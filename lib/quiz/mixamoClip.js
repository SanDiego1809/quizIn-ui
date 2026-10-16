import * as THREE from "three";

/**
 * Three.js FBXLoader strips the colon from Mixamo names:
 *   file "mixamorig:Hips" / "mixamorig10:Hips"
 *   runtime "mixamorigHips" / "mixamorig10Hips"
 * Animation tracks use the same runtime form (e.g. mixamorigHips.quaternion).
 *
 * Barry/Racer use a numbered prefix (mixamorig10 / mixamorig6) while clips
 * still target mixamorig — remap track names or the mixer never binds.
 */
const MIXAMO_BONE_RE = /^(mixamorig\d*)(?=[A-Z_])/;

export function detectMixamoPrefix(root) {
  let prefix = null;
  root?.traverse?.((obj) => {
    if (prefix || !obj?.isBone || !obj.name) return;
    const match = obj.name.match(MIXAMO_BONE_RE);
    if (match) prefix = match[1];
  });
  return prefix || "mixamorig";
}

export function detectClipMixamoPrefix(clip) {
  const track = clip?.tracks?.find((entry) =>
    entry.name.startsWith("mixamorig")
  );
  if (!track) return "mixamorig";
  const boneName = track.name.split(".")[0];
  const match = boneName.match(MIXAMO_BONE_RE);
  return match?.[1] || "mixamorig";
}

function rewriteMixamoTrackName(trackName, fromPrefix, toPrefix) {
  const dot = trackName.indexOf(".");
  if (dot < 0) return trackName;
  const bone = trackName.slice(0, dot);
  const prop = trackName.slice(dot);
  const match = bone.match(/^(mixamorig\d*)(.*)$/);
  if (!match || match[1] !== fromPrefix) return trackName;
  return `${toPrefix}${match[2]}${prop}`;
}

/** Return a clip whose track names use `toPrefix` (clone only when needed). */
export function remapMixamoClip(clip, toPrefix) {
  if (!clip || !toPrefix) return clip;
  const fromPrefix = detectClipMixamoPrefix(clip);
  if (fromPrefix === toPrefix) return clip;

  const tracks = clip.tracks.map((track) => {
    const nextName = rewriteMixamoTrackName(track.name, fromPrefix, toPrefix);
    if (nextName === track.name) return track;
    const next = track.clone();
    next.name = nextName;
    return next;
  });

  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
