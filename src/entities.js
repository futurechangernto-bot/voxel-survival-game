import * as THREE from 'three';

export const ANIMAL_STATES = Object.freeze({
  IDLE: 'IDLE',
  WANDER: 'WANDER',
  FLEE: 'FLEE'
});

export class ItemDrop {
  constructor({ scene, itemId, amount = 1, position = new THREE.Vector3() } = {}) {
    this.scene = scene;
    this.itemId = itemId;
    this.amount = amount;
    this.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 1.4,
      2.2 + Math.random() * 0.8,
      (Math.random() - 0.5) * 1.4
    );
    this.gravity = 9.5;

    const mat = new THREE.MeshStandardMaterial({ color: 0xf2d175, emissive: 0x332200 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), mat);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.mesh = mesh;
    this.life = 90;
    this.collected = false;
  }

  update(delta, playerPos) {
    if (!this.mesh) return;

    this.velocity.y -= this.gravity * delta;
    this.mesh.position.addScaledVector(this.velocity, delta);

    const dist = this.mesh.position.distanceTo(playerPos);
    if (dist <= 1.5) {
      const dir = playerPos.clone().sub(this.mesh.position).normalize();
      this.mesh.position.addScaledVector(dir, delta * 3.0);
    }

    this.life -= delta;
    if (this.life <= 0) {
      this.dispose();
      return;
    }

    if (dist <= 0.8) {
      this.collected = true;
      this.dispose();
    }
  }

  dispose() {
    if (!this.mesh) return;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }
}

export class Animal {
  constructor({ scene, position, speed = 1.2 } = {}) {
    this.scene = scene;
    this.speed = speed;
    this.state = ANIMAL_STATES.IDLE;
    this.stateTimer = 0;
    this.direction = new THREE.Vector3(1, 0, 0);
    this.fleeDistance = 4.0;

    const mat = new THREE.MeshStandardMaterial({ color: 0x79b86b });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1), mat);
    mesh.position.copy(position ?? new THREE.Vector3(0, 8, 0));
    this.scene.add(mesh);
    this.mesh = mesh;
  }

  setState(state) {
    this.state = state;
    this.stateTimer = 0;
  }

  update(delta, playerPos) {
    if (!this.mesh) return;

    const dist = this.mesh.position.distanceTo(playerPos);
    if (dist <= this.fleeDistance) {
      this.state = ANIMAL_STATES.FLEE;
    } else if (this.state === ANIMAL_STATES.FLEE && dist > this.fleeDistance + 1.5) {
      this.state = ANIMAL_STATES.WANDER;
    }

    if (this.state === ANIMAL_STATES.IDLE) {
      this.stateTimer += delta;
      if (this.stateTimer >= 2 + Math.random() * 5) {
        this.setState(ANIMAL_STATES.WANDER);
      }
      return;
    }

    if (this.state === ANIMAL_STATES.WANDER) {
      this.stateTimer += delta;
      if (this.stateTimer >= 1.2) {
        const angle = Math.random() * Math.PI * 2;
        this.direction.set(Math.cos(angle), 0, Math.sin(angle));
        this.stateTimer = 0;
      }
      this.mesh.position.addScaledVector(this.direction, delta * this.speed * 0.8);
      return;
    }

    const away = this.mesh.position.clone().sub(playerPos).normalize();
    this.mesh.position.addScaledVector(away, delta * this.speed * 1.8);
    this.direction.copy(away);
  }

  dispose() {
    if (!this.mesh) return;
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = null;
  }
}
