import * as THREE from "three";

const SCREEN_IDLE = 0x2563eb;
const SCREEN_ANSWERED = 0x22c55e;

export function createQuizPedestal() {
  const group = new THREE.Group();
  group.position.set(0, 0, 1.15);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.45,
    roughness: 0.5,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.7,
    roughness: 0.28,
    emissive: 0xb45309,
    emissiveIntensity: 0.25,
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.68, 0.2, 24),
    bodyMaterial
  );
  base.position.y = 0.1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const pillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.3, 0.58, 16),
    bodyMaterial
  );
  pillar.position.y = 0.49;
  pillar.castShadow = true;
  group.add(pillar);

  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 0.66, 0.1),
    trimMaterial
  );
  screenFrame.position.y = 0.98;
  screenFrame.castShadow = true;
  group.add(screenFrame);

  const screenMaterial = new THREE.MeshStandardMaterial({
    color: SCREEN_IDLE,
    emissive: SCREEN_IDLE,
    emissiveIntensity: 0.65,
    metalness: 0.15,
    roughness: 0.75,
  });

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.84, 0.5),
    screenMaterial
  );
  screen.position.set(0, 0.98, 0.055);
  group.add(screen);

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.56, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.9 })
  );
  bezel.position.set(0, 0.98, 0.04);
  group.add(bezel);

  return { group, screenMaterial };
}

export function setPedestalAnswered(screenMaterial, answered) {
  const color = answered ? SCREEN_ANSWERED : SCREEN_IDLE;
  screenMaterial.color.setHex(color);
  screenMaterial.emissive.setHex(color);
  screenMaterial.emissiveIntensity = answered ? 1.15 : 0.65;
}
