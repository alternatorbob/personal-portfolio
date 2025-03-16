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
            scene.background = texture;
            scene.environment = texture;
        }
    );

    // Camera orbit parameters
    const cameraOrbit = {
        initialPosition: null,
        initialTarget: null,
        currentOffset: new THREE.Vector3(0, 0, 0),
        positionOffset: new THREE.Vector3(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        positionVelocity: new THREE.Vector3(0, 0, 0),
        maxOffset: Math.PI / 8,
        maxPositionOffset: 4.0,
        followStrength: 0.015,
        positionFollowStrength: 0.012,
        inertia: 0.95,
        returnStrength: 0.02,
        dampingFactor: 0.94,
        isMouseDown: false
    };

    // Update camera position to orbit around sphere
    function updateCameraRotation(camera, sphereRotationVelocity, isMouseDown) {
        // Record initial position and target on first update
        if (!cameraOrbit.initialPosition) {
            cameraOrbit.initialPosition = camera.position.clone();
            const target = new THREE.Vector3(0, 0, 0);
            camera.getWorldDirection(target);
            target.multiplyScalar(14);
            target.add(camera.position);
            cameraOrbit.initialTarget = target;
        }

        // Update mouse down state
        cameraOrbit.isMouseDown = isMouseDown;

        // Scale the velocities for movement and rotation
        const scaledRotationX = -sphereRotationVelocity.y * 1.2;
        const scaledPositionX = sphereRotationVelocity.x * 2.5;
        const scaledPositionY = sphereRotationVelocity.y * 2.5;

        // Update velocities with smooth follow
        cameraOrbit.velocity.x += (scaledRotationX - cameraOrbit.velocity.x) * cameraOrbit.followStrength;
        cameraOrbit.positionVelocity.x += (scaledPositionX - cameraOrbit.positionVelocity.x) * cameraOrbit.positionFollowStrength;
        cameraOrbit.positionVelocity.y += (scaledPositionY - cameraOrbit.positionVelocity.y) * cameraOrbit.positionFollowStrength;

        // Apply damping
        cameraOrbit.velocity.multiplyScalar(cameraOrbit.dampingFactor);
        cameraOrbit.positionVelocity.multiplyScalar(cameraOrbit.dampingFactor);

        // Apply return force when mouse is not down
        if (!cameraOrbit.isMouseDown) {
            const returnForce = cameraOrbit.returnStrength;
            cameraOrbit.currentOffset.x *= (1 - returnForce);
            cameraOrbit.positionOffset.multiplyScalar(1 - returnForce);
        }

        // Update offsets
        cameraOrbit.currentOffset.x += cameraOrbit.velocity.x;
        cameraOrbit.positionOffset.x += cameraOrbit.positionVelocity.x;
        cameraOrbit.positionOffset.y += cameraOrbit.positionVelocity.y;

        // Clamp offsets
        cameraOrbit.currentOffset.x = THREE.MathUtils.clamp(
            cameraOrbit.currentOffset.x,
            -cameraOrbit.maxOffset,
            cameraOrbit.maxOffset
        );
        cameraOrbit.positionOffset.x = THREE.MathUtils.clamp(
            cameraOrbit.positionOffset.x,
            -cameraOrbit.maxPositionOffset,
            cameraOrbit.maxPositionOffset
        );
        cameraOrbit.positionOffset.y = THREE.MathUtils.clamp(
            cameraOrbit.positionOffset.y,
            -cameraOrbit.maxPositionOffset,
            cameraOrbit.maxPositionOffset
        );

        // Create rotation matrix around Y axis
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(cameraOrbit.currentOffset.x);

        // Apply rotation to both position and target
        const rotatedPosition = cameraOrbit.initialPosition.clone();
        const rotatedTarget = cameraOrbit.initialTarget.clone();
        rotatedPosition.applyMatrix4(rotationMatrix);
        rotatedTarget.applyMatrix4(rotationMatrix);

        // Add position offset
        rotatedPosition.x += cameraOrbit.positionOffset.x;
        rotatedPosition.y += cameraOrbit.positionOffset.y;
        rotatedTarget.x += cameraOrbit.positionOffset.x;
        rotatedTarget.y += cameraOrbit.positionOffset.y;
        
        // Update camera position and look direction
        camera.position.copy(rotatedPosition);
        camera.lookAt(rotatedTarget);
    }

    return { updateCameraRotation };
}

export { getRandomInt, createEnvironment };
