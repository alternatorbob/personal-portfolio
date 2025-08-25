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
    // Update camera position - camera stays static, no connection to sphere rotation
    function updateCameraRotation(camera, sphereRotationVelocity, isMouseDown) {
        // Camera remains in its initial position - no movement based on sphere rotation
        // The camera will stay fixed while the sphere and world rotate independently
        
        // If you want to add independent camera controls later, they can be added here
        // without any connection to sphereRotationVelocity
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

export { createEnvironment };

/**
 * Detect when Scto Grotesk fonts are loaded and apply larger typography
 */
export function detectFontLoading() {
    // Create a test element to check if Scto Grotesk is loaded
    const testElement = document.createElement('span');
    testElement.style.fontFamily = 'Scto Grotesk A, monospace';
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
            console.log('Scto Grotesk fonts loaded - using default (larger) typography scale');
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
            console.log('Scto Grotesk fonts not loaded - applying fallback typography scale');
        }
    }, 3000);
}

/**
 * Detect media type from file path or URL
 * @param {string} mediaPath - The file path or URL to analyze
 * @returns {string} - The detected media type: 'image', 'video', or 'gif'
 */
export function detectMediaType(mediaPath) {
    if (!mediaPath) return 'image';
    
    // Ensure mediaPath is a string
    if (typeof mediaPath !== 'string') {
        console.warn('detectMediaType called with non-string value:', mediaPath);
        return 'image';
    }
    
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
