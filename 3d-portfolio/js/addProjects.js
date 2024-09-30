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
    const scale = 3; // Scale of the cubes
    const minDistanceFromSphere = sphereRadius + 50; // Minimum distance from sphere
    const maxDistanceFromSphere = sphereRadius + 100; // Max distance for cubes
    const minDistanceBetweenCubes = 60; // Minimum distance between cubes

    const occupiedPositions = [];

    function getRandomPosition() {
        let validPosition = null;
        let attempts = 0;

        while (!validPosition && attempts < 100) {
            // Generate random spherical coordinates
            const r = THREE.MathUtils.randFloat(minDistanceFromSphere, maxDistanceFromSphere);
            const theta = THREE.MathUtils.randFloat(0, Math.PI); // Polar angle (0 to π)
            const phi = THREE.MathUtils.randFloat(0, 2 * Math.PI); // Azimuthal angle (0 to 2π)

            // Convert spherical coordinates to Cartesian coordinates
            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.sin(theta) * Math.sin(phi);
            const z = r * Math.cos(theta);

            const position = new THREE.Vector3(x, y, z).add(sphere.position); // Offset from sphere position

            // Check if the new position is far enough from all other cubes
            let tooClose = false;
            for (const occupied of occupiedPositions) {
                if (position.distanceTo(occupied) < minDistanceBetweenCubes) {
                    tooClose = true;
                    break;
                }
            }

            if (!tooClose) {
                validPosition = position;
                occupiedPositions.push(position); // Store this position to avoid future intersections
            }

            attempts++;
        }

        if (!validPosition) {
            console.warn('Failed to find a valid position after 100 attempts');
        }

        return validPosition;
    }

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

        // Get a valid random position in 3D space around the sphere
        const randomPosition = getRandomPosition();

        if (randomPosition) {
            cube.name = projects[i].id;
            cube.position.copy(randomPosition);
            cube.lookAt(sphere.position);

            // Assign a random rotation speed for each cube
            cube.rotationSpeed = Math.random() * 0.0012 + 0.001; // Random speed between 0.001 and 0.003

            cubes.push(cube);
            scene.add(cube);
        }
    }
}
