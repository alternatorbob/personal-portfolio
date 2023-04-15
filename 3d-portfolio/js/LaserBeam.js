import * as THREE from "three";

export class LaserBeam {
    constructor(iconfig) {
        let config = {
            length: 10000,
            reflectMax: 1,
        };
        config = Object.assign(config, iconfig);

        this.object3d = new THREE.Object3D();
        this.reflectObject = null;
        this.pointLight = new THREE.PointLight(0xff0000, 0.75);

        let intersectionTime = 0;
        const clock = new THREE.Clock();

        let raycaster = new THREE.Raycaster();
        let canvas = generateLaserBodyCanvas();
        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        //texture
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            color: 0x4444aa,
            side: THREE.DoubleSide,
            depthWrite: false,
            transparent: true,
        });
        let geometry = new THREE.PlaneGeometry(1, 0.2 * 5);
        geometry.rotateY(0.5 * Math.PI);

        //use planes to simulate laserbeam
        let i,
            nPlanes = 30;
        for (i = 0; i < nPlanes; i++) {
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = 1 / 2;
            mesh.rotation.z = (i / nPlanes) * Math.PI;
            this.object3d.add(mesh);
        }

        if (config.reflectMax > 0)
            this.reflectObject = new LaserBeam(
                Object.assign(config, {
                    reflectMax: config.reflectMax - 1,
                })
            );

        this.intersect = function (direction, objectArray = []) {
            raycaster.set(
                this.object3d.position.clone(),
                direction.clone().normalize()
            );

            let intersectArray = [];
            intersectArray = raycaster.intersectObjects(objectArray, true);

            let activeIntersect = null;
            let selectedProject = null;

            //have collision
            if (intersectArray.length > 0) {
                this.object3d.scale.z = intersectArray[0].distance;
                this.object3d.lookAt(intersectArray[0].point.clone());
                this.pointLight.visible = true;

                intersectionTime += clock.getDelta();
                activeIntersect = intersectArray[0].object.name;

                if (intersectionTime >= 3) {
                    selectedProject = activeIntersect;
                    intersectionTime = 0;
                }

                //get normal vector
                let normalMatrix = new THREE.Matrix3().getNormalMatrix(
                    intersectArray[0].object.matrixWorld
                );
                let normalVector = intersectArray[0].face.normal
                    .clone()
                    .applyMatrix3(normalMatrix)
                    .normalize();

                //set pointLight under plane
                this.pointLight.position.x =
                    intersectArray[0].point.x + normalVector.x * 0.5;
                this.pointLight.position.y =
                    intersectArray[0].point.y + normalVector.y * 0.5;
                this.pointLight.position.z =
                    intersectArray[0].point.z + normalVector.z * 0.5;

                // console.log(normalVector);
                // console.log("pointLight", this.pointLight.position);
                // console.log("intersectPoint", intersectArray[0].point);

                //calculation reflect vector
                let reflectVector = new THREE.Vector3(
                    intersectArray[0].point.x - this.object3d.position.x,
                    intersectArray[0].point.y - this.object3d.position.y,
                    intersectArray[0].point.z - this.object3d.position.z
                )
                    .normalize()
                    .reflect(normalVector);

                //set reflectObject
                if (this.reflectObject != null) {
                    this.reflectObject.object3d.visible = true;
                    this.reflectObject.object3d.position.set(
                        intersectArray[0].point.x,
                        intersectArray[0].point.y,
                        intersectArray[0].point.z
                    );

                    //iteration reflect
                    this.reflectObject.intersect(
                        reflectVector.clone(),
                        objectArray
                    );
                }
            } else {
                intersectionTime = 0;

                this.object3d.scale.z = config.length;
                this.pointLight.visible = false;
                this.object3d.lookAt(
                    this.object3d.position.x + direction.x,
                    this.object3d.position.y + direction.y,
                    this.object3d.position.z + direction.z
                );

                this.hiddenReflectObject();
            }

            // console.log(intersectionTime);

            // console.log("intersectionTime", intersectionTime);
            return { intersectionTime, selectedProject };
        };

        this.hiddenReflectObject = function () {
            if (this.reflectObject != null) {
                this.reflectObject.object3d.visible = false;
                this.reflectObject.pointLight.visible = false;
                this.reflectObject.hiddenReflectObject();
            }
        };

        return;

        function generateLaserBodyCanvas() {
            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");
            canvas.width = 10;
            canvas.height = 64;
            // set gradient
            let gradient = context.createLinearGradient(
                0,
                0,
                canvas.width,
                canvas.height
            );
            gradient.addColorStop(0, "rgba(  0,  0,  0,0.1)");
            gradient.addColorStop(0.1, "rgba(160,0,0,0.3)");
            gradient.addColorStop(0.5, "rgba(255,130,130,0.5)");
            gradient.addColorStop(0.9, "rgba(160,0,0,0.3)");
            gradient.addColorStop(1.0, "rgba(  0,  0,  0,0.1)");
            // fill the rectangle
            context.fillStyle = gradient;
            context.fillRect(0, 0, canvas.width, canvas.height);
            // return the just built canvas
            return canvas;
        }
    }
}

export function add2Scene(scene, obj) {
    if (obj == null) return;
    scene.add(obj.object3d);
    scene.add(obj.pointLight);

    if (obj.reflectObject != null) {
        add2Scene(obj.reflectObject);
    }
}
