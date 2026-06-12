#!/usr/bin/env node

const BEAST_DRAMA_PROFILES = {
 baize: {
 id: 'baize',
 chineseName: '白泽',
 mythTrait: '知万物之情，通鬼神之事',
 emotionalArchetype: '悲悯智者',
 narrativeGift: '预见命运',
 desire: '让理解代替恐惧',
 fear: '看见悲剧却无法阻止',
 misconception: '远离众生就是慈悲',
 sacrificeMode: '化身为光',
 suitableConflicts: ['protect', 'misunderstanding', 'sacrifice'],
 suitableNirathZones: ['luminous_vein_canyon', 'twin_sun_grassland'],
 voiceTone: 'calm_sacred_melancholy'
 },
 dijiang: {
 id: 'dijiang',
 chineseName: '帝江',
 mythTrait: '混沌之象，不可目测，不可言尽',
 emotionalArchetype: '混沌守望者',
 narrativeGift: '感知失衡',
 desire: '维持生态平衡',
 fear: '秩序把混沌误判成毁灭',
 misconception: '沉默就能避免伤害',
 sacrificeMode: '回归混沌原域',
 suitableConflicts: ['misunderstanding', 'coexistence'],
 suitableNirathZones: ['chaos_origin_field'],
 voiceTone: 'distant_cosmic_compassion'
 },
 xingtian: {
 id: 'xingtian',
 chineseName: '刑天',
 mythTrait: '失首而战，不屈不灭',
 emotionalArchetype: '不灭战魂',
 narrativeGift: '战意唤醒沉眠意志',
 desire: '守住尊严与存在',
 fear: '被遗忘',
 misconception: '只有战斗才能证明自己',
 sacrificeMode: '身躯与大地同化',
 suitableConflicts: ['rebellion', 'remembrance', 'sacrifice'],
 suitableNirathZones: ['broken_battlefield'],
 voiceTone: 'burning_defiant_grief'
 },
 kuafu: {
 id: 'kuafu',
 chineseName: '夸父',
 mythTrait: '逐日不止，明知不可及而不止步',
 emotionalArchetype: '悲壮追逐者',
 narrativeGift: '以自身意志撼动天地',
 desire: '把希望留给后来者',
 fear: '世界永远干涸死寂',
 misconception: '只要再多一步，就能追上命运',
 sacrificeMode: '化山化林',
 suitableConflicts: ['rebellion', 'sacrifice', 'remembrance'],
 suitableNirathZones: ['twin_sun_grassland'],
 voiceTone: 'epic_tired_burning'
 }
};

function getBeastDramaProfile(beastId) {
 const profile = BEAST_DRAMA_PROFILES[beastId];
 if (!profile) throw new Error(`Unknown beast drama profile: ${beastId}`);
 return profile;
}

module.exports = { BEAST_DRAMA_PROFILES, getBeastDramaProfile };
