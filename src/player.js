import * as THREE from 'three';

export class PlayerController {
  constructor({ camera, onHealthChange, onDamageFlash } = {}) {
    this.camera = camera;
    this.maxHealth = 12;
    this.currentHealth = this.maxHealth;
    this.onHealthChange = onHealthChange ?? (() => {});
    this.onDamageFlash = onDamageFlash ?? (() => {});
    this.previousY = camera.position.y;
    this.damageFlash = 0;
    this.onGround = false;
    this.isUnderwater = false;
  }

  clampHealth() {
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, this.currentHealth));
  }

  applyDamage(amount, source = 'damage') {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, this.currentHealth - amount));
    this.damageFlash = 1;
    this.onDamageFlash?.(source, this.currentHealth);
    this.onHealthChange?.(this.currentHealth, this.maxHealth);
    this.clampHealth();
  }

  heal(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, this.currentHealth + amount));
    this.onHealthChange?.(this.currentHealth, this.maxHealth);
  }

  updateFallDamage(currentY, grounded, underwater) {
    if (!grounded && !underwater) {
      const dropDistance = Math.max(0, this.previousY - currentY);
      if (dropDistance > 3) {
        const damage = (dropDistance - 3) * 0.5;
        this.applyDamage(damage, 'fall');
      }
    }
    this.onGround = grounded;
    this.isUnderwater = underwater;
    this.previousY = currentY;
  }

  performMeleeAttack({ remotePlayers, maxRange = 2.5, network, localPeerId = null } = {}) {
    const origin = this.camera.position.clone();
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    let closest = null;
    for (const [peerId, remote] of remotePlayers.entries()) {
      if (!remote || !remote.mesh) continue;
      const target = remote.mesh.position.clone();
      const distance = origin.distanceTo(target);
      if (distance > maxRange) continue;

      const toTarget = target.clone().sub(origin).normalize();
      const dot = dir.dot(toTarget);
      if (dot <= 0.25) continue;

      if (!closest || distance < closest.distance) {
        closest = { peerId, distance, target };
      }
    }

    if (!closest) return null;
    const knockback = closest.target.clone().sub(origin).normalize().multiplyScalar(2.5);

    if (network && typeof network.emitHit === 'function') {
      network.emitHit({
        targetPeerId: closest.peerId,
        sourcePeerId: localPeerId,
        direction: [knockback.x, knockback.y, knockback.z],
        damage: 1.5
      });
    }

    return closest;
  }

  applyHit({ damage = 1, direction = [0, 0, 0] } = {}) {
    const dmg = Number(damage) || 0;
    if (dmg <= 0) return false;
    this.currentHealth = Math.max(0, Math.min(this.maxHealth, this.currentHealth - dmg));
    this.damageFlash = 1;
    this.onDamageFlash?.('hit', this.currentHealth);
    this.onHealthChange?.(this.currentHealth, this.maxHealth);
    return true;
  }
}
