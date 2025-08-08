import * as THREE from "three";

// Add flag to control rendering state
export let isRendering = true;

// Add functions to pause and resume rendering
export function pauseRenderer() {
    isRendering = false;
}

export function resumeRenderer() {
    isRendering = true;
}

/**
 * Check if WebGL is available and working properly
 * @returns {boolean} True if WebGL is available and working
 */
export function isWebGLAvailable() {
    let isAvailable = false;
    
    try {
        // First check if WebGL is available at all
        if (window.WebGLRenderingContext) {
            // Create temporary canvas to test WebGL support
            const testCanvas = document.createElement('canvas');
            
            // Try WebGL2 first (more features), then fallback to WebGL1
            let testContext = null;
            
            try {
                // Try getting WebGL2 context
                testContext = testCanvas.getContext('webgl2');
            } catch (e) {
                console.warn("WebGL2 not available, trying WebGL1");
            }
            
            if (!testContext) {
                try {
                    // Try getting WebGL1 context as fallback
                    testContext = testCanvas.getContext('webgl') || 
                               testCanvas.getContext('experimental-webgl');
                } catch (e) {
                    console.warn("WebGL1 not available either");
                }
            }
            
            // If we got a valid context, WebGL is supported
            if (testContext) {
                isAvailable = true;
                
                // Additional check - make sure we can create a basic shader program
                try {
                    const vertexShader = testContext.createShader(testContext.VERTEX_SHADER);
                    const fragmentShader = testContext.createShader(testContext.FRAGMENT_SHADER);
                    if (!vertexShader || !fragmentShader) {
                        console.warn("Could not create basic shaders");
                        isAvailable = false;
                    }
                    
                    // Clean up resources
                    if (vertexShader) testContext.deleteShader(vertexShader);
                    if (fragmentShader) testContext.deleteShader(fragmentShader);
                } catch (e) {
                    console.warn("Error testing shader creation:", e);
                    isAvailable = false;
                }
            }
        }
    } catch (e) {
        console.error("Error checking WebGL availability:", e);
        isAvailable = false;
    }
    
    return isAvailable;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export // Helper function to detect mobile devices
function isMobileDevice() {
    const mobileDetect =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0;

    // Log detection result for debugging
    console.log("Mobile device detected: " + mobileDetect);

    return mobileDetect;
}

export function findObjectById(objectsArray, id) {
    for (var object of objectsArray) {
        if (object.id === id) {
            return object;
        }
    }
    return null;
}

function createEnvironment(scene) {
    // Load the 2D image as a texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/assets/textures/hdr/28.03.2023_fade_background.jpg");
    const fadeBg = loader.load("/assets/textures/hdr/28.03.2023_fade_background_S.jpg", (texture) => {
        scene.background = texture;
    });

    // Camera orbit parameters
    const cameraOrbit = {
        initialPosition: null,
        initialTarget: null,
        currentOffset: new THREE.Vector3(0, 0, 0),
        positionOffset: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        positionVelocity: new THREE.Vector3(0, 0, 0),
        maxOffset: Math.PI / 4,
        maxPositionOffset: 50.0,
        followStrength: 0.025,
        positionFollowStrength: 0.02,
        inertia: 0.95,
        returnStrength: 0.045,
        dampingFactor: 0.92,
        isMouseDown: false,
        lastRotationVelocity: new THREE.Vector3(0, 0, 0),
        returnToCenter: false,
    };

    // Update camera position to orbit around sphere
    function updateCameraRotation(camera, sphereRotationVelocity, isMouseDown) {
        // Record initial position and target on first update
        if (!cameraOrbit.initialPosition) {
            cameraOrbit.initialPosition = camera.position.clone();
            const target = new THREE.Vector3(0, 0, 0);
            camera.getWorldDirection(target);
            target.multiplyScalar(14);
            target.add(camera.position);
            cameraOrbit.initialTarget = target;
        }

        // Update mouse down state
        const wasMouseDown = cameraOrbit.isMouseDown;
        cameraOrbit.isMouseDown = isMouseDown;

        // If mouse was just released, start return to center
        if (wasMouseDown && !isMouseDown) {
            cameraOrbit.returnToCenter = true;
            cameraOrbit.lastRotationVelocity.copy(sphereRotationVelocity);
        }

        // Use either current rotation velocity or last stored velocity
        const effectiveRotationVelocity = isMouseDown ? sphereRotationVelocity : cameraOrbit.lastRotationVelocity;

        // Scale the velocities for movement and rotation
        const scaledRotationX = -effectiveRotationVelocity.y * 1.5;
        const scaledPositionX = effectiveRotationVelocity.x * 3.0;
        const scaledPositionY = effectiveRotationVelocity.y * 3.0;

        // Update velocities with smooth follow only when dragging
        if (isMouseDown) {
            cameraOrbit.velocity.x += (scaledRotationX - cameraOrbit.velocity.x) * cameraOrbit.followStrength;
            cameraOrbit.positionVelocity.x += (scaledPositionX - cameraOrbit.positionVelocity.x) * cameraOrbit.positionFollowStrength;
            cameraOrbit.positionVelocity.y += (scaledPositionY - cameraOrbit.positionVelocity.y) * cameraOrbit.positionFollowStrength;
            cameraOrbit.returnToCenter = false;
        }

        // Apply damping
        cameraOrbit.velocity.multiplyScalar(cameraOrbit.dampingFactor);
        cameraOrbit.positionVelocity.multiplyScalar(cameraOrbit.dampingFactor);

        // Apply return force when returning to center
        if (cameraOrbit.returnToCenter) {
            const returnForce = cameraOrbit.returnStrength;
            cameraOrbit.currentOffset.x *= 1 - returnForce;
            cameraOrbit.positionOffset.multiplyScalar(1 - returnForce);

            // Apply stronger return force to velocities
            cameraOrbit.velocity.multiplyScalar(1 - returnForce);
            cameraOrbit.positionVelocity.multiplyScalar(1 - returnForce);
            cameraOrbit.lastRotationVelocity.multiplyScalar(1 - returnForce);

            // Check if we're close enough to center to stop returning
            if (Math.abs(cameraOrbit.currentOffset.x) < 0.001 && cameraOrbit.positionOffset.lengthSq() < 0.001) {
                cameraOrbit.returnToCenter = false;
                cameraOrbit.currentOffset.set(0, 0, 0);
                cameraOrbit.positionOffset.set(0, 0, 0);
            }
        }

        // Update offsets
        cameraOrbit.currentOffset.x += cameraOrbit.velocity.x;
        cameraOrbit.positionOffset.x += cameraOrbit.positionVelocity.x;
        cameraOrbit.positionOffset.y += cameraOrbit.positionVelocity.y;

        // Clamp offsets
        cameraOrbit.currentOffset.x = THREE.MathUtils.clamp(cameraOrbit.currentOffset.x, -cameraOrbit.maxOffset, cameraOrbit.maxOffset);
        cameraOrbit.positionOffset.x = THREE.MathUtils.clamp(
            cameraOrbit.positionOffset.x,
            -cameraOrbit.maxPositionOffset,
            cameraOrbit.maxPositionOffset
        );
        cameraOrbit.positionOffset.y = THREE.MathUtils.clamp(
            cameraOrbit.positionOffset.y,
            -cameraOrbit.maxPositionOffset,
            cameraOrbit.maxPositionOffset
        );

        // Create rotation matrix around Y axis
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(cameraOrbit.currentOffset.x);

        // Apply rotation to both position and target
        const rotatedPosition = cameraOrbit.initialPosition.clone();
        const rotatedTarget = cameraOrbit.initialTarget.clone();
        rotatedPosition.applyMatrix4(rotationMatrix);
        rotatedTarget.applyMatrix4(rotationMatrix);

        // Add position offset
        rotatedPosition.x += cameraOrbit.positionOffset.x;
        rotatedPosition.y += cameraOrbit.positionOffset.y;
        rotatedTarget.x += cameraOrbit.positionOffset.x;
        rotatedTarget.y += cameraOrbit.positionOffset.y;

        // Update camera position and look direction
        camera.position.copy(rotatedPosition);
        camera.lookAt(rotatedTarget);
    }

    return { updateCameraRotation };
}

// Easing function for smooth transitions
export function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Load projects from JSON file
export async function loadProjects() {
    try {
        const response = await fetch('/projects/projects.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projects = await response.json();
        return projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

export { getRandomInt, createEnvironment };

/**
 * Detect when Apfel Grotesk fonts are loaded and apply larger typography
 */
export function detectFontLoading() {
    // Create a test element to check if Apfel Grotesk is loaded
    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Apfel Grotesk, monospace';
    testElement.style.fontSize = '72px';
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.style.whiteSpace = 'nowrap';
    testElement.textContent = 'abcdefghijklmnopqrstuvwxyz';
    
    document.body.appendChild(testElement);
    
    // Get the initial width
    const initialWidth = testElement.offsetWidth;
    
    // Flag to prevent double removal
    let elementRemoved = false;
    
    // Function to safely remove the test element
    const removeTestElement = () => {
        if (!elementRemoved && document.body.contains(testElement)) {
            document.body.removeChild(testElement);
            elementRemoved = true;
        }
    };
    
    // Function to check if font is loaded
    const checkFontLoaded = () => {
        // If element was already removed, stop checking
        if (elementRemoved) return;
        
        const currentWidth = testElement.offsetWidth;
        
        // If width changed, font is loaded
        if (currentWidth !== initialWidth) {
            // Font loaded successfully - keep default (larger) scale
            removeTestElement();
            console.log('Apfel Grotesk fonts loaded - using default (larger) typography scale');
        } else {
            // Check again in 100ms
            setTimeout(checkFontLoaded, 100);
        }
    };
    
    // Start checking
    checkFontLoaded();
    
    // Fallback: if font doesn't load within 3 seconds, apply fallback scale
    setTimeout(() => {
        removeTestElement();
        if (!elementRemoved) {
            document.documentElement.classList.add('fonts-fallback');
            console.log('Apfel Grotesk fonts not loaded - applying fallback typography scale');
        }
    }, 3000);
}

/**
 * Detect media type from file path or URL
 * @param {string} mediaPath - The file path or URL to analyze
 * @returns {string} - The detected media type: 'image', 'video', 'iframe', or 'gif'
 */
export function detectMediaType(mediaPath) {
    if (!mediaPath) return 'image';
    
    // Check for iframe (Vimeo embeds)
    if (mediaPath.startsWith('<iframe')) {
        return 'iframe';
    }
    
    // Check for video file extensions
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const hasVideoExtension = videoExtensions.some(ext => 
        mediaPath.toLowerCase().includes(ext)
    );
    if (hasVideoExtension) {
        return 'video';
    }
    
    // Check for GIF
    if (mediaPath.toLowerCase().includes('.gif')) {
        return 'gif';
    }
    
    // Default to image for all other cases
    return 'image';
}
