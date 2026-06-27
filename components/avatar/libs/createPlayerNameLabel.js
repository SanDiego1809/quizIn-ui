import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export function createPlayerNameLabel(name, { isYou = false, labelClass, youClass }) {
  const element = document.createElement("div");
  element.className = isYou ? `${labelClass} ${youClass}` : labelClass;
  element.textContent = name;

  const label = new CSS2DObject(element);
  label.position.set(0, 4.15, -0.1);
  return label;
}
