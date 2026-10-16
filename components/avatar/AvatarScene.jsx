"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import getLayer from "./libs/getLayer.js";
import {
  createQuizPedestal,
  setPedestalAnswered,
} from "./libs/createQuizPedestal.js";
import { skinUrl, animationUrl } from "@/lib/quiz/avatarAssets";
import {
  ANIMATION_PREVIEW_MS,
  DEFAULT_ANIMATION,
} from "@/lib/quiz/animations";
import { DEFAULT_SKIN, getSkin, getSkinScale } from "@/lib/quiz/cosmetics";
import {
  detectMixamoPrefix,
  remapMixamoClip,
} from "@/lib/quiz/mixamoClip";
import { createSkinMaterial, skinUsesMatcap } from "@/lib/quiz/skinMaterial";
import styles from "./AvatarScene.module.css";

export default function AvatarScene({
  animation,
  skinKey = DEFAULT_SKIN,
  className = "",
  showQuizPedestal = false,
  answered = false,
  /** When false, keep playing the selected clip instead of restoring Idle after preview. */
  restoreIdleAfterPreview = true,
  onIdleRestore,
  onError,
}) {
  const mountRef = useRef(null);
  const animationRef = useRef(animation);
  const playAnimationRef = useRef(null);
  const screenMaterialRef = useRef(null);
  const onIdleRestoreRef = useRef(onIdleRestore);
  const onErrorRef = useRef(onError);
  const skipPreviewTimerRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    onIdleRestoreRef.current = onIdleRestore;
  }, [onIdleRestore]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (loadError) onErrorRef.current?.(loadError);
  }, [loadError]);

  useEffect(() => {
    animationRef.current = animation;
    playAnimationRef.current?.(animation);

    if (skipPreviewTimerRef.current) {
      skipPreviewTimerRef.current = false;
      return undefined;
    }

    if (!restoreIdleAfterPreview || animation === DEFAULT_ANIMATION) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      animationRef.current = DEFAULT_ANIMATION;
      playAnimationRef.current?.(DEFAULT_ANIMATION);
      onIdleRestoreRef.current?.();
    }, ANIMATION_PREVIEW_MS);

    return () => window.clearTimeout(timeoutId);
  }, [animation, restoreIdleAfterPreview]);

  useEffect(() => {
    if (screenMaterialRef.current) {
      setPedestalAnswered(screenMaterialRef.current, answered);
    }
  }, [answered]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    setLoading(true);
    setLoadError(null);

    let active = true;
    let animationId = null;
    let resizeObserver = null;
    let renderer = null;
    let mixer = null;
    let currentAction = null;
    let characterRoot = null;
    let mixamoPrefix = "mixamorig";
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

    const skin = getSkin(skinKey);
    const useMatcap = skinUsesMatcap(skinKey);
    let characterMaterial = null;
    if (useMatcap) {
      const textureLoader = new THREE.TextureLoader();
      const matcapTexture = textureLoader.load(
        "/assets/animation/fire-edge-blue.jpg"
      );
      matcapTexture.colorSpace = THREE.SRGBColorSpace;
      characterMaterial = createSkinMaterial(matcapTexture, skinKey);
    }

    const plane = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0a1628,
        metalness: 0.3,
        roughness: 0.6,
      })
    );
    plane.rotation.x = Math.PI * -0.5;
    plane.receiveShadow = true;
    plane.position.y = -1.5;
    scene.add(plane);

    const sunLight = new THREE.DirectionalLight(0xfff1c9, 5.5);
    sunLight.position.set(2, 5.5, 4);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 1.6);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.1);
    rimLight.position.set(0, 3, -3.5);
    scene.add(rimLight);

    scene.add(
      getLayer({
        hue: 0.12,
        numSprites: 8,
        opacity: 0.14,
        radius: 11,
        size: 22,
        z: -9.5,
      })
    );
    scene.add(
      getLayer({
        hue: 0.58,
        numSprites: 10,
        opacity: 0.2,
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

    function revealReady() {
      if (!active) return;
      if (characterRoot) characterRoot.visible = true;
      setLoadError(null);
      setLoading(false);
    }

    function startClip(clip, { snap = false } = {}) {
      if (!mixer || !active) return;

      const remapped = remapMixamoClip(clip, mixamoPrefix);
      const nextAction = mixer.clipAction(remapped);
      if (currentAction === nextAction) {
        if (!nextAction.isRunning()) nextAction.play();
        mixer.update(0);
        return;
      }

      if (snap || !currentAction) {
        currentAction?.stop();
        nextAction.reset();
        nextAction.play();
        mixer.update(0);
      } else {
        currentAction.fadeOut(0.35);
        nextAction.reset();
        nextAction.fadeIn(0.35);
        nextAction.play();
      }
      currentAction = nextAction;
    }

    function playAnimation(name, { snap = false } = {}) {
      if (!mixer || !active) return Promise.resolve();

      const cached = clipCache.get(name);
      if (cached) {
        startClip(cached, { snap });
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        loader.load(
          animationUrl(name),
          (fbx) => {
            if (!active || !mixer) {
              resolve();
              return;
            }
            const clip = fbx.animations[0];
            if (!clip) {
              resolve();
              return;
            }
            clip.name = name;
            clipCache.set(name, clip);
            startClip(clip, { snap });
            resolve();
          },
          undefined,
          () => {
            if (!active) {
              resolve();
              return;
            }
            console.error("Avatar animation failed to load:", name);
            resolve();
          }
        );
      });
    }

    playAnimationRef.current = (name) => playAnimation(name, { snap: false });

    loader.load(
      skinUrl(skin.file),
      (fbx) => {
        if (!active) return;

        const character = fbx;
        character.visible = false;
        character.scale.setScalar(getSkinScale(skinKey));
        character.position.set(0, showQuizPedestal ? 0 : -1.5, showQuizPedestal ? -0.4 : 0);
        character.traverse((child) => {
          if (child.isMesh) {
            if (characterMaterial) {
              child.material = characterMaterial;
            }
            child.castShadow = true;
          }
        });

        characterRoot = character;
        mixamoPrefix = detectMixamoPrefix(character);
        mixer = new THREE.AnimationMixer(character);
        characterParent.add(character);
        playAnimation(animationRef.current, { snap: true }).then(revealReady);
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
  }, [showQuizPedestal, skinKey]);

  return (
    <div
      ref={mountRef}
      className={`${styles.mount} ${className}`.trim()}
    >
      {loading ? (
        <div className={styles.loading} aria-busy="true" aria-live="polite">
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <span className={styles.loadingLabel}>Loading avatar…</span>
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
