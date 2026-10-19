import * as THREE from "three";

const SCREEN_COLORS = {
  idle: 0x2563eb,
  pending: 0xf59e0b,
  correct: 0x22c55e,
  wrong: 0xef4444,
  missed: 0x64748b,
};

const KIT_PRESETS = {
  gold: {
    body: 0x334155,
    trim: 0xfbbf24,
    trimEmissive: 0xb45309,
    trimEmissiveIntensity: 0.25,
    metalness: 0.45,
    roughness: 0.5,
  },
  neon: {
    body: 0x0f172a,
    trim: 0x22d3ee,
    trimEmissive: 0x0891b2,
    trimEmissiveIntensity: 0.85,
    metalness: 0.35,
    roughness: 0.4,
  },
  wood: {
    body: 0x5c4033,
    trim: 0xd4a574,
    trimEmissive: 0x8b5a2b,
    trimEmissiveIntensity: 0.12,
    metalness: 0.08,
    roughness: 0.82,
  },
  chrome: {
    body: 0x94a3b8,
    trim: 0xe2e8f0,
    trimEmissive: 0xcbd5e1,
    trimEmissiveIntensity: 0.2,
    metalness: 0.92,
    roughness: 0.18,
  },
};

function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255,
  };
}

function drawScreenGlyph(ctx, w, h, state, pulse) {
  ctx.clearRect(0, 0, w, h);
  const { r, g, b } = hexToRgb(SCREEN_COLORS[state] ?? SCREEN_COLORS.idle);
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(15, 23, 42, 0.22)";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = Math.max(6, w * 0.07);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const cx = w / 2;
  const cy = h / 2;

  if (state === "correct") {
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.18, cy + h * 0.02);
    ctx.lineTo(cx - w * 0.04, cy + h * 0.16);
    ctx.lineTo(cx + w * 0.22, cy - h * 0.16);
    ctx.stroke();
  } else if (state === "wrong") {
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.16, cy - h * 0.16);
    ctx.lineTo(cx + w * 0.16, cy + h * 0.16);
    ctx.moveTo(cx + w * 0.16, cy - h * 0.16);
    ctx.lineTo(cx - w * 0.16, cy + h * 0.16);
    ctx.stroke();
  } else if (state === "pending") {
    const radius = Math.min(w, h) * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.04, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - radius * 0.35, cy - h * 0.02, radius * 0.7, radius * 0.85);
    const spin = pulse * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, spin, spin + Math.PI * 1.2);
    ctx.stroke();
  } else if (state === "missed") {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.1);
    ctx.lineTo(cx, cy + h * 0.02);
    ctx.moveTo(cx, cy + h * 0.1);
    ctx.lineTo(cx, cy + h * 0.12);
    ctx.stroke();
  }
}

function ensureScreenController(screenMaterial) {
  if (screenMaterial.userData.pedestalScreen) {
    return screenMaterial.userData.pedestalScreen;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  screenMaterial.map = texture;
  screenMaterial.emissiveMap = texture;
  screenMaterial.needsUpdate = true;

  const controller = {
    canvas,
    ctx,
    texture,
    state: "idle",
    pulse: 0,
    current: new THREE.Color(SCREEN_COLORS.idle),
    target: new THREE.Color(SCREEN_COLORS.idle),
    targetIntensity: 0.65,
  };
  screenMaterial.userData.pedestalScreen = controller;
  drawScreenGlyph(ctx, canvas.width, canvas.height, "idle", 0);
  texture.needsUpdate = true;
  return controller;
}

export function createQuizPedestal({ kit = "gold" } = {}) {
  const preset = KIT_PRESETS[kit] || KIT_PRESETS.gold;
  const group = new THREE.Group();
  group.position.set(0, 0, 1.15);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: preset.body,
    metalness: preset.metalness,
    roughness: preset.roughness,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: preset.trim,
    metalness: Math.min(0.95, preset.metalness + 0.25),
    roughness: Math.max(0.12, preset.roughness - 0.2),
    emissive: preset.trimEmissive,
    emissiveIntensity: preset.trimEmissiveIntensity,
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
    color: 0xffffff,
    emissive: SCREEN_COLORS.idle,
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
    new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.2,
      roughness: 0.9,
    })
  );
  bezel.position.set(0, 0.98, 0.04);
  group.add(bezel);

  ensureScreenController(screenMaterial);

  return { group, screenMaterial, kit };
}

/** @param {"idle"|"pending"|"correct"|"wrong"|"missed"} state */
export function setPedestalScreen(screenMaterial, state = "idle") {
  if (!screenMaterial) return;
  const controller = ensureScreenController(screenMaterial);
  const next = SCREEN_COLORS[state] ?? SCREEN_COLORS.idle;
  controller.state = state;
  controller.target.setHex(next);
  const lit = state === "correct" || state === "wrong" || state === "pending";
  controller.targetIntensity =
    lit ? 1.15 : state === "missed" ? 0.45 : 0.65;
  drawScreenGlyph(
    controller.ctx,
    controller.canvas.width,
    controller.canvas.height,
    state,
    controller.pulse
  );
  controller.texture.needsUpdate = true;
}

/** Soft color lerp + pending pulse — call from the render loop. */
export function tickPedestalScreen(screenMaterial, dt = 0.016) {
  const controller = screenMaterial?.userData?.pedestalScreen;
  if (!controller) return;

  controller.current.lerp(controller.target, Math.min(1, dt * 8));
  screenMaterial.emissive.copy(controller.current);
  screenMaterial.emissiveIntensity +=
    (controller.targetIntensity - screenMaterial.emissiveIntensity) *
    Math.min(1, dt * 8);

  if (controller.state === "pending") {
    controller.pulse = (controller.pulse + dt * 0.9) % 1;
    drawScreenGlyph(
      controller.ctx,
      controller.canvas.width,
      controller.canvas.height,
      "pending",
      controller.pulse
    );
    controller.texture.needsUpdate = true;
  }
}

/** @deprecated Prefer setPedestalScreen — kept for AvatarScene. */
export function setPedestalAnswered(screenMaterial, answered) {
  setPedestalScreen(screenMaterial, answered ? "pending" : "idle");
}

export const PULPIT_KITS = Object.keys(KIT_PRESETS);
