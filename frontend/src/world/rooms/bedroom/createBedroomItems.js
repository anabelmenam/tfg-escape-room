import * as THREE from "three";
import { ClockHand, Flashlight, Fuse, Key, PaintingFragment, RadioDial } from "../../objects/index.js";

const createBedroomItems = ({ timeline, furniture, onAction }) => {
  const { nightstand2, cabinet, desk, wardrobe } = furniture;
  const key = timeline === "past"
    ? new Key({ id: "bedroom-key", position: new THREE.Vector3(2, 1, -3) })
    : null;
  const clockHand = timeline === "past" ? new ClockHand() : null;
  const radioDial = timeline === "past" ? new RadioDial({ id: "radio-dial" }) : null;
  const fuse = timeline === "present" ? new Fuse({ id: "fuse", scale: 0.8 }) : null;
  const flashlight = timeline === "present"
    ? new Flashlight({
        id: "flashlight",
        scale: 0.62,
        onCollect: () => onAction?.("item.pickup", "flashlight"),
      })
    : null;
  const paintingFragments = timeline === "past"
    ? [
        new PaintingFragment({ id: "painting-piece-1", index: 0 }),
        new PaintingFragment({ id: "painting-piece-2", index: 4 }),
      ]
    : [];

  if (clockHand) {
    clockHand.object3D.rotation.set(-Math.PI / 2, 0, Math.PI / 5);
    nightstand2.addObjectToDrawer(0, clockHand.object3D, new THREE.Vector3(0, -0.18, -0.45));
  }
  if (flashlight) cabinet.addObjectToDrawer(0, flashlight.object3D, new THREE.Vector3(0, -0.18, -0.38));
  if (paintingFragments.length) {
    desk.addObjectToDrawer(0, paintingFragments[0].object3D, new THREE.Vector3(0, -0.16, -0.62));
    wardrobe.addObjectToDrawer(0, paintingFragments[1].object3D, new THREE.Vector3(-0.65, -0.395, -1.07));
  }
  if (fuse) desk.addObjectToDrawer(0, fuse.object3D, new THREE.Vector3(-0.55, -0.18, -0.7));

  return { key, clockHand, radioDial, fuse, flashlight, paintingFragments };
};

export { createBedroomItems };
