#!/usr/bin/env node

class StoryAwarePromptBuilder {
 build(shot, kernel, beastProfile) {
 const w = shot.worldReaction;
 return [
 `山海经异兽${kernel.protagonist}第一视角叙事短片`,
 `theme: ${kernel.theme}`,
 `conflict: ${kernel.conflict}`,
 `perspective: ${kernel.perspective}`,
 `shot type: ${shot.shotType}`,
 `dramatic purpose: ${shot.dramaticPurpose}`,
 `beast inner state: ${shot.beastInnerState}`,
 `camera suggestion: ${shot.cameraSuggestion}`,
 `world base: ${w.zoneBase}`,
 `lighting: ${w.lighting}`,
 `terrain response: ${w.terrain}`,
 `atmosphere: ${w.atmosphere}`,
 `voice tone: ${beastProfile.voiceTone}`,
 `myth trait: ${beastProfile.mythTrait}`,
 `sacred melancholy, ancient intelligence, intimate awe, emotional realism`,
 `Nirath alien world responding to beast emotion`,
 `photorealistic, cinematic, volumetric light, emotional composition, ecological storytelling`,
 `must preserve narrative meaning: ${shot.mustPreserveLine}`
 ].join(', ');
 }
}

module.exports = { StoryAwarePromptBuilder };
