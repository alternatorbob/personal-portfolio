import "./css/style.css";
import "./css/global_styles.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer";

import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { dragInit } from "./js/dragControl";
import { addProjects, cubes } from "./js/addProjects";
import { projects } from "./js/projects";
import { createEnvironment } from "./js/utils";
import { addProjectCardToPage, uiSwitchState } from "./js/ui";

const mobileMessage = document.querySelector("#mobile-message");
const mainContainer = document.querySelector(".main-container");
export const navbarHint = document.querySelector(".navbar-hint");

export let wasSelected = false;

let camera, scene, renderer;

let sphere;

const camFar = 1500;
export const sphereRadius = 3.75;
export const numCubes = 10;

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

// check for common mobile user agents
if (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
) {
    mobileMessage.classList.remove("hidden");
} else {
    threeInit();
}

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
    camera.position.z = 14;
    camera.position.y = 3.5;

    scene = new THREE.Scene();

    new RGBELoader()
        .setPath("assets/textures/hdr/")
        .load("quarry_01_1k.pic", function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            // scene.background = texture;
            // scene.environment = texture;
        });

    createEnvironment(scene);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    const redLight_1 = new THREE.DirectionalLight(0xff0000, 0.25);
    redLight_1.castShadow = true;

    redLight_1.position.set(0, 6, -15); // set position to above
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

    sphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(sphereRadius, 20),
        sphereMaterial
    );
    sphere.castShadow = true;
    scene.add(sphere);

    addProjects(projects);

    dragInit();
}

function animate(msTime) {
    const time = clock.getElapsedTime();

    // if (!wasSelected) {
    //     //project creation based on raycast
    //     const { selectedProject } = laserBeam.intersect(
    //         new THREE.Vector3(0, 2, -10),
    //         cubes,
    //         intersectionTime
    //     );

    //     if (selectedProject) {
    //         wasSelected = true;
    //         addProjectCardToPage(selectedProject, mainContainer);
    //         uiSwitchState("2d");
    //     }
    // }

    //scene objects animation
    cubeCamera.update(renderer, scene);
    for (let cube of cubes) {
        cube.lookAt(sphere.position);
    }

    // camera.position.y += (mouse.y * 1.5 - camera.position.y + 3.5) * 0.03;
    camera.position.x += (-mouse.x * 3.5 - camera.position.x) * 0.05;

    const width = window.innerWidth;
    const mouseThreshold = width * 0.4;

    if (camera.rotation.y > -0.16 && mouse.x > width / 2 - mouseThreshold) {
        camera.rotation.y += mouse.x * 0.0005;
    } else if (
        camera.rotation.y < 0.16 &&
        mouse.x > width / 2 + mouseThreshold
    ) {
        camera.rotation.y -= mouse.x * 0.0005;
    }

    camera.position.z = (mouse.y * 1.5 - camera.position.x) * 0.05 + 14;

    // Loop through the array of cubes and update their positions
    for (let i = 0; i < cubes.length; i++) {
        const cube = cubes[i];

        // Define variables for the movement
        const amplitude = 0.0001 + i * 0.005; // Increase amplitude with each cube
        const frequency = 0.05 + i * 0.01; // Increase frequency with each cube

        // Update the cube's position with a sine wave
        cube.position.x +=
            Math.sin(Date.now() * frequency * 0.000001) * amplitude;
        // cube.position.y +=
        //     Math.sin(Date.now() * frequency * 0.0001) * amplitude;
    }

    renderer.render(scene, camera);
    // CSSRenderer.render(CSSScene, camera);
}

export function reverseSelected() {
    wasSelected = !wasSelected;
}

function onWindowResized() {
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

document.addEventListener(
    "mousemove",
    function (event) {
        mouse.x = event.clientX / window.innerWidth - 0.5;
        mouse.y = event.clientY / window.innerHeight - 0.5;
    },
    false
);

window.addEventListener("mousedown", onMouseDown, false);

// Function to handle mouse click events
function onMouseDown(event) {
    click.x = (event.clientX / window.innerWidth) * 2 - 1;
    click.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(click, camera);
    // const intersects = raycaster.intersectObjects(cubes);

    const intersects = raycaster.intersectObjects([sphere, ...cubes]);

    if (!wasSelected) {
        if (intersects.length > 0 && intersects[0].object !== sphere) {
            // An intersection occurred
            const selectedProject = intersects[0].object;
            selectedProject.material.color.set(0xff0000);

            if (selectedProject) {
                wasSelected = true;
                addProjectCardToPage(selectedProject.name, mainContainer);
                uiSwitchState("2d");
            }
        }
    }
}

export { camera, scene, renderer, sphere };
