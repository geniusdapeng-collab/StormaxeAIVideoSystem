/**
 * Beast Perspective Injector v1.0-Peng
 * 神兽视角注入器 — 将第三人称镜头描述转换为神兽第一人称感知描述
 * 
 * 核心设计：不改上游引擎，在Pipeline中动态注入视角转换
 * 符合P0级优化原则：机制级改进，通用可复用
 */

const BEAST_PERSPECTIVE_TEMPLATES = {
  // 起幕：沉睡中微醒
  '起': {
    cameraPrefix: '从神兽感知中，画面带微妙能量波动，像沉睡火山微呼吸',
    subjectTransform: (subject, desc) => {
      return desc.replace(/([\u4e00-\u9fa5]{2,8})(?:穿越|走进|踏入|来到)/, '渺小生命$2，触动神兽沉睡感知')
                 .replace(/发现/, '让神兽感应到')
                 .replace(/好奇/, '神兽好奇');
    },
    emotionLayer: '画面暗淡，微光闪烁，记忆边缘模糊光斑'
  },
  
  // 承幕：试探与困惑
  '承': {
    cameraPrefix: '从神兽感知中，画面呈双重视角——现实与远古记忆叠加',
    subjectTransform: (subject, desc) => {
      return desc.replace(/([\u4e00-\u9fa5]{2,8})(?:逃跑|摔倒|爬起)/, '生命$2，让神兽想起远古记忆')
                 .replace(/恐惧/, '神兽感受的困惑与试探')
                 .replace(/震惊/, '神兽深处的震动');
    },
    emotionLayer: '明暗交替，能量试探性脉动，像心跳加速'
  },
  
  // 转幕：触动与震动
  '转': {
    cameraPrefix: '神兽感知中，画面不再"看"而是"感受"——能量共振',
    subjectTransform: (subject, desc) => {
      return desc.replace(/([\u4e00-\u9fa5]{2,8})(?:睁眼|对视|理解)/, '生命觉醒触发神兽深处共振')
                 .replace(/发现/, '神兽被看见的震颤')
                 .replace(/神秘/, '神兽记忆中涌出的神秘');
    },
    emotionLayer: '能量波动如涟漪扩散，岩石微颤，光芒脉动'
  },
  
  // 高潮：能量传递
  '高潮': {
    cameraPrefix: '神兽感知中，画面充满能量交换——神兽不再孤独',
    subjectTransform: (subject, desc) => {
      return desc.replace(/([\u4e00-\u9fa5]{2,8})(?:走向|流泪|感悟)/, '生命与神兽同频共振')
                 .replace(/敬畏/, '神兽被理解的敬畏')
                 .replace(/感动/, '神兽传递的感动');
    },
    emotionLayer: '光芒从接触点爆发，能量洪流，温暖震撼'
  },
  
  // 合幕：释然与消散
  '合': {
    cameraPrefix: '从神兽感知中，画面呈"消散"质感——不是死亡，是完成',
    subjectTransform: (subject, desc) => {
      return desc.replace(/([\u4e00-\u9fa5]{2,8})(?:化为光点|握住|记住)/, '生命接住神兽火种')
                 .replace(/消散/, '神兽如归潮退去')
                 .replace(/传承/, '神兽终有去处');
    },
    emotionLayer: '能量如退潮退去，但中心有光，余烬最后一丝温暖'
  }
};

/**
 * 注入神兽视角到镜头描述
 * @param {Object} shot 镜头对象
 * @param {string} act 幕位
 * @param {Array} characters 角色列表
 * @returns {Object} 注入后的镜头对象
 */
function injectBeastPerspective(shot, act, characters) {
  const template = BEAST_PERSPECTIVE_TEMPLATES[act];
  if (!template) return shot;
  
  // 1. 获取主角和神兽
  const beast = characters.find(c => c.role === 'beast' || c.role === 'antagonist')?.name;
  const protagonist = characters[0]?.name || '小G';
  
  // 2. 转换描述
  let newDesc = shot.description || '';
  
  // 应用视角转换模板
  if (template.subjectTransform) {
    newDesc = template.subjectTransform(protagonist, newDesc);
  }
  
  // 3. 注入视角质感到camera字段
  let newCamera = shot.camera || '';
  if (template.cameraPrefix && !newCamera.includes('战魂')) {
    newCamera = template.cameraPrefix + '，' + newCamera;
  }
  
  // 4. 注入情感层
  if (template.emotionLayer && !newDesc.includes('能量')) {
    newDesc = newDesc + '，' + template.emotionLayer;
  }
  
  return {
    ...shot,
    description: newDesc,
    camera: newCamera,
    // 标记已注入视角
    _perspectiveInjected: true,
    _perspectiveMode: 'beast-first-person'
  };
}

/**
 * 注入视角到所有镜头
 * @param {Array} shots 镜头数组
 * @param {string} perspectiveMode 视角模式
 * @param {Array} characters 角色列表
 * @returns {Array} 注入后的镜头数组
 */
function injectPerspectiveToShots(shots, perspectiveMode, characters) {
  if (perspectiveMode !== 'beast-first-person') {
    return shots; // 非神兽视角不做转换
  }
  
  return shots.map(shot => {
    const act = shot.act || '起';
    return injectBeastPerspective(shot, act, characters);
  });
}

/**
 * 注入视角到Prompt
 * @param {string} prompt 原始Prompt
 * @param {string} act 幕位
 * @returns {string} 注入视角后的Prompt
 */
function injectPerspectiveToPrompt(prompt, act) {
  const template = BEAST_PERSPECTIVE_TEMPLATES[act];
  if (!template || !template.cameraPrefix) return prompt;
  
  // 在cinematic shot之前注入视角描述
  const perspectiveLine = `视角质感：${template.cameraPrefix}，`;
  
  if (prompt.includes('cinematic shot:')) {
    return prompt.replace('cinematic shot:', perspectiveLine + 'cinematic shot:');
  }
  
  return prompt;
}

module.exports = {
  injectBeastPerspective,
  injectPerspectiveToShots,
  injectPerspectiveToPrompt,
  BEAST_PERSPECTIVE_TEMPLATES
};