/**
 * Camera Style Constraint v1.0-Peng
 * 运镜风格约束系统 — 缩减风格数量，统一认知模型
 * 
 * 核心原则：每个镜头 ≤3种风格，全片 ≤3个风格族
 * 
 * 风格族定义：
 * 1. Steadicam族（基础运动）：跟踪、跟随、平滑移动
 * 2. Drone/FPV族（震撼运动）：航拍、俯冲、环绕、高速
 * 3. Static族（情绪定格）：静止、定格、缓慢推拉
 * 
 * 导演指令：每次风格切换都是重新学习，需要统一认知模型
 */

const STYLE_FAMILIES = {
  drone: {
    name: 'Drone/FPV震撼',
    keywords: ['drone', 'fpv', 'aerial', 'crane', 'jib', 'orbit', 'circling', 'sweeping', 'descending', 'dive', '俯冲', '环绕', '航拍', 'freefall', 'plunge', 'stomach-dropping', 'nose-dive'],
    maxPerShot: 2,
    priority: 2
  },
  static: {
    name: 'Static情绪',
    keywords: ['static', 'fixed', 'still', 'hold', 'freeze', '定格', '缓慢', 'slow', 'push', 'pull', 'zoom', 'close-up', '特写', 'extreme close', 'reveals', 'reveal'],
    maxPerShot: 2,
    priority: 3
  },
  steadicam: {
    name: 'Steadicam基础',
    keywords: ['steadicam', 'tracking', 'follow', 'smooth', 'glide', 'floating', 'dolly', 'slider', 'seamless', 'breakneck', 'rushing', 'motion blur', 'ground-level'],
    maxPerShot: 2,
    priority: 1
  }
};

// 风格词总库（用于检测）
const ALL_STYLE_KEYWORDS = [
  ...STYLE_FAMILIES.steadicam.keywords,
  ...STYLE_FAMILIES.drone.keywords,
  ...STYLE_FAMILIES.static.keywords
];

/**
 * 检测camera描述中的风格词
 */
function detectStyleKeywords(cameraDescription) {
  const text = (cameraDescription || '').toLowerCase();
  const found = [];
  
  for (const keyword of ALL_STYLE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      // 确定属于哪个族
      for (const [familyName, family] of Object.entries(STYLE_FAMILIES)) {
        if (family.keywords.includes(keyword)) {
          found.push({ keyword, family: familyName });
          break;
        }
      }
    }
  }
  
  return found;
}

/**
 * 检查风格是否超标
 */
function checkStyleConstraint(cameraDescription) {
  const found = detectStyleKeywords(cameraDescription);
  
  // 按族分组
  const byFamily = {};
  for (const item of found) {
    if (!byFamily[item.family]) byFamily[item.family] = [];
    byFamily[item.family].push(item.keyword);
  }
  
  const familyCount = Object.keys(byFamily).length;
  const totalKeywords = found.length;
  
  return {
    totalKeywords,
    familyCount,
    byFamily,
    isValid: familyCount <= 3 && totalKeywords <= 3,
    issues: []
  };
}

/**
 * 精简camera描述至3种风格以内
 * 策略：保留主要动作，移除次要风格词
 */
function constrainCameraStyle(cameraDescription, shotType = '') {
  const result = checkStyleConstraint(cameraDescription);
  
  if (result.isValid) {
    return cameraDescription; // 无需修改
  }
  
  let constrained = cameraDescription;
  
  // 如果风格词超过3个，移除次要风格词
  if (result.totalKeywords > 3) {
    const allFound = detectStyleKeywords(cameraDescription);
    
    // 按族优先级排序（保留高优先级族的风格词）
    allFound.sort((a, b) => {
      const priorityA = STYLE_FAMILIES[a.family].priority;
      const priorityB = STYLE_FAMILIES[b.family].priority;
      return priorityA - priorityB;
    });
    
    // 保留前3个风格词，移除其余
    const keep = allFound.slice(0, 3);
    const remove = allFound.slice(3);
    
    for (const item of remove) {
      // 从camera描述中移除该风格词（简单替换为空）
      const regex = new RegExp(item.keyword, 'gi');
      constrained = constrained.replace(regex, '');
    }
    
    // 清理多余空格和逗号
    constrained = constrained.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').trim();
  }
  
  return constrained;
}

/**
 * 为全片分配风格族
 * 确保风格族数量 ≤3，相邻镜头优先同族
 */
function assignStyleFamilies(shots) {
  const assignments = [];
  
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    const detected = detectStyleKeywords(shot.camera || '');
    
    // 确定主要风格族
    let primaryFamily = 'static';
    if (detected.length > 0) {
      primaryFamily = detected[0].family;
    }
    
    // 如果与前一个镜头风格族不同，考虑是否统一
    if (i > 0 && assignments[i-1].family !== primaryFamily) {
      const prevFamily = assignments[i-1].family;
      // 如果当前镜头风格族与前后都不一致，统一为相邻族
      if (i < shots.length - 1) {
        const nextDetected = detectStyleKeywords(shots[i+1].camera || '');
        const nextFamily = nextDetected.length > 0 ? nextDetected[0].family : 'static';
        if (nextFamily !== primaryFamily && prevFamily !== primaryFamily) {
          // 当前镜头是孤立风格，统一为前一个风格
          primaryFamily = prevFamily;
        }
      }
    }
    
    assignments.push({
      id: shot.id,
      family: primaryFamily,
      familyName: STYLE_FAMILIES[primaryFamily].name,
      detectedKeywords: detected.map(d => d.keyword)
    });
  }
  
  return assignments;
}

module.exports = {
  STYLE_FAMILIES,
  detectStyleKeywords,
  checkStyleConstraint,
  constrainCameraStyle,
  assignStyleFamilies
};