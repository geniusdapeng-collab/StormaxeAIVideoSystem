'use strict';

/**
 * Prompt Variation Enhancer v1.0-Peng
 * 强制相邻镜头视觉差异化，减少模板化
 */

const VARIATION_MODES = [
  'change focal emphasis to the eye region',
  'shift attention to body silhouette against background scale',
  'highlight environmental response around the subject',
  'focus on movement initiation rather than static pose',
  'stress human-to-beast distance and tension',
  'reframe toward light interaction and surface texture'
];

function addVariationToShot(shot, index, shots) {
  const mode = VARIATION_MODES[index % VARIATION_MODES.length];
  shot._variationMode = mode;

  if (!shot.Camera) shot.Camera = '';
  if (!shot.Action) shot.Action = '';
  if (!shot.Scene) shot.Scene = '';
  if (!shot.Mood) shot.Mood = '';

  if (index % 3 === 0) {
    shot.Camera += ' Visual priority on face and eye detail.';
  } else if (index % 3 === 1) {
    shot.Camera += ' Visual priority on body scale and environmental contrast.';
  } else {
    shot.Camera += ' Visual priority on motion and spatial transition.';
  }

  if (index % 2 === 0) {
    shot.Action += ' Avoid static repetition, show a clear change or reaction beat.';
  } else {
    shot.Scene += ' Ensure a distinct environmental element separates this shot from the previous one.';
  }
}

function enhancePromptVariation(shots) {
  for (let i = 0; i < (shots || []).length; i++) {
    addVariationToShot(shots[i], i, shots);
  }
}

module.exports = { addVariationToShot, enhancePromptVariation };
