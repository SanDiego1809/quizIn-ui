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
  setPedestalAnswered,
} from "./libs/createQuizPedestal.js";
import { layoutPlayersForArc } from "./libs/playerArcLayout.js";
import { CHARACTER_URL, animationUrl } from "@/lib/quiz/avatarAssets";
import { DEFAULT_ANIMATION } from "@/lib/quiz/animations";
import { DEFAULT_SKIN } from "@/lib/quiz/cosmetics";
import { createSkinMaterial } from "@/lib/quiz/skinMaterial";
import styles from "./AvatarScene.module.css";

function prepareCharacter(root, material, scale) {
  const character = root;
  character.scale.setScalar(scale);
  character.position.set(0, 0, -0.4);
  character.traverse((child) => {
    if (child.isMesh) {
      child.material = material;
      child.castShadow = true;
    }
  });
  return character;
}

export default function QuizAvatarRoom({
  players,
  yourPlayerId,
  className = "",
}) {
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
            `${player.id}:${player.animation ?? DEFAULT_ANIMATION}:${player.skinKey ?? DEFAULT_SKIN}:${Boolean(player.answered)}`
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
      setPedestalAnswered(controller.screenMaterial, Boolean(player.answered));
    }
  }, [playerAnimationKey, players]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !players.length) return undefined;

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
    camera.position.set(0, 0.45, 5.5 + Math.max(0, playerCount - 2) * 0.4);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = "absolute";
    labelRenderer.domElement.style.inset = "0";
    labelRenderer.domElement.style.pointerEvents = "none";
    mount.appendChild(labelRenderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const matcapTexture = textureLoader.load(
      "/assets/animation/fire-edge-blue.jpg"
    );
    matcapTexture.colorSpace = THREE.SRGBColorSpace;

    const plane = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({ color: 0x001020 })
    );
    plane.rotation.x = Math.PI * -0.5;
    plane.receiveShadow = true;
    plane.position.y = -1.5;
    scene.add(plane);

    const sunLight = new THREE.DirectionalLight(0xffffff, 5);
    sunLight.position.set(2, 5, 4);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    scene.add(
      getLayer({
        hue: 0.58,
        numSprites: 14,
        opacity: 0.22,
        radius: 14,
        size: 28,
        z: -10.5,
      })
    );

    const characterScale = playerCount > 4 ? 0.017 : 0.02;
    const slots = layoutPlayersForArc(players, yourPlayerId);

    function startClip(mixer, currentActionRef, clip) {
      const playerClip = clip.clone();
      const nextAction = mixer.clipAction(playerClip);

      currentActionRef.current?.fadeOut(0.35);
      nextAction.reset();
      nextAction.fadeIn(0.35);
      nextAction.play();
      currentActionRef.current = nextAction;
      return nextAction;
    }

    function playAnimationForPlayer(playerId, name) {
      const controller = controllers.get(playerId);
      if (!controller || !active) return;

      const cached = clipCacheRef.current.get(name);
      if (cached) {
        startClip(controller.mixer, controller.currentActionRef, cached);
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
          startClip(
            liveController.mixer,
            liveController.currentActionRef,
            clip
          );
        },
        undefined,
        () => {
          if (!active) return;
          console.error("Avatar animation failed to load:", name);
        }
      );
    }

    playAnimationRef.current = playAnimationForPlayer;

    loader.load(
      CHARACTER_URL,
      (fbx) => {
        if (!active) return;

        for (const slot of slots) {
          const slotGroup = new THREE.Group();
          slotGroup.position.set(slot.x, -1.5, slot.z);
          slotGroup.rotation.y = slot.rotationY;

          const character = prepareCharacter(
            cloneSkeleton(fbx),
            createSkinMaterial(
              matcapTexture,
              slot.player.skinKey ?? DEFAULT_SKIN
            ),
            characterScale
          );
          const mixer = new THREE.AnimationMixer(character);
          mixers.push(mixer);
          slotGroup.add(character);

          const { group: pedestal, screenMaterial } = createQuizPedestal();
          setPedestalAnswered(
            screenMaterial,
            Boolean(slot.player.answered)
          );
          slotGroup.add(pedestal);

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
      },
      undefined,
      (error) => {
        if (!active) return;
        console.error("Avatar model failed to load:", error);
        setLoadError("Could not load avatar.");
        setLoading(false);
      }
    );

    function animate() {
      if (!active) return;
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      for (const mixer of mixers) mixer.update(delta);
      renderer.render(scene, camera);
      labelRenderer?.render(scene, camera);
    }

    function handleResize() {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight || !renderer) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
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
  }, [playerKey, playerSkinKey, yourPlayerId]);

  return (
    <div ref={mountRef} className={`${styles.mount} ${className}`.trim()}>
      {loading ? <p className={styles.loading}>Loading avatars…</p> : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
