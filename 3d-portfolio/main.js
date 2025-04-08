import "./css/style.css";
import "./css/global_styles.css";
import "./css/mobile.css";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { dragInit } from "./js/dragControl";
import { addProjects, cubes } from "./js/addProjects";
import { projects } from "./js/projects";
import { createEnvironment, isRendering, pauseRenderer, resumeRenderer } from "./js/utils";
import { addProjectCardToPage, uiSwitchState, uiInit } from "./js/ui";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";

const mobileMessage = document.querySelector("#mobile-message");
const mainContainer = document.querySelector(".main-container");
export const navbarHint = document.querySelector(".navbar-hint");

export let wasSelected = false;

let camera, scene, renderer;
let composer, renderPass, bloomPass, afterimagePass;
let sphere;

const camFar = 1500;
export const sphereRadius = window.innerWidth < 768 ? 4.5 : 3.75;
export const numCubes = 10;
export const backgroundRotationFactor = 0.3; // How much the background follows the sphere rotation

// Add original scale reference for spring effect
export let originalSphereScale = 1.0;
let envMesh; // Make environment mesh accessible globally

const clock = new THREE.Clock();
export let intersectionTime = 0;

let mouse = new THREE.Vector2();
let click = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
let cubeCamera, cubeRenderTarget;

// Define gradient shader in global scope
let gradientShader;

const textureManager = new THREE.LoadingManager();
textureManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log("Started loading file: " + url + ".\nLoaded " + itemsLoaded + " of " + itemsTotal + " files.");
};

textureManager.onLoad = function () {
    console.log("All textures are loaded");
    // all textures are loaded
    // ...
};

const textureLoader = new THREE.TextureLoader();

const roughnessMap = textureLoader.load("assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Roughness.png");
const normalMap = textureLoader.load("assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Normal-ogl.png");

// Add initialization flag
let isInitialized = false;

// Initialize Three.js
try {
    threeInit();
} catch (error) {
    console.error("Error during initialization:", error);
    // If initialization fails, switch to fallback mode
    enableFallbackMode();
}

function threeInit() {
    // Only initialize once to prevent context loss
    if (isInitialized) return;
    
    // Direct initialization without checks
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        precision: "highp",
        powerPreference: "high-performance",
        alpha: true,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
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

    if (blurElement && mainContainer) {
        blurElement.parentNode.removeChild(blurElement);
        mainContainer.parentNode.insertBefore(blurElement, mainContainer);
    }

    window.addEventListener("resize", onWindowResized);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, camFar);
    camera.position.z = window.innerWidth < 768 ? 20 : 14;
    camera.position.y = window.innerWidth < 768 ? 12 : 3.5;

    scene = new THREE.Scene();

    gradientShader = {
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
                float gradient = smoothstep(-100.0, -30.0, y - 16.0);
    
                // Base color blend from white (floor) to black (top)
                vec3 color = mix(vec3(1.0), vec3(0.0), gradient);
                
                // Ensure colors stay in valid range
                color = clamp(color, 0.0, 1.0);
    
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    };

    // Create environment cube using the globally defined shader
    envMesh = new THREE.Mesh(
        new THREE.BoxGeometry(300, 300, 300),
        new THREE.ShaderMaterial({
            uniforms: gradientShader.uniforms,
            vertexShader: gradientShader.vertexShader,
            fragmentShader: gradientShader.fragmentShader,
            side: THREE.BackSide,
        })
    );
    scene.add(envMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
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
    const sphereMaterial = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 1.0,
        roughness: 0.4,
        roughnessMap: roughnessMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1.5, 1.5),
        envMapIntensity: 0.6,
    });

    // Improve texture quality
    roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    roughnessMap.minFilter = THREE.LinearFilter;
    normalMap.minFilter = THREE.LinearFilter;

    const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 32);

    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    originalSphereScale = sphere.scale.x;
    scene.add(sphere);

    // Initial cube camera update
    cubeCamera.position.copy(sphere.position);
    cubeCamera.update(renderer, scene);

    addProjects(projects);
    dragInit();
    uiInit();

    // Setup post-processing
    composer = new EffectComposer(
        renderer,
        new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding,
            samples: 4,
        })
    );

    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.08, 0.85, 0.95);
    bloomPass.threshold = 0.95;
    bloomPass.radius = 0.85;
    bloomPass.strength = 0.08;
    composer.addPass(bloomPass);

    afterimagePass = new AfterimagePass(0.65);
    composer.addPass(afterimagePass);

    // Mark as initialized after successful setup
    isInitialized = true;
}

function animate(msTime) {
    // If rendering is paused, don't update or render anything
    if (!isRendering) return;
    
    // Update gradient shader time uniform if needed
    if (gradientShader && gradientShader.uniforms) {
        gradientShader.uniforms.time.value = msTime * 0.001;
    }

    // Update environment mesh rotation based on sphere rotation
    if (envMesh && sphere && sphere.quaternion) {
        // Get the sphere's current rotation as euler angles
        const sphereRotation = new THREE.Euler().setFromQuaternion(sphere.quaternion);

        // Apply scaled rotation to environment mesh
        envMesh.rotation.x = -sphereRotation.x * backgroundRotationFactor;
        envMesh.rotation.z = -sphereRotation.y * backgroundRotationFactor; // Use Y rotation for Z-axis tilt
        envMesh.rotation.y = sphereRotation.z * backgroundRotationFactor * 0.5; // Subtle Y-axis rotation
    }

    // Hide sphere and update cubemap
    if (sphere && cubeCamera && renderer && scene) {
        sphere.visible = false;
        cubeCamera.position.copy(sphere.position);
        cubeCamera.update(renderer, scene);
        sphere.visible = true;
    }

    // Update camera position
    if (camera && typeof mouse !== 'undefined') {
        camera.position.y += (mouse.y * 0.7 - camera.position.y + (window.innerWidth < 768 ? 5.5 : 3.5)) * 0.03;
        camera.position.x += (-mouse.x * 3.5 - camera.position.x) * 0.05;
    }

    // Update cube positions
    if (cubes && cubes.length > 0 && sphere) {
        for (let i = 0; i < cubes.length; i++) {
            const cube = cubes[i];
            if (cube) cube.lookAt(sphere.position);
        }
    }

    // Render with post-processing
    if (composer) {
        composer.render();
    }
}

export function reverseSelected() {
    wasSelected = !wasSelected;
}

function onWindowResized() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    composer.setPixelRatio(pixelRatio);
}

// Add touch event listeners
document.addEventListener(
    "touchmove",
    function (event) {
        event.preventDefault();
        const touch = event.touches[0];
        mouse.x = touch.clientX / window.innerWidth - 0.5;
        mouse.y = touch.clientY / window.innerHeight - 0.5;
    },
    { passive: false }
);

window.addEventListener("touchstart", onTouchStart, false);

function onTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    click.x = (touch.clientX / window.innerWidth) * 2 - 1;
    click.y = -(touch.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(click, camera);
    const intersects = raycaster.intersectObjects([sphere, ...cubes]);

    // Check if a project card is already open
    const existingProjectCards = document.querySelectorAll('.project-card');
    if (existingProjectCards.length > 0) {
        return; // Don't process further if a card is already open
    }

    if (!wasSelected) {
        if (intersects.length > 0 && intersects[0].object !== sphere) {
            const selectedProject = intersects[0].object;

            // Handle material color change for array of materials
            if (Array.isArray(selectedProject.material)) {
                // Set color for all materials in the array
                selectedProject.material.forEach((mat) => {
                    if (mat && mat.color) {
                        mat.color.set(0x202020);
                    }
                });
            } else if (selectedProject.material && selectedProject.material.color) {
                // Fallback for single material
                selectedProject.material.color.set(0x202020);
            }

            renderer.domElement.style.cursor = "pointer";

            if (selectedProject) {
                wasSelected = true;
                addProjectCardToPage(selectedProject.name, mainContainer);
                uiSwitchState("2d");
            }
        } else {
            renderer.domElement.style.cursor = "auto";
        }
    }
}

export { camera, scene, renderer, sphere };

// Function to enable fallback mode when WebGL is not available
function enableFallbackMode() {
    // Show the list view as fallback
    const listView = document.querySelector(".list-view");
    const viewToggle = document.querySelector(".view-toggle");
    const blur = document.getElementById("blur");
    const navbarHint = document.querySelector(".navbar-hint");
    
    if (listView) {
        listView.classList.add("active");
        // Style changes for fallback mode
        listView.style.transform = "translateX(0)";
        listView.style.zIndex = "1000";
        
        // Hide blur since we won't have the 3D effect
        if (blur) {
            blur.classList.add("hide");
        }
        
        // Hide navbar hint since it's not needed in list view
        if (navbarHint) {
            navbarHint.classList.add("hide");
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
        if (typeof uiInit === 'function') {
            uiInit();
        }
    }
}
