import "./css/style.css";
import "./css/global_styles.css";
import "./css/mobile.css";
import * as THREE from "three";
import { dragInit, updateCubesForSphereRotation, worldRotation, rotationVelocity, animateInertia } from "./js/dragControl";
import { addProjects } from "./js/addProjects";
import { isRendering, easeInOutCubic, loadProjects, detectFontLoading, isMobileDevice } from "./js/utils";
import { uiInit } from "./js/ui";

// Don't show content immediately - wait for loading to complete

const mainContainer = document.querySelector(".main-container");

export let wasSelected = false;

// Random rotation parameters for navbar name click
const RANDOM_ROTATION_MIN_VELOCITY = 0.02;
const RANDOM_ROTATION_MAX_VELOCITY = 0.08;
const RANDOM_ROTATION_MIN_DIRECTION = -1;
const RANDOM_ROTATION_MAX_DIRECTION = 1;

let camera, scene, renderer;
let sphere;

const camFar = 750;
export const sphereRadius = window.innerWidth < 768 ? 4.5 : 3.75;
// Add original scale reference for spring effect
export let originalSphereScale = 1.0;
export let envMesh; // Make environment mesh accessible globally

// Add material state tracking
let isGlassMaterial = false;
let metalMaterial, glassMaterial;
let transitionInProgress = false;
let transitionStartTime = 0;
const TRANSITION_DURATION = 720; // 1 second transition

let mouse = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
let cubeCamera, cubeRenderTarget;

// Function to toggle sphere material (used by spacebar and bottom navbar)
export function toggleSphereMaterial() {
    if (!transitionInProgress) {
        isGlassMaterial = !isGlassMaterial;
        transitionInProgress = true;
        transitionStartTime = performance.now();
    }
}

// Function to apply random rotation to sphere
export function applyRandomRotation() {
    if (!sphere || !worldRotation || !rotationVelocity) return;
    
    // Generate random velocities for X and Y rotation
    const randomVelX = (Math.random() * (RANDOM_ROTATION_MAX_VELOCITY - RANDOM_ROTATION_MIN_VELOCITY) + RANDOM_ROTATION_MIN_VELOCITY) 
                      * (Math.random() > 0.5 ? RANDOM_ROTATION_MAX_DIRECTION : RANDOM_ROTATION_MIN_DIRECTION);
    const randomVelY = (Math.random() * (RANDOM_ROTATION_MAX_VELOCITY - RANDOM_ROTATION_MIN_VELOCITY) + RANDOM_ROTATION_MIN_VELOCITY) 
                      * (Math.random() > 0.5 ? RANDOM_ROTATION_MAX_DIRECTION : RANDOM_ROTATION_MIN_DIRECTION);
    
    // Apply the random velocities to the rotation system
    rotationVelocity.x = randomVelX;
    rotationVelocity.y = randomVelY;
    rotationVelocity.z = 0; // Keep Z rotation at 0 for cleaner movement
    
    // Trigger inertia animation to start the rotation
    if (rotationVelocity.length() > 0.0001) {
        animateInertia();
    }
}

// Define gradient shader in global scope
let bgShader;

const textureManager = new THREE.LoadingManager();
textureManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log("Started loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
};

textureManager.onLoad = function () {
    console.log("All textures are loaded");
    texturesLoaded = true;
    checkLoadingComplete();
};

const textureLoader = new THREE.TextureLoader(textureManager);

const roughnessMap = textureLoader.load("assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Roughness.png");
const normalMap = textureLoader.load("assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Normal-ogl.png");

// Add initialization flag
let isInitialized = false;
let texturesLoaded = false;

// Function to handle loading completion and blackout
function checkLoadingComplete() {
    if (isInitialized && texturesLoaded) {
        console.log("Loading complete - starting fade sequence");

        // Mark JavaScript as loaded and show content
        document.body.classList.add("js-loaded");

        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) {
            // Keep blackout for a brief moment, then fade out smoothly
            setTimeout(() => {
                loadingScreen.classList.add("hide");
                // Remove the loading screen after fade completes
                setTimeout(() => {
                    loadingScreen.remove();
                }, 1550); // Match CSS transition duration
            }, 300); // Brief pause before fade
        }

        // Trigger intro fade
        const introFade = document.querySelector(".intro-fade");
        if (introFade) {
            setTimeout(() => {
                introFade.classList.add("fade-out");
            }, 500); // Brief pause before fade
        }
    }
}

// Initialize Three.js
async function init() {
    try {
        // Start font loading detection
        detectFontLoading();

        await threeInit();
    } catch (error) {
        console.error("Error during initialization:", error);
        // If initialization fails, switch to fallback mode
        enableFallbackMode();
    }
}

// Start the application
init();

async function threeInit() {
    // Only initialize once to prevent context loss
    if (isInitialized) return;

    // Direct initialization without checks
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        precision: "mediump",
        powerPreference: "default",
        alpha: false,
        stencil: false,
        depth: false,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.classList.add("three-canvas");
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Ensure the blur div is positioned correctly
    const blurElement = document.getElementById("blur");
    const mainContainer = document.querySelector(".main-container");

    // if (blurElement && mainContainer) {
    //     blurElement.parentNode.removeChild(blurElement);
    //     mainContainer.parentNode.insertBefore(blurElement, mainContainer);
    // }

    window.addEventListener("resize", onWindowResized);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, camFar);
    camera.position.z = window.innerWidth < 768 ? 21.5 : 15;

    // Calculate camera Y position to be above the bottom navbar
    updateCameraPositionForNavbar();

    scene = new THREE.Scene();

    bgShader = {
        uniforms: {
            time: { value: 0 },
        },
        vertexShader: `
            varying vec3 vWorldPosition;
    
            void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
            }
        `,
        fragmentShader: `
            varying vec3 vWorldPosition;
    
            void main() {
                float y = vWorldPosition.y;
    
                // Gradient transition with wider smoothing area
                float gradient = smoothstep(-50.0, 100.0, y + 200.0);
                
    
                // Base color blend from white (floor) to black (top)
                vec3 color = mix(vec3(1.0), vec3(0.0), gradient);
                
                // Ensure colors stay in valid range
                color = clamp(color, 0.0, 1.0);
    
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    };

    // Create environment with subdivision for smoother look
    // Option 1: Subdivided Cube (current geometry with more faces)
    // Alternative geometries to try (comment/uncomment to test):
    envMesh = new THREE.Mesh(
        // Option 1: Subdivided Cube (current - more faces than original)
        // new THREE.BoxGeometry(1000, 1000, 1000, 10, 10, 10), // 20x20x20 subdivision

        // Option 2: Sphere (smoothest, most faces)
        // new THREE.SphereGeometry(700, 64, 32), // radius, widthSegments, heightSegments
        new THREE.SphereGeometry(700, 16, 16), // radius, widthSegments, heightSegments

        // Option 3: Icosahedron (organic, spherical but faceted)
        // new THREE.IcosahedronGeometry(700, 4), // radius, subdivision_level (0-5)

        // Option 4: Cylinder (good for horizons, infinite feeling)
        // new THREE.CylinderGeometry(1000, 1000, 1000, 32, 20), // topRadius, bottomRadius, height, radialSegments, heightSegments

        // Option 5: Dodecahedron (12-sided, unique look)
        // new THREE.DodecahedronGeometry(700, 2), // radius, subdivision_level (0-3)

        new THREE.ShaderMaterial({
            uniforms: bgShader.uniforms,
            vertexShader: bgShader.vertexShader,
            fragmentShader: bgShader.fragmentShader,
            side: THREE.BackSide,
        })
    );
    scene.add(envMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.475);
    scene.add(ambientLight);

    // Set up cube render target with higher resolution for better quality
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
        mapping: THREE.CubeReflectionMapping,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding,
    });

    cubeCamera = new THREE.CubeCamera(0.1, camFar, cubeRenderTarget);

    // Update sphere material
    metalMaterial = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 1.0,
        roughness: 0.4,
        roughnessMap: roughnessMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1.5, 1.5),
        envMapIntensity: 0.6,
        transparent: true,
        opacity: 1.0,
    });

    // Create glass material
    glassMaterial = new THREE.MeshPhysicalMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 0.0,
        roughness: 0.1,
        transmission: 0.9,
        thickness: 1.0,
        envMapIntensity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        ior: 1.309,
        reflectivity: 1.0,
        transparent: true,
        opacity: 0.0,
    });

    // Improve texture quality
    roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    roughnessMap.minFilter = THREE.LinearFilter;
    normalMap.minFilter = THREE.LinearFilter;

    const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 32);

    // Create a group to hold both materials
    const materialGroup = new THREE.Group();
    const metalSphere = new THREE.Mesh(sphereGeometry, metalMaterial);
    const glassSphere = new THREE.Mesh(sphereGeometry, glassMaterial);
    materialGroup.add(metalSphere);
    materialGroup.add(glassSphere);
    materialGroup.castShadow = true;
    originalSphereScale = materialGroup.scale.x;
    scene.add(materialGroup);
    sphere = materialGroup;

    // Helper function to get currently visible video in slideshow
    function getCurrentVisibleVideo(slideshowContainer) {
        // Find the slide group and current slide
        const slideGroup = slideshowContainer.querySelector(".slide-group");
        if (!slideGroup) return null;

        // Get all slides
        const slides = slideGroup.querySelectorAll(".slide");
        if (!slides || slides.length === 0) return null;

        // Calculate which slide is currently visible based on transform
        const transform = slideGroup.style.transform;
        let currentIndex = 0;

        if (transform && transform.includes("translateX")) {
            // Extract translateX value and calculate current slide index
            const translateX = transform.match(/translateX\(([^)]+)\)/);
            if (translateX && translateX[1]) {
                const translateValue = parseFloat(translateX[1]);
                // Each slide is 100% width, so index = abs(translateValue) / 100
                currentIndex = Math.round(Math.abs(translateValue) / 100);
            }
        }

        // Ensure index is within bounds
        currentIndex = Math.max(0, Math.min(currentIndex, slides.length - 1));

        // Get the current slide and check for video
        const currentSlide = slides[currentIndex];
        if (!currentSlide) return null;

        // Look for video element in current slide
        const video = currentSlide.querySelector("video");

        // Only return video if it's actually loaded and not hidden
        if (video && video.readyState >= 2) {
            // HAVE_CURRENT_DATA or higher
            return video;
        }

        return null;
    }

    // Add spacebar event listener (only for desktop)
    if (!isMobileDevice()) {
        document.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                e.preventDefault();

                // Check if a project card is currently open
                const projectCard = document.querySelector(".project-card.show");

                if (projectCard) {
                    // Project is open - check for current video in slideshow
                    const slideshowContainer = projectCard.querySelector(".slideshow-container");
                    if (slideshowContainer) {
                        const currentVideo = getCurrentVisibleVideo(slideshowContainer);
                        if (currentVideo) {
                            // Video found - toggle play/pause
                            if (currentVideo.paused) {
                                currentVideo.play().catch((error) => {
                                    console.log("Video play failed:", error);
                                });
                            } else {
                                currentVideo.pause();
                            }
                            return; // Don't toggle sphere material
                        }
                    }
                    // Project is open but no video playing - don't affect sphere
                    return;
                }

                // No project open - toggle sphere material if not in transition
                if (!transitionInProgress) {
                    toggleSphereMaterial();
                }
            }
        });
    }

    // Initial cube camera update
    cubeCamera.position.copy(sphere.position);
    cubeCamera.update(renderer, scene);

    // Load projects from JSON and initialize
    const projects = await loadProjects();
    addProjects(projects);
    dragInit();
    uiInit(projects);

    // Mark as initialized after successful setup
    isInitialized = true;
    checkLoadingComplete();
}

function animate(msTime) {
    // If rendering is paused, don't update or render anything
    if (!isRendering) return;

    // Handle material transition
    if (transitionInProgress) {
        const elapsed = msTime - transitionStartTime;
        const rawProgress = Math.min(elapsed / TRANSITION_DURATION, 1);
        const progress = easeInOutCubic(rawProgress);

        if (isGlassMaterial) {
            // Fading to glass
            metalMaterial.opacity = 1 - progress;
            glassMaterial.opacity = progress;
        } else {
            // Fading to metal
            metalMaterial.opacity = progress;
            glassMaterial.opacity = 1 - progress;
        }

        if (rawProgress >= 1) {
            transitionInProgress = false;
            // Ensure final opacity values
            metalMaterial.opacity = isGlassMaterial ? 0 : 1;
            glassMaterial.opacity = isGlassMaterial ? 1 : 0;
        }
    }

    // Update gradient shader time uniform if needed
    if (bgShader && bgShader.uniforms) {
        bgShader.uniforms.time.value = msTime * 0.001;
    }

    // Hide sphere and update cubemap
    if (sphere && cubeCamera && renderer && scene) {
        sphere.visible = false;
        cubeCamera.position.copy(sphere.position);
        cubeCamera.update(renderer, scene);
        sphere.visible = true;
    }

    // Camera position is now static - no movement based on mouse
    // The camera stays fixed while the sphere and world rotate independently

    // Update cube positions to follow sphere rotation
    updateCubesForSphereRotation();

    renderer.render(scene, camera);
}

export function reverseSelected() {
    wasSelected = !wasSelected;
}

// Helper function to calculate camera position based on navbar position
function updateCameraPositionForNavbar() {
    // Navbar is at bottom: 12px with height: 30px, so it's at viewport height - 42px
    // We want camera to be above this, so we calculate the percentage
    const viewportHeight = window.innerHeight;
    const navbarBottom = 12; // CSS bottom value
    const navbarHeight = 30; // CSS height value
    const navbarTop = viewportHeight - navbarBottom - navbarHeight;

    // Add a small offset above the navbar (in viewport pixels)
    const offsetAboveNavbar = 20; // Adjust this value to position camera above navbar
    const cameraTargetY = navbarTop - offsetAboveNavbar;

    // Convert to a percentage of viewport height (0-1 range)
    const cameraYPercent = cameraTargetY / viewportHeight;

    // Convert percentage to world space coordinates
    // For mobile: use a larger range, for desktop: use a smaller range
    const worldHeightRange = window.innerWidth < 768 ? 5.75 : 3.75; // Adjust these values as needed
    camera.position.y = cameraYPercent * worldHeightRange;
}

function onWindowResized() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Recalculate camera position based on new viewport dimensions
    updateCameraPositionForNavbar();

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
}

// Touch events are now handled by dragControl.js for better event management

export { camera, scene, renderer, sphere };

// Function to enable fallback mode when WebGL is not available
function enableFallbackMode() {
    console.log("Fallback mode - starting fade sequence");

    // Mark JavaScript as loaded and show content
    document.body.classList.add("js-loaded");

    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        // Keep blackout for a brief moment, then fade out smoothly
        setTimeout(() => {
            loadingScreen.classList.add("hide");
            setTimeout(() => {
                loadingScreen.remove();
            }, 1250);
        }, 300); // Brief pause before fade
    }

    // Trigger intro fade
    const introFade = document.querySelector(".intro-fade");
    if (introFade) {
        setTimeout(() => {
            introFade.classList.add("fade-out");
        }, 500); // Brief pause before fade
    }

    // Show the index view as fallback
    const indexView = document.querySelector(".index-view");
    const viewToggle = document.querySelector(".view-toggle");
    const blur = document.getElementById("blur");

    if (indexView) {
        indexView.classList.add("active");
        // Style changes for fallback mode
        indexView.style.transform = "translateX(0)";
        indexView.style.zIndex = "1000";

        // Hide blur since we won't have the 3D effect
        if (blur) {
            blur.classList.add("hide");
        }

        // Update toggle if it exists
        if (viewToggle) {
            viewToggle.classList.add("active");
            // Disable the toggle button since we can't switch back to 3D
            viewToggle.style.pointerEvents = "none";
            viewToggle.style.opacity = "0.5";
        }

        // Hide any three.js related elements
        const threeCanvas = document.querySelector(".three-canvas");
        if (threeCanvas) {
            threeCanvas.style.display = "none";
        }

        // Make sure the UI is initialized for viewing projects
        if (typeof uiInit === "function") {
            loadProjects()
                .then((projects) => {
                    uiInit(projects);
                })
                .catch((error) => {
                    console.error("Error loading projects in fallback mode:", error);
                    uiInit([]); // Initialize with empty array if loading fails
                });
        }
    }
}
