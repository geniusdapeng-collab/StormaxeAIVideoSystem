#!/usr/bin/env node

const { NirathWorldReactionEngine } = require('./nirath-world-reaction-engine');

class DramaShotEngine {
 constructor() { this.worldEngine = new NirathWorldReactionEngine(); }

 buildShots(kernel, zoneId) {
 const beats = kernel.emotionalCurve;
 const durations = this._allocateDurations(kernel.targetDuration, beats);
 return beats.map((beat, i) => ({
 id: `S${String(i).padStart(2,'0')}`,
 beat,
 duration: durations[i],
 shotType: this._suggestShotType(beat),
 dramaticPurpose: this._dramaticPurpose(beat),
 beastInnerState: this._innerState(beat),
 worldReaction: this.worldEngine.react(zoneId, beat),
 mustPreserveLine: this._keyLine(beat, kernel),
 cameraSuggestion: this._cameraSuggestion(beat),
 emotionLevel: this._emotionLevel(beat)
 }));
 }

 _allocateDurations(total, beats) {
 const c = beats.length;
 if (c===5&&total===60) return [10,12,14,14,10];
 if (c===5&&total===45) return [8,9,10,10,8];
 const base = Math.floor(total/c), rem = total - base*c;
 return Array.from({length:c},(_,i)=> i===c-1 ? base+rem : base);
 }

 _suggestShotType(beat) {
 const m={observe:'wide_establishing',foresee:'eye_vision_reveal',hesitate:'medium_emotional_hold',protect:'epic_action_block',dissolve:'afterglow_close_wide',wound:'impact_closeup',rise:'low_angle_recovery',defy:'low_angle_power',burst:'chaotic_peak_motion',stand:'monumental_long_shot',hide:'obscured_partial_reveal',reveal:'sacred_form_unveil',understand:'gentle_two_scale_frame'};
 return m[beat]||'medium_cinematic';
 }

 _dramaticPurpose(beat) {
 const m={observe:'建立异兽主体与命运感',foresee:'建立危机与预知能力',hesitate:'建立角色内在冲突',protect:'完成主题表达与情感高潮',dissolve:'形成余韵与世界升华',wound:'建立代价与伤口',rise:'建立重新站起的力量',defy:'强化反抗意志',burst:'制造爆发性高潮',stand:'让角色成为传说',hide:'制造距离与误解',reveal:'揭示真实本体',understand:'让理解真正发生'};
 return m[beat]||'推进故事';
 }

 _innerState(beat) {
 const m={observe:'calm ancient awareness',foresee:'sorrowful certainty',hesitate:'compassion fighting restraint',protect:'resolute sacrifice',dissolve:'gentle fading peace',wound:'suffering contained by will',rise:'pain hardening into resolve',defy:'unyielding rage',burst:'identity exploding outward',stand:'solemn immortality',hide:'distance and caution',reveal:'truth breaking through fear',understand:'softened dignity'};
 return m[beat]||'controlled mythic emotion';
 }

 _keyLine(beat, kernel) {
 const n=kernel.protagonist;
 const m={observe:`${n}早已看见来者的命运`,foresee:`${n}知道灾难将从何处降临`,hesitate:`${n}第一次不再选择离开`,protect:`${n}决定替他者改写结局`,dissolve:`${n}化作留在世界里的光`,wound:`${n}感受到自身的破碎`,rise:`${n}从伤口中再次站起`,defy:`${n}拒绝屈服`,burst:`${n}把全部意志燃成一击`,stand:`${n}即使残缺，也依旧屹立`,hide:`${n}把真实藏进沉默`,reveal:`${n}终于让世界看见自己`,understand:`${n}第一次被真正理解`};
 return m[beat]||`${n}正在做出选择`;
 }

 _cameraSuggestion(beat) {
 const m={observe:'slow wide push-in',foresee:'tight reflective close-up',hesitate:'held medium with slight orbit',protect:'violent push and impact framing',dissolve:'slow pull-back with drifting particles',wound:'shaky close impact',rise:'low angle lift',defy:'heroic low angle push',burst:'rapid push-pull chaos',stand:'static monumental long lens',hide:'obstructed frame through mist',reveal:'unveiling dolly with rim light',understand:'balanced two-scale composition'};
 return m[beat]||'cinematic stable movement';
 }

 _emotionLevel(beat) {
 const m={observe:3,foresee:5,hesitate:6,protect:10,dissolve:7,wound:7,rise:8,defy:9,burst:10,stand:8,hide:4,reveal:8,understand:6};
 return m[beat]||5;
 }
}

module.exports = { DramaShotEngine };
