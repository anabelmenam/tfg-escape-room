import * as THREE from "three";

const createTomatoes = () => {
  const group = new THREE.Group();
  [[-.2, 0], [.2, 0], [0, -.22]].forEach(([x, z], index) => {
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

const createCarrots = () => {
  const group = new THREE.Group();
  [-.14, .14].forEach((z, index) => {
    const carrot = new THREE.Mesh(
      new THREE.ConeGeometry(.14, .82, 20),
      new THREE.MeshStandardMaterial({ color: index === 0 ? 0xe17a2d : 0xd96f27, roughness: .84 }),
    );
    carrot.rotation.z = -Math.PI / 2;
    carrot.rotation.y = index === 0 ? -.08 : .1;
    carrot.position.set(.02, .15, z);
    group.add(carrot);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(.07, .085, .1, 12),
      new THREE.MeshStandardMaterial({ color: 0x527c3f, roughness: .9 }),
    );
    collar.rotation.z = Math.PI / 2;
    collar.position.set(-.42, .15, z);
    group.add(collar);

    [-.23, 0, .23].forEach((angle, leafIndex) => {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(.045, .34 - leafIndex * .025, 8),
        new THREE.MeshStandardMaterial({ color: leafIndex === 1 ? 0x527c3f : 0x638c49, roughness: .9 }),
      );
      leaf.rotation.z = Math.PI / 2 + angle;
      leaf.rotation.y = index === 0 ? -.15 : .15;
      leaf.position.set(-.5, .18 + Math.abs(angle) * .12, z + (leafIndex - 1) * .055);
      group.add(leaf);
    });

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

const createCheese = () => {
  const group = new THREE.Group();
  const cheese = new THREE.Mesh(
    new THREE.CylinderGeometry(.42, .42, .22, 3),
    new THREE.MeshStandardMaterial({ color: 0xd8b64a, roughness: .72 }),
  );
  cheese.rotation.y = -.18;
  cheese.position.y = .12;
  group.add(cheese);
  [[-.12, .12], [.07, .04], [.15, -.12]].forEach(([x, z], index) => {
    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(.032 + index * .006, .032 + index * .006, .008, 14),
      new THREE.MeshStandardMaterial({ color: 0x9f7b2f, roughness: .88 }),
    );
    hole.position.set(x, .235, z);
    group.add(hole);
  });
  return group;
};

const createKitchenFoodModel = (kind) => {
  if (kind === "tomato" || kind === "kitchen-tomatoes") return createTomatoes();
  if (kind === "carrot" || kind === "kitchen-carrots") return createCarrots();
  return createCheese();
};

export { createKitchenFoodModel };
