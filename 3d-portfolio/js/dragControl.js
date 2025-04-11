import * as THREE from "three";
import { camera, renderer, sphere, navbar, originalSphereScale } from "../main";
import { cubes, cubeOriginalDimensions } from "./addProjects";
import { uiSwitchState, addProjectCardToPage } from "./ui";
import { createEnvironment, isMobileDevice, pauseRenderer } from "./utils";

let isDragging = false;
let wasDragged = false;
let lastMousePosition = new THREE.Vector2();
export let mousePosition = new THREE.Vector2();
let intersectionPoint; // Required for touch interactions
let lastTime = 0; // Track time for velocity calculations

// Spring effect parameters
const springCompression = 0.87; // How much the sphere shrinks when pressed
const mobileSpringCompression = 0.85; // Larger spring for mobile devices (15% larger than before)
const springDamping = 0.55; // Damping factor for the spring
const springStiffness = 0.15; // Stiffness of the spring
const mobileSpringStiffness = 0.12; // Softer spring stiffness for mobile devices
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

// Create a quaternion to store the sphere rotation
const sphereRotation = new THREE.Quaternion();
// Add velocity tracking
let rotationVelocity = new THREE.Vector3();
const dampingFactor = 0.96; // Even stronger damping
const velocityFactor = 0.0089; // Drastically reduced
const mobileVelocityFactor = 0.012; // Drastically reduced for mobile
const maxVelocity = 0.7; // Drastically reduced maximum velocity
const mobileMaxVelocity = 0.65; // Drastically reduced for mobile

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
// Touch event handlers
const onTouchStart = function (e) {
    e.preventDefault();

    // Skip hover animation on touch devices
    hoverAnimationPlayed = true;

    // Check if a project card is already open
    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return; // Don't process further if a card is already open
    }

    const touch = e.touches[0];
    raycaster.setFromCamera(
        new THREE.Vector2((touch.clientX / window.innerWidth) * 2 - 1, (-touch.clientY / window.innerHeight) * 2 + 1),
        camera
    );
    const intersections = raycaster.intersectObjects([sphere, ...cubes]);
    if (intersections.length > 0) {
        const intersectedObject = intersections[0].object;
        if (cubes.includes(intersectedObject)) {
            // If a cube is clicked, switch to project view and open the gallery
            const projectId = intersectedObject.name;

            // Mark project as viewed and darken its texture after 1s delay
            if (!viewedProjects.has(projectId)) {
                viewedProjects.add(projectId);
                setTimeout(() => {
                    darkenProjectCube(intersectedObject);
                }, 170);
            }

            // Hide navbar when opening a project
            navbar.hide();

            // Open project card without switching to list view
            addProjectCardToPage(projectId, document.querySelector(".main-container"));
            return;
        }

        // Store the intersection point and enable dragging
        intersectionPoint = intersections[0].point;
        isDragging = true;
        wasDragged = true;

        // Reset velocity when starting to drag
        rotationVelocity.set(0, 0, 0);

        // Apply compression effect for mobile
        targetScale = mobileSpringCompression * originalSphereScale;
    }

    if (wasDragged == true) {
        navbar.hide();
    }

    lastMousePosition.set(touch.clientX, touch.clientY);
    lastTime = performance.now();
};

const onTouchMove = function (e) {
    e.preventDefault();
    if (!isDragging) return;

    renderer.domElement.style.cursor = "grabbing";
    const touch = e.touches[0];
    mousePosition.set(touch.clientX, touch.clientY);

    // Calculate touch movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);

    // Ensure we have enough movement to consider it a drag (prevents accidental touches)
    if (mouseDelta.length() < 0.1 && isDragging) {
        lastMousePosition.copy(mousePosition);
        return;
    }

    // Apply a fixed factor for direct rotation control (lower for mobile)
    const factor = mobileVelocityFactor;

    // Apply direct rotation based on touch movement
    const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), mouseDelta.y * factor);
    const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), mouseDelta.x * factor);
    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

    // Apply rotation
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);

    // Update velocity for inertia
    rotationVelocity.x = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.x * factor * 0.1));
    rotationVelocity.y = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.y * factor * 0.1));

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(rotationQuaternion, velocityMagnitude);

    // When on mobile, don't update camera rotation to prevent getting stuck
    if (cameraControl && !isMobile) {
        cameraControl.updateCameraRotation(camera, rotationVelocity, true);
    }

    lastMousePosition.copy(mousePosition);
    lastTime = performance.now();
};

const onTouchEnd = function () {
    if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";

        // Reset camera rotation to prevent sticking on mobile
        if (isMobile && cameraControl) {
            rotationVelocity.multiplyScalar(0.5); // Reduce velocity on touch end for mobile
            cameraControl.updateCameraRotation(camera, new THREE.Vector3(0, 0, 0), false);
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

export function dragInit(cameraControl) {
    // isMobile is already initialized at the top of the file
    
    // Now that we have originalSphereScale available, set the correct values
    targetScale = originalSphereScale;
    currentScale = originalSphereScale;

    // Ensure sphere starts at the correct size
    sphere.scale.set(originalSphereScale, originalSphereScale, originalSphereScale);

    // Initialize camera control after environment creation
    cameraControl = createEnvironment(sphere.parent);

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
    renderer.domElement.addEventListener("mousemove", onMouseHover);
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);

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

    // Add keyboard event listeners
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
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

function onMouseHover(e) {
    // Skip hover effects on mobile devices
    if (isMobile) return;

    raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, (-e.clientY / window.innerHeight) * 2 + 1), camera);

    const intersections = raycaster.intersectObject(sphere);

    // Previous hover state - store for detecting when we leave the sphere
    const wasHovering = isHoveringOverSphere;

    if (!isDragging) {
        if (intersections.length > 0) {
            renderer.domElement.style.cursor = "grab";

            // If we weren't hovering before and haven't played the animation yet
            if (!isHoveringOverSphere && !hoverAnimationPlayed) {
                // Trigger a gentle spring effect
                springVelocity = -0.004; // Small negative impulse for shrinking
                targetScale = originalSphereScale * 0.98; // Shrink slightly

                // After a short delay, return to normal size
                setTimeout(() => {
                    targetScale = originalSphereScale;
                    hoverAnimationPlayed = true; // Mark animation as played

                    // Reset the animation played flag after leaving the sphere
                    setTimeout(() => {
                        hoverAnimationPlayed = false;
                    }, 1000);
                }, 150);
            }

            isHoveringOverSphere = true;
        } else {
            renderer.domElement.style.cursor = "auto";

            // If we just left the sphere (was hovering, now not)
            if (wasHovering) {
                // Add a small spring effect when leaving
                springVelocity = 0.005; // Small positive impulse when leaving
            }

            isHoveringOverSphere = false;
        }
    }
}

function onMouseDown(e) {
    // Check if a project card is already open
    const existingProjectCards = document.querySelectorAll(".project-card");
    if (existingProjectCards.length > 0) {
        return; // Don't process further if a card is already open
    }

    raycaster.setFromCamera(new THREE.Vector2((e.clientX / window.innerWidth) * 2 - 1, (-e.clientY / window.innerHeight) * 2 + 1), camera);
    const intersections = raycaster.intersectObjects([sphere, ...cubes]);
    if (intersections.length > 0) {
        const intersectedObject = intersections[0].object;
        if (cubes.includes(intersectedObject)) {
            // If a cube is clicked, switch to project view and open the gallery
            const projectId = intersectedObject.name;

            // Mark project as viewed and darken its texture after 1s delay
            if (!viewedProjects.has(projectId)) {
                viewedProjects.add(projectId);
                setTimeout(() => {
                    darkenProjectCube(intersectedObject);
                }, 170);
            }

            // Hide navbar when opening a project
            navbar.hide();

            // Open project card without switching to list view
            addProjectCardToPage(projectId, document.querySelector(".main-container"));
            return;
        } else {
            // If the sphere is clicked, handle dragging
            intersectionPoint = intersections[0].point;
            isDragging = true;
            wasDragged = true;
            // Reset velocity when starting to drag
            rotationVelocity.set(0, 0, 0);

            // Apply appropriate spring compression effect based on device type
            targetScale = isMobile ? mobileSpringCompression * originalSphereScale : springCompression * originalSphereScale;
        }
    }

    if (wasDragged == true) {
        navbar.hide();
    }

    lastMousePosition.set(e.clientX, e.clientY);
    lastTime = performance.now();
}

function onMouseUp() {
    if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";

        // Update camera rotation with isDragging false immediately
        if (cameraControl) {
            cameraControl.updateCameraRotation(camera, rotationVelocity, false);
        }

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

            // Apply rotation based on velocity components
            const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationVelocity.y);
            const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationVelocity.x);
            const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

            // Apply rotation to sphere
            sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
            sphere.setRotationFromQuaternion(sphereRotation);

            // Update cube positions
            updateCubePositions(rotationQuaternion, velocityMagnitude);

            // On mobile devices, limit camera rotation during inertia to prevent getting stuck
            if (cameraControl && (!isMobile || velocityMagnitude < 0.1)) {
                cameraControl.updateCameraRotation(camera, rotationVelocity, false);
            }

            animationFrameId = requestAnimationFrame(animate);
        } else {
            returnCubesToOriginalPositions();
        }
    };
    animate();
}

function updateCubePositions(rotationQuaternion, velocityMagnitude) {
    for (let cube of cubes) {
        // Get the current orbital position
        let orbitalPosition = cubePositions.get(cube.uuid);

        // Apply rotation to orbital position
        orbitalPosition.applyQuaternion(rotationQuaternion);
        cubePositions.set(cube.uuid, orbitalPosition);

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

                // Apply position
                cube.position.copy(cubePositions.get(cube.uuid)).add(currentOutwardOffset);
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
    if (!isDragging) return;

    // Check if cursor has left the screen
    if (hasCursorLeftScreen(e)) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";

        // Update camera rotation with isDragging false immediately
        if (cameraControl) {
            cameraControl.updateCameraRotation(camera, rotationVelocity, false);
        }

        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }

        // Release spring compression with a slight expansion effect
        springVelocity = 0.01; // Add a small positive impulse
        targetScale = originalSphereScale;
        return;
    }

    renderer.domElement.style.cursor = "grabbing";
    mousePosition.set(e.clientX, e.clientY);

    // Calculate mouse movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);

    // Apply a fixed factor for direct rotation control
    const factor = velocityFactor;

    // Apply direct rotation based on mouse movement
    const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), mouseDelta.y * factor);

    const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), mouseDelta.x * factor);

    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

    // Apply rotation to sphere
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);

    // Update velocity for inertia
    rotationVelocity.x = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.x * factor * 0.1));
    rotationVelocity.y = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.y * factor * 0.1));

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(rotationQuaternion, velocityMagnitude);

    // Update camera rotation
    if (cameraControl) {
        cameraControl.updateCameraRotation(camera, rotationVelocity, true);
    }

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

    // Get normalized scroll deltas for x and y directions
    const scrollDeltaX = e.deltaX * 0.02;
    const scrollDeltaY = e.deltaY * 0.02;

    // Mark that interaction has occurred and hide navbar hint
    wasDragged = true;
    if (wasDragged == true) {
        navbar.hide();
    }

    // Use a scaled factor for wheel sensitivity - increased by 4x
    const wheelFactor = velocityFactor * 2.0;

    // Create rotation quaternions for x and y axes
    const xRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), scrollDeltaY * wheelFactor);

    const yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), scrollDeltaX * wheelFactor);

    // Combine rotations
    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);

    // Apply rotation to sphere
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);

    // Add to rotation velocity for inertia effect - increased velocity factor
    rotationVelocity.x += Math.min(maxVelocity, Math.max(-maxVelocity, scrollDeltaX * wheelFactor * 0.2));
    rotationVelocity.y += Math.min(maxVelocity, Math.max(-maxVelocity, scrollDeltaY * wheelFactor * 0.2));

    // Apply less damping to maintain more velocity
    rotationVelocity.multiplyScalar(0.97);

    // Calculate velocity magnitude and update cube positions
    const velocityMagnitude = rotationVelocity.length();
    updateCubePositions(rotationQuaternion, velocityMagnitude);

    // Update camera rotation
    if (cameraControl) {
        cameraControl.updateCameraRotation(camera, rotationVelocity, false);
    }

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
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keyState[e.key] = true;
        keyHoldTime[e.key] = performance.now();
        
        // Mark that interaction has occurred and hide navbar hint
        wasDragged = true;
        if (wasDragged == true) {
            navbar.hide();
        }
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

    // Apply rotation with velocity buildup
    const xQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), xRotation);
    const yQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);
    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yQuat, xQuat);

    // Apply rotation to sphere
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);

    // Update velocity with buildup based on hold time
    const holdTimeMultiplier = 1 + Math.max(
        keyState.ArrowUp ? (currentTime - keyHoldTime.ArrowUp) / 1000 : 0,
        keyState.ArrowDown ? (currentTime - keyHoldTime.ArrowDown) / 1000 : 0,
        keyState.ArrowLeft ? (currentTime - keyHoldTime.ArrowLeft) / 1000 : 0,
        keyState.ArrowRight ? (currentTime - keyHoldTime.ArrowRight) / 1000 : 0
    ) * 0.5;

    rotationVelocity.x = Math.min(maxNudgeVelocity, Math.max(-maxNudgeVelocity, rotationVelocity.x * velocityBuildUp + yRotation * holdTimeMultiplier));
    rotationVelocity.y = Math.min(maxNudgeVelocity, Math.max(-maxNudgeVelocity, rotationVelocity.y * velocityBuildUp + xRotation * holdTimeMultiplier));

    // Don't update cube positions for keyboard controls
    // const velocityMagnitude = rotationVelocity.length();
    // updateCubePositions(rotationQuaternion, velocityMagnitude);
}
