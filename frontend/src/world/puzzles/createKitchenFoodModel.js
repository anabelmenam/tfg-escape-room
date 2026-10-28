import * as THREE from "three";

const createTomatoes = (quantity = 3) => {
  const group = new THREE.Group();
  const positions = [[-.2, 0], [.2, 0], [0, -.22], [0, .22]];
  positions.slice(0, quantity).forEach(([x, z], index) => {
    const tomato = new THREE.Mesh(
      new THREE.SphereGeometry(.2, 18, 14),
      new THREE.MeshStandardMaterial({ color: 0xb9362f, roughness: .78 }),
    );
    tomato.scale.y = .88;
    tomato.position.set(x, index === 2 ? .18 : .12, z);
    const crown = new THREE.Mesh(
      new THREE.ConeGeometry(.085, .045, 5),
      new THREE.MeshStandardMaterial({ color: 0x416332, roughness: .9 }),
    );
    crown.position.set(x, tomato.position.y + .18, z);
    group.add(tomato, crown);
  });
  return group;
};

const createCarrotGeometry = (bendDirection = 1) => {
  const profile = [
    new THREE.Vector2(.012, -.41),
    new THREE.Vector2(.035, -.36),
    new THREE.Vector2(.064, -.24),
    new THREE.Vector2(.086, -.06),
    new THREE.Vector2(.102, .17),
    new THREE.Vector2(.096, .31),
    new THREE.Vector2(.072, .38),
    new THREE.Vector2(.025, .41),
  ];
  const geometry = new THREE.LatheGeometry(profile, 24);
  const positions = geometry.attributes.position;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const y = positions.getY(vertex);
    const normalizedHeight = (y + .41) / .82;
    const curve = Math.sin(normalizedHeight * Math.PI) * .032 * bendDirection;
    positions.setX(vertex, positions.getX(vertex) + curve);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
};

const createCarrots = (quantity = 2) => {
  const group = new THREE.Group();
  [-.2, 0, .2].slice(0, quantity).forEach((z, index) => {
    const carrot = new THREE.Mesh(
      createCarrotGeometry(index === 0 ? -1 : 1),
      new THREE.MeshStandardMaterial({ color: index === 0 ? 0xe17a2d : 0xd96f27, roughness: .84 }),
    );
    carrot.rotation.z = -Math.PI / 2;
    carrot.rotation.y = index === 0 ? -.08 : .1;
    carrot.position.set(.02, .15, z);
    group.add(carrot);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.bezierCurveTo(-.12, .055, -.3, .08, -.46, 0);
    leafShape.bezierCurveTo(-.3, -.08, -.12, -.055, 0, 0);
    const leaf = new THREE.Mesh(
      new THREE.ShapeGeometry(leafShape, 10),
      new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x527f40 : 0x648f4b,
        roughness: .9,
        side: THREE.DoubleSide,
      }),
    );
    leaf.position.set(-.4, .17, z);
    leaf.rotation.set(index === 0 ? -.12 : .12, 0, index === 0 ? -.13 : .1);
    const vein = new THREE.Mesh(
      new THREE.BoxGeometry(.4, .009, .008),
      new THREE.MeshStandardMaterial({ color: 0x365d30, roughness: .95 }),
    );
    vein.position.set(-.2, 0, .006);
    leaf.add(vein);
    group.add(leaf);

    [[-.12, .255], [.08, .225], [.25, .19]].forEach(([x, y], ridgeIndex) => {
      const ridge = new THREE.Mesh(
        new THREE.BoxGeometry(.012, .012, .085 - ridgeIndex * .012),
        new THREE.MeshStandardMaterial({ color: 0xb95d22, roughness: .92 }),
      );
      ridge.rotation.x = index === 0 ? -.18 : .18;
      ridge.position.set(x, y, z + (ridgeIndex - 1) * .018);
      group.add(ridge);
    });
  });
  return group;
};

const createCheese = (quantity = 1) => {
  const group = new THREE.Group();
  Array.from({ length: quantity }, (_, cheeseIndex) => {
    const cheeseGroup = new THREE.Group();
    cheeseGroup.position.x = (cheeseIndex - (quantity - 1) / 2) * .48;
    const cheese = new THREE.Mesh(
      new THREE.CylinderGeometry(.36, .36, .22, 3),
      new THREE.MeshStandardMaterial({ color: 0xd8b64a, roughness: .72 }),
    );
    cheese.rotation.y = -.18;
    cheese.position.y = .12;
    cheeseGroup.add(cheese);
    [[-.12, .12], [.07, .04], [.15, -.12]].forEach(([x, z], index) => {
      const hole = new THREE.Mesh(
        new THREE.CylinderGeometry(.032 + index * .006, .032 + index * .006, .008, 14),
        new THREE.MeshStandardMaterial({ color: 0x9f7b2f, roughness: .88 }),
      );
      hole.position.set(x, .235, z);
      cheeseGroup.add(hole);
    });
    group.add(cheeseGroup);
  });
  return group;
};

const createKitchenFoodModel = (kind, quantity = null) => {
  if (kind === "tomato" || kind === "kitchen-tomatoes") return createTomatoes(quantity ?? 3);
  if (kind === "carrot" || kind === "kitchen-carrots") return createCarrots(quantity ?? 2);
  return createCheese(quantity ?? 1);
};

export { createKitchenFoodModel };
