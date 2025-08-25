import * as THREE from "three";
import { sphere, envMesh, originalSphereScale, camera, renderer } from "../main.js";
import { cubes, cubeOriginalDimensions } from "./addProjects";
import { uiSwitchState, addProjectCardToPage, setIndexStateForProjectOpening } from "./ui";
import { createEnvironment, isMobileDevice, pauseRenderer } from "./utils";

let isDragging = false;
let wasDragged = false;
let lastMousePosition = new THREE.Vector2();
export let mousePosition = new THREE.Vector2();
let lastTime = 0; // Track time for velocity calculations



// Spring effect parameters
const springCompression = 0.93; // How much the sphere shrinks when pressed
const mobileSpringCompression = 0.95; // Larger spring for mobile devices (15% larger than before)
const springDamping = 0.55; // Damping factor for the spring
const springStiffness = 0.08; // Stiffness of the spring
const mobileSpringStiffness = 0.012; // Softer spring stiffness for mobile devices
// Initialize isMobile right away to avoid reference errors
let isMobile = isMobileDevice(); // Flag to check if the user is on mobile
let targetScale = 1.0; // Default value until we have originalSphereScale
let currentScale = 1.0; // Default value until we have originalSphereScale
let springVelocity = 0; // Velocity of the spring

// Cube scaling parameters
const cubeOriginalScales = new Map(); // Store original scales of cubes
const cubeMaxScaleFactor = 1.15; // Maximum scale increase for closest cubes
const cubeMinScaleFactor = 0.9; // Minimum scale for furthest cubes
const cubeScaleDistance = 55; // Distance over which scaling is applied
let cubeScalingEnabled = false; // Will be enabled after initialization

const raycaster = new THREE.Raycaster();

// ROTARY ENCODER SYSTEM - Complete separation of sphere and world
// The sphere stays visually stable, only the world rotates
const worldRotation = new THREE.Quaternion();  // Controls cube orbital positions
let rotationVelocity = new THREE.Vector3();
const dampingFactor = 0.975; // Reduced damping for quicker settling
const velocityFactor = 0.004; // Reduced sensitivity for smoother control
const mobileVelocityFactor = 0.008; // Reduced mobile sensitivity 
const maxVelocity = 0.05; // Reduced maximum velocity
const mobileMaxVelocity = 0.05; // Reduced mobile maximum velocity

// Track viewed projects
const viewedProjects = new Set();
const darknessFactor = 0.2; // How dark the viewed projects should become

// Add parameters for project cube movement
const cubeMovementConfig = {
    baseMaxDistance: 550.0, // Base maximum distance cubes can move
    distanceMultiplierMin: 0.5, // Minimum multiplier for max distance
    distanceMultiplierMax: 1.2, // Maximum multiplier for max distance
    returnSpeed: 0.00022, // Base speed at which cubes return to original position
    returnSpeedVariation: 2, // How much the return speed can vary
    velocityScale: 1.2, // How much velocity affects the movement
};

// Add animation frame tracking
let animationFrameId = null;

// Camera rotation control
let cameraControl;

// Store cube positions
const cubePositions = new Map(); // Store current orbital positions
const cubeOutwardOffsets = new Map(); // Store outward offset for each cube
const cubeReturnSpeeds = new Map(); // Store randomized return speeds for each cube
const cubeMaxDistances = new Map(); // Store randomized max distances for each cube

// Store original cube positions
const cubeOriginalPositions = new Map();

// Track if we're currently hovering over the sphere
let isHoveringOverSphere = false;
// Track if we've already played the hover animation
let hoverAnimationPlayed = false;

// Add keyboard control parameters
const nudgeFactor = 0.01; // Base velocity for arrow key nudges
const velocityBuildUp = 1.05; // How much velocity builds up when holding keys
const maxNudgeVelocity = 0.1; // Maximum velocity from keyboard controls
let keyState = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let keyHoldTime = { ArrowUp: 0, ArrowDown: 0, ArrowLeft: 0, ArrowRight: 0 };

// Define touch event handlers before they're used
// Touch event handlers - Pure 2D screen input
const onTouchStart = function (e) {
    e.preventDefault();

    // Skip hover animation on touch devices
    hoverAnimationPlayed = true;

    // Check if interactions are disabled or if a project card is already open
    if (interactionsDisabled) {
        return; // Don't process if interactions are disabled
    }

    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return; // Don't process further if a card is already open
    }

    const touch = e.touches[0];
    
    // Check if we're clicking on sphere or cubes - prioritize sphere
    raycaster.setFromCamera(
        new THREE.Vector2((touch.clientX / window.innerWidth) * 2 - 1, (-touch.clientY / window.innerHeight) * 2 + 1),
        camera
    );
    
    // Check sphere intersection first
    const sphereIntersections = raycaster.intersectObject(sphere, true);
    const cubeIntersections = raycaster.intersectObjects(cubes);
    
    // If sphere is hit, prioritize sphere interaction over cubes
    if (sphereIntersections.length > 0) {
        // Sphere interaction takes priority - start dragging
        isDragging = true;
        wasDragged = true;

        // Apply appropriate spring compression effect based on device type
        targetScale = isMobile ? mobileSpringCompression * originalSphereScale : springCompression * originalSphereScale;

        lastMousePosition.set(touch.clientX, touch.clientY);
        lastTime = performance.now();
    } else if (cubeIntersections.length > 0) {
        // Only open project if sphere is not hit
        const intersectedObject = cubeIntersections[0].object;
        if (cubes.includes(intersectedObject)) {
            // If a cube is clicked, switch to 2D mode and open the gallery
            const projectId = intersectedObject.name;

            // Track index state when opening project from 3D view
            setIndexStateForProjectOpening();

            // Mark project as viewed and darken its texture after 1s delay
            if (!viewedProjects.has(projectId)) {
                viewedProjects.add(projectId);
                setTimeout(() => {
                    darkenProjectCube(intersectedObject);
                }, 170);
            }

            uiSwitchState("project");
            addProjectCardToPage(projectId, document.querySelector(".main-container"));
            return;
        }
    }
    // If neither sphere nor cube is touched, do nothing - don't start dragging
};

const onTouchMove = function (e) {
    e.preventDefault();
    if (!isDragging || interactionsDisabled) return;

    document.body.style.cursor = "grabbing";
    const touch = e.touches[0];
    mousePosition.set(touch.clientX, touch.clientY);

    // Calculate touch movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);

    // Ensure we have enough movement to consider it a drag (prevents accidental touches)
    if (mouseDelta.length() < 0.1 && isDragging) {
        lastMousePosition.copy(mousePosition);
        return;
    }

    // Apply movement delta directly to world rotation (rotary encoder style)
    const factor = mobileVelocityFactor;
    applyRotationToWorld(mouseDelta.x * factor, mouseDelta.y * factor);

    // Update velocity for inertia - reduced for smoother feel
    rotationVelocity.x = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.x * factor * 0.08));
    rotationVelocity.y = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.y * factor * 0.08));

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(velocityMagnitude);

    lastMousePosition.copy(mousePosition);
    lastTime = performance.now();
};

const onTouchEnd = function () {
    if (isDragging && !interactionsDisabled) {
        isDragging = false;
        document.body.style.cursor = "auto";

        // Reset camera rotation to prevent sticking on mobile
        if (isMobile && cameraControl) {
            rotationVelocity.multiplyScalar(0.5); // Reduce velocity on touch end for mobile
        }

        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }

        // Release spring compression with a slight expansion effect
        springVelocity = 0.01; // Add a small positive impulse
        targetScale = originalSphereScale;
    }
};

// Global flag to track if interactions are disabled
let interactionsDisabled = false;

export function dragInit() {
    // isMobile is already initialized at the top of the file
    
    // Initialize camera control after environment creation
    cameraControl = createEnvironment(sphere.parent);

    // Now that we have originalSphereScale available, set the correct values
    targetScale = originalSphereScale;
    currentScale = originalSphereScale;

    // Ensure sphere starts at the correct size and neutral rotation
    sphere.scale.set(originalSphereScale, originalSphereScale, originalSphereScale);

    // Select a random cube to be the "front" cube
    const randomCubeIndex = Math.floor(Math.random() * cubes.length);
    const targetCube = cubes[randomCubeIndex];
    
    // Get the cube's original position
    const cubeOriginalPosition = cubeOriginalPositions.get(targetCube.uuid);
    if (cubeOriginalPosition) {
        // Calculate the direction from sphere center to the cube
        const cubeDirection = cubeOriginalPosition.clone().normalize();
        
        // We want the cube to be in front of the camera, slightly up and centered
        // So we need to rotate the world so that the cube's direction becomes (0, 0.3, -1)
        const targetDirection = new THREE.Vector3(10, 30, -40).normalize();
        
        // Calculate the rotation needed to align the cube direction with the target direction
        const rotationAxis = new THREE.Vector3().crossVectors(cubeDirection, targetDirection).normalize();
        const rotationAngle = Math.acos(cubeDirection.dot(targetDirection));
        
        if (rotationAxis.length() > 0.001) { // Avoid division by zero
            const targetRotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
            worldRotation.multiplyQuaternions(targetRotation, worldRotation);
        }
        
        // Add a small random offset to make it not perfectly centered
        // const smallRandomX = (Math.random() - 0.5) * 0.3; // Small random X offset
        // const smallRandomY = (Math.random() - 0.5) * 0.2; // Small random Y offset
        // const smallRandomZ = (Math.random() - 0.5) * 0.1; // Small random Z offset
        
        const smallRotationX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0));
        const smallRotationY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0));
        const smallRotationZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1));
        
        worldRotation.multiplyQuaternions(smallRotationX, worldRotation);
        worldRotation.multiplyQuaternions(smallRotationY, worldRotation)
        worldRotation.multiplyQuaternions(smallRotationZ, worldRotation);
    }

    // Initialize cube positions and randomized properties
    for (let cube of cubes) {
        cubePositions.set(cube.uuid, cube.position.clone());
        cubeOriginalPositions.set(cube.uuid, cube.position.clone());
        cubeOutwardOffsets.set(cube.uuid, new THREE.Vector3(0, 0, 0));

        // Randomize return speeds and max distances
        const returnSpeed = cubeMovementConfig.returnSpeed * (1 + (Math.random() - 0.5) * cubeMovementConfig.returnSpeedVariation);
        cubeReturnSpeeds.set(cube.uuid, returnSpeed);

        const maxDistance =
            cubeMovementConfig.baseMaxDistance *
            (cubeMovementConfig.distanceMultiplierMin +
                Math.random() * (cubeMovementConfig.distanceMultiplierMax - cubeMovementConfig.distanceMultiplierMin));
        cubeMaxDistances.set(cube.uuid, maxDistance);
    }

    // Add mouse event listeners
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);
    
    // Add document-level mouse leave listener to handle cursor leaving browser window
    document.addEventListener("mouseleave", onMouseLeave);

    // Add wheel event listener for trackpad scrolling
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    // Add touch event listeners with correct options
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    // Add touchcancel handler to properly end dragging operation
    renderer.domElement.addEventListener("touchcancel", onTouchEnd);

    // Store original cube scales
    setTimeout(() => {
        for (let cube of cubes) {
            cubeOriginalScales.set(cube.uuid, cube.scale.x);
        }
        cubeScalingEnabled = true;
    }, 1100);

    // Start the spring animation
    animateSpring();

    // Add keyboard event listeners (only for desktop)
    if (!isMobile) {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }
}

// Function to disable canvas interactions
export function disableCanvasInteractions() {
    interactionsDisabled = true;
    document.body.style.cursor = "auto";
    isDragging = false;
    wasDragged = false;
}

// Function to enable canvas interactions
export function enableCanvasInteractions() {
    interactionsDisabled = false;
}

// CORE ROTARY ENCODER FUNCTION
// This applies rotation only to the world, sphere stays completely static
function applyRotationToWorld(xDelta, yDelta) {
    // Create rotation quaternions from input deltas
    const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), yDelta);
    const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), xDelta);
    const deltaRotation = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

    // Apply to world rotation only - sphere stays completely static
    worldRotation.multiplyQuaternions(deltaRotation, worldRotation);
    
    // Make sphere rotate to match the accumulated world rotation (no jumping)
    sphere.quaternion.copy(worldRotation);
}

function animateSpring() {
    requestAnimationFrame(animateSpring);

    // Update keyboard controls in the main animation loop
    updateKeyboardControls();

    // Calculate spring physics with improved smoothness
    // Use appropriate spring stiffness based on device type
    const activeSpringStiffness = isMobile ? mobileSpringStiffness : springStiffness;

    const springForce = (targetScale - currentScale) * activeSpringStiffness;
    springVelocity += springForce;
    springVelocity *= springDamping;
    currentScale += springVelocity;

    // Apply scale to sphere
    if (sphere) {
        // Simply apply the current scale without breathing effect
        sphere.scale.set(currentScale, currentScale, currentScale);

        // Scale cubes based on distance from sphere
        if (cubeScalingEnabled) {
            updateCubeScales();
        }
    }
}

function updateCubeScales() {
    for (let cube of cubes) {
        // Get original dimensions for this cube
        const originalDims = cubeOriginalDimensions.get(cube.uuid);

        if (!originalDims) {
            // If dimensions not yet available (image still loading), skip this cube
            continue;
        }

        // Calculate distance from cube to sphere
        const distance = cube.position.distanceTo(sphere.position);

        // Calculate scale factor based on distance
        // Closer cubes scale more, further cubes scale less
        let scaleFactor;

        if (distance < cubeScaleDistance) {
            // Linear interpolation between max and min scale factors
            const t = distance / cubeScaleDistance;
            scaleFactor = cubeMaxScaleFactor * (1 - t) + cubeMinScaleFactor * t;

            // Apply additional scaling based on sphere's current scale
            // When sphere is compressed, nearby cubes expand slightly
            const sphereScaleDelta = 1.0 - currentScale;
            scaleFactor += sphereScaleDelta * 0.5 * (1 - t);
        } else {
            scaleFactor = cubeMinScaleFactor;
        }

        // Apply scale with smooth transition, maintaining aspect ratio
        cube.scale.lerp(new THREE.Vector3(scaleFactor, scaleFactor, scaleFactor), 0.1);
    }
}

function onMouseDown(e) {
    // Check if interactions are disabled or if a project card is already open
    if (interactionsDisabled) {
        return; // Don't process if interactions are disabled
    }

    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return; // Don't process further if a card is already open
    }

    // Check if we're clicking on sphere or cubes - prioritize sphere
    raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, (-e.clientY / window.innerHeight) * 2 + 1), camera);
    
    // Check sphere intersection first
    const sphereIntersections = raycaster.intersectObject(sphere, true);
    const cubeIntersections = raycaster.intersectObjects(cubes);
    
    // If sphere is hit, prioritize sphere interaction over cubes
    if (sphereIntersections.length > 0) {
        // Sphere interaction takes priority - start dragging
        document.body.style.cursor = "grabbing";
        isDragging = true;
        wasDragged = true;

        // Apply appropriate spring compression effect based on device type
        targetScale = isMobile ? mobileSpringCompression * originalSphereScale : springCompression * originalSphereScale;

        lastMousePosition.set(e.clientX, e.clientY);
        lastTime = performance.now();
    } else if (cubeIntersections.length > 0) {
        // Only open project if sphere is not hit
        const intersectedObject = cubeIntersections[0].object;
        if (cubes.includes(intersectedObject)) {
            // If a cube is clicked, switch to 2D mode and open the gallery
            const projectId = intersectedObject.name;

            // Track index state when opening project from 3D view
            setIndexStateForProjectOpening();

            // Mark project as viewed and darken its texture after 1s delay
            if (!viewedProjects.has(projectId)) {
                viewedProjects.add(projectId);
                setTimeout(() => {
                    darkenProjectCube(intersectedObject);
                }, 170);
            }

            uiSwitchState("project");
            addProjectCardToPage(projectId, document.querySelector(".main-container"));
            return;
        }
    }
    // If neither sphere nor cube is clicked, do nothing - don't start dragging
}

function onMouseUp() {
    if (isDragging && !interactionsDisabled) {
        isDragging = false;
        document.body.style.cursor = "auto";

        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }

        // Release spring compression with a slight expansion effect
        springVelocity = 0.01; // Add a small positive impulse
        targetScale = originalSphereScale;
    }
}

function onMouseLeave(e) {
    // Check if the mouse has actually left the window
    if (e.clientX <= 0 || e.clientX >= window.innerWidth || 
        e.clientY <= 0 || e.clientY >= window.innerHeight) {
        // Always release the ball when cursor definitively leaves the browser window
        isDragging = false;
        document.body.style.cursor = "auto";

        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }

        // Release spring compression with a slight expansion effect
        springVelocity = 0.01; // Add a small positive impulse
        targetScale = originalSphereScale;
    }
}

function animateInertia() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    const animate = () => {
        if (!isDragging && rotationVelocity.length() > 0.0001) {
            // Apply damping to velocity
            rotationVelocity.multiplyScalar(dampingFactor);

            // Calculate velocity magnitude
            const velocityMagnitude = rotationVelocity.length();

            // Stop animation if velocity is very small
            if (velocityMagnitude < 0.0001) {
                rotationVelocity.set(0, 0, 0);
                returnCubesToOriginalPositions();
                return;
            }

            // Apply velocity to world rotation
            applyRotationToWorld(rotationVelocity.x, rotationVelocity.y);

            // Update cube positions
            updateCubePositions(velocityMagnitude);

            animationFrameId = requestAnimationFrame(animate);
        } else {
            returnCubesToOriginalPositions();
        }
    };
    animate();
}

function updateCubePositions(velocityMagnitude) {
    for (let cube of cubes) {
        // Get the original position and apply world's total rotation
        const originalPosition = cubeOriginalPositions.get(cube.uuid);
        const orbitalPosition = originalPosition.clone();
        orbitalPosition.applyQuaternion(worldRotation);
        
        // Update the stored orbital position for consistency
        cubePositions.set(cube.uuid, orbitalPosition.clone());

        // Calculate outward offset based on velocity
        const directionFromCenter = orbitalPosition.clone().sub(sphere.position).normalize();
        const offset = velocityMagnitude * cubeMovementConfig.velocityScale;
        const currentOutwardOffset = cubeOutwardOffsets.get(cube.uuid);

        // Use cube's individual max distance
        const maxDistance = cubeMaxDistances.get(cube.uuid);
        const targetOffset = directionFromCenter.multiplyScalar(offset * maxDistance);

        // Smoothly interpolate the outward offset
        currentOutwardOffset.lerp(targetOffset, 0.1);
        cubeOutwardOffsets.set(cube.uuid, currentOutwardOffset);

        // Apply combined position
        cube.position.copy(orbitalPosition).add(currentOutwardOffset);
        cube.lookAt(sphere.position);
    }
}

function returnCubesToOriginalPositions() {
    const returnAnimation = () => {
        let allCubesInPosition = true;

        for (let cube of cubes) {
            const currentOutwardOffset = cubeOutwardOffsets.get(cube.uuid);
            const returnSpeed = cubeReturnSpeeds.get(cube.uuid);

            if (currentOutwardOffset.length() > 0.01) {
                // Use cube's individual return speed
                currentOutwardOffset.multiplyScalar(1 - returnSpeed);
                cubeOutwardOffsets.set(cube.uuid, currentOutwardOffset);

                // Get the original position and apply world's current rotation
                const originalPosition = cubeOriginalPositions.get(cube.uuid);
                const orbitalPosition = originalPosition.clone();
                orbitalPosition.applyQuaternion(worldRotation);
                
                // Update stored position for consistency
                cubePositions.set(cube.uuid, orbitalPosition.clone());

                // Apply position with offset
                cube.position.copy(orbitalPosition).add(currentOutwardOffset);
                cube.lookAt(sphere.position);
                allCubesInPosition = false;
            }
        }

        if (!allCubesInPosition) {
            requestAnimationFrame(returnAnimation);
        }
    };

    returnAnimation();
}

function onMouseMove(e) {
    // Cursor styling logic
    if (!isDragging || interactionsDisabled) {
        raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, (-e.clientY / window.innerHeight) * 2 + 1), camera);

        const sphereIntersections = raycaster.intersectObject(sphere);
        const cubeIntersections = raycaster.intersectObjects(cubes);

        if (sphereIntersections.length > 0) {
            document.body.style.cursor = "grab";
        } else if (cubeIntersections.length > 0) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "auto";
        }
    }

    // Existing drag logic
    if (!isDragging || interactionsDisabled) return;

    // Check if cursor has left the screen
    if (hasCursorLeftScreen(e)) {
        isDragging = false;
        document.body.style.cursor = "auto";

        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }

        // Release spring compression with a slight expansion effect
        springVelocity = 0.01; // Add a small positive impulse
        targetScale = originalSphereScale;
        return;
    }

    document.body.style.cursor = "grabbing";
    mousePosition.set(e.clientX, e.clientY);

    // Calculate mouse movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);

    // Apply movement delta directly to world rotation (rotary encoder style)
    const factor = velocityFactor;
    applyRotationToWorld(mouseDelta.x * factor, mouseDelta.y * factor);

    // Update velocity for inertia - reduced for smoother feel
    rotationVelocity.x = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.x * factor * 0.08));
    rotationVelocity.y = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.y * factor * 0.08));

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(velocityMagnitude);

    lastMousePosition.copy(mousePosition);
    lastTime = performance.now();
}

function hasCursorLeftScreen(event) {
    // Only check screen boundaries for mouse events, not touch events
    if (event.type && event.type.startsWith("touch")) {
        return false;
    }
    return event.clientX < 0 || event.clientX > window.innerWidth || event.clientY < 0 || event.clientY > window.innerHeight;
}

// Handle wheel events (trackpad scrolling)
function onWheel(e) {
    e.preventDefault();
    
    if (interactionsDisabled) {
        return; // Don't process if interactions are disabled
    }

    // Get normalized scroll deltas for x and y directions
    const scrollDeltaX = e.deltaX * 0.07;
    const scrollDeltaY = e.deltaY * 0.07;

    // Mark that interaction has occurred
    wasDragged = true;

    // Use a scaled factor for wheel sensitivity - reduced for smoother feel
    const wheelFactor = velocityFactor * 1.5;

    // Apply movement delta directly to world rotation (rotary encoder style)
    applyRotationToWorld(scrollDeltaX * wheelFactor, scrollDeltaY * wheelFactor);

    // Add to rotation velocity for inertia effect - reduced velocity factor for smoother feel
    rotationVelocity.x += Math.min(maxVelocity, Math.max(-maxVelocity, scrollDeltaX * wheelFactor * 0.15));
    rotationVelocity.y += Math.min(maxVelocity, Math.max(-maxVelocity, scrollDeltaY * wheelFactor * 0.15));

    // Apply more damping to settle velocity quicker
    rotationVelocity.multiplyScalar(0.95);

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(velocityMagnitude);

    // Start inertia animation if there's velocity and we're not already dragging
    if (!isDragging && rotationVelocity.length() > 0.0001) {
        animateInertia();
    }
}

function darkenProjectCube(cube) {
    // Handle both single material and material array cases
    if (Array.isArray(cube.material)) {
        cube.material.forEach((material) => {
            if (material.map) {
                // Create a dark overlay color
                material.color = new THREE.Color(darknessFactor, darknessFactor, darknessFactor);
            }
        });
    } else if (cube.material && cube.material.map) {
        // Create a dark overlay color
        cube.material.color = new THREE.Color(darknessFactor, darknessFactor, darknessFactor);
    }
}

function onKeyDown(e) {
    if (interactionsDisabled) {
        return; // Don't process if interactions are disabled
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keyState[e.key] = true;
        keyHoldTime[e.key] = performance.now();
        
        // Mark that interaction has occurred
        wasDragged = true;
    }
}

function onKeyUp(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keyState[e.key] = false;
        keyHoldTime[e.key] = 0;
        
        // Start inertia animation when key is released
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }
    }
}

function updateKeyboardControls() {
    if (!keyState.ArrowUp && !keyState.ArrowDown && !keyState.ArrowLeft && !keyState.ArrowRight) {
        return;
    }

    // Calculate rotation based on key states and hold time
    let xRotation = 0;
    let yRotation = 0;
    const currentTime = performance.now();

    if (keyState.ArrowUp) {
        const holdTime = (currentTime - keyHoldTime.ArrowUp) / 1000; // Convert to seconds
        xRotation -= nudgeFactor * (1 + holdTime * 0.5); // Increase effect with hold time
    }
    if (keyState.ArrowDown) {
        const holdTime = (currentTime - keyHoldTime.ArrowDown) / 1000;
        xRotation += nudgeFactor * (1 + holdTime * 0.5);
    }
    if (keyState.ArrowLeft) {
        const holdTime = (currentTime - keyHoldTime.ArrowLeft) / 1000;
        yRotation -= nudgeFactor * (1 + holdTime * 0.5);
    }
    if (keyState.ArrowRight) {
        const holdTime = (currentTime - keyHoldTime.ArrowRight) / 1000;
        yRotation += nudgeFactor * (1 + holdTime * 0.5);
    }

    // Apply movement delta directly to world rotation (rotary encoder style)
    applyRotationToWorld(yRotation, xRotation);

    // Update velocity with buildup based on hold time
    const holdTimeMultiplier = 1 + Math.max(
        keyState.ArrowUp ? (currentTime - keyHoldTime.ArrowUp) / 1000 : 0,
        keyState.ArrowDown ? (currentTime - keyHoldTime.ArrowDown) / 1000 : 0,
        keyState.ArrowLeft ? (currentTime - keyHoldTime.ArrowLeft) / 1000 : 0,
        keyState.ArrowRight ? (currentTime - keyHoldTime.ArrowRight) / 1000 : 0
    ) * 0.5;

    rotationVelocity.x = Math.min(maxNudgeVelocity, Math.max(-maxNudgeVelocity, rotationVelocity.x * velocityBuildUp + yRotation * holdTimeMultiplier));
    rotationVelocity.y = Math.min(maxNudgeVelocity, Math.max(-maxNudgeVelocity, rotationVelocity.y * velocityBuildUp + xRotation * holdTimeMultiplier));
}

// Export function to update cube positions based on current world rotation
export function updateCubesForSphereRotation() {
    if (!cubes || cubes.length === 0) return;
    
    for (let cube of cubes) {
        // Get the original position and apply world's current rotation
        const originalPosition = cubeOriginalPositions.get(cube.uuid);
        if (!originalPosition) continue;
        
        const orbitalPosition = originalPosition.clone();
        orbitalPosition.applyQuaternion(worldRotation);
        
        // Update stored position
        cubePositions.set(cube.uuid, orbitalPosition.clone());
        
        // Apply position (with any existing outward offset)
        const currentOutwardOffset = cubeOutwardOffsets.get(cube.uuid) || new THREE.Vector3(0, 0, 0);
        cube.position.copy(orbitalPosition).add(currentOutwardOffset);
        cube.lookAt(sphere.position);
    }
}
