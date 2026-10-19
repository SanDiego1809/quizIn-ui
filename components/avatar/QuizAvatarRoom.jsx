"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import getLayer from "./libs/getLayer.js";
import { createPlayerNameLabel } from "./libs/createPlayerNameLabel.js";
import {
  createQuizPedestal,
  setPedestalScreen,
  tickPedestalScreen,
} from "./libs/createQuizPedestal.js";
import { layoutPlayersForArc } from "./libs/playerArcLayout.js";
import { skinUrl, animationUrl } from "@/lib/quiz/avatarAssets";
import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import { DEFAULT_SKIN, getSkin, getSkinScale } from "@/lib/quiz/cosmetics";
import {
  detectMixamoPrefix,
  remapMixamoClip,
} from "@/lib/quiz/mixamoClip";
import { createSkinMaterial, skinUsesMatcap } from "@/lib/quiz/skinMaterial";
import styles from "./AvatarScene.module.css";

function prepareCharacter(root, material, scale) {
  const character = root;
  character.scale.setScalar(scale);
  character.position.set(0, 0, -0.4);
  character.traverse((child) => {
    if (child.isMesh) {
      if (material) {
        child.material = material;
      }
      child.castShadow = true;
    }
  });
  return character;
}

function loadFbx(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/** Framing for the strip above the question block (heads + pulpits). */
function applyStageCamera(camera, width, height, playerCount) {
  const aspect = Math.max(0.35, width / Math.max(height, 1));
  const crowd = Math.max(0, playerCount - 2) * 0.18;
  camera.fov = aspect > 2.2 ? 38 : 44;
  camera.aspect = aspect;
  /* Aim a bit higher so pulpits sit near the bottom edge (closer to questions). */
  camera.position.set(0, 1.55, 7.1 + crowd);
  camera.lookAt(0, -0.2, 0.15);
  camera.updateProjectionMatrix();
}

export default function QuizAvatarRoom({
  players,
  yourPlayerId,
  className = "",
  /** "studio" = self-contained dark room; "stage" = transparent over quiz-show backdrop */
  backdrop = "studio",
  onReady,
  showLoadingOverlay = true,
  /** Pedestal chrome: gold | neon | wood | chrome */
  pulpitKit = "gold",
  /** Highlight top ranks on results (playerId → 1|2|3). */
  podiumRanks = null,
}) {
  const stageBackdrop = backdrop === "stage";
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const mountRef = useRef(null);
  const controllersRef = useRef(new Map());
  const clipCacheRef = useRef(new Map());
  const playAnimationRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const playerKey = players.map((player) => player.id).join(",");
  const playerAnimationKey = useMemo(
    () =>
      players
        .map(
          (player) =>
            `${player.id}:${player.animation ?? DEFAULT_ANIMATION}:${player.skinKey ?? DEFAULT_SKIN}:${player.answerOutcome ?? (player.answered ? "pending" : "idle")}`
        )
        .join("|"),
    [players]
  );

  const playerSkinKey = useMemo(
    () =>
      players
        .map((player) => `${player.id}:${player.skinKey ?? DEFAULT_SKIN}`)
        .join("|"),
    [players]
  );

  useEffect(() => {
    for (const player of players) {
      const controller = controllersRef.current.get(player.id);
      if (!controller) continue;

      const nextAnimation = player.animation ?? DEFAULT_ANIMATION;
      controller.playAnimation(nextAnimation);
      const outcome =
        player.answerOutcome ??
        (player.answered ? "pending" : "idle");
      setPedestalScreen(controller.screenMaterial, outcome);
    }
  }, [playerAnimationKey, players]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !players.length) return undefined;

    setLoading(true);
    setLoadError(null);

    let active = true;
    let animationId = null;
    let resizeObserver = null;
    let renderer = null;
    let labelRenderer = null;
    const mixers = [];
    const loader = new FBXLoader();
    const clock = new THREE.Clock();
    const controllers = new Map();

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 300;
    const playerCount = players.length;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    if (stageBackdrop) {
      applyStageCamera(camera, width, height, playerCount);
    } else {
      camera.position.set(0, 0.45, 5.5 + Math.max(0, playerCount - 2) * 0.4);
    }

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.background = "transparent";
    mount.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    let matcapTexture = null;

    if (stageBackdrop) {
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(40, 24),
        new THREE.ShadowMaterial({ opacity: 0.38 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, -1.5, 0.4);
      ground.receiveShadow = true;
      scene.add(ground);
    } else {
      const plane = new THREE.Mesh(
        new THREE.CircleGeometry(18, 64),
        new THREE.MeshStandardMaterial({
          color: 0x0a1628,
          metalness: 0.35,
          roughness: 0.55,
        })
      );
      plane.rotation.x = Math.PI * -0.5;
      plane.receiveShadow = true;
      plane.position.y = -1.5;
      scene.add(plane);
    }

    const sunLight = new THREE.DirectionalLight(
      0xfff1c9,
      stageBackdrop ? 4.4 : 5.8
    );
    sunLight.position.set(2.2, 6, 3.5);
    sunLight.castShadow = true;
    if (stageBackdrop) {
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 24;
      sunLight.shadow.camera.left = -8;
      sunLight.shadow.camera.right = 8;
      sunLight.shadow.camera.top = 8;
      sunLight.shadow.camera.bottom = -8;
    }
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(
      stageBackdrop ? 0xbae6fd : 0x7dd3fc,
      stageBackdrop ? 1.35 : 1.8
    );
    fillLight.position.set(-3.5, 2.2, 2.5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, stageBackdrop ? 1.8 : 1.35);
    rimLight.position.set(0, 3.5, -4);
    scene.add(rimLight);

    const studioGlow = new THREE.AmbientLight(
      stageBackdrop ? 0x334155 : 0x1e293b,
      stageBackdrop ? 0.75 : 0.55
    );
    scene.add(studioGlow);

    if (!stageBackdrop) {
      scene.add(
        getLayer({
          hue: 0.12,
          numSprites: 10,
          opacity: 0.16,
          radius: 12,
          size: 22,
          z: -9.5,
        })
      );
      scene.add(
        getLayer({
          hue: 0.58,
          numSprites: 12,
          opacity: 0.2,
          radius: 14,
          size: 28,
          z: -11,
        })
      );
    }

    const roomScaleFactor = playerCount > 4 ? 0.85 : 1;
    const slots = layoutPlayersForArc(players, yourPlayerId, {
      stageLine: stageBackdrop,
    });

    function startClip(controller, clip) {
      const remapped = remapMixamoClip(clip, controller.mixamoPrefix);
      const playerClip = remapped.clone();
      const nextAction = controller.mixer.clipAction(playerClip);

      controller.currentActionRef.current?.fadeOut(0.35);
      nextAction.reset();
      nextAction.fadeIn(0.35);
      nextAction.play();
      controller.currentActionRef.current = nextAction;
      return nextAction;
    }

    function playAnimationForPlayer(playerId, name) {
      const controller = controllers.get(playerId);
      if (!controller || !active) return;

      const cached = clipCacheRef.current.get(name);
      if (cached) {
        startClip(controller, cached);
        return;
      }

      loader.load(
        animationUrl(name),
        (fbx) => {
          if (!active) return;
          const clip = fbx.animations[0];
          if (!clip) return;
          clip.name = name;
          clipCacheRef.current.set(name, clip);

          const liveController = controllers.get(playerId);
          if (!liveController) return;
          startClip(liveController, clip);
        },
        undefined,
        () => {
          if (!active) return;
          console.error("Avatar animation failed to load:", name);
        }
      );
    }

    playAnimationRef.current = playAnimationForPlayer;

    const uniqueSkinKeys = [
      ...new Set(
        slots.map((slot) => slot.player.skinKey ?? DEFAULT_SKIN)
      ),
    ];

    (async () => {
      try {
        const templateBySkin = new Map();
        await Promise.all(
          uniqueSkinKeys.map(async (key) => {
            const skin = getSkin(key);
            const fbx = await loadFbx(loader, skinUrl(skin.file));
            templateBySkin.set(key, fbx);
          })
        );
        if (!active) return;

        if (uniqueSkinKeys.some((key) => skinUsesMatcap(key))) {
          matcapTexture = textureLoader.load(
            "/assets/animation/fire-edge-blue.jpg"
          );
          matcapTexture.colorSpace = THREE.SRGBColorSpace;
        }

        for (const slot of slots) {
          const slotGroup = new THREE.Group();
          slotGroup.position.set(slot.x, -1.5, slot.z);
          slotGroup.rotation.y = slot.rotationY;

          if (stageBackdrop) {
            const contact = new THREE.Mesh(
              new THREE.CircleGeometry(0.72, 28),
              new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.42,
                depthWrite: false,
              })
            );
            contact.rotation.x = -Math.PI / 2;
            contact.position.set(0, 0.015, 0.85);
            slotGroup.add(contact);
          }

          const skinKey = slot.player.skinKey ?? DEFAULT_SKIN;
          const template = templateBySkin.get(skinKey);
          const material = skinUsesMatcap(skinKey)
            ? createSkinMaterial(matcapTexture, skinKey)
            : null;
          const character = prepareCharacter(
            cloneSkeleton(template),
            material,
            getSkinScale(skinKey) * roomScaleFactor * (stageBackdrop ? 0.92 : 1)
          );
          const mixer = new THREE.AnimationMixer(character);
          mixers.push(mixer);
          slotGroup.add(character);

          const { group: pedestal, screenMaterial } = createQuizPedestal({
            kit: pulpitKit,
          });
          setPedestalScreen(
            screenMaterial,
            slot.player.answerOutcome ??
              (slot.player.answered ? "pending" : "idle")
          );
          slotGroup.add(pedestal);

          const place = podiumRanks?.[slot.player.id];
          if (place === 1 || place === 2 || place === 3) {
            const light = new THREE.PointLight(
              place === 1 ? 0xfbbf24 : place === 2 ? 0xcbd5e1 : 0xd97706,
              place === 1 ? 2.4 : 1.5,
              3.2,
              2
            );
            light.position.set(0, 2.2, 1.1);
            slotGroup.add(light);
          }

          const nameLabel = createPlayerNameLabel(slot.player.name, {
            isYou: slot.player.id === yourPlayerId,
            labelClass: styles.playerName,
            youClass: styles.playerNameYou,
          });
          slotGroup.add(nameLabel);

          scene.add(slotGroup);

          const currentActionRef = { current: null };
          const controller = {
            mixer,
            currentActionRef,
            mixamoPrefix: detectMixamoPrefix(character),
            screenMaterial,
            playAnimation: (animationName) =>
              playAnimationForPlayer(slot.player.id, animationName),
          };
          controllers.set(slot.player.id, controller);
          controller.playAnimation(slot.player.animation ?? DEFAULT_ANIMATION);
        }

        controllersRef.current = controllers;
        setLoadError(null);
        setLoading(false);
        onReadyRef.current?.();
      } catch (error) {
        if (!active) return;
        console.error("Avatar model failed to load:", error);
        setLoadError("Could not load avatar.");
        setLoading(false);
        onReadyRef.current?.();
      }
    })();

    function animate() {
      if (!active) return;
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      for (const mixer of mixers) mixer.update(delta);
      for (const controller of controllersRef.current.values()) {
        tickPedestalScreen(controller.screenMaterial, delta);
      }
      renderer.render(scene, camera);
      labelRenderer?.render(scene, camera);
    }

    function handleResize() {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight || !renderer) return;
      if (stageBackdrop) {
        applyStageCamera(camera, nextWidth, nextHeight, playerCount);
      } else {
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
      }
      renderer.setSize(nextWidth, nextHeight);
      labelRenderer?.setSize(nextWidth, nextHeight);
    }

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    handleResize();
    animate();

    return () => {
      active = false;
      controllersRef.current = new Map();
      playAnimationRef.current = null;
      resizeObserver?.disconnect();
      if (animationId) cancelAnimationFrame(animationId);

      if (renderer) {
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer.forceContextLoss?.();
      }

      if (labelRenderer && mount.contains(labelRenderer.domElement)) {
        mount.removeChild(labelRenderer.domElement);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          const { material } = object;
          if (!material) return;
          if (Array.isArray(material)) {
            material.forEach((mat) => mat.dispose());
          } else {
            material.dispose();
          }
        }
      });
    };
  }, [playerKey, playerSkinKey, yourPlayerId, stageBackdrop, pulpitKit, podiumRanks]);

  return (
    <div
      ref={mountRef}
      className={`${styles.mount} ${stageBackdrop ? styles.mountStage : ""} ${className}`.trim()}
    >
      {loading && showLoadingOverlay ? (
        <div
          className={`${styles.loading} ${stageBackdrop ? styles.loadingStage : ""}`}
          aria-busy="true"
          aria-live="polite"
        >
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <span className={styles.loadingLabel}>Loading avatars…</span>
        </div>
      ) : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
