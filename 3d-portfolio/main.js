import "./css/style.css";
import "./css/global_styles.css";
import "./css/mobile.css";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
import { dragInit } from "./js/dragControl";
import { addProjects, cubes } from "./js/addProjects";
import { projects } from "./js/projects";
import { createEnvironment } from "./js/utils";
import { addProjectCardToPage, uiSwitchState, uiInit } from "./js/ui";

const mobileMessage = document.querySelector("#mobile-message");
const mainContainer = document.querySelector(".main-container");
export const navbarHint = document.querySelector(".navbar-hint");

export let wasSelected = false;

let camera, scene, renderer;

let sphere;

const camFar = 1500;
export const sphereRadius = window.innerWidth < 768 ? 6 : 3.75;
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
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;

    renderer.domElement.classList.add("three-canvas");
    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    window.addEventListener("resize", onWindowResized);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        camFar
    );
    // Adjust camera position for mobile view - higher Y position to make sphere appear lower
    camera.position.z = window.innerWidth < 768 ? 22 : 14;
    camera.position.y = window.innerWidth < 768 ? 10 : 3.5; // Increased from 6 to 10 for mobile

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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Increased from 0.25 to 0.5
    scene.add(ambientLight);

    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    cubeCamera = new THREE.CubeCamera(1, camFar, cubeRenderTarget);

    const sphereMaterial = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget.texture,
        metalness: 1.0,
        roughness: 0.4,
        roughnessMap: roughnessMap, // roughnessMap is your loaded roughness texture
        normalMap: normalMap, // normalMap is your loaded normal map texture
        normalScale: new THREE.Vector2(1.5, 1.5), // adjust the normal map strength with this Vector2
    });

    // Create a higher resolution sphere geometry for better subdivision
    const sphereGeometry = new THREE.IcosahedronGeometry(sphereRadius, 100);
    
    // Apply subtle noise displacement to the vertices
    const noise = new SimplexNoise();
    const noiseScale = 0.15; // Scale of the noise (smaller = more subtle)
    const noiseAmount = -0.15; // Amount of displacement (smaller = more subtle)
    
    const positionAttribute = sphereGeometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i);
        
        // Normalize to get direction
        const direction = vertex.clone().normalize();
        
        // Apply noise based on position
        const noiseValue = noise.noise(
            direction.x * noiseScale, 
            direction.y * noiseScale, 
            direction.z * noiseScale
        );
        
        // Displace vertex along its direction
        vertex.add(direction.multiplyScalar(noiseValue * noiseAmount));
        
        // Write back to geometry
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    // Update normals after displacement
    sphereGeometry.computeVertexNormals();
    
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
}

function animate(msTime) {
    cubeCamera.update(renderer, scene);

    // Store current rotation
    const currentRotation = new THREE.Euler().copy(camera.rotation);

    // Update camera position
    camera.position.y += (mouse.y * 0.7 - camera.position.y + 3.5) * 0.03;
    camera.position.x += (-mouse.x * 3.5 - camera.position.x) * 0.05;

    // Restore rotation after position update
    camera.rotation.copy(currentRotation);

    // Update cube positions
    for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];
        cube.lookAt(sphere.position);
    }

    renderer.render(scene, camera);
}

export function reverseSelected() {
    wasSelected = !wasSelected;
}

function onWindowResized() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
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
