import * as THREE from "three";
import { camera, scene, sphere, sphereRadius } from "../main";

export let cubes = [];
export const distanceCoeff = 2000;

export function addProjects(numCubes) {
    const size = 400; // Size of the cubes
    const scale = 60; // Scale of the cubes
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
            new THREE.BoxGeometry(14 * scale, 9 * scale, 5 * scale),
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
        cubes.push(cube);
    }
    console.log("cubes:", cubes);
}
