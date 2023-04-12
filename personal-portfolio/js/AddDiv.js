import * as THREE from "three";
import {
    CSS3DRenderer,
    CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";

export let cssScene, cssRenderer;

class CSS3DObjectDiv {
    constructor() {
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            wireframeLinewidth: 1,
            side: THREE.DoubleSide,
        });

        const element = document.createElement("div");
        element.style.width = "100px";
        element.style.height = "100px";
        element.style.opacity = 0.5;
        element.style.background = new THREE.Color(
            Math.random() * 0xffffff
        ).getStyle();
        element.style.pointerEvents = "none";

        const object = new CSS3DObject(element);
        object.position.x = Math.random() * 2 - 1;
        object.position.y = Math.random() * 2 - 1;
        object.position.z = Math.random() * 2 - 1;
        object.rotation.x = Math.random();
        object.rotation.y = Math.random();
        object.rotation.z = Math.random();
        object.scale.x = Math.random() + 0.5;
        object.scale.y = Math.random() + 0.5;
        // cssScene.add(object);

        const geometry = new THREE.PlaneGeometry(100, 100);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(object.position);
        mesh.rotation.copy(object.rotation);
        mesh.scale.copy(object.scale);

        // scene.add(mesh);
    }
}

export function addDiv(numDivs) {
    for (let i = 0; i < numDivs; i++) {
        const mesh = new CSS3DObjectDiv();
        cssScene.add(mesh);
        console.log(mesh.position);
    }
}

export function css3DInit() {
    cssRenderer = new CSS3DRenderer();
    cssScene = new THREE.Scene();

    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = "absolute";
    cssRenderer.domElement.style.top = 0;
    document.body.appendChild(cssRenderer.domElement);
}
