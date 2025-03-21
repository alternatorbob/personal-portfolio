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
        maxOffset: Math.PI / 4,
        maxPositionOffset: 50.0,
        followStrength: 0.025,
        positionFollowStrength: 0.02,
        inertia: 0.95,
        returnStrength: 0.045,
        dampingFactor: 0.92,
        isMouseDown: false,
        lastRotationVelocity: new THREE.Vector3(0, 0, 0),
        returnToCenter: false
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
        const wasMouseDown = cameraOrbit.isMouseDown;
        cameraOrbit.isMouseDown = isMouseDown;

        // If mouse was just released, start return to center
        if (wasMouseDown && !isMouseDown) {
            cameraOrbit.returnToCenter = true;
            cameraOrbit.lastRotationVelocity.copy(sphereRotationVelocity);
        }

        // Use either current rotation velocity or last stored velocity
        const effectiveRotationVelocity = isMouseDown ? 
            sphereRotationVelocity : 
            cameraOrbit.lastRotationVelocity;

        // Scale the velocities for movement and rotation
        const scaledRotationX = -effectiveRotationVelocity.y * 1.5;
        const scaledPositionX = effectiveRotationVelocity.x * 3.0;
        const scaledPositionY = effectiveRotationVelocity.y * 3.0;

        // Update velocities with smooth follow only when dragging
        if (isMouseDown) {
            cameraOrbit.velocity.x += (scaledRotationX - cameraOrbit.velocity.x) * cameraOrbit.followStrength;
            cameraOrbit.positionVelocity.x += (scaledPositionX - cameraOrbit.positionVelocity.x) * cameraOrbit.positionFollowStrength;
            cameraOrbit.positionVelocity.y += (scaledPositionY - cameraOrbit.positionVelocity.y) * cameraOrbit.positionFollowStrength;
            cameraOrbit.returnToCenter = false;
        }

        // Apply damping
        cameraOrbit.velocity.multiplyScalar(cameraOrbit.dampingFactor);
        cameraOrbit.positionVelocity.multiplyScalar(cameraOrbit.dampingFactor);

        // Apply return force when returning to center
        if (cameraOrbit.returnToCenter) {
            const returnForce = cameraOrbit.returnStrength;
            cameraOrbit.currentOffset.x *= (1 - returnForce);
            cameraOrbit.positionOffset.multiplyScalar(1 - returnForce);
            
            // Apply stronger return force to velocities
            cameraOrbit.velocity.multiplyScalar(1 - returnForce);
            cameraOrbit.positionVelocity.multiplyScalar(1 - returnForce);
            cameraOrbit.lastRotationVelocity.multiplyScalar(1 - returnForce);

            // Check if we're close enough to center to stop returning
            if (Math.abs(cameraOrbit.currentOffset.x) < 0.001 && 
                cameraOrbit.positionOffset.lengthSq() < 0.001) {
                cameraOrbit.returnToCenter = false;
                cameraOrbit.currentOffset.set(0, 0, 0);
                cameraOrbit.positionOffset.set(0, 0, 0);
            }
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
