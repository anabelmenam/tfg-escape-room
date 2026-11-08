import assert from "node:assert/strict";
import test from "node:test";
import { installBrowserMocks } from "../helpers/browserMocks.js";

installBrowserMocks();

const { PlayerAvatar } = await import("../../src/game/PlayerAvatar.js");

for (const role of ["mama", "papa"]) {
  test(`PlayerAvatar representa y anima a ${role}`, () => {
    const avatar = new PlayerAvatar({ role, name: "Jugador" });
    assert.equal(avatar.object3D.visible, false);
    const depthShells = [];
    avatar.object3D.traverse((object) => { if (object.userData.playerAvatarDepthShell) depthShells.push(object); });
    assert.ok(depthShells.length > 0);
    assert.ok(depthShells.every((shell) => shell.material.colorWrite === false && shell.material.depthWrite === true));
    avatar.setConnected(true);
    assert.equal(avatar.object3D.visible, false);
    avatar.setName("");
    avatar.setName("Jugador");
    avatar.setName("Compañero");
    avatar.setTarget({ position: { x: 1, y: 5.25, z: 2 }, rotationY: Math.PI });
    assert.equal(avatar.object3D.visible, true);
    avatar.setTarget({ position: { x: 4, y: 5.25, z: 5 }, rotationY: -Math.PI / 2 });
    avatar.update(.016);
    avatar.update(.5);
    avatar.setConnected(false);
    assert.equal(avatar.object3D.visible, false);
    avatar.update(.1);
    avatar.dispose();
  });
}
