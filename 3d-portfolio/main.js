import "./css/style.css";
import "./css/global_styles.css";
import "./css/mobile.css";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { dragInit } from "./js/dragControl";
import { addProjects, cubes } from "./js/addProjects";
import { projects } from "./js/projects";
import { createEnvironment } from "./js/utils";
import { addProjectCardToPage, uiSwitchState, uiInit } from "./js/ui";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

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

// Add original scale reference for spring effect
export let originalSphereScale = 1.0;

const clock = new THREE.Clock();
export let intersectionTime = 0;

let mouse = new THREE.Vector2();
let click = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
let cubeCamera, cubeRenderTarget;

const textureManager = new THREE.LoadingManager();
textureManager.onStart = function (url, itemsLoaded, itemsTotal) {
    console.log(
        "Started loading file: " +
        url +
        ".\nLoaded " +
        itemsLoaded +
        " of " +
        itemsTotal +
        " files."
    );
};

textureManager.onLoad = function () {
    // all textures are loaded
    // ...
};

const textureLoader = new THREE.TextureLoader();

const roughnessMap = textureLoader.load(
    "assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Roughness.png"
);
const normalMap = textureLoader.load(
    "assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Normal-ogl.png"
);

// Initialize Three.js
threeInit();

function threeInit() {
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        precision: "highp",
        powerPreference: "high-performance",
        alpha: true,
        stencil: false,
        depth: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Slightly increased exposure
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality

    renderer.domElement.classList.add("three-canvas");
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    // Ensure the blur div is positioned correctly (after canvas, before main-container)
    const blurElement = document.getElementById('blur');
    const mainContainer = document.querySelector('.main-container');
    
    if (blurElement && mainContainer) {
        // Remove the blur element from its current position
        blurElement.parentNode.removeChild(blurElement);
        
        // Insert it before the main-container
        mainContainer.parentNode.insertBefore(blurElement, mainContainer);
    }

    window.addEventListener("resize", onWindowResized);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        camFar
    );
    // Adjust camera position for mobile view - higher Y position to make sphere appear lower
    camera.position.z = window.innerWidth < 768 ? 20 : 14;
    camera.position.y = window.innerWidth < 768 ? 12 : 3.5; // Set initial Y position to match target

    scene = new THREE.Scene();

    new RGBELoader()
        .setPath("assets/textures/hdr/")
        .load("quarry_01_1k.pic", function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            // scene.background = texture;
            // scene.environment = texture;
        });

    createEnvironment(scene);

    // Increased ambient light intensity for stronger environment lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Increased from 0.25 to 0.5
    scene.add(ambientLight);

    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    cubeCamera = new THREE.CubeCamera(1, camFar, cubeRenderTarget);

    // Update sphere material for better quality
    const sphereMaterial = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 1.0,
        roughness: 0.4,
        roughnessMap: roughnessMap,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(1.5, 1.5),
        envMapIntensity: 0.85, // Increased environment map intensity
        flatShading: false, // Ensure smooth shading
    });

    // Improve texture quality
    roughnessMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    normalMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
    roughnessMap.minFilter = THREE.LinearFilter;
    normalMap.minFilter = THREE.LinearFilter;
    
    // Create a higher quality sphere geometry
    const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 32);
    
    sphere = new THREE.Mesh(
        sphereGeometry,
        sphereMaterial
    );
    sphere.castShadow = true;
    // Store original scale for spring effect
    originalSphereScale = sphere.scale.x;
    scene.add(sphere);

    addProjects(projects);
    dragInit();
    
    // Initialize UI elements
    uiInit();

    // Setup post-processing with better quality
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(
        window.innerWidth, 
        window.innerHeight, 
        {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding,
            samples: 4 // MSAA for composer
        }
    ));
    
    // Regular scene render pass
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    // Add bloom effect with refined settings
    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.35,    // Slightly reduced bloom strength for clarity
        0.5,    // Increased radius for smoother bloom
        0.85    // threshold
    );
    bloomPass.threshold = 0.85;
    bloomPass.radius = 0.5;
    bloomPass.strength = 0.35;
    composer.addPass(bloomPass);
    
    // Add afterimage effect for motion trails
    afterimagePass = new AfterimagePass(0.75);
    composer.addPass(afterimagePass);
}

function animate(msTime) {
    cubeCamera.update(renderer, scene);

    // Store current rotation
    const currentRotation = new THREE.Euler().copy(camera.rotation);

    // Define target Y position based on device width
    const targetY = window.innerWidth < 768 ? 5.5 : 3.5;

    // Update camera position
    camera.position.y += (mouse.y * 0.7 - camera.position.y + targetY) * 0.03;
    camera.position.x += (-mouse.x * 3.5 - camera.position.x) * 0.05;

    // Restore rotation after position update
    camera.rotation.copy(currentRotation);

    // Update cube positions
    for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        cube.lookAt(sphere.position);
    }

    // Render with post-processing
    composer.render();
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

    if (!wasSelected) {
        if (intersects.length > 0 && intersects[0].object !== sphere) {
            const selectedProject = intersects[0].object;
            
            // Handle material color change for array of materials
            if (Array.isArray(selectedProject.material)) {
                // Set color for all materials in the array
                selectedProject.material.forEach(mat => {
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
