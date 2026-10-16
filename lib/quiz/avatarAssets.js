export const DEFAULT_CHARACTER_FILE = "Y Bot";

export function skinUrl(fileName = DEFAULT_CHARACTER_FILE) {
  return `/assets/animation/skins/${fileName}.fbx`;
}

/** @deprecated Prefer skinUrl(getSkin(skinKey).file) */
export const CHARACTER_URL = skinUrl(DEFAULT_CHARACTER_FILE);

export function animationUrl(name) {
  return `/assets/animation/animations/${name}.fbx`;
}
