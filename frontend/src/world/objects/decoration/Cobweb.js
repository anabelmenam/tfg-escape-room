import * as THREE from "three";
import { Entity } from "../Entity.js";

class Cobweb extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,
    radius = 1,
    depth = 0.35,
    corner = false,
    cornerCeiling = false,
    spokes = 8,
    rings = 3,
    color = 0xd9e2e8,
    opacity = 0.58,
  } = {}) {
    super(id);

    this.radius = radius;
    this.depth = Math.max(0, depth);
    this.corner = corner;
    this.cornerCeiling = cornerCeiling;
    this.spokes = Math.max(3, Math.floor(spokes));
    this.rings = Math.max(1, Math.floor(rings));

    this.object3D = new THREE.Group();
    this.object3D.name = id;
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);
    this.object3D.rotation.y += rotationY;

    if (typeof scale === "number") {
      this.object3D.scale.setScalar(scale);
    } else {
      this.object3D.scale.copy(scale);
    }

    this.material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0,
    });
    this.geometry = this.createGeometry();
    this.web = this.createStrands();
    this.web.renderOrder = 1;

    this.object3D.add(this.web);
  }

  createGeometry() {
    const vertices = [];
    const pointAt = (ring, spoke) => {
      const angle = (spoke / this.spokes) * Math.PI * 2;
      const baseRadius = this.radius * (0.22 + (ring / this.rings) * 0.72);
      const variation = 1 + Math.sin(spoke * 5.3 + ring * 2.1) * 0.055;

      const depth = this.corner ? 0 : this.depth * (1 - ring / this.rings);
      const x = Math.cos(angle) * baseRadius * variation;
      const y = Math.sin(angle) * baseRadius * variation;

      if (this.corner) {
        if (this.cornerCeiling && y >= 0) {
          return new THREE.Vector3(-Math.abs(x), 0, y);
        }

        return new THREE.Vector3(Math.min(x, 0), y, Math.max(x, 0));
      }

      return new THREE.Vector3(x, y, depth);
    };

    for (let spoke = 0; spoke < this.spokes; spoke++) {
      const edge = pointAt(this.rings, spoke);
      vertices.push(0, 0, this.corner ? 0 : this.depth, edge.x, edge.y, edge.z);
    }

    for (let ring = 1; ring <= this.rings; ring++) {
      for (let spoke = 0; spoke < this.spokes; spoke++) {
        const start = pointAt(ring, spoke);
        const end = pointAt(ring, (spoke + 1) % this.spokes);
        vertices.push(start.x, start.y, start.z, end.x, end.y, end.z);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

    return geometry;
  }

  createStrands() {
    const positions = this.geometry.getAttribute("position");
    const strandCount = positions.count / 2;
    this.strandGeometry = new THREE.CylinderGeometry(0.008, 0.008, 1, 6);

    const strands = new THREE.InstancedMesh(this.strandGeometry, this.material, strandCount);
    const start = new THREE.Vector3();
    const end = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const midpoint = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const matrix = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);

    for (let index = 0; index < strandCount; index++) {
      start.fromBufferAttribute(positions, index * 2);
      end.fromBufferAttribute(positions, index * 2 + 1);
      direction.subVectors(end, start);
      const length = direction.length();
      midpoint.addVectors(start, end).multiplyScalar(0.5);
      quaternion.setFromUnitVectors(up, direction.normalize());
      matrix.compose(midpoint, quaternion, new THREE.Vector3(1, length, 1));
      strands.setMatrixAt(index, matrix);
    }

    strands.instanceMatrix.needsUpdate = true;

    return strands;
  }

  setOpacity(opacity) {
    this.material.opacity = THREE.MathUtils.clamp(opacity, 0, 1);
  }

  dispose() {
    this.geometry.dispose();
    this.strandGeometry.dispose();
    this.material.dispose();
  }
}

export { Cobweb };
