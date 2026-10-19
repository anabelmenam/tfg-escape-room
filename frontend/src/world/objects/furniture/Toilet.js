import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

const createMesh = (geometry, material, position) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

class Toilet extends Entity {
  constructor({
    id = "bathroom-toilet",
    position = new THREE.Vector3(),
    rotationY = 0,
    scale = 1,
    heightScale = 1,
    fixtureColor = 0xf1ead9,
    metalColor = 0xb9aa83,
    lidSpeed = 7,
  } = {}) {
    super(id);
    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.y = rotationY;
    this.object3D.scale.set(scale, scale * heightScale, scale);
    this.lidSpeed = lidSpeed;
    this.isLidOpen = false;
    this.lidTargetRotation = 0;

    const porcelain = new THREE.MeshStandardMaterial({
      color: fixtureColor,
      roughness: 0.28,
      side: THREE.DoubleSide,
    });
    const water = new THREE.MeshPhysicalMaterial({
      color: 0x4f9fb3,
      roughness: 0.12,
      transparent: true,
      opacity: 0.52,
      transmission: 0.14,
      depthWrite: false,
    });
    const metal = new THREE.MeshStandardMaterial({ color: metalColor, roughness: 0.25, metalness: 0.7 });

    const bowl = createMesh(
      new THREE.SphereGeometry(0.92, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      porcelain,
      new THREE.Vector3(0, 1.46, -0.05),
    );
    bowl.scale.set(1, 0.52, 1.25);

    const seatShape = new THREE.Shape();
    seatShape.absellipse(0, 0, 0.89, 1.07, 0, Math.PI * 2, false);
    const seatOpening = new THREE.Path();
    seatOpening.absellipse(0, 0, 0.59, 0.75, 0, Math.PI * 2, true);
    seatShape.holes.push(seatOpening);
    const seat = createMesh(
      new THREE.ExtrudeGeometry(seatShape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.025,
        bevelThickness: 0.02,
        curveSegments: 32,
      }),
      porcelain,
      new THREE.Vector3(0, 1.43, -0.05),
    );
    seat.rotation.x = -Math.PI / 2;
    const waterSurface = createMesh(
      new THREE.CircleGeometry(0.44, 32),
      water,
      new THREE.Vector3(0, 1.18, -0.08),
    );
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.scale.y = 1.15;
    waterSurface.castShadow = false;
    waterSurface.renderOrder = 2;
    waterSurface.userData.ignoreAging = true;

    this.object3D.add(
      createMesh(new THREE.CylinderGeometry(0.62, 0.48, 1.05, 28), porcelain, new THREE.Vector3(0, 0.55, 0)),
      bowl,
      seat,
      waterSurface,
      createMesh(new THREE.BoxGeometry(1.65, 1.75, 0.72), porcelain, new THREE.Vector3(0, 1.55, 1.28)),
      createMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.05, 18), metal, new THREE.Vector3(0, 2.45, 1.28)),
    );

    this.createLid(porcelain, metal);
  }

  createLid(porcelain, metal) {
    this.lidPivot = new THREE.Group();
    this.lidPivot.position.set(0, 1.48, 0.82);

    this.lid = createMesh(
      new THREE.CylinderGeometry(0.82, 0.82, 0.1, 32),
      porcelain,
      new THREE.Vector3(0, 0, -0.87),
    );
    this.lid.scale.z = 1.25;

    const hinge = createMesh(
      new THREE.CylinderGeometry(0.11, 0.11, 1.28, 18),
      metal,
      new THREE.Vector3(0, 0, 0),
    );
    hinge.rotation.z = Math.PI / 2;

    this.lidPivot.add(this.lid, hinge);
    this.object3D.add(this.lidPivot);
  }

  toggleLid() {
    this.isLidOpen = !this.isLidOpen;
    this.lidTargetRotation = this.isLidOpen ? Math.PI / 2.08 : 0;
  }

  getInteractables() {
    return [
      {
        id: `${this.id}-lid`,
        object3D: this.lidPivot,
        enabled: true,
        interact: () => this.toggleLid(),
        getInteractionText: () =>
          this.isLidOpen
            ? tInteraction("close", tItem("toilet-lid"))
            : tInteraction("open", tItem("toilet-lid")),
      },
    ];
  }

  update(deltaTime) {
    this.lidPivot.rotation.x = THREE.MathUtils.damp(
      this.lidPivot.rotation.x,
      this.lidTargetRotation,
      this.lidSpeed,
      deltaTime,
    );
  }

  getCollider() {
    this.object3D.updateMatrixWorld(true);
    return new THREE.Box3().setFromObject(this.object3D);
  }
}

export { Toilet };
