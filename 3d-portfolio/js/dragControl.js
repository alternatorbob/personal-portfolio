import * as THREE from "three";
import { camera, renderer, sphere, navbarHint, originalSphereScale } from "../main";
import { cubes, cubeOriginalDimensions } from "./addProjects";
import { uiSwitchState, addProjectCardToPage } from "./ui";
import { createEnvironment } from "./utils";

let isDragging = false;
let wasDragged = false;
let lastMousePosition = new THREE.Vector2();
export let mousePosition = new THREE.Vector2();
let intersectionPoint;
let cursorStyle = "none";

// Spring effect parameters
const springCompression = 0.9; // How much the sphere shrinks when pressed
const mobileSpringCompression = 0.92; // Less compression for mobile devices
const springDamping = 0.65; // Damping factor for the spring
const springStiffness = 0.1; // Stiffness of the spring
let targetScale = 1.0; // Target scale for the spring effect
let currentScale = 1.0; // Current scale of the sphere
let springVelocity = 0; // Velocity of the spring

// Cube scaling parameters
const cubeOriginalScales = new Map(); // Store original scales of cubes
const cubeMaxScaleFactor = 1.15; // Maximum scale increase for closest cubes
const cubeMinScaleFactor = 0.9; // Minimum scale for furthest cubes
const cubeScaleDistance = 15; // Distance over which scaling is applied
let cubeScalingEnabled = false; // Will be enabled after initialization

const raycaster = new THREE.Raycaster();

// Create a quaternion to store the sphere rotation
const sphereRotation = new THREE.Quaternion();

// Add velocity tracking
let rotationVelocity = new THREE.Vector3();
const dampingFactor = 0.9; // Even stronger damping
const velocityFactor = 0.0089; // Drastically reduced
const mobileVelocityFactor = 0.012; // Drastically reduced for mobile
const maxVelocity = 0.7; // Drastically reduced maximum velocity
const mobileMaxVelocity = 0.65; // Drastically reduced for mobile

// Add animation frame tracking
let lastTime = 0;
let animationFrameId = null;

// Detect if we're on mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Camera rotation control
let cameraControl;

// Define touch event handlers before they're used
// Touch event handlers
const onTouchStart = function(e) {
    e.preventDefault();
    const touch = e.touches[0];
    raycaster.setFromCamera(
        new THREE.Vector2(
            (touch.clientX / window.innerWidth) * 2 - 1,
            (-touch.clientY / window.innerHeight) * 2 + 1
        ),
        camera
    );
    const intersections = raycaster.intersectObject(sphere);
    if (intersections.length > 0) {
        intersectionPoint = intersections[0].point;
        isDragging = true;
        wasDragged = true;
        // Reset velocity when starting to drag
        rotationVelocity.set(0, 0, 0);
        
        // Apply spring compression effect - use mobile-specific value
        targetScale = mobileSpringCompression;
    }

    if (wasDragged == true) {
        navbarHint.classList.add("fade-out");
    }

    lastMousePosition.set(touch.clientX, touch.clientY);
    lastTime = performance.now();
};

const onTouchMove = function(e) {
    e.preventDefault();
    if (!isDragging) return;

    renderer.domElement.style.cursor = "grabbing";
    const touch = e.touches[0];
    mousePosition.set(touch.clientX, touch.clientY);
    
    // Calculate touch movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);
    
    // Apply a fixed factor for direct rotation control (lower for mobile)
    const factor = mobileVelocityFactor;
    
    // Apply direct rotation based on touch movement
    const xRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        mouseDelta.y * factor
    );
    
    const yRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        mouseDelta.x * factor
    );
    
    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);
    
    // Apply rotation
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);
    
    // Update velocity for inertia (with very low values)
    rotationVelocity.x = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.x * factor * 0.1));
    rotationVelocity.y = Math.min(mobileMaxVelocity, Math.max(-mobileMaxVelocity, mouseDelta.y * factor * 0.1));
    
    // Update camera rotation
    cameraControl.updateCameraRotation(camera, rotationVelocity);
    
    lastMousePosition.copy(mousePosition);
    lastTime = performance.now();

    // Update cube positions
    for (let cube of cubes) {
        cube.position.applyQuaternion(rotationQuaternion);
        cube.lookAt(sphere.position);
    }
};

const onTouchEnd = function() {
    if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";
        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }
        
        // Release spring compression
        targetScale = originalSphereScale;
    }
};

export function dragInit() {
    // Initialize camera control
    cameraControl = createEnvironment(sphere.parent);

    // Add mouse event listeners
    renderer.domElement.addEventListener("mousemove", onMouseMove);
    renderer.domElement.addEventListener("mousemove", onMouseHover);
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", onMouseUp);

    // Add touch event listeners
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    renderer.domElement.addEventListener("touchend", onTouchEnd);
    
    // Store original cube scales
    setTimeout(() => {
        for (let cube of cubes) {
            cubeOriginalScales.set(cube.uuid, cube.scale.x);
        }
        cubeScalingEnabled = true;
    }, 1000); // Delay to ensure cubes are fully loaded
    
    // Start the spring animation
    animateSpring();
}

function animateSpring() {
    requestAnimationFrame(animateSpring);
    
    // Calculate spring physics
    const springForce = (targetScale - currentScale) * springStiffness;
    springVelocity += springForce;
    springVelocity *= springDamping;
    currentScale += springVelocity;
    
    // Apply scale to sphere
    if (sphere) {
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
        cube.scale.lerp(new THREE.Vector3(
            scaleFactor,
            scaleFactor,
            scaleFactor
        ), 0.1);
    }
}

function onMouseHover(e) {
    raycaster.setFromCamera(
        new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            (-e.clientY / window.innerHeight) * 2 + 1
        ),
        camera
    );

    const intersections = raycaster.intersectObject(sphere);
   
    if (!isDragging) {
        if (intersections.length > 0) {
            renderer.domElement.style.cursor = "grab";
        } else {
            renderer.domElement.style.cursor = "auto";
        }
    }
}

function onMouseDown(e) {
    raycaster.setFromCamera(
        new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            (-e.clientY / window.innerHeight) * 2 + 1
        ),
        camera
    );
    const intersections = raycaster.intersectObjects([sphere, ...cubes]);
    if (intersections.length > 0) {
        const intersectedObject = intersections[0].object;
        if (cubes.includes(intersectedObject)) {
            // If a cube is clicked, switch to 2D mode and open the gallery
            const projectId = intersectedObject.name; // Assuming each cube has a unique name matching the project ID
            uiSwitchState("2d");
            addProjectCardToPage(projectId, document.querySelector(".main-container"));
        } else {
            // If the sphere is clicked, handle dragging
            intersectionPoint = intersections[0].point;
            isDragging = true;
            wasDragged = true;
            // Reset velocity when starting to drag
            rotationVelocity.set(0, 0, 0);
            
            // Apply spring compression effect
            targetScale = springCompression;
        }
    }

    if (wasDragged == true) {
        navbarHint.classList.add("fade-out");
    }

    lastMousePosition.set(e.clientX, e.clientY);
    lastTime = performance.now();
}

function onMouseUp() {
    if (isDragging) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";
        // Start inertia animation if there's velocity
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }
        
        // Release spring compression
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
            
            // Stop animation if velocity is very small
            if (rotationVelocity.length() < 0.0001) {
                rotationVelocity.set(0, 0, 0);
                return;
            }
            
            // Apply rotation directly based on velocity components
            const xRotation = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(1, 0, 0),
                rotationVelocity.y
            );
            
            const yRotation = new THREE.Quaternion().setFromAxisAngle(
                new THREE.Vector3(0, 1, 0),
                rotationVelocity.x
            );
            
            const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);
            
            // Apply rotation
            sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
            sphere.setRotationFromQuaternion(sphereRotation);
            
            // Update camera rotation
            cameraControl.updateCameraRotation(camera, rotationVelocity);

            // Update cube positions
            for (let cube of cubes) {
                cube.position.applyQuaternion(rotationQuaternion);
                cube.lookAt(sphere.position);
            }
            
            requestAnimationFrame(animate);
        }
    };
    animate();
}

function onMouseMove(e) {
    if (!isDragging) return;

    renderer.domElement.style.cursor = "grabbing";

    mousePosition.set(e.clientX, e.clientY);
    
    // Calculate mouse movement delta
    const mouseDelta = new THREE.Vector2().subVectors(mousePosition, lastMousePosition);
    
    // Apply a fixed factor for direct rotation control
    const factor = velocityFactor;
    
    // Apply direct rotation based on mouse movement
    const xRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        mouseDelta.y * factor
    );
    
    const yRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        mouseDelta.x * factor
    );
    
    const rotationQuaternion = new THREE.Quaternion().multiplyQuaternions(yRotation, xRotation);
    
    // Apply rotation
    sphereRotation.multiplyQuaternions(rotationQuaternion, sphereRotation);
    sphere.setRotationFromQuaternion(sphereRotation);
    
    // Update velocity for inertia
    rotationVelocity.x = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.x * factor * 0.1));
    rotationVelocity.y = Math.min(maxVelocity, Math.max(-maxVelocity, mouseDelta.y * factor * 0.1));
    
    // Update camera rotation
    cameraControl.updateCameraRotation(camera, rotationVelocity);
    
    lastMousePosition.copy(mousePosition);
    lastTime = performance.now();

    // Update cube positions
    for (let cube of cubes) {
        cube.position.applyQuaternion(rotationQuaternion);
        cube.lookAt(sphere.position);
    }

    if (hasCursorLeftScreen(e)) {
        isDragging = false;
        renderer.domElement.style.cursor = "auto";
        if (rotationVelocity.length() > 0.0001) {
            animateInertia();
        }
    }
}

function hasCursorLeftScreen(event) {
    return event.clientX < 0 ||
        event.clientX > window.innerWidth ||
        event.clientY < 0 ||
        event.clientY > window.innerHeight
        ? true
        : false;
}
