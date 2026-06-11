/**
 * Transition Coherence Checker v1.1-Peng
 * 转场连贯性检查器 — 系统级修复镜头衔接割裂问题
 * 
 * 核心原则：不为单个case定制，建立通用转场连贯性检查机制
 * 
 * 检测维度：
 * 1. 景别跳跃 — 相邻镜头景别差异不应超过2级
 * 2. 运动跳跃 — 相邻镜头运动方式差异不应超过2级
 * 3. 视角跳跃 — 相邻镜头视角差异（POV切换需过渡）
 * 
 * 自动修复：
 * - 当检测到跳跃过大时，在当前镜头的Prompt中注入过渡运镜指令
 * - 或在camera描述中追加过渡措辞
 */

const SCALE_LEVELS = [
  // 等级1: 微距/特写
  { level: 1, keywords: ['微距', '特写', 'closeup', 'close-up', 'macro', 'detail', 'extreme close'] },
  // 等级2: 近景
  { level: 2, keywords: ['近景', 'medium close', 'shoulder', 'face shot', 'worm\'s-eye', 'worm\'s eye'] },
  // 等级3: 中景
  { level: 3, keywords: ['中景', 'medium', 'waist', 'medium shot', 'half body'] },
  // 等级4: 全景/全身
  { level: 4, keywords: ['全景', 'full', 'full body', 'wide', 'establishing', '全身'] },
  // 等级5: 大全景/生态级/远景/FPV
  { level: 5, keywords: ['远景', '大全景', 'epic', 'aerial', 'fpv', '俯冲', '生态级', 'vista', 'grand'] }
];

const MOTION_LEVELS = [
  // 等级1: 静止/定格
  { level: 1, keywords: ['定格', '静止', 'fixed', 'static', 'still', 'hold', 'freeze'] },
  // 等级2: 缓慢移动/推进/拉远
  { level: 2, keywords: ['缓慢', '推进', '拉远', 'slow', 'push in', 'pull out', 'zoom', '微距'] },
  // 等级3: 跟随/移动/斯坦尼康
  { level: 3, keywords: ['跟随', '移动', 'tracking', 'follow', 'steadicam', '斯坦尼康', 'slider', 'dolly'] },
  // 等级4: 环绕/航拍/升降
  { level: 4, keywords: ['环绕', '航拍', 'orbit', 'crane', 'jib', '升', '降', 'drone', '360-degree'] },
  // 等级5: 高速俯冲/甩镜/FPV
  { level: 5, keywords: ['俯冲', '高速', 'fpv', 'dive', 'whip', '甩镜', 'rapid', 'fast', 'breakneck', 'nose-dive', 'plunge'] },
];

const TRANSITION_INJECTORS = {
  // 景别跳跃过大时的过渡注入
  scale: {
    '1→3': '从特写缓慢拉远至中景，过渡自然',
    '1→4': '从微距特写逐步拉远至全景，镜头持续后退展现全貌',
    '1→5': '从微距特写缓慢拉远过渡，经中景、全景逐步扩展至大全景',
    '2→4': '从近景平稳拉远至全景，保持主体在画面中心',
    '2→5': '从近景经中景过渡，逐步扩展至大全景',
    '3→5': '从中景平稳上摇并后退，逐步展现大全景',
    '4→1': '从全景缓慢推进至特写，聚焦细节',
    '5→1': '从大全景逐步推进，经全景、中景过渡至特写',
    '5→2': '从大全景逐步推近至近景，过渡平滑'
  },
  // 运动跳跃过大时的过渡注入
  motion: {
    '1→3': '从静止开始缓慢移动，逐步加速至跟随速度',
    '1→4': '从静止缓缓启动，逐渐加速至环绕速度',
    '1→5': '从静止缓慢启动，经跟随、环绕逐步加速至俯冲',
    '2→4': '从缓慢移动逐渐加速，平滑过渡至环绕',
    '2→5': '从缓慢推进逐步加速，经跟随、环绕过渡至高速俯冲',
    '3→5': '从跟随速度逐步加速，经环绕过渡至高速俯冲',
    '4→1': '环绕速度逐渐减缓，减速后定格',
    '5→1': '高速运动逐渐减速，经环绕、跟随缓慢过渡至静止定格',
    '5→2': '高速俯冲逐渐减速，缓慢过渡至微距推进',
    '4→2': '环绕逐渐减速，缓慢过渡至微距推进'
  }
};

/**
 * 检测camera描述中的景别等级
 * v1.2-Peng-fix: 取最高级别(最极端的景别)，而非第一个匹配
 */
function detectScaleLevel(cameraDescription) {
  const cameraDescStr = typeof cameraDescription === 'string' ? cameraDescription : ((cameraDescription?.move || '') + ' ' + (cameraDescription?.scale || ''));
  const text = (cameraDescStr || '').toLowerCase();
  let maxLevel = 0;
  for (const scale of SCALE_LEVELS) {
    for (const keyword of scale.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        if (scale.level > maxLevel) {
          maxLevel = scale.level;
        }
      }
    }
  }
  return maxLevel > 0 ? maxLevel : 3; // 默认中景
}

/**
 * 检测camera描述中的运动等级
 * v1.2-Peng-fix: 取最高级别(最激烈的运动)，而非第一个匹配
 */
function detectMotionLevel(cameraDescription) {
  const cameraDescStr = typeof cameraDescription === 'string' ? cameraDescription : ((cameraDescription?.move || '') + ' ' + (cameraDescription?.scale || ''));
  const text = (cameraDescStr || '').toLowerCase();
  let maxLevel = 0;
  for (const motion of MOTION_LEVELS) {
    for (const keyword of motion.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        if (motion.level > maxLevel) {
          maxLevel = motion.level;
        }
      }
    }
  }
  return maxLevel > 0 ? maxLevel : 2; // 默认缓慢移动
}

/**
 * 检查相邻镜头的转场连贯性
 * @param {Array} shots - 镜头列表
 * @returns {Array} 问题报告
 */
function checkTransitionCoherence(shots) {
  const issues = [];
  
  for (let i = 1; i < shots.length; i++) {
    const prevShot = shots[i - 1];
    const currShot = shots[i];
    
    const prevScale = detectScaleLevel(prevShot.camera);
    const currScale = detectScaleLevel(currShot.camera);
    const scaleDiff = Math.abs(currScale - prevScale);
    
    const prevMotion = detectMotionLevel(prevShot.camera);
    const currMotion = detectMotionLevel(currShot.camera);
    const motionDiff = Math.abs(currMotion - prevMotion);
    
    // v1.1-Peng-fix: 景别方向性修复 — 使用实际方向(prev→curr)，不再丢失方向信息
    const scaleKey = `${prevScale}→${currScale}`;
    const motionKey = `${Math.min(prevMotion, currMotion)}→${Math.max(prevMotion, currMotion)}`;
    
    // 景别跳跃超过2级 = 问题
    if (scaleDiff > 2) {
      issues.push({
        type: 'scale_jump',
        severity: scaleDiff > 3 ? 'critical' : 'warning',
        from: prevShot.id,
        to: currShot.id,
        fromScale: prevScale,
        toScale: currScale,
        diff: scaleDiff,
        suggestion: TRANSITION_INJECTORS.scale[scaleKey] || `景别跳跃${scaleDiff}级，建议增加过渡运镜`,
        fromCamera: prevShot.camera,
        toCamera: currShot.camera
      });
    }
    
    // 运动跳跃超过2级 = 问题
    if (motionDiff > 2) {
      issues.push({
        type: 'motion_jump',
        severity: motionDiff > 3 ? 'critical' : 'warning',
        from: prevShot.id,
        to: currShot.id,
        fromMotion: prevMotion,
        toMotion: currMotion,
        diff: motionDiff,
        suggestion: TRANSITION_INJECTORS.motion[motionKey] || `运动跳跃${motionDiff}级，建议增加过渡运镜`,
        fromCamera: prevShot.camera,
        toCamera: currShot.camera
      });
    }
  }
  
  return issues;
}

/**
 * 为镜头注入过渡运镜指令
 * @param {Object} shot - 当前镜头
 * @param {Object} prevShot - 前一镜头
 * @returns {string} 注入后的camera描述
 */
function injectTransitionCamera(shot, prevShot) {
  const prevScale = detectScaleLevel(prevShot.camera);
  const currScale = detectScaleLevel(shot.camera);
  const scaleDiff = Math.abs(currScale - prevScale);
  
  const prevMotion = detectMotionLevel(prevShot.camera);
  const currMotion = detectMotionLevel(shot.camera);
  const motionDiff = Math.abs(currMotion - prevMotion);
  
  let injection = '';
  
  if (scaleDiff > 2) {
    // v1.1-Peng-fix: 景别方向性修复 — 使用实际方向(prev→curr)，不再丢失方向信息
    const scaleKey = `${prevScale}→${currScale}`;
    const reverseScaleKey = `${currScale}→${prevScale}`;
    const scaleTransition = TRANSITION_INJECTORS.scale[scaleKey] || TRANSITION_INJECTORS.scale[reverseScaleKey];
    if (scaleTransition) {
      injection += `【转场过渡】${scaleTransition}。`;
    }
  }
  
  if (motionDiff > 2) {
    // 使用实际运动方向（前一镜头→当前镜头），而不是排序后的方向
    const motionKey = `${prevMotion}→${currMotion}`;
    const reverseKey = `${currMotion}→${prevMotion}`;
    const motionTransition = TRANSITION_INJECTORS.motion[motionKey] || TRANSITION_INJECTORS.motion[reverseKey];
    if (motionTransition) {
      injection += `【运动过渡】${motionTransition}。`;
    }
  }
  
  if (injection) {
    return `${shot.camera} ${injection}`;
  }
  
  return shot.camera;
}

/**
 * 批量修复转场问题
 * @param {Array} shots - 镜头列表
 * @returns {Object} {fixedShots, issues, fixCount}
 */
function fixTransitionIssues(shots) {
  const issues = checkTransitionCoherence(shots);
  const fixedShots = shots.map((shot, index) => {
    if (index === 0) return { ...shot };
    
    const prevShot = shots[index - 1];
    const newCamera = injectTransitionCamera(shot, prevShot);
    
    if (newCamera !== shot.camera) {
      return { ...shot, camera: newCamera, _transitionFixed: true };
    }
    
    return { ...shot };
  });
  
  const fixCount = fixedShots.filter(s => s._transitionFixed).length;
  
  return { fixedShots, issues, fixCount };
}

module.exports = {
  checkTransitionCoherence,
  injectTransitionCamera,
  fixTransitionIssues,
  detectScaleLevel,
  detectMotionLevel,
  SCALE_LEVELS,
  MOTION_LEVELS
};