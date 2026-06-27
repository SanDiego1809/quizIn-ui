"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import getLayer from "./libs/getLayer.js";
import {
  createQuizPedestal,
  setPedestalAnswered,
} from "./libs/createQuizPedestal.js";
import { CHARACTER_URL, animationUrl } from "@/lib/quiz/avatarAssets";
import {
  ANIMATION_PREVIEW_MS,
  DEFAULT_ANIMATION,
} from "@/lib/quiz/animations";
import styles from "./AvatarScene.module.css";

export default function AvatarScene({
  animation,
  className = "",
  showQuizPedestal = false,
  answered = false,
  onIdleRestore,
}) {
  const mountRef = useRef(null);
  const animationRef = useRef(animation);
  const playAnimationRef = useRef(null);
  const screenMaterialRef = useRef(null);
  const onIdleRestoreRef = useRef(onIdleRestore);
  const skipPreviewTimerRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    onIdleRestoreRef.current = onIdleRestore;
  }, [onIdleRestore]);

  useEffect(() => {
    animationRef.current = animation;
    playAnimationRef.current?.(animation);

    if (skipPreviewTimerRef.current) {
      skipPreviewTimerRef.current = false;
      return undefined;
    }

    if (animation === DEFAULT_ANIMATION) return undefined;

    const timeoutId = window.setTimeout(() => {
      animationRef.current = DEFAULT_ANIMATION;
      playAnimationRef.current?.(DEFAULT_ANIMATION);
      onIdleRestoreRef.current?.();
    }, ANIMATION_PREVIEW_MS);

    return () => window.clearTimeout(timeoutId);
  }, [animation]);

  useEffect(() => {
    if (screenMaterialRef.current) {
      setPedestalAnswered(screenMaterialRef.current, answered);
    }
  }, [answered]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let active = true;
    let animationId = null;
    let resizeObserver = null;
    let renderer = null;
    let mixer = null;
    let currentAction = null;
    const clipCache = new Map();
    const loader = new FBXLoader();
    const clock = new THREE.Clock();

    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.35, 5.5);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const matcapTexture = textureLoader.load(
      "/assets/animation/fire-edge-blue.jpg"
    );
    matcapTexture.colorSpace = THREE.SRGBColorSpace;
    const characterMaterial = new THREE.MeshMatcapMaterial({
      matcap: matcapTexture,
    });

    const plane = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
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
        numSprites: 12,
        opacity: 0.22,
        radius: 12,
        size: 28,
        z: -10.5,
      })
    );

    let characterParent = scene;

    if (showQuizPedestal) {
      const slot = new THREE.Group();
      slot.position.set(0, -1.5, 0);

      const { group: pedestal, screenMaterial } = createQuizPedestal();
      screenMaterialRef.current = screenMaterial;
      setPedestalAnswered(screenMaterial, answered);
      slot.add(pedestal);
      scene.add(slot);
      characterParent = slot;
    }

    function startClip(clip) {
      if (!mixer || !active) return;

      const nextAction = mixer.clipAction(clip);
      if (currentAction === nextAction) {
        if (!nextAction.isRunning()) nextAction.play();
        return;
      }

      currentAction?.fadeOut(0.35);
      nextAction.reset();
      nextAction.fadeIn(0.35);
      nextAction.play();
      currentAction = nextAction;
    }

    function playAnimation(name) {
      if (!mixer || !active) return;

      const cached = clipCache.get(name);
      if (cached) {
        startClip(cached);
        return;
      }

      loader.load(
        animationUrl(name),
        (fbx) => {
          if (!active || !mixer) return;
          const clip = fbx.animations[0];
          if (!clip) return;
          clip.name = name;
          clipCache.set(name, clip);
          startClip(clip);
        },
        undefined,
        () => {
          if (!active) return;
          console.error("Avatar animation failed to load:", name);
        }
      );
    }

    playAnimationRef.current = playAnimation;

    loader.load(
      CHARACTER_URL,
      (fbx) => {
        if (!active) return;

        const character = fbx;
        character.scale.setScalar(0.02);
        character.position.set(0, showQuizPedestal ? 0 : -1.5, showQuizPedestal ? -0.4 : 0);
        character.traverse((child) => {
          if (child.isMesh) {
            child.material = characterMaterial;
            child.castShadow = true;
          }
        });

        mixer = new THREE.AnimationMixer(character);
        characterParent.add(character);
        playAnimation(animationRef.current);
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
      mixer?.update(delta);
      renderer.render(scene, camera);
    }

    function handleResize() {
      const nextWidth = mount.clientWidth;
      const nextHeight = mount.clientHeight;
      if (!nextWidth || !nextHeight || !renderer) return;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    }

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);
    handleResize();
    animate();

    return () => {
      active = false;
      playAnimationRef.current = null;
      screenMaterialRef.current = null;
      resizeObserver?.disconnect();
      if (animationId) cancelAnimationFrame(animationId);

      if (renderer) {
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer.forceContextLoss?.();
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
  }, [showQuizPedestal]);

  return (
    <div
      ref={mountRef}
      className={`${styles.mount} ${className}`.trim()}
    >
      {loading ? <p className={styles.loading}>Loading avatar…</p> : null}
      {loadError ? (
        <p className={styles.error} role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
