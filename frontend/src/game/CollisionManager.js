export class CollisionManager {
  constructor({ playerRadius = 0.6 } = {}) {
    this.roomBounds = null;
    this.objectColliders = [];
    this.wallColliders = [];
    this.doorPassage = null;
    this.exteriorBounds = null;
    this.isDoorOpen = false;
    this.isOutsideRoom = false;
    this.previousPosition = null;
    this.playerRadius = playerRadius;
  }

  setRoomBounds(roomBounds) {
    this.roomBounds = roomBounds;
  }

  setDoorPassage(doorPassage) {
    this.doorPassage = doorPassage;
  }

  setExteriorBounds(exteriorBounds) {
    this.exteriorBounds = exteriorBounds;
  }

  setObjectColliders(colliders) {
    this.objectColliders = colliders;
  }

  setWallColliders(colliders) {
    this.wallColliders = colliders;
  }

  resolveWallCollision(position, crouchOffset) {
    const start = this.previousPosition;
    const feetY = position.y - this.roomBounds.floorY + crouchOffset;
    const active = this.wallColliders.filter(
      ({ box, isActive }) => (!isActive || isActive()) && position.y >= box.min.y && feetY < box.max.y,
    );
    let x = position.x;
    for (const { box } of active) {
      if (start.z <= box.min.z - this.playerRadius || start.z >= box.max.z + this.playerRadius) continue;
      const min = box.min.x - this.playerRadius;
      const max = box.max.x + this.playerRadius;
      if (x > start.x && start.x <= min && x > min) x = min;
      if (x < start.x && start.x >= max && x < max) x = max;
    }
    let z = position.z;
    for (const { box } of active) {
      if (x <= box.min.x - this.playerRadius || x >= box.max.x + this.playerRadius) continue;
      const min = box.min.z - this.playerRadius;
      const max = box.max.z + this.playerRadius;
      if (z > start.z && start.z <= min && z > min) z = min;
      if (z < start.z && start.z >= max && z < max) z = max;
    }
    position.x = x;
    position.z = z;
  }

  setDoorOpen(isOpen) {
    this.isDoorOpen = isOpen;
  }

  resolvePlayerCollision(camera, crouchOffset = 0) {
    if (!this.roomBounds) {
      return {
        isGrounded: false,
      };
    }

    const { minX, maxX, minZ, maxZ, floorY, ceilingY } = this.roomBounds;

    const radius = this.playerRadius;
    const playerMinX = minX + radius;
    const playerMaxX = maxX - radius;
    const playerMinZ = minZ + radius;
    const playerMaxZ = maxZ - radius;
    let isGrounded = false;

    const playerFloorY = floorY - crouchOffset;

    if (camera.position.y <= playerFloorY) {
      camera.position.y = playerFloorY;
      isGrounded = true;
    }

    if (camera.position.y >= ceilingY) {
      camera.position.y = ceilingY;
    }

    if (!this.previousPosition) {
      this.previousPosition = camera.position.clone();
    }

    for (const collider of this.objectColliders) {
      const inside =
        camera.position.x >= collider.min.x &&
        camera.position.x <= collider.max.x &&
        camera.position.z >= collider.min.z &&
        camera.position.z <= collider.max.z;

      if (inside) {
        camera.position.x = this.previousPosition.x;
        camera.position.z = this.previousPosition.z;
      }
    }

    this.resolveWallCollision(camera.position, crouchOffset);

    const isInsideDoorPassage =
      this.doorPassage &&
      camera.position.x >= this.doorPassage.minX + radius &&
      camera.position.x <= this.doorPassage.maxX - radius;

    if (this.isOutsideRoom) {
      const isTryingToEnterRoom =
        camera.position.x > playerMinX &&
        camera.position.x < playerMaxX &&
        camera.position.z > playerMinZ &&
        camera.position.z < playerMaxZ;

      if (isTryingToEnterRoom) {
        const cameThroughFrontDoor = this.previousPosition.z >= playerMaxZ && isInsideDoorPassage && this.isDoorOpen;

        if (cameThroughFrontDoor) {
          this.isOutsideRoom = false;
        } else {
          camera.position.x = this.previousPosition.x;
          camera.position.z = this.previousPosition.z;
          this.previousPosition.copy(camera.position);
          return {
            isGrounded,
          };
        }
      }

      if (this.exteriorBounds) {
        const { minX, maxX, minZ, maxZ } = this.exteriorBounds;
        const canApproachOpenDoor = this.isDoorOpen && isInsideDoorPassage;
        camera.position.x = Math.max(minX + radius, Math.min(maxX - radius, camera.position.x));
        camera.position.z = Math.min(maxZ - radius, camera.position.z);
        if (!canApproachOpenDoor) {
          camera.position.z = Math.max(minZ + radius, camera.position.z);
        }
      }

      this.previousPosition.copy(camera.position);

      return {
        isGrounded,
      };
    }

    camera.position.x = Math.max(playerMinX, Math.min(playerMaxX, camera.position.x));
    camera.position.z = Math.max(playerMinZ, camera.position.z);
    const canPassThroughDoor = this.isDoorOpen && isInsideDoorPassage;

    if (camera.position.z > playerMaxZ) {
      if (canPassThroughDoor) {
        this.isOutsideRoom = true;
      } else {
        camera.position.z = playerMaxZ;
      }
    }
    this.previousPosition.copy(camera.position);

    return {
      isGrounded,
    };
  }
}
