import * as THREE from "three";
import { Entity } from "../Entity.js";

class Lamp extends Entity {
  constructor({ id, position = new THREE.Vector3(0, 8, 0), eventManager, linkedButton, intensityScale = 1 } = {}) {
    super(id);

    this.object3D = new THREE.Group();
    this.object3D.position.copy(position);

    this.isActive = false;
    this.intensityScale = intensityScale;

    this.createCable();
    this.createSocket();
    this.createShade();
    this.createBulb();
    this.createLight();

    const linkedButtons = Array.isArray(linkedButton) ? linkedButton : linkedButton ? [linkedButton] : [];
    if (eventManager && linkedButtons.length > 0) {
      eventManager.on("buttonPressed", ({ id }) => {
        if (!linkedButtons.includes(id)) {
          return;
        }
        this.setActive(!this.isActive);
      });
    }

    this.setActive(false);
  }

  createCable() {
    const cableGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);

    const cableMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.8,
    });

    this.cable = new THREE.Mesh(cableGeometry, cableMaterial);
    this.cable.position.y = -0.4;
    this.cable.castShadow = true;
    this.cable.receiveShadow = true;

    this.object3D.add(this.cable);
  }

  createSocket() {
    const socketGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16);
    const socketMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.4,
    });

    this.socket = new THREE.Mesh(socketGeometry, socketMaterial);
    this.socket.position.y = -1;
    this.socket.castShadow = true;
    this.socket.receiveShadow = true;

    this.object3D.add(this.socket);
  }

  createShade() {
    const shadeGeometry = new THREE.CylinderGeometry(0.25, 1.1, 1, 32, 1, true);
    const shadeMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030,
      roughness: 0.65,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    this.shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
    this.shade.position.y = -1.5;
    this.shade.castShadow = false;
    this.shade.receiveShadow = true;
    this.object3D.add(this.shade);

    const shadeTopGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.12, 32);

    const shadeTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x202020,
      roughness: 0.8,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    this.shadeTop = new THREE.Mesh(shadeTopGeometry, shadeTopMaterial);
    this.shadeTop.position.y = -1.03;
    this.shadeTop.castShadow = false;
    this.shadeTop.receiveShadow = true;

    this.object3D.add(this.shadeTop);
  }

  createBulb() {
    const bulbGeometry = new THREE.SphereGeometry(0.28, 24, 24);
    this.bulbMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.25,
    });

    this.bulb = new THREE.Mesh(bulbGeometry, this.bulbMaterial);
    this.bulb.position.y = -1.65;
    this.bulb.castShadow = false;

    this.object3D.add(this.bulb);
  }

  createLight() {
    this.roomLight = new THREE.PointLight(0xffe4a3, 0, 55, 1.35);
    this.roomLight.position.set(0, -1.28, 0);
    this.roomLight.castShadow = false;

    this.roomLight.shadow.mapSize.width = 1024;
    this.roomLight.shadow.mapSize.height = 1024;
    this.roomLight.shadow.camera.near = 0.1;
    this.roomLight.shadow.camera.far = 60;
    this.roomLight.shadow.bias = -0.0005;
    this.roomLight.shadow.normalBias = 0.03;

    this.downLight = new THREE.SpotLight(0xffe4a3, 0, 70, Math.PI / 2.2, 0.75, 1.2);
    this.downLight.position.set(0, -1.7, 0);

    this.lightTarget = new THREE.Object3D();
    this.lightTarget.position.set(0, -10, 0);
    this.downLight.target = this.lightTarget;
    this.downLight.castShadow = false;

    this.object3D.add(this.roomLight, this.downLight, this.lightTarget);
  }

  setActive(active) {
    this.setLights({
      warm: active,
      cold: false,
    });
  }

  getActive() {
    return this.isActive;
  }

  turnOn() {
    this.setActive(true);
  }

  turnOff() {
    this.setActive(false);
  }

  setLights({ warm = false, cold = false } = {}) {
    const active = warm || cold;

    this.isActive = active;

    if (!active) {
      this.roomLight.intensity = 0;
      this.downLight.intensity = 0;
      this.bulbMaterial.color.set(0x555555);
      this.bulbMaterial.emissive.set(0x000000);
      this.bulbMaterial.emissiveIntensity = 0;

      return;
    }

    let lightColor;
    let bulbColor;
    let emissiveColor;

    if (warm && cold) {
      lightColor = 0xffffff;
      bulbColor = 0xffffee;
      emissiveColor = 0xfff4d6;
    } else if (warm) {
      lightColor = 0xffb45e;
      bulbColor = 0xffffcc;
      emissiveColor = 0xff9d3d;
    } else {
      lightColor = 0x8fcfff;
      bulbColor = 0xcceeff;
      emissiveColor = 0x66bfff;
    }

    this.roomLight.color.setHex(lightColor);
    this.downLight.color.setHex(lightColor);

    this.roomLight.intensity = 300 * this.intensityScale;
    this.downLight.intensity = 450 * this.intensityScale;

    this.bulbMaterial.color.setHex(bulbColor);
    this.bulbMaterial.emissive.setHex(emissiveColor);
    this.bulbMaterial.emissiveIntensity = 4;
  }
}

export { Lamp };
