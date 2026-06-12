#!/usr/bin/env node

class StoryKernelEngine {
 constructor() {
 this.themes = {
 protect: '知道结局后仍选择守护',
 rebellion: '明知不可为，仍不肯屈服',
 misunderstanding: '被恐惧的，未必是真正邪恶',
 remembrance: '即使被遗忘，也要留下痕迹',
 coexistence: '真正的强大，是学会与异己共生'
 };
 }

 buildKernel({ beastProfile, mode = 'beast_first_person', targetDuration = 60 }) {
 if (!beastProfile) throw new Error('Missing beastProfile');

 const theme = this._selectTheme(beastProfile);
 const conflict = this._buildConflict(beastProfile, theme);
 const arc = this._buildArc(theme);

 return {
 version: '1.0-Peng-StoryKernel',
 perspective: mode,
 protagonist: beastProfile.chineseName,
 protagonistId: beastProfile.id,
 theme,
 desire: beastProfile.desire,
 fear: beastProfile.fear,
 misconception: beastProfile.misconception,
 narrativeGift: beastProfile.narrativeGift,
 conflict,
 sacrifice: beastProfile.sacrificeMode,
 afterglow: this._buildAfterglow(beastProfile, theme),
 emotionalCurve: arc,
 targetDuration
 };
 }

 _selectTheme(beastProfile) {
 if (beastProfile.suitableConflicts?.includes('sacrifice')) return this.themes.protect;
 if (beastProfile.suitableConflicts?.includes('rebellion')) return this.themes.rebellion;
 if (beastProfile.suitableConflicts?.includes('misunderstanding')) return this.themes.misunderstanding;
 if (beastProfile.suitableConflicts?.includes('remembrance')) return this.themes.remembrance;
 return this.themes.coexistence;
 }

 _buildConflict(beastProfile, theme) {
 if (theme === this.themes.protect) return '是否为他者承担本不属于自己的灾难';
 if (theme === this.themes.rebellion) return '是否在命运与压迫前继续战斗';
 if (theme === this.themes.misunderstanding) return '是否继续背负误解，还是主动显露真实';
 if (theme === this.themes.remembrance) return '是否接受被遗忘，还是留下不可磨灭的痕迹';
 return '是否打破隔阂，建立新的共生关系';
 }

 _buildArc(theme) {
 if (theme === this.themes.protect) return ['observe', 'foresee', 'hesitate', 'protect', 'dissolve'];
 if (theme === this.themes.rebellion) return ['wound', 'rise', 'defy', 'burst', 'stand'];
 if (theme === this.themes.misunderstanding) return ['hide', 'approach', 'misread', 'reveal', 'understand'];
 if (theme === this.themes.remembrance) return ['fade', 'resist', 'mark', 'burn', 'echo'];
 return ['distance', 'encounter', 'test', 'resonate', 'coexist'];
 }

 _buildAfterglow(beastProfile, theme) {
 if (theme === this.themes.protect) return `${beastProfile.chineseName}并未真正消失，而是以另一种形式留在Nirath生态之中`;
 if (theme === this.themes.rebellion) return `${beastProfile.chineseName}的意志成为大地新的回声`;
 if (theme === this.themes.misunderstanding) return `误解没有完全消失，但第一次有人看见了它真实的一面`;
 if (theme === this.themes.remembrance) return `${beastProfile.chineseName}虽被时间埋没，却在世界上留下永不熄灭的痕迹`;
 return `${beastProfile.chineseName}与来者共同改变了这片土地的命运`;
 }
}

module.exports = { StoryKernelEngine };
