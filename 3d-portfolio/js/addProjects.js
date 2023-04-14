import * as THREE from "three";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { camera, scene, sphere, sphereRadius } from "../main";

export let cubes = [];
export let projects = [];
export const distanceCoeff = 2000;

export function addMesh(w, h, CSSScene, scene) {
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        wireframeLinewidth: 1,
        side: THREE.DoubleSide,
    });

    // material.blending = THREE.NoBlending;

    const size = 400; // Size of the cubes
    const gridSize = 10; // Grid size

    //POSITIONS
    // Define the grid of positions
    const grid = [];
    for (let x = -gridSize; x <= gridSize; x++) {
        for (let y = -gridSize; y <= gridSize; y++) {
            for (let z = -gridSize; z <= gridSize; z++) {
                grid.push(new THREE.Vector3(x, y, z).multiplyScalar(size));
            }
        }
    }

    const occupiedPositions = new Set();

    // Select a random position from the grid
    let randomPosition = null;
    while (randomPosition === null) {
        const index = Math.floor(Math.random() * grid.length);
        const position = grid[index];
        if (!occupiedPositions.has(position)) {
            randomPosition = position;
            occupiedPositions.add(position);
        }
    }

    //ELEMENTS
    const element = document.createElement("div");
    element.style.pointerEvents = "none";
    element.style.width = `${w}px`;
    element.style.height = `${h}px`;
    element.style.opacity = 0.75;
    element.style.background = new THREE.Color(
        Math.random() * 0xffffff
    ).getStyle();

    const object = new CSS3DObject(element);
    object.position.x = Math.random() * 200 - 100;
    object.position.y = Math.random() * 200 - 100;
    object.position.z = Math.random() * 200 - 100;
    // object.position.copy(randomPosition);

    object.rotation.x = Math.random();
    object.rotation.y = Math.random();
    object.rotation.z = Math.random();
    object.scale.x = Math.random() + 0.5;
    object.scale.y = Math.random() + 0.5;
    // object.renderOrder = -1;
    CSSScene.add(object);

    const geometry = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.copy(object.position);
    // mesh.rotation.copy(object.rotation);
    mesh.scale.copy(object.scale);
    // mesh.add(object);

    mesh.position.copy(object.position);

    scene.add(mesh);
    projects.push(object);
}

export function addProjects(numCubes) {
    const size = 2; // Size of the grid
    const scale = 0.5; // Scale of the cubes
    const gridSize = 10; // Grid size

    // Define the grid of positions
    const grid = [];
    for (let x = -gridSize; x <= gridSize; x++) {
        for (let y = -gridSize; y <= gridSize; y++) {
            for (let z = -gridSize; z <= gridSize; z++) {
                grid.push(new THREE.Vector3(x, y, z).multiplyScalar(size));
            }
        }
    }

    const occupiedPositions = new Set();

    for (let i = 0; i < numCubes; i++) {
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(14 * scale, 9 * scale, scale),
            new THREE.MeshStandardMaterial()
        );

        // Select a random position from the grid
        let randomPosition = null;
        while (randomPosition === null) {
            const index = Math.floor(Math.random() * grid.length);
            const position = grid[index];
            if (!occupiedPositions.has(position)) {
                randomPosition = position;
                occupiedPositions.add(position);
            }
        }

        cube.position.copy(randomPosition);
        cube.lookAt(sphere.position);
        scene.add(cube);
    }
}
