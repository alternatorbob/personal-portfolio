import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer";

import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { dragInit } from "./js/dragControl";
import { addProjects, cubes, addMesh } from "./js/addProjects";
import { createEnvironment } from "./js/utils";
import { LaserBeam, add2Scene } from "./js/LaserBeam";

const clock = new THREE.Clock();
let camera, scene, renderer;
let CSSScene, CSSRenderer;

let sphere, laserBeam;
let light2;

const camFar = 1500;
export const sphereRadius = 3.5;
export const numCubes = 10;

//Mouse event
var mouse = {
    x: 0,
    y: 0,
};

let cubeCamera, cubeRenderTarget;

init();

function init() {
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

    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", onWindowResized);

    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        camFar
    );
    camera.position.z = 14;
    camera.position.y = 3;

    scene = new THREE.Scene();

    new RGBELoader()
        .setPath("assets/textures/hdr/")
        .load("quarry_01_1k.pic", function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            // scene.background = texture;
            // scene.environment = texture;
        });

    createEnvironment(scene);

    const light = new THREE.AmbientLight(0xffffff, 1.6);
    light2 = new THREE.DirectionalLight(0xff0000, 10.0);
    light2.castShadow = true;

    light2.position.set(20, 1, 1); // set position to above
    scene.add(light, light2);

    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    cubeRenderTarget.texture.type = THREE.HalfFloatType;
    cubeCamera = new THREE.CubeCamera(1, camFar, cubeRenderTarget);

    const textureLoader = new THREE.TextureLoader();
    const roughnessMap = textureLoader.load(
        "assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Roughness.png"
    );
    const normalMap = textureLoader.load(
        "assets/textures/mat/worn-shiny-metal-bl/worn-shiny-metal-Normal-ogl.png"
    );

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

    laserBeam = new LaserBeam({ reflectMax: 2 });
    laserBeam.object3d.position.set(0, 0, 0);
    add2Scene(scene, laserBeam);
    dragInit();

    //SPAGHETTI CODE
    CSSScene = new THREE.Scene();

    for (let i = 0; i < 10; i++) addMesh(20, 50, CSSScene, scene);

    CSSRenderer = new CSS3DRenderer();
    CSSRenderer.setSize(window.innerWidth, window.innerHeight);
    CSSRenderer.domElement.style.pointerEvents = "none";
    CSSRenderer.domElement.style.position = "absolute";
    CSSRenderer.domElement.style.top = 0;
    document.body.appendChild(CSSRenderer.domElement);
}

function animate(msTime) {
    const time = clock.getElapsedTime();

    const radius = 200; // radius of circular path
    const angle = time * 0.5; // angle in radians, adjust the speed of rotation with a multiplication factor

    // calculate x and z coordinates based on angle and radius
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;

    cubeCamera.update(renderer, scene);
    for (let cube of cubes) {
        cube.lookAt(sphere.position);
    }
    laserBeam.intersect(new THREE.Vector3(0, 1, -10), cubes);

    // camera.position.x += (mouse.x * 30 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.5 - camera.position.y + 3.5) * 0.01;
    camera.position.x += (-mouse.x * 0.5 - camera.position.x) * 0.02;
    // camera.lookAt(scene.position);

    renderer.render(scene, camera);
    CSSRenderer.render(CSSScene, camera);
}

function onWindowResized() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    CSSRenderer.setSize(window.innerWidth, window.innerHeight);

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

export { camera, scene, renderer, sphere };
