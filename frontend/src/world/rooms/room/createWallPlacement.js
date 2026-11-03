import * as THREE from "three";

const createWallPlacement =
  (room, { width, depth, wallThickness }) =>
  (entity, wall, gap = 0) => {
    const object = entity.object3D ?? entity;
    if (object.parent !== room) throw new Error("El objeto debe pertenecer a la habitación antes de colocarlo.");
    room.updateWorldMatrix(true, true);
    const box = new THREE.Box3()
      .setFromObject(entity.wallMountObject ?? object)
      .applyMatrix4(room.matrixWorld.clone().invert());
    const axis = wall === "left" || wall === "right" ? "x" : "z";
    const positive = wall === "right" || wall === "front";
    const innerFace = ((axis === "x" ? width : depth) - wallThickness) / 2;
    const offset = new THREE.Vector3();
    offset[axis] = positive ? innerFace - gap - box.max[axis] : -innerFace + gap - box.min[axis];
    object.position.add(offset);
    object.updateMatrixWorld(true);
    return offset;
  };

export { createWallPlacement };
