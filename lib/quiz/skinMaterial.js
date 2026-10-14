import * as THREE from "three";
import { getSkin, DEFAULT_SKIN } from "@/lib/quiz/cosmetics";

/**
 * Build a MeshMatcapMaterial for a cosmetic skin id.
 * Callers own the returned material (and should dispose it).
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
