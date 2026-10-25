import * as THREE from "three";
import { Entity } from "../Entity.js";
import { tInteraction, tItem } from "../../../translations/index.js";

class Paper extends Entity {
  constructor({
    id,
    position = new THREE.Vector3(),
    rotation = new THREE.Euler(),
    rotationY = 0,
    scale = 1,
    width = 1.4,
    height = 1,
    paperColor = "#e7d5aa",
    backColor = null,
    text = null,
    imagePath = null,
    imageFit = "contain",
    imagePadding = 36,
    content = null,
    onFocus = null,
    focusOffset = new THREE.Vector3(0, 1.9, 1.4),
    collectible = false,
    inventoryIcon = null,
    inspectionTitle = null,
    itemName = "paper",
    onCollect = null,
    archiveOnly = false,
  } = {}) {
    super(id);

    this.canvas = document.createElement("canvas");
    this.canvas.width = 1024;
    this.canvas.height = Math.round((this.canvas.width * height) / width);
    this.context = this.canvas.getContext("2d");
    this.paperColor = paperColor;
    this.imageRequest = 0;
    this.onFocus = onFocus;
    this.focusOffset = focusOffset.clone();
    this.collectible = collectible;
    this.itemName = itemName;
    this.inventoryIcon = inventoryIcon ?? (collectible ? imagePath : null);
    this.inspectionImage = collectible ? imagePath : null;
    this.inspectionTitle = inspectionTitle;
    this.inventoryInspectionKey = collectible ? "KeyR" : null;
    this.onCollect = onCollect;
    this.archiveOnly = archiveOnly;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.object3D = new THREE.Group();
    this.object3D.name = id ?? "paper";
    this.object3D.position.copy(position);
    this.object3D.rotation.copy(rotation);
    this.object3D.rotation.y += rotationY;
    this.object3D.scale.setScalar(scale);

    const paperGeometry = new THREE.PlaneGeometry(width, height);
    const paperMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.92,
      side: backColor ? THREE.FrontSide : THREE.DoubleSide,
    });
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.castShadow = true;
    paper.receiveShadow = true;

    paper.userData.ignoreAging = true;
    this.object3D.add(paper);
    if (backColor) {
      const paperBack = new THREE.Mesh(
        paperGeometry,
        new THREE.MeshStandardMaterial({ color: backColor, roughness: 0.96, side: THREE.BackSide }),
      );
      paperBack.castShadow = true;
      paperBack.receiveShadow = true;
      paperBack.userData.ignoreAging = true;
      this.object3D.add(paperBack);
    }

    if (content) {
      this.setContent(content);
    } else if (imagePath) {
      this.setImage(imagePath, { fit: imageFit, padding: imagePadding });
    } else if (text !== null) {
      this.setText(text);
    } else {
      this.clearContent();
    }
  }

  clearContent() {
    this.context.fillStyle = this.paperColor;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }

  setContent(drawContent) {
    if (typeof drawContent !== "function") {
      throw new Error("El contenido de Paper debe ser una función de dibujo.");
    }

    this.clearContent();
    drawContent(this.context, this.canvas, this);
    this.texture.needsUpdate = true;
    this.updateInventoryPreview();
  }

  updateInventoryPreview() {
    if (!this.collectible || this.inspectionImage) {
      return;
    }

    const preview = this.canvas.toDataURL("image/png");
    this.inventoryIcon ??= preview;
    this.inspectionImage = preview;
  }

  setText(text, {
    color = "#43301f",
    font = "48px serif",
    padding = 72,
    lineHeight = 1.35,
    align = "left",
  } = {}) {
    this.setContent((context, canvas) => {
      context.fillStyle = color;
      context.font = font;
      context.textAlign = align;
      context.textBaseline = "top";

      const x = align === "center" ? canvas.width / 2 : align === "right" ? canvas.width - padding : padding;
      const maxWidth = canvas.width - padding * 2;
      const lineHeightPx = Number.parseFloat(font) * lineHeight;
      let y = padding;

      for (const paragraph of String(text).split("\n")) {
        const words = paragraph.split(/\s+/);
        let line = "";

        for (const word of words) {
          const nextLine = line ? `${line} ${word}` : word;

          if (line && context.measureText(nextLine).width > maxWidth) {
            context.fillText(line, x, y);
            y += lineHeightPx;
            line = word;
          } else {
            line = nextLine;
          }
        }

        if (line) {
          context.fillText(line, x, y);
          y += lineHeightPx;
        }
      }
    });
  }

  setImage(imagePath, { fit = "contain", padding = 36 } = {}) {
    const request = ++this.imageRequest;

    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        if (request !== this.imageRequest) {
          resolve(this);
          return;
        }

        this.setContent((context, canvas) => {
          const availableWidth = canvas.width - padding * 2;
          const availableHeight = canvas.height - padding * 2;
          const imageScale = fit === "cover"
            ? Math.max(availableWidth / image.width, availableHeight / image.height)
            : Math.min(availableWidth / image.width, availableHeight / image.height);
          const drawWidth = image.width * imageScale;
          const drawHeight = image.height * imageScale;

          context.drawImage(
            image,
            (canvas.width - drawWidth) / 2,
            (canvas.height - drawHeight) / 2,
            drawWidth,
            drawHeight,
          );
        });
        resolve(this);
      };

      image.onerror = () => reject(new Error(`No se pudo cargar la imagen del papel: ${imagePath}`));
      image.src = imagePath;
    });
  }

  interact(player) {
    if (this.collectible) {
      if (!this.archiveOnly && !player?.inventory.add(this)) {
        return;
      }
      this.setCollected(true);
      this.onCollect?.(this);
      return;
    }

    this.onFocus?.(this);
  }

  setCollected(collected) {
    this.object3D.visible = !collected;
    this.setEnabled(!collected);
  }

  getInteractionText() {
    if (this.collectible && this.enabled) {
      return tInteraction("pickUp", tItem(this.itemName));
    }

    return this.onFocus ? "[E] Examinar nota" : null;
  }

  getFocusPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(this.focusOffset.clone());
  }

  getLookAtPosition() {
    this.object3D.updateMatrixWorld(true);
    return this.object3D.localToWorld(new THREE.Vector3());
  }
}

export { Paper };
