import * as THREE from "three";
import { Door, FinalBolt, FinalThreshold } from "../../objects/index.js";

const createDoorAtOpening = (opening, options) => new Door({
  ...options,
  position: opening.position.clone().add(new THREE.Vector3(-opening.width / 2, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), opening.rotationY)),
  rotationY: opening.rotationY,
});

const createHallwayDoors = ({ timeline, testMode, passageOpenings, isInteractHeld, onAction }) => {
  const opening = (id) => passageOpenings.find((entry) => entry.id === id);
  const livingRoomOpening = opening("living-room-hallway-connection");
  const livingRoomDoor = createDoorAtOpening(livingRoomOpening, {
    id: "hallway-living-room-door",
    requiredKey: testMode ? null : timeline === "present" ? "living-room-key" : null,
    locked: !testMode,
    onUnlock: () => onAction?.("object.interact", "hallway-living-room-door"),
  });
  livingRoomDoor.object3D.position.y = livingRoomOpening.height / 2;
  const specs = [
    ["hallway-children-room-door", "hallway-children-room-opening", testMode ? null : timeline === "past" ? "study-key" : null, !testMode],
    ["hallway-bathroom-door", "hallway-bathroom-opening", null, false],
    ["hallway-kitchen-door", "hallway-kitchen-opening", testMode ? null : timeline === "past" ? "crowbar" : null, !testMode],
    ["hallway-street-door", "hallway-street-opening", null, true],
  ];
  const hallwayDoors = specs.map(([id, openingId, requiredKey, locked]) => createDoorAtOpening(opening(openingId), {
    id, requiredKey, locked,
    onUnlock: ["hallway-children-room-door", "hallway-kitchen-door"].includes(id) ? () => onAction?.("object.interact", id) : null,
  }));
  const streetDoor = hallwayDoors.find((door) => door.id === "hallway-street-door");
  const boltSpecs = [
    ["final-bolt-bedroom", "final-key-bedroom", "moon", 0x9aa7ba],
    ["final-bolt-living-room", "final-key-living-room", "flame", 0xb56b38],
    ["final-bolt-children", "final-key-children", "star", 0xc6a044],
    ["final-bolt-bathroom", "final-key-bathroom", "wave", 0x4f91ad],
  ];
  const finalBolts = boltSpecs.map(([id, keyId, symbol, color], index) => {
    const bolt = new FinalBolt({ id, keyId, symbol, color, onUnlock: () => onAction?.("object.interact", id) });
    const position = new THREE.Vector3(5.7, 3.05 - index * .68, streetDoor.thickness / 2 + .11).applyAxisAngle(new THREE.Vector3(0, 1, 0), streetDoor.closedRotation);
    bolt.object3D.position.copy(position.add(streetDoor.object3D.position));
    bolt.object3D.rotation.y = streetDoor.closedRotation;
    bolt.object3D.scale.setScalar(.56);
    return bolt;
  });
  const threshold = new FinalThreshold({
    timeline,
    isInteractHeld,
    onHoldChange: (holding) => onAction?.("object.interact", "hallway-final-threshold", { operation: holding ? "hold-start" : "hold-end" }),
  });
  threshold.object3D.position.set(1.65, 0, streetDoor.thickness / 2 + .15);
  streetDoor.doorMesh.add(threshold.object3D);

  const applyState = (state, livingRoomKey) => {
    if (state.timelines?.[timeline]?.objects?.["hallway-living-room-door"]?.locked === false) {
      livingRoomDoor.unlock({ notify: false });
      livingRoomKey.object3D.visible = false;
      livingRoomKey.setEnabled(false);
    }
    if (["past", "present"].some((era) => state.timelines?.[era]?.objects?.["hallway-children-room-door"]?.locked === false)) hallwayDoors.find((door) => door.id === "hallway-children-room-door")?.unlock({ notify: false });
    if (["past", "present"].some((era) => state.timelines?.[era]?.objects?.["hallway-kitchen-door"]?.locked === false || state.timelines?.[era]?.objects?.["living-room-kitchen-door"]?.locked === false)) hallwayDoors.find((door) => door.id === "hallway-kitchen-door")?.unlock({ notify: false });
    finalBolts.forEach((bolt) => { if (["past", "present"].some((era) => state.timelines?.[era]?.objects?.[bolt.id]?.unlocked)) bolt.unlock(); });
    threshold.applyEndingState(state.ending);
    const finalState = state.timelines?.past?.objects?.["hallway-street-door"] ?? state.timelines?.present?.objects?.["hallway-street-door"];
    if (finalState?.locked === false) streetDoor.unlock({ notify: false });
    if (finalState?.open) streetDoor.open({ notify: false });
  };
  return { livingRoomOpening, livingRoomDoor, hallwayDoors, streetDoor, finalBolts, threshold, applyState };
};
export { createHallwayDoors };
