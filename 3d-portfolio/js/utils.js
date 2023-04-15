import * as THREE from "three";

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

export function findObjectById(objectsArray, id) {
    for (var object of objectsArray) {
        if (object.id === id) {
            return object;
        }
    }
    return null;
}

function createEnvironment(scene) {
    // Load the 2D image as a texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
        "/assets/textures/hdr/28.03.2023_fade_background.jpg"
    );
    const fadeBg = loader.load(
        "/assets/textures/hdr/28.03.2023_fade_background_S.jpg",
        (texture) => {
            // texture.rotation = Math.PI / 8;
            scene.background = texture;
            scene.environment = texture;
        }
    );
}

export { getRandomInt, createEnvironment };
