import * as THREE from "three";
import { getSkin, DEFAULT_SKIN } from "@/lib/quiz/cosmetics";

/**
 * Build a MeshMatcapMaterial for stylized skins (Y Bot).
 * Textured Mixamo skins keep their embedded materials instead.
 */
export function createSkinMaterial(matcapTexture, skinKey = DEFAULT_SKIN) {
  const skin = getSkin(skinKey);
  const material = new THREE.MeshMatcapMaterial({
    matcap: matcapTexture,
  });
  if (skin?.color != null) {
    material.color = new THREE.Color(skin.color);
  }
  return material;
}

export function skinUsesMatcap(skinKey = DEFAULT_SKIN) {
  return Boolean(getSkin(skinKey)?.useMatcap);
}
