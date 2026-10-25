import * as THREE from "three";

const mapWallUvs = (geometry, { wall, sectionCenter, sectionCenterY, wallLength, height, wallThickness }) => {
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const normals = geometry.attributes.normal;
  for (let index = 0; index < positions.count; index += 1) {
    const localX = positions.getX(index);
    const localY = positions.getY(index);
    const localZ = positions.getZ(index);
    const normalX = Math.abs(normals.getX(index));
    const normalZ = Math.abs(normals.getZ(index));
    const horizontalWall = wall === "front" || wall === "back";
    const horizontalPosition = horizontalWall ? sectionCenter + localX : sectionCenter + localZ;
    const verticalPosition = sectionCenterY + localY;
    let u;
    let v;
    if (horizontalWall ? normalZ > 0.5 : normalX > 0.5) {
      u = (horizontalPosition + wallLength / 2) / wallLength;
      v = verticalPosition / height;
      if (wall === "front" || wall === "right") u = 1 - u;
    } else if (normalX > 0.5 || normalZ > 0.5) {
      const revealPosition = horizontalWall ? localZ : localX;
      u = (revealPosition + wallThickness / 2) / wallLength;
      v = verticalPosition / height;
    } else {
      u = (horizontalPosition + wallLength / 2) / wallLength;
      v = (localZ + wallThickness / 2) / wallLength;
    }
    uvs.setXY(index, u, v);
  }
  uvs.needsUpdate = true;
};

const createRoomShell = ({ room, colliders, dimensions, openings, omitWalls, materials, walls }) => {
  const { width, height, depth, wallThickness } = dimensions;
  const addBox = ({ name, size, position, material, mapUvs }) => {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    mapUvs?.(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.copy(position);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.userData.isCollider = true;
    room.add(mesh);
    colliders.push(mesh);
  };
  addBox({ name: "floor", size: new THREE.Vector3(width, 1, depth), position: new THREE.Vector3(0, -0.5, 0), material: materials.floor });
  addBox({ name: "ceiling", size: new THREE.Vector3(width, 1, depth), position: new THREE.Vector3(0, height + 0.5, 0), material: materials.ceiling });

  walls.filter((wall) => !omitWalls.includes(wall)).forEach((wall) => {
    const horizontalWall = wall === "front" || wall === "back";
    const wallLength = horizontalWall ? width : depth;
    const wallOpenings = openings.filter((opening) => opening.wall === wall);
    const horizontalCuts = [-wallLength / 2, wallLength / 2];
    const verticalCuts = [0, height];
    wallOpenings.forEach((opening) => {
      horizontalCuts.push(opening.position - opening.width / 2, opening.position + opening.width / 2);
      verticalCuts.push(opening.bottom, opening.bottom + opening.height);
    });
    const xCuts = [...new Set(horizontalCuts)].sort((a, b) => a - b);
    const yCuts = [...new Set(verticalCuts)].sort((a, b) => a - b);
    for (let xIndex = 0; xIndex < xCuts.length - 1; xIndex += 1) {
      const sectionLength = xCuts[xIndex + 1] - xCuts[xIndex];
      const sectionCenter = (xCuts[xIndex] + xCuts[xIndex + 1]) / 2;
      for (let yIndex = 0; yIndex < yCuts.length - 1; yIndex += 1) {
        const sectionHeight = yCuts[yIndex + 1] - yCuts[yIndex];
        const sectionCenterY = (yCuts[yIndex] + yCuts[yIndex + 1]) / 2;
        if (sectionLength <= 0 || sectionHeight <= 0) continue;
        const blocked = wallOpenings.some((opening) => sectionCenter > opening.position - opening.width / 2
          && sectionCenter < opening.position + opening.width / 2
          && sectionCenterY > opening.bottom && sectionCenterY < opening.bottom + opening.height);
        if (blocked) continue;
        const size = horizontalWall ? new THREE.Vector3(sectionLength, sectionHeight, wallThickness) : new THREE.Vector3(wallThickness, sectionHeight, sectionLength);
        const position = wall === "front" ? new THREE.Vector3(sectionCenter, sectionCenterY, depth / 2)
          : wall === "back" ? new THREE.Vector3(sectionCenter, sectionCenterY, -depth / 2)
            : wall === "left" ? new THREE.Vector3(-width / 2, sectionCenterY, sectionCenter)
              : new THREE.Vector3(width / 2, sectionCenterY, sectionCenter);
        addBox({
          name: `${wall}-wall-section-${xIndex}-${yIndex}`,
          size,
          position,
          material: materials.wall,
          mapUvs: (geometry) => mapWallUvs(geometry, { wall, sectionCenter, sectionCenterY, wallLength, height, wallThickness }),
        });
      }
    }
  });
};

export { createRoomShell };
