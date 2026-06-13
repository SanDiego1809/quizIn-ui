"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import getLayer from "./libs/getLayer.js";
import { ANIMATIONS } from "@/lib/quiz/animations";
import styles from "./AvatarPicker.module.css";

const CHARACTER_URL = "/assets/animation/Y Bot.fbx";

function animationUrl(name) {
  return `/assets/animation/animations/${name}.fbx`;
}

export default function AvatarPicker({ value, onChange }) {
  const mountRef = useRef(null);
  const selectedAnimationRef = useRef(value);
  const playAnimationRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    selectedAnimationRef.current = value;
    playAnimationRef.current?.(value);
  }, [value]);

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
    const height = mount.clientHeight || 224;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.2, 4.5);

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
      new THREE.CircleGeometry(10, 32),
      new THREE.MeshStandardMaterial({ color: 0x001020 })
    );
    plane.rotation.x = Math.PI * -0.5;
    plane.receiveShadow = true;
    plane.position.y = -1.5;
    scene.add(plane);

    const sunLight = new THREE.DirectionalLight(0xffffff, 5);
    sunLight.position.set(2, 4, 3);
    sunLight.castShadow = true;
    scene.add(sunLight);

    scene.add(
      getLayer({
        hue: 0.58,
        numSprites: 8,
        opacity: 0.2,
        radius: 10,
        size: 24,
        z: -10.5,
      })
    );

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
        character.position.set(0, -1.5, 0);
        character.traverse((child) => {
          if (child.isMesh) {
            child.material = characterMaterial;
            child.castShadow = true;
          }
        });

        mixer = new THREE.AnimationMixer(character);
        scene.add(character);
        playAnimation(selectedAnimationRef.current);
        setLoadError(null);
        setLoading(false);
      },
      undefined,
      (error) => {
        if (!active) return;
        console.error("Avatar model failed to load:", error);
        setLoadError("Could not load avatar model.");
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
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={styles.preview} ref={mountRef}>
        {loading ? <p className={styles.loading}>Loading avatar…</p> : null}
        {loadError ? (
          <p className={styles.error} role="alert">
            {loadError}
          </p>
        ) : null}
      </div>
      <label className={styles.label}>
        Avatar animation
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={Boolean(loadError)}
        >
          {ANIMATIONS.map((anim) => (
            <option key={anim} value={anim}>
              {anim}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
