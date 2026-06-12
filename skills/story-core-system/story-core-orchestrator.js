#!/usr/bin/env node

const { StoryKernelEngine } = require('./story-kernel-engine');
const { getBeastDramaProfile } = require('./lore-drama-adapter');
const { DramaShotEngine } = require('./drama-shot-engine');
const { StoryAwarePromptBuilder } = require('./story-aware-prompt-builder');
const { NarrativeConsistencyGuard } = require('./narrative-consistency-guard');

class StoryCoreOrchestrator {
 constructor() {
 this.kernelEngine = new StoryKernelEngine();
 this.shotEngine = new DramaShotEngine();
 this.promptBuilder = new StoryAwarePromptBuilder();
 this.guard = new NarrativeConsistencyGuard();
 }

 buildProject({ beastId = 'baize', zoneId, duration = 60, title = '' } = {}) {
 const beastProfile = getBeastDramaProfile(beastId);
 const kernel = this.kernelEngine.buildKernel({ beastProfile, targetDuration: duration });
 const finalZoneId = zoneId || beastProfile.suitableNirathZones[0];
 const shots = this.shotEngine.buildShots(kernel, finalZoneId);
 const prompts = shots.map(shot => ({
 id: shot.id, duration: shot.duration,
 prompt: this.promptBuilder.build(shot, kernel, beastProfile)
 }));
 const validation = this.guard.validate(kernel, shots);
 return {
 title: title || `${beastProfile.chineseName}：异兽之歌`,
 beastProfile, kernel, shots, prompts, validation
 };
 }
}

if (require.main === module) {
 const r = new StoryCoreOrchestrator().buildProject({ beastId: 'baize', duration: 60 });
 console.log(JSON.stringify(r, null, 2));
}

module.exports = { StoryCoreOrchestrator };
