import * as THREE from "three";
import { camera, scene, sphere } from "../main";
import { detectMediaType } from "./utils.js";

export let cubes = [];

// Store original dimensions for each cube
export const cubeOriginalDimensions = new Map();

// Target consistent visual size
const targetVisualSize = 18; // Increased from 12 to make images bigger

//used for 3D Cubes Projects
// Projects are randomized on each page load for a fresh experience
export function addProjects(projects, onAllCoversLoaded) {
    const scale = 30; // Scale of the cubes
    const radius = 40; // Distance from center
    
    // Handle empty projects array
    if (!projects || projects.length === 0) {
        if (onAllCoversLoaded) {
            onAllCoversLoaded();
        }
        return;
    }
    
    // Create a shuffled copy of projects to randomize the layout on each load
    const shuffledProjects = [...projects].sort(() => Math.random() - 0.5);
        
    // Calculate positions on a sphere for equal distribution
    const positions = calculateEvenlySpacedPointsOnSphere(shuffledProjects.length, radius);

    // Track loading progress
    let loadedCount = 0;
    const totalProjects = shuffledProjects.length;

    for (let i = 0; i < shuffledProjects.length; i++) {
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
        
        // Get the cover image from the project's cover property, or fall back to finding first image in media array
        let coverImage = shuffledProjects[i].content.cover;
        
        if (!coverImage && shuffledProjects[i].content.media && shuffledProjects[i].content.media.length > 0) {
            // Find the first image in the media array as fallback
            for (let j = 0; j < shuffledProjects[i].content.media.length; j++) {
                const mediaItem = shuffledProjects[i].content.media[j];
                const mediaPath = typeof mediaItem === 'string' ? mediaItem : mediaItem.path;
                const mediaType = detectMediaType(mediaPath);
                if (mediaType === 'image' || mediaType === 'gif') {
                    coverImage = mediaPath;
                    break;
                }
            }
        }
        
        // Fall back to images array if no image found in media array
        if (!coverImage && shuffledProjects[i].content.images && shuffledProjects[i].content.images.length > 0) {
            coverImage = shuffledProjects[i].content.images[0];
        }
        
        // If still no cover image, use a placeholder
        if (!coverImage) {
            console.warn(`No cover image found for project: ${shuffledProjects[i].title}`);
            loadedCount++;
            if (loadedCount === totalProjects && onAllCoversLoaded) {
                onAllCoversLoaded();
            }
            return;
        }
        
        // Only load the cover image for 3D cubes - this is the only image loaded on initial page load
        
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

            // Track loading progress
            loadedCount++;
            if (loadedCount === totalProjects && onAllCoversLoaded) {
                onAllCoversLoaded();
            }
        }, undefined, (error) => {
            console.error(`Error loading texture for project ${shuffledProjects[i].title}:`, error);
            // Still count as loaded to prevent infinite waiting
            loadedCount++;
            if (loadedCount === totalProjects && onAllCoversLoaded) {
                onAllCoversLoaded();
            }
        });

        // Position the cube at the calculated position
        cube.position.copy(positions[i]);
        cube.name = shuffledProjects[i].id;
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
    
    // Remove shuffling and random offsets for perfectly even distribution
    // The Fibonacci sphere algorithm already provides optimal even spacing
    
    return points;
}
