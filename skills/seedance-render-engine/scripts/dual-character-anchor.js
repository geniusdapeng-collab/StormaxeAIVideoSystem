/**
 * 🔗 Dual Character Anchor System v1.2-Peng-fix
 * 系统级模块：确保所有主要角色在Prompt中都有视觉锚点
 * 
 * v1.2-Peng-fix 更新:
 * + 新增 minimal 精简锚点：保留核心视觉特征（40字以内）
 * + 中文Role映射：神兽→beast, 主角→xiaog, 人→default_human
 * + 修复：characterVisualNote被截断后变成generic无效描述
 * 
 * v1.1-Peng 更新:
 * + 新增 format='id-only' 极简模式：当有参考图时只保留名字+极简ID引用
 * + 省出150-200字Prompt空间，用于Dialogue/Scene/Camera/Lighting
 * 
 * 设计哲学：
 * - 双锚点 = 参考图(Reference Image) + 文字锚点(Text Anchor)
 * - 当Reference Image存在时，文本描述是冗余的（Seedance直接从图片读取）
 * - 极简ID模式：name [ref:A1-A8]，省略详细文字描述
 * - 适用于所有含多个角色的镜头
 * 
 * 适用：所有视频生成项目
 */

/**
 * 双锚点配置
 */
const ANCHOR_CONFIG = {
  // 核心外观锚点（必须保留的文字描述）
  coreAnchors: {
    // 刑天
    'beast': {
      required: ['headless', 'torso', 'breast-eyes', 'navel-mouth', 'war-axe', 'shield'],
      text: 'headless titanic torso, two luminous breast-eyes glowing silver, vertical navel-mouth, wielding war-axe and shield',
      minimal: 'headless torso, breast-eyes, navel-mouth, war-axe, shield'  // 🆕 v1.2: 极简锚点，保留API匹配所需的关键特征词
    },
    // 小G
    'xiaog': {
      required: ['8-year-old', 'boy', 'yellow', 'jacket', 'jeans'],
      text: '8-year-old Chinese boy, bright yellow short jacket, dark blue jeans, white sneakers',
      minimal: 'yellow jacket, compass, child'  // 🆕 v1.2: 极简锚点，compass是核心识别特征
    },
    // 默认神兽
    'default_beast': {
      required: ['species', 'features'],
      text: 'mythical beast with distinctive features',
      minimal: 'mythical beast, distinctive features'
    },
    // 默认人类
    'default_human': {
      required: ['age', 'gender', 'clothing'],
      text: 'human character with clear visual identity',
      minimal: 'human character'
    }
  },
  
  // 锚点强度等级
  strength: {
    FULL: 'full',           // 有Reference Image，保留核心文字
    PARTIAL: 'partial',     // 无Reference Image，注入完整文字锚点
    MINIMAL: 'minimal'      // 背景角色，最小锚点
  }
};

/**
 * 为镜头生成角色双锚点
 * @param {Object} shot - 镜头数据
 * @param {Object} plan - 计划数据
 * @param {Array} refs - 参考图路径数组
 * @returns {Object} 角色锚点映射 { charName: { text, refs, strength } }
 */
function generateDualAnchors(shot, plan, refs = []) {
  const chars = shot.characters || [];
  const anchors = {};
  
  for (const charName of chars) {
    const charData = plan?.characters?.find(c => c.name === charName);
    if (!charData) continue;
    
    const charLower = charName.toLowerCase();
    const hasRef = refs.length > 0;
    
    // 确定角色类型和锚点配置
    let anchorConfig = null;
    let strength = hasRef ? ANCHOR_CONFIG.strength.FULL : ANCHOR_CONFIG.strength.PARTIAL;
    
    // 🆕 v1.2-Peng-fix: 中文role映射到英文id，确保"神兽"→"beast"正确匹配
    // 🆕 v6.11-Peng-fix: 扩展映射，包含所有异兽角色类型
    const roleMap = {
      'beast': 'beast', '神兽': 'beast', 'deuteragonist': 'beast', '异兽': 'beast',
      '导师': 'beast', '智慧守护者': 'beast',
      'xiaog': 'xiaog', '小g': 'xiaog', 'protagonist': 'xiaog', '主角': 'xiaog',
      'human': 'default_human', '人': 'default_human'
    };
    const mappedRole = roleMap[charData.role] || roleMap[charData.id] || charData.role;

    // 🆕 v6.11-Peng-fix: 从plan.characters动态提取异兽特征描述，不依赖硬编码'beast'配置
    // 异兽角色判定: role含'神兽/导师/守护者'或id含beast/baize/xingtian等异兽关键词
    const beastKeywords = ['beast', 'baize', 'xingtian', 'chilong', '白泽', '刑天', '烛龙', '麒麟', '饕餮'];
    const isBeastRole = ['神兽', '异兽', '导师', '智慧守护者', 'deuteragonist'].includes(charData.role);
    const isBeastId = beastKeywords.some(k => (charData.id || '').toLowerCase().includes(k.toLowerCase()));
    const isBeast = charData.id === 'beast' || mappedRole === 'beast' || isBeastRole || isBeastId;

    if (isBeast) {
      // 🆕 v6.11-Peng-fix: 动态生成异兽锚点，从charData自动提取，不硬编码刑天特征
      // 生成方式: species + description + signature → 组合描述
      const beastParts = [];
      if (charData.species) beastParts.push(charData.species);
      if (charData.description) beastParts.push(charData.description);
      if (charData.signature) beastParts.push(charData.signature);
      const beastText = beastParts.join(', ').substring(0, 200); // 限制长度
      const beastMinimal = charData.signature
        ? charData.signature.substring(0, 80)
        : (beastText.substring(0, 80));

      // 动态注入到coreAnchors(运行时,不影响硬编码的默认配置)
      if (!ANCHOR_CONFIG.coreAnchors[charData.id]) {
        ANCHOR_CONFIG.coreAnchors[charData.id] = {
          required: ['mythical', 'beast'],
          text: beastText || 'mythical beast with distinctive features',
          minimal: beastMinimal || 'mythical beast'
        };
      }
      anchorConfig = ANCHOR_CONFIG.coreAnchors[charData.id] || ANCHOR_CONFIG.coreAnchors['beast'];
    } else if (charLower.includes('xiaog') || charLower.includes('小g') || mappedRole === 'xiaog') {
    } else if (charLower.includes('xiaog') || charLower.includes('小g') || mappedRole === 'xiaog') {
      anchorConfig = ANCHOR_CONFIG.coreAnchors['xiaog'];
    } else if (charData.role === 'human' || charData.species === 'human' || mappedRole === 'default_human') {
      anchorConfig = ANCHOR_CONFIG.coreAnchors['default_human'];
    } else {
      anchorConfig = ANCHOR_CONFIG.coreAnchors['default_beast'];
    }
    
    // 生成文字锚点
    let textAnchor = '';
    
    if (strength === ANCHOR_CONFIG.strength.FULL) {
      // 有Reference Image：保留核心锚点（防止图失效）
      textAnchor = anchorConfig.text;
    } else {
      // 无Reference Image：完整文字锚点
      const parts = [];
      if (charData.species) parts.push(charData.species);
      parts.push(anchorConfig.text);
      if (charData.features && charData.features.length > 0) {
        parts.push(charData.features.join(','));
      }
      if (charData.signature) parts.push(charData.signature);
      textAnchor = parts.join(', ');
    }
    
    // 检测角色是否已在前文出现过（已建立视觉记忆）
    const isPreviouslySeen = shot._previouslySeenChars?.includes(charName) || false;
    
    // 如果已出现过且是配角，降级为MINIMAL
    if (isPreviouslySeen && charData.role !== 'protagonist' && charData.role !== 'beast') {
      strength = ANCHOR_CONFIG.strength.MINIMAL;
      textAnchor = charData.name || charName;
    }
    
    anchors[charName] = {
      text: textAnchor,
      refs: hasRef ? refs : [],
      strength,
      config: anchorConfig
    };
  }
  
  return anchors;
}

/**
 * 将双锚点合并为Prompt字符串
 * @param {Object} anchors - generateDualAnchors的输出
 * @param {Object} options - 配置
 * @returns {string} 合并后的角色描述字符串
 */
function mergeAnchorsToPrompt(anchors, options = {}) {
  const { maxLength = 200, includeRefNote = true, format = 'full' } = options;
  
  const parts = [];
  let charIndex = 0; // A, B, C...
  
  for (const [charName, anchor] of Object.entries(anchors)) {
    let desc = '';
    
    // 🆕 v1.1-Peng: 极简锚点模式 - 保留核心视觉特征+参考图引用
    // 关键：API靠视觉理解匹配定妆照，只写名字无法匹配，必须保留关键特征
    if (format === 'id-only') {
      if (anchor.refs && anchor.refs.length > 0) {
        // 从完整路径提取实际文件名（去掉路径和扩展名），确保Prompt中的引用与上传文件名完全一致
        const ids = anchor.refs.map(ref => {
          const parts = ref.split(/[\\\\/]/);
          const filename = parts[parts.length - 1];
          const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
          
          // 策略1：去掉角色名前缀（如"刑天-正面全身" → "正面全身"）
          let cleanName = nameWithoutExt;
          if (nameWithoutExt.startsWith(charName)) {
            cleanName = nameWithoutExt.substring(charName.length).replace(/^[-_]/, '');
          }
          
          // 策略2：按分隔符分割，取最后一段（通常是中文描述部分）
          // "01-front-fullbody-正面全身" → "正面全身"
          // "刑天-45度半身" → "45度半身"（数字+中文混合保留）
          const segments = cleanName.split(/[-_]/);
          const lastSegment = segments[segments.length - 1];
          // 最后一段如果包含中文，用它作为引用标识
          if (/[\u4e00-\u9fa5]/.test(lastSegment)) {
            cleanName = lastSegment;
          }
          
          // 策略3：如果清理后为空，返回原始文件名
          return cleanName || filename;
        }).join(',');
        
        // 🆕 v1.2-Peng: 使用极简锚点(minimal)，保留API匹配所需的关键特征词
        // 优先使用预定义的minimal版本，fallback到text截断
        const coreAnchor = anchor.config?.minimal || anchor.text || '';
        // minimal已精确定义关键特征词，无需额外截断
        const truncatedAnchor = coreAnchor;
        
        if (truncatedAnchor) {
          desc = `${charName}: ${truncatedAnchor} [ref:${ids}]`;
        } else {
          desc = `${charName} [ref:${ids}]`;
        }
      } else {
        // 🆕 v1.2-Peng: 没有参考图时，使用极简锚点(minimal)确保API能匹配
        const coreAnchor = anchor.config?.minimal || anchor.text || '';
        const truncatedAnchor = coreAnchor;
        desc = truncatedAnchor ? `${charName}: ${truncatedAnchor}` : charName;
      }
    } else if (anchor.strength === ANCHOR_CONFIG.strength.MINIMAL) {
      // 最小锚点：只保留名字
      desc = charName;
    } else if (anchor.strength === ANCHOR_CONFIG.strength.FULL) {
      // 完整锚点：名字 + 核心特征 + 参考图声明
      desc = `${charName}(${anchor.text})`;
      if (includeRefNote && anchor.refs.length > 0) {
        desc += ` [ref:${anchor.refs.length}img]`;
      }
    } else {
      // 部分锚点：名字 + 完整描述
      desc = `${charName}: ${anchor.text}`;
    }
    
    parts.push(desc);
    charIndex++;
  }
  
  let result = parts.join('; ');
  if (result.length > maxLength) {
    // 截断时优先保留主角
    result = parts.slice(0, 2).join('; ');
  }
  
  return result;
}

/**
 * 验证角色锚点完整性
 * @param {string} prompt - 生成的Prompt
 * @param {Array} expectedChars - 期望包含的角色列表
 * @param {Object} plan - 计划数据
 * @returns {Object} 验证结果
 */
function validateCharacterAnchors(prompt, expectedChars, plan) {
  const missing = [];
  const partial = [];
  const complete = [];
  
  for (const charName of expectedChars) {
    const charData = plan?.characters?.find(c => c.name === charName);
    if (!charData) continue;
    
    const charLower = charName.toLowerCase();
    
    // 检查Prompt中是否包含角色名
    const hasName = prompt.toLowerCase().includes(charLower);
    
    // 检查是否包含核心特征
    let hasCoreFeatures = false;
    
    if (charData.id === 'beast' || charData.role === 'beast') {
      hasCoreFeatures = /headless|breast-eye|navel-mouth|war-axe|shield/.test(prompt);
    } else if (charLower.includes('xiaog') || charLower.includes('小g')) {
      hasCoreFeatures = /8-year|yellow jacket|boy/.test(prompt);
    } else {
      hasCoreFeatures = prompt.toLowerCase().includes(charLower);
    }
    
    if (!hasName && !hasCoreFeatures) {
      missing.push(charName);
    } else if (hasName && !hasCoreFeatures) {
      partial.push(charName);
    } else {
      complete.push(charName);
    }
  }
  
  return {
    complete,
    partial,
    missing,
    isValid: missing.length === 0,
    coverage: `${complete.length}/${expectedChars.length}完整, ${partial.length}部分, ${missing.length}缺失`
  };
}

/**
 * 为镜头标记已出现的角色（用于后续镜头锚点降级）
 * @param {Array} shots - 所有镜头
 * @returns {Array} 带_previouslySeenChars标记的镜头
 */
function markPreviouslySeenCharacters(shots) {
  const seen = new Set();
  
  for (const shot of shots) {
    shot._previouslySeenChars = Array.from(seen);
    
    const chars = shot.characters || [];
    for (const char of chars) {
      seen.add(char);
    }
  }
  
  return shots;
}

module.exports = {
  generateDualAnchors,
  mergeAnchorsToPrompt,
  validateCharacterAnchors,
  markPreviouslySeenCharacters,
  ANCHOR_CONFIG
};