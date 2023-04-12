import * as THREE from "three";
import { camera, renderer, sphere } from "../main";
import { cubes } from "./addProjects";

let isDragging = false;
let lastMousePosition = new THREE.Vector2();
export let mousePosition = new THREE.Vector2();
let intersectionPoint;
const raycaster = new THREE.Raycaster();

// Create a quaternion to store the sphere rotation
const sphereRotation = new THREE.Quaternion();

export function dragInit() {
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    renderer.domElement.addEventListener("mouseup", () => {
        isDragging = false;
    });
}

function onMouseDown(e) {
    raycaster.setFromCamera(
        new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            (-e.clientY / window.innerHeight) * 2 + 1
        ),
        camera
    );
    const intersections = raycaster.intersectObject(sphere);
    if (intersections.length > 0) {
        intersectionPoint = intersections[0].point;
        isDragging = true;
    }

    // Store the current mouse position
    lastMousePosition.set(e.clientX, e.clientY);

    document.addEventListener("mousemove", onMouseMove);
}

const dampingFactor = 0.95;

function onMouseMove(e) {
    if (!isDragging) return;

    mousePosition.set(e.clientX, e.clientY);
    const ballWeight = 0.002;

    // Project the mouse position onto the cube's local coordinate system
    raycaster.setFromCamera(
        new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            (-e.clientY / window.innerHeight) * 2 + 1
        ),
        camera
    );

    if (intersectionPoint) {
        raycaster.ray.intersectPlane(
            new THREE.Plane(
                new THREE.Vector3(0, 1, 0).normalize(),
                intersectionPoint
            ),
            intersectionPoint
        );
    }

    // Calculate the difference between the current mouse position and the last mouse position
    const mouseDelta = new THREE.Vector2().subVectors(
        mousePosition,
        lastMousePosition
    );

    // Create a quaternion to represent the mouse rotation
    const mouseQuaternionX = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        mouseDelta.y * ballWeight
    );
    const mouseQuaternionY = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        mouseDelta.x * ballWeight
    );
    const mouseQuaternion = new THREE.Quaternion().multiplyQuaternions(
        mouseQuaternionY,
        mouseQuaternionX
    );

    // Multiply the sphere rotation by the mouse rotation
    sphereRotation.multiplyQuaternions(mouseQuaternion, sphereRotation);

    // Set the sphere rotation using the quaternion
    sphere.setRotationFromQuaternion(sphereRotation);

    lastMousePosition.copy(mousePosition);

    for (let cube of cubes) {
        cube.position.applyQuaternion(mouseQuaternion);
        cube.lookAt(sphere.position);
    }

    if (hasCursorLeftScreen(e)) {
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
    }
}

function hasCursorLeftScreen(event) {
    return event.clientX < 0 ||
        event.clientX > window.innerWidth ||
        event.clientY < 0 ||
        event.clientY > window.innerHeight
        ? true
        : false;
}
