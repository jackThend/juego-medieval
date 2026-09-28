import RAPIER from "@dimforge/rapier3d-compat";

export class PhysicsWorld {
  constructor() {
    this.RAPIER = RAPIER;
    this.world = null;
    this.characterController = null;
  }

  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: -22, z: 0 });
    this.world.timestep = 1 / 60;

    this.characterController = this.world.createCharacterController(0.025);
    this.characterController.enableAutostep(0.34, 0.18, true);
    this.characterController.enableSnapToGround(0.22);
    this.characterController.setMaxSlopeClimbAngle((46 * Math.PI) / 180);
    this.characterController.setMinSlopeSlideAngle((52 * Math.PI) / 180);
  }

  step() {
    this.world.step();
  }

  createGround({ y = -0.25, halfExtents = { x: 18, y: 0.25, z: 18 } } = {}) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, y, 0);
    const body = this.world.createRigidBody(bodyDesc);
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfExtents.x, halfExtents.y, halfExtents.z)
      .setFriction(1.1)
      .setRestitution(0);
    return this.world.createCollider(colliderDesc, body);
  }

  createStaticBox({ x, y, z, hx, hy, hz, rotationY = 0 }) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(x, y, z)
      .setRotation({ x: 0, y: Math.sin(rotationY * 0.5), z: 0, w: Math.cos(rotationY * 0.5) });
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.95),
      body,
    );
    return { body, collider };
  }

  createCharacterCapsule({ x = 0, y = 0.74, z = 0, halfHeight = 0.43, radius = 0.29 } = {}) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z);
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.capsule(halfHeight, radius)
        .setFriction(0)
        .setRestitution(0),
      body,
    );
    return { body, collider, halfHeight, radius };
  }

  createPlayerCapsule(options = {}) {
    return this.createCharacterCapsule(options);
  }

  moveCharacter(collider, body, desiredMovement) {
    this.characterController.computeColliderMovement(collider, desiredMovement);
    const movement = this.characterController.computedMovement();
    const current = body.translation();
    body.setNextKinematicTranslation({
      x: current.x + movement.x,
      y: current.y + movement.y,
      z: current.z + movement.z,
    });

    return {
      movement,
      grounded: this.characterController.computedGrounded(),
    };
  }
}
