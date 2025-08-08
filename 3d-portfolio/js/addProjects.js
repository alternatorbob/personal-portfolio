import * as THREE from "three";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { camera, scene, sphere, sphereRadius } from "../main";
import { detectMediaType } from "./utils.js";

export let cubes = [];
export const distanceCoeff = 2000;

// Store original dimensions for each cube
export const cubeOriginalDimensions = new Map();

// Target consistent visual size
const targetVisualSize = 18; // Increased from 12 to make images bigger

//used for 3D Cubes Projects
export function addProjects(projects) {
    const scale = 30; // Scale of the cubes
    const radius = 40; // Distance from center
    
    // Calculate positions on a sphere for equal distribution
    const positions = calculateEvenlySpacedPointsOnSphere(projects.length, radius);

    for (let i = 0; i < projects.length; i++) {
        const loader = new THREE.TextureLoader();
        
        // Create a placeholder cube with default dimensions
        const defaultWidth = 14 * scale;
        const defaultHeight = 9 * scale;
        const defaultDepth = scale;
        
        // Create placeholder materials - all gray initially
        // Create separate instances for each face to avoid reference issues
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0x888888 }), // right
            new THREE.MeshStandardMaterial({ color: 0x888888 }), // left
            new THREE.MeshStandardMaterial({ color: 0x888888 }), // top
            new THREE.MeshStandardMaterial({ color: 0x888888 }), // bottom
            new THREE.MeshStandardMaterial({ color: 0x888888 }), // front
            new THREE.MeshStandardMaterial({ color: 0x888888 })  // back
        ];
        
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(defaultWidth, defaultHeight, defaultDepth),
            materials // Array of materials
        );
        
        // Get the first image from media array or fall back to images array
        let coverImage = null;
        
        if (projects[i].content.media && projects[i].content.media.length > 0) {
            // Find the first image in the media array
            for (let j = 0; j < projects[i].content.media.length; j++) {
                const mediaItem = projects[i].content.media[j];
                const mediaType = detectMediaType(mediaItem);
                if (mediaType === 'image' || mediaType === 'gif') {
                    coverImage = mediaItem;
                    break;
                }
            }
        }
        
        // Fall back to images array if no image found in media array
        if (!coverImage && projects[i].content.images && projects[i].content.images.length > 0) {
            coverImage = projects[i].content.images[0];
        }
        
        // If still no cover image, use a placeholder
        if (!coverImage) {
            console.warn(`No cover image found for project: ${projects[i].title}`);
            return;
        }
        
        // Load the texture and adjust dimensions when loaded
        loader.load(coverImage, (texture) => {
            // Get image dimensions
            const imageWidth = texture.image.width;
            const imageHeight = texture.image.height;
            const aspectRatio = imageWidth / imageHeight;
            
            // Calculate dimensions to maintain consistent visual size
            let width, height;
            if (aspectRatio >= 1) {
                // Landscape or square image
                width = targetVisualSize;
                height = targetVisualSize / aspectRatio;
            } else {
                // Portrait image
                height = targetVisualSize;
                width = targetVisualSize * aspectRatio;
            }
            
            // Store original dimensions for scaling effects
            cubeOriginalDimensions.set(cube.uuid, {
                width: width,
                height: height,
                depth: defaultDepth / 7
            });
            
            // Update geometry with correct dimensions
            cube.geometry.dispose();
            cube.geometry = new THREE.BoxGeometry(width, height, defaultDepth / 7);
            
            // Create materials array - black for all sides except front
            const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const imageMaterial = new THREE.MeshStandardMaterial({ map: texture });
            
            // Materials order in BoxGeometry: [right, left, top, bottom, front, back]
            const materials = [
                blackMaterial, // right
                blackMaterial, // left
                blackMaterial, // top
                blackMaterial, // bottom
                imageMaterial, // front (facing the sphere)
                blackMaterial  // back
            ];
            
            // Properly dispose of existing materials
            if (Array.isArray(cube.material)) {
                // If it's already an array of materials, dispose each one
                cube.material.forEach(mat => {
                    if (mat && typeof mat.dispose === 'function') {
                        mat.dispose();
                    }
                });
            } else if (cube.material && typeof cube.material.dispose === 'function') {
                // If it's a single material, dispose it
                cube.material.dispose();
            }
            
            // Apply new materials
            cube.material = materials;
            
            // Ensure the cube is looking at the sphere after dimension change
            cube.lookAt(sphere.position);
        });

        // Position the cube at the calculated position
        cube.position.copy(positions[i]);
        cube.name = projects[i].id;
        cube.lookAt(sphere.position);
        cubes.push(cube);
        scene.add(cube);
    }
}

// Function to calculate evenly spaced points on a sphere using the Fibonacci sphere algorithm
function calculateEvenlySpacedPointsOnSphere(count, radius) {
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle in radians
    
    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
        const radiusAtY = Math.sqrt(1 - y * y); // radius at y
        
        const theta = phi * i; // Golden angle increment
        
        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;
        
        // Scale to desired radius
        points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
    }
    
    // Shuffle the points array using Fisher-Yates algorithm
    for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [points[i], points[j]] = [points[j], points[i]];
    }
    
    // Add slight random offset to each position for more variation
    points.forEach(point => {
        const offsetRange = radius * 0.1; // 10% of radius for offset
        point.x += (Math.random() - 0.5) * offsetRange;
        point.y += (Math.random() - 0.5) * offsetRange;
        point.z += (Math.random() - 0.5) * offsetRange;
    });
    
    return points;
}
