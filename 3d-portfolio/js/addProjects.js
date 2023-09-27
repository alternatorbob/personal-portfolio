import * as THREE from "three";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { camera, scene, sphere, sphereRadius } from "../main";

export let cubes = [];
export const distanceCoeff = 2000;

//used for 3D Cubes Projects
export function addProjects(projects) {
    const size = 6; // Size of the grid
    const scale = 2; // Scale of the cubes
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

    for (let i = 0; i < projects.length; i++) {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(projects[i].content.images[0], (tex) => {
            // console.log(tex.image);
        });
        const material = new THREE.MeshStandardMaterial({ map: texture });

        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(14 * scale, 9 * scale, scale),
            material
        );

        // const imageAspectRatio = texture.image.width / texture.image.height;
        // const cubeWidth = 1; // example value, adjust as needed
        // const cubeHeight = cubeWidth / imageAspectRatio;

        // const cube = new THREE.Mesh(
        //     new THREE.BoxGeometry(cubeHeight, cubeWidth, 1),
        //     material
        // );

        // OG;
        // const cube = new THREE.Mesh(
        //     new THREE.BoxGeometry(14 * scale, 9 * scale, scale),
        //     new THREE.MeshPhongMaterial({
        //         color: 0xffffff,
        //     })
        // );

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
        cube.name = projects[i].id;
        cube.position.copy(randomPosition);
        cube.lookAt(sphere.position);
        cubes.push(cube);
        scene.add(cube);
    }
}
