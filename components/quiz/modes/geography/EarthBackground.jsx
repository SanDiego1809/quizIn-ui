"use client";

/**
 * Decorative Earth background adapted from franky-adl/threejs-earth (MIT).
 * Local source: C:/Projects/Projects/threejs-earth
 * No OrbitControls / dat.GUI / Stats — lobby background only.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ATM_FRAGMENT, ATM_VERTEX } from "./earthShaders/atmosphere";
import classes from "./EarthBackground.module.css";

const ASSET_BASE = "/geo/earth";

const params = {
  sunIntensity: 1.3,
  speedFactor: 2.0,
  metalness: 0.1,
  atmOpacity: { value: 0.7 },
  atmPowFactor: { value: 4.1 },
  atmMultiplier: { value: 9.5 },
};

function loadTexture(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

function attachEarthShader(earthMat, cloudsMap) {
  earthMat.onBeforeCompile = (shader) => {
    shader.uniforms.tClouds = { value: cloudsMap };
    shader.uniforms.tClouds.value.wrapS = THREE.RepeatWrapping;
    shader.uniforms.uv_xOffset = { value: 0 };
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      /* glsl */ `
#include <common>
uniform sampler2D tClouds;
uniform float uv_xOffset;
`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      /* glsl */ `
float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
  vec4 texelRoughness = texture2D(roughnessMap, vRoughnessMapUv);
  texelRoughness = vec4(1.0) - texelRoughness;
  roughnessFactor *= clamp(texelRoughness.g, 0.5, 1.0);
#endif
`
    );
    // three r180 exposes \`normal\` after normal_fragment_*; original used geometryNormal
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `
#ifdef USE_EMISSIVEMAP
  vec4 emissiveColor = texture2D(emissiveMap, vEmissiveMapUv);
  emissiveColor *= 1.0 - smoothstep(-0.02, 0.0, dot(normal, directionalLights[0].direction));
  totalEmissiveRadiance *= emissiveColor.rgb;
#endif
float cloudsMapValue = texture2D(tClouds, vec2(vMapUv.x - uv_xOffset, vMapUv.y)).r;
diffuseColor.rgb *= max(1.0 - cloudsMapValue, 0.2);
float intensity = 1.4 - dot(normal, vec3(0.0, 0.0, 1.0));
vec3 atmosphere = vec3(0.3, 0.6, 1.0) * pow(intensity, 5.0);
diffuseColor.rgb += atmosphere;
`
    );
    earthMat.userData.shader = shader;
  };
}

export default function EarthBackground({ className = "" }) {
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
    let earth;
    let clouds;
    let clock;
    const textures = [];

    const onVisibility = () => {
      if (document.hidden) clock?.stop();
      else clock?.start();
    };

    const resize = () => {
      if (!renderer || !camera || !mount) return;
      const width = mount.clientWidth || 1;
      const height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    async function init() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
      camera.position.set(0, 0, 30);

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = classes.canvas;
      mount.appendChild(renderer.domElement);

      const loader = new THREE.TextureLoader();
      const [
        albedoMap,
        bumpMap,
        cloudsMap,
        oceanMap,
        lightsMap,
        envMap,
      ] = await Promise.all([
        loadTexture(loader, `${ASSET_BASE}/Albedo.jpg`),
        loadTexture(loader, `${ASSET_BASE}/Bump.jpg`),
        loadTexture(loader, `${ASSET_BASE}/Clouds.png`),
        loadTexture(loader, `${ASSET_BASE}/Ocean.png`),
        loadTexture(loader, `${ASSET_BASE}/night_lights.png`),
        loadTexture(loader, `${ASSET_BASE}/Gaia_sky.jpg`),
      ]);

      if (disposed) {
        [albedoMap, bumpMap, cloudsMap, oceanMap, lightsMap, envMap].forEach(
          (tex) => tex.dispose()
        );
        return;
      }

      textures.push(
        albedoMap,
        bumpMap,
        cloudsMap,
        oceanMap,
        lightsMap,
        envMap
      );

      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      for (const tex of [
        albedoMap,
        bumpMap,
        cloudsMap,
        oceanMap,
        lightsMap,
        envMap,
      ]) {
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
      }

      albedoMap.colorSpace = THREE.SRGBColorSpace;
      cloudsMap.wrapS = THREE.RepeatWrapping;
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      envMap.colorSpace = THREE.SRGBColorSpace;
      scene.background = envMap;

      const dirLight = new THREE.DirectionalLight(
        0xffffff,
        params.sunIntensity
      );
      dirLight.position.set(-50, 0, 30);
      scene.add(dirLight);

      const group = new THREE.Group();
      group.rotation.z = (23.5 / 360) * 2 * Math.PI;

      const earthGeo = new THREE.SphereGeometry(10, 64, 64);
      const earthMat = new THREE.MeshStandardMaterial({
        map: albedoMap,
        bumpMap,
        bumpScale: 0.03,
        roughnessMap: oceanMap,
        metalness: params.metalness,
        metalnessMap: oceanMap,
        emissiveMap: lightsMap,
        emissive: new THREE.Color(0xffff88),
      });
      attachEarthShader(earthMat, cloudsMap);

      earth = new THREE.Mesh(earthGeo, earthMat);
      earth.rotateY(-0.3);
      group.add(earth);

      const cloudGeo = new THREE.SphereGeometry(10.05, 64, 64);
      const cloudsMat = new THREE.MeshStandardMaterial({
        alphaMap: cloudsMap,
        transparent: true,
        depthWrite: false,
      });
      clouds = new THREE.Mesh(cloudGeo, cloudsMat);
      clouds.rotateY(-0.3);
      group.add(clouds);

      const atmosGeo = new THREE.SphereGeometry(12.5, 64, 64);
      const atmosMat = new THREE.ShaderMaterial({
        vertexShader: ATM_VERTEX,
        fragmentShader: ATM_FRAGMENT,
        uniforms: {
          atmOpacity: params.atmOpacity,
          atmPowFactor: params.atmPowFactor,
          atmMultiplier: params.atmMultiplier,
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      });
      group.add(new THREE.Mesh(atmosGeo, atmosMat));

      scene.add(group);

      clock = new THREE.Clock();
      resize();
      setLoading(false);

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        if (document.hidden) return;

        const interval = clock.getDelta();
        earth.rotateY(interval * 0.005 * params.speedFactor);
        clouds.rotateY(interval * 0.01 * params.speedFactor);

        const shader = earth.material.userData.shader;
        if (shader?.uniforms?.uv_xOffset) {
          const offset =
            (interval * 0.005 * params.speedFactor) / (2 * Math.PI);
          shader.uniforms.uv_xOffset.value += offset % 1;
        }

        renderer.render(scene, camera);
      };
      animate();
    }

    init().catch((err) => {
      console.error("[EarthBackground]", err);
      if (!disposed) setLoading(false);
    });

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);

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
      {loading ? <div className={classes.loading}>Loading Earth…</div> : null}
    </div>
  );
}
