"use client";

/**
 * Decorative TV-studio background for classic quiz lobby (Three.js).
 * Raised stage, host desk, and sweeping spotlights — no Lottie.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import classes from "./StudioBackground.module.css";

function makeScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#1e1b4b");
  gradient.addColorStop(0.5, "#312e81");
  gradient.addColorStop(1, "#0f172a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
  ctx.font = "bold 52px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QUIZIN", canvas.width / 2, canvas.height / 2 + 12);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeBeamMaterial(color, opacity = 0.08) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

export default function StudioBackground({ className = "" }) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    THREE.ColorManagement.enabled = true;

    let disposed = false;
    let frameId = 0;
    let renderer;
    let scene;
    let camera;
    let screenMesh;
    let clock;
    const textures = [];
    const spots = [];
    const beams = [];
    const aim = new THREE.Vector3();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const resize = () => {
      if (!renderer || !camera || !mount) return;
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    function addSpot(color, intensity) {
      const light = new THREE.SpotLight(color, intensity, 45, Math.PI / 7, 0.55, 1.1);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 8, 24, 1, true),
        makeBeamMaterial(color, 0.07)
      );
      beam.geometry.translate(0, -4, 0);
      scene.add(light);
      scene.add(light.target);
      scene.add(beam);
      spots.push(light);
      beams.push(beam);
      return light;
    }

    function init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x08060c);
      scene.fog = new THREE.FogExp2(0x08060c, 0.022);

      camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
      camera.position.set(0, 5.4, 16.5);
      camera.lookAt(0, 2.6, -1);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = classes.canvas;
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0x334155, 0.35));
      const rim = new THREE.DirectionalLight(0x93c5fd, 0.7);
      rim.position.set(-10, 8, 4);
      scene.add(rim);
      const warm = new THREE.PointLight(0xfbbf24, 3.5, 28);
      warm.position.set(4, 3.2, 3);
      scene.add(warm);

      // House floor
      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(32, 64),
        new THREE.MeshStandardMaterial({
          color: 0x0c0a12,
          roughness: 0.9,
          metalness: 0.15,
        })
      );
      floor.rotation.x = -Math.PI / 2;
      scene.add(floor);

      // Raised stage (upper / back of view)
      const stageMat = new THREE.MeshStandardMaterial({
        color: 0x1a1624,
        roughness: 0.5,
        metalness: 0.35,
      });
      const stage = new THREE.Mesh(new THREE.BoxGeometry(16, 0.55, 7.5), stageMat);
      stage.position.set(0, 0.28, -4.2);
      scene.add(stage);

      const stageLip = new THREE.Mesh(
        new THREE.BoxGeometry(16.2, 0.18, 0.35),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: new THREE.Color(0xfbbf24),
          emissiveIntensity: 0.35,
          roughness: 0.4,
          metalness: 0.5,
        })
      );
      stageLip.position.set(0, 0.55, -0.55);
      scene.add(stageLip);

      // Backdrop screen on stage
      const screenTex = makeScreenTexture();
      textures.push(screenTex);
      const bezel = new THREE.Mesh(
        new THREE.BoxGeometry(11.2, 6.2, 0.28),
        new THREE.MeshStandardMaterial({
          color: 0x0b0a10,
          roughness: 0.35,
          metalness: 0.65,
        })
      );
      bezel.position.set(0, 4.35, -7.55);
      scene.add(bezel);

      screenMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(10.4, 5.6),
        new THREE.MeshStandardMaterial({
          map: screenTex,
          emissiveMap: screenTex,
          emissive: new THREE.Color(0xffffff),
          emissiveIntensity: 0.9,
          roughness: 0.35,
          metalness: 0.1,
        })
      );
      screenMesh.position.set(0, 4.35, -7.38);
      scene.add(screenMesh);

      // Side curtains / wings
      const curtainMat = new THREE.MeshStandardMaterial({
        color: 0x3b1020,
        roughness: 0.85,
        metalness: 0.05,
      });
      [-1, 1].forEach((side) => {
        const curtain = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 8.5, 0.4),
          curtainMat
        );
        curtain.position.set(side * 7.4, 4.4, -6.8);
        curtain.rotation.y = side * -0.35;
        scene.add(curtain);
      });

      // Host desk (center)
      const deskGroup = new THREE.Group();
      deskGroup.position.set(0, 0, 1.8);

      const deskTop = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.22, 1.8),
        new THREE.MeshStandardMaterial({
          color: 0x2a2438,
          roughness: 0.35,
          metalness: 0.45,
        })
      );
      deskTop.position.y = 1.55;
      deskGroup.add(deskTop);

      const deskFront = new THREE.Mesh(
        new THREE.BoxGeometry(5, 1.35, 0.22),
        new THREE.MeshStandardMaterial({
          color: 0x1e1830,
          roughness: 0.45,
          metalness: 0.4,
          emissive: new THREE.Color(0x6366f1),
          emissiveIntensity: 0.12,
        })
      );
      deskFront.position.set(0, 0.85, 0.75);
      deskGroup.add(deskFront);

      const deskAccent = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 0.08, 0.06),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: new THREE.Color(0xfbbf24),
          emissiveIntensity: 0.55,
          roughness: 0.3,
        })
      );
      deskAccent.position.set(0, 1.15, 0.87);
      deskGroup.add(deskAccent);

      [-1.6, 1.6].forEach((x) => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 1.45, 1.4),
          new THREE.MeshStandardMaterial({
            color: 0x171222,
            roughness: 0.55,
            metalness: 0.35,
          })
        );
        leg.position.set(x, 0.72, 0);
        deskGroup.add(leg);
      });

      // Small desk monitors
      [-1.1, 1.1].forEach((x) => {
        const monitor = new THREE.Mesh(
          new THREE.BoxGeometry(0.85, 0.55, 0.08),
          new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            emissive: new THREE.Color(0x38bdf8),
            emissiveIntensity: 0.4,
            roughness: 0.3,
          })
        );
        monitor.position.set(x, 1.95, 0.15);
        monitor.rotation.x = -0.25;
        deskGroup.add(monitor);
      });

      scene.add(deskGroup);

      // Contestant podiums on stage
      const podiumMat = new THREE.MeshStandardMaterial({
        color: 0x312e42,
        roughness: 0.45,
        metalness: 0.4,
      });
      [-3.4, 0, 3.4].forEach((x, i) => {
        const podium = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.15, 1.15),
          podiumMat
        );
        podium.position.set(x, 1.15, -3.6);
        podium.scale.y = 1 + (1 - Math.abs(i - 1)) * 0.2;
        scene.add(podium);
      });

      // Moving spotlights
      const spotA = addSpot(0xfff1c1, 32);
      spotA.position.set(-6, 11, 2);
      const spotB = addSpot(0xa5b4fc, 26);
      spotB.position.set(6, 11, 1);
      const spotC = addSpot(0xf9a8d4, 22);
      spotC.position.set(0, 12, 4);

      clock = new THREE.Clock();
      resize();
      setLoading(false);

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        if (document.hidden) return;

        const t = clock.getElapsedTime();

        if (!reduceMotion) {
          camera.position.x = Math.sin(t * 0.1) * 0.35;
          camera.position.y = 5.4 + Math.sin(t * 0.16) * 0.1;
          camera.lookAt(0, 2.6, -1);

          // Sweep lights across stage (back) and desk (center)
          const targets = [
            {
              x: Math.sin(t * 0.55) * 4.5,
              y: 1.2,
              z: -3.5 + Math.cos(t * 0.4) * 1.2,
            },
            {
              x: Math.sin(t * 0.45 + 2) * 3.8,
              y: 1.6,
              z: 1.5 + Math.sin(t * 0.35) * 0.8,
            },
            {
              x: Math.cos(t * 0.35) * 2.2,
              y: 2.2,
              z: -1 + Math.sin(t * 0.5) * 2.5,
            },
          ];

          spots.forEach((light, i) => {
            const target = targets[i];
            aim.set(target.x, target.y, target.z);
            light.target.position.copy(aim);
            light.target.updateMatrixWorld();
            light.intensity = 20 + Math.sin(t * 1.3 + i) * 5;

            const beam = beams[i];
            if (!beam) return;
            beam.position.copy(light.position);
            beam.lookAt(aim);
            beam.rotateX(Math.PI / 2);
            beam.scale.set(1, light.position.distanceTo(aim) / 8, 1);
            beam.material.opacity = 0.05 + Math.sin(t * 1.1 + i) * 0.02;
          });

          if (screenMesh?.material) {
            screenMesh.material.emissiveIntensity =
              0.8 + Math.sin(t * 2) * 0.12;
          }
        } else {
          // Static aim for reduced motion
          const staticAims = [
            [0, 1.2, -3.5],
            [0, 1.6, 1.8],
            [-2, 2, -1],
          ];
          spots.forEach((light, i) => {
            const [x, y, z] = staticAims[i];
            light.target.position.set(x, y, z);
            light.target.updateMatrixWorld();
            const beam = beams[i];
            if (!beam) return;
            beam.position.copy(light.position);
            beam.lookAt(x, y, z);
            beam.rotateX(Math.PI / 2);
          });
        }

        renderer.render(scene, camera);
      };
      animate();
    }

    try {
      init();
    } catch (err) {
      console.error("[StudioBackground]", err);
      if (!disposed) setLoading(false);
    }

    window.addEventListener("resize", resize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);

      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      }

      scene?.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((mat) => mat?.dispose?.());
        }
      });

      textures.forEach((tex) => tex.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`${classes.root}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      {loading ? <div className={classes.loading}>Loading studio…</div> : null}
    </div>
  );
}
