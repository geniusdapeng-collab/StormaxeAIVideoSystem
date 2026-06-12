/**
 * Micro-Expression Engine v1.0-Peng
 * AI微表情提示词系统化引擎
 * 
 * 核心原理: AI看不懂模糊情绪，只认具象细节
 * 三层结构: 微表情层 → 肢体动作层 → 情绪气质层
 * 
 * 约束: 单镜头不超过3个动作（防串模）
 * 
 * 版本: v1.0-Peng | 2026-06-01
 */

class MicroExpressionEngine {
  constructor() {
    // 人类微表情库
    this.humanEmotionLib = {
      curious: {
        eye: { pupil: '微微放大', eyelid: '快速眨动两下', eye_corner: '微微上挑', gaze: '锁定目标不移' },
        eyebrow: { brow: '轻蹙1mm', shape: '微挑' },
        mouth_cheek: { mouth_corner: '微扬', lip: '微张失语', cheek_ear: '耳尖微红' },
        body: { head: '微微前倾', shoulder: '微僵', hand: '指尖蜷缩', posture: '半步距离', stance: '探索姿态' }
      },
      awe: {
        eye: { pupil: '放大凝滞', eyelid: '定格颤动', eye_corner: '泛红蔓延至下颚', gaze: '锁定对方仰视' },
        eyebrow: { brow: '舒展', shape: '平缓' },
        mouth_cheek: { mouth_corner: '微张失语', lip: '轻颤', cheek_ear: '耳尖爆红蔓延至颈侧' },
        body: { head: '抬下颚', shoulder: '脊背挺直', hand: '双手攥紧衣摆', posture: '身体微倾', stance: '如松挺立' }
      },
      fear: {
        eye: { pupil: '微缩', eyelid: '快速眨动', eye_corner: '眼尾泛红', gaze: '躲闪又忍不住回望' },
        eyebrow: { brow: '紧锁', shape: '下压' },
        mouth_cheek: { mouth_corner: '拧直', lip: '紧抿发白', cheek_ear: '耳根瞬间爆红' },
        body: { head: '侧首凝望', shoulder: '微瑟缩', hand: '攥袖口', posture: '后退半步', stance: '防御姿态' }
      },
      determination: {
        eye: { pupil: '凝滞不移', eyelid: '定格', eye_corner: '眼尾微微泛红', gaze: '对视不移' },
        eyebrow: { brow: '舒展', shape: '微挑' },
        mouth_cheek: { mouth_corner: '紧抿', lip: '轻颤', cheek_ear: '面色坚毅' },
        body: { head: '抬下颚', shoulder: '脊背挺直如松', hand: '握拳', posture: '半步距离', stance: '战斗姿态' }
      },
      tender: {
        eye: { pupil: '柔和放大', eyelid: '慢垂', eye_corner: '带水汽', gaze: '温柔锁定' },
        eyebrow: { brow: '舒展', shape: '平缓' },
        mouth_cheek: { mouth_corner: '微扬', lip: '轻颤', cheek_ear: '耳尖泛红' },
        body: { head: '歪头', shoulder: '放松', hand: '指尖轻触', posture: '微微前倾', stance: '亲近姿态' }
      }
    };

    // 神兽微表情库（刑天类型: 战士/无头战神）
    this.beastEmotionLib = {
      wrath: {
        eye: { pupil: '竖瞳收缩如针', eyelid: '外眼睑紧绷', eye_corner: '眼角鳞片立起', gaze: '凝视锁定' },
        beast_special: {
          horn_glow: '角尖光芒烈烈爆发',
          gill: '鳃弓紧缩如弓弦',
          scale: '鳞片全立如刀锋',
          tail: '尾巴紧缠地面碎石',
          ear: '耳尖后压如刀削'
        },
        body: { head: '低伏', shoulder: '肩甲隆起', hand: '双爪抠入地面', posture: '身体前倾', stance: '战斗姿态' }
      },
      solemn: {
        eye: { pupil: '凝滞如古潭', eyelid: '缓慢眨动', eye_corner: '眼角微垂', gaze: '深远凝视' },
        beast_special: {
          horn_glow: '角尖光芒暗淡如余烬',
          gill: '鳃弓完全放松',
          scale: '鳞片平贴如古岩',
          tail: '尾巴轻摇如钟摆',
          ear: '耳尖自然下垂'
        },
        body: { head: '微低', shoulder: '肩甲微松', hand: '单爪轻抬', posture: '巍然不动', stance: '山岳姿态' }
      },
      vigilance: {
        eye: { pupil: '竖瞳旋转扫描', eyelid: '半开', eye_corner: '眼角鳞片微立', gaze: '环视四周' },
        beast_special: {
          horn_glow: '角尖光芒明暗交替',
          gill: '鳃弓缓缓张合',
          scale: '鳞片微微起伏',
          tail: '尾巴稳定指向',
          ear: '耳尖竖直旋转'
        },
        body: { head: '侧转', shoulder: '肩甲绷紧', hand: '爪尖轻触地面', posture: '身体微低', stance: '警戒姿态' }
      }
    };

    // 场景→情绪映射
    this.sceneEmotionMap = {
      opening_title: { human: 'curious', beast: 'solemn' },
      discovery: { human: 'curious', beast: 'vigilance' },
      confrontation: { human: 'fear', beast: 'wrath' },
      emotional: { human: 'tender', beast: 'solemn' },
      climax: { human: 'determination', beast: 'wrath' },
      action: { human: 'determination', beast: 'wrath' },
      closing: { human: 'awe', beast: 'solemn' }
    };
  }

  /**
   * 生成微表情提示词
   * @param {Object} shot - 镜头数据
   * @param {Object} character - 角色数据 { name, type, subtype, emotion }
   * @returns {String} 微表情提示词文本
   */
  generate(shot, character) {
    const type = character.type || 'human';
    const subtype = character.subtype || '';
    
    // 确定情绪
    let emotion = character.emotion;
    if (!emotion) {
      const sceneMapping = this.sceneEmotionMap[shot.type] || this.sceneEmotionMap['discovery'];
      emotion = type === 'human' ? sceneMapping.human : sceneMapping.beast;
    }

    if (type === 'human') {
      return this._generateHumanExpression(character.name, emotion);
    } else {
      return this._generateBeastExpression(character.name, subtype, emotion);
    }
  }

  /**
   * 生成人类微表情
   */
  _generateHumanExpression(name, emotion) {
    const lib = this.humanEmotionLib[emotion] || this.humanEmotionLib['curious'];
    
    const parts = [];
    
    // 微表情层（最多3个细节）
    const eyeDetails = [
      `瞳孔${lib.eye.pupil}`,
      `眼睫${lib.eye.eyelid}`,
      `眼尾${lib.eye.eye_corner}`,
      `视线${lib.eye.gaze}`
    ].filter(Boolean);
    parts.push(`眼: ${eyeDetails.slice(0, 2).join('，')}`);
    
    const faceDetails = [
      `眉头${lib.eyebrow.brow}`,
      `嘴角${lib.mouth_cheek.mouth_corner}`,
      `嘴唇${lib.mouth_cheek.lip}`,
      `脸颊${lib.mouth_cheek.cheek_ear}`
    ].filter(Boolean);
    parts.push(`面: ${faceDetails.slice(0, 2).join('，')}`);
    
    // 肢体动作层（最多3个动作）
    const bodyDetails = [
      `头部${lib.body.head}`,
      `肩背${lib.body.shoulder}`,
      `手部${lib.body.hand}`,
      `身形${lib.body.posture}`
    ].filter(Boolean);
    parts.push(`体: ${bodyDetails.slice(0, 2).join('，')}`);
    
    return `[微表情] ${name}: ${parts.join(' | ')}`;
  }

  /**
   * 生成神兽微表情
   */
  _generateBeastExpression(name, subtype, emotion) {
    const lib = this.beastEmotionLib[emotion] || this.beastEmotionLib['solemn'];
    
    const parts = [];
    
    // 眼部
    const eyeDetails = [
      `兽瞳${lib.eye.pupil}`,
      `眼睑${lib.eye.eyelid}`,
      `视线${lib.eye.gaze}`
    ].filter(Boolean);
    parts.push(`眼: ${eyeDetails.slice(0, 2).join('，')}`);
    
    // 特殊器官
    if (lib.beast_special) {
      const specialDetails = [
        lib.beast_special.horn_glow,
        lib.beast_special.gill,
        lib.beast_special.scale,
        lib.beast_special.tail,
        lib.beast_special.ear
      ].filter(Boolean);
      parts.push(`特: ${specialDetails.slice(0, 2).join('，')}`);
    }
    
    // 肢体
    const bodyDetails = [
      `头部${lib.body.head}`,
      `肩甲${lib.body.shoulder}`,
      `爪姿${lib.body.hand}`
    ].filter(Boolean);
    parts.push(`体: ${bodyDetails.slice(0, 2).join('，')}`);
    
    return `[微表情] ${name}(${subtype}): ${parts.join(' | ')}`;
  }

  /**
   * 批量生成镜头微表情
   * @param {Array} shots - 镜头列表
   * @param {Array} characters - 角色列表
   * @returns {Object} { shotId: [expressions] }
   */
  batchGenerate(shots, characters) {
    const result = {};
    
    for (const shot of shots) {
      const shotExpressions = [];
      const shotChars = shot.characters || [];
      
      for (const charName of shotChars) {
        const char = (Array.isArray(characters) ? characters : Object.values(characters || {})).find(c => c.name === charName);
        if (!char) continue;
        
        const expr = this.generate(shot, {
          name: char.name,
          type: char.type || (char.species === 'human' ? 'human' : 'beast'),
          subtype: char.subtype || '',
          emotion: char.emotion || shot.emotion
        });
        
        shotExpressions.push(expr);
      }
      
      result[shot.id] = shotExpressions;
    }
    
    return result;
  }
}

module.exports = { MicroExpressionEngine };