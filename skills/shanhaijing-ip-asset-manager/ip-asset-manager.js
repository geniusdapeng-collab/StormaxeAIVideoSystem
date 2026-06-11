#!/usr/bin/env node
/**
 * Nirath原创世界观IP资产管理系统 — Shanhaijing IP Asset Manager
 *
 * 7类资产目录 + 三级IP体系 + 跨集一致性追踪
 * 从内容生产到IP工业标准的升级
 *
 * 融合策略：新增模块，系列化资产管理基础设施
 */

// ============ 资产分类定义 ============
const ASSET_CATEGORIES = {
  character: { name: '角色资产', description: '异兽定妆照、骨骼绑定、表情库' },
  location: { name: '场景资产', description: 'Nirath原创世界观地理场景、环境贴图、天空盒' },
  artifact: { name: '神器资产', description: '法宝模型、特效模板、交互逻辑' },
  style: { name: '风格资产', description: 'LUT预设、风格DNA、材质球' },
  narrative: { name: '叙事资产', description: '剧本模板、弧线规划、母题库' },
  sound: { name: '声音资产', description: '声纹档案、环境音、配乐主题' },
  prop: { name: '道具资产', description: '武器、装饰、生活用品模型' }
};

// ============ 【故事内核融入】小G标志性物品资产定义 ============
const XG_SIGNATURE_PROPS = {
  notebook: {
    id: 'xg_notebook',
    name: '炭笔笔记本',
    description: '小G的"记忆方舟"——挂在脖子上的牛皮纸笔记本，用炭笔和彩色石头记录',
    appearance: {
      cover: '牛皮纸封面，边缘磨损',
      pages: '泛黄内页，炭笔线条，逐渐工整的字迹',
      binding: '麻绳穿孔绑定',
      accessories: '挂在脖子上的皮绳'
    },
    evolution: {
      s1: { content: '涂鸦为主——线条简单，颜色鲜艳，充满恐惧与好奇', handwriting: '稚嫩不规则' },
      s2: { content: '图画+文字——出现简单句子，开始有"命名"记录', handwriting: '开始工整' },
      s3: { content: '系统记录——表格、分类、地图，文字多于图画', handwriting: '清晰可辨' },
      s4: { content: '成熟书写——完整段落，反思性文字，诗意表达', handwriting: '优美流畅' }
    },
    emotionalWeight: '笔记本是小G的存在证明——只要还在写，就还没有被世界遗忘',
    ipTier: 'primary',
    category: 'prop'
  },
  halfPhoto: {
    id: 'xg_half_photo',
    name: '半张照片',
    description: '小G最珍贵的物品——家庭合影被撕裂或烧毁一半，只剩孩子和部分背景',
    appearance: {
      condition: '撕裂边缘或焦黑痕迹',
      visiblePart: '小G的脸和部分幼儿园背景',
      hiddenPart: '父母的脸被撕掉或烧毁',
      texture: '照片纸泛黄，表面有磨损'
    },
    evolution: {
      s1: { state: '经常拿出来看，试图回忆父母的脸', emotional: 'nostalgia + 困惑' },
      s2: { state: '发现照片开始褪色，更加珍惜', emotional: '悲伤 + 恐惧' },
      s3: { state: '接受照片只是记忆的一部分', emotional: '平静 + 怀念' },
      s4: { state: '将照片贴在笔记本扉页，作为写作动力', emotional: '力量 + 传承' }
    },
    emotionalWeight: '照片是旧世界的最后证据——不是记忆，是"证明"',
    ipTier: 'primary',
    category: 'prop'
  },
  charcoalPen: {
    id: 'xg_charcoal_pen',
    name: '炭笔',
    description: '小G用来写字的工具——从废墟中找到的炭笔，后来得到雪白智兽羽毛笔',
    appearance: {
      material: '木炭或烧焦的木头',
      length: '逐渐变短',
      usage: '握笔处发黑'
    },
    evolution: {
      early: '纯木炭——容易断，颜色淡',
      middle: '得到雪白智兽羽毛笔——升级书写工具',
      late: '羽毛笔成为主要工具，炭笔作为备用'
    },
    ipTier: 'secondary',
    category: 'prop'
  },
  dijiangFeather: {
    id: 'xg_dijiang_feather',
    name: '光囊母兽羽毛信物',
    description: '光囊母兽自然脱落的一片赤金色"羽毛"（实则为光芒凝结物）',
    appearance: {
      color: '赤金色',
      texture: '如光凝结，轻盈无重量',
      glow: '微弱温暖光芒',
      shape: '不规则流线型，如火焰凝固'
    },
    significance: '光囊母兽牺牲后留下的唯一实体——系在小G手腕上',
    emotionalWeight: '温暖的悲伤——失去与陪伴的共存',
    ipTier: 'primary',
    category: 'artifact'
  },
  xuanguiStone: {
    id: 'xg_xuangui_stone',
    name: '冰甲龟兽石',
    description: '冰甲龟兽背甲上脱落的一片小石片——地图的碎片',
    appearance: {
      color: '青黑色',
      texture: '光滑如打磨过',
      pattern: '微缩地图纹路',
      glow: '浸泡水中时微光闪烁'
    },
    significance: '小G的"导航器"——迷路时看石片纹路',
    emotionalWeight: '方向与陪伴——即使冰甲龟兽不在，地图仍在',
    ipTier: 'secondary',
    category: 'artifact'
  },
  baizeFeatherPen: {
    id: 'xg_baize_feather_pen',
    name: '雪白智兽羽毛笔',
    description: '雪白智兽自然脱落的羽毛制成——知识与传承的象征',
    appearance: {
      shaft: '白色羽毛杆',
      tip: '自然分叉，可蘸墨/光脉能量',
      glow: '书写时微光闪烁',
      texture: '柔软如云雾'
    },
    significance: '雪白智兽的遗产——"我会用它写下所有故事"',
    firstAppearance: 'S2雪白智兽首次见面后',
    ipTier: 'primary',
    category: 'artifact'
  }
};

// ============ 【故事内核融入】世界观核心IP资产 ============
const WORLD_IP_ASSETS = {
  sanctuaries: {
    buzhoushan: { name: '浮空晶簇山脉', type: '圣所', ipTier: 'primary', significance: '世界中心，时间静止' },
    guixu: { name: '虹脉深渊', type: '圣所', ipTier: 'primary', significance: '世界边缘，时间尽头' },
    kunlunxu: { name: '浮空晶簇山虚', type: '圣所', ipTier: 'secondary', significance: '众神居所，光脉能量最浓郁' },
    penglai: { name: '蓬莱', type: '圣所', ipTier: 'secondary', significance: '海上仙岛，超脱时间' },
    lingmuyuan: { name: '灵木原', type: '圣所', ipTier: 'tertiary', significance: '生命起源，植物记忆' }
  },
  passages: {
    natural: { name: '自然通道', type: '通道', ipTier: 'secondary' },
    xuanguiWaterway: { name: '冰甲龟兽水道', type: '通道', ipTier: 'primary', guardian: '冰甲龟兽' },
    baizeGate: { name: '雪白智兽知识之门', type: '通道', ipTier: 'primary', guardian: '雪白智兽' },
    taisuMoment: { name: '太素时刻', type: '通道', ipTier: 'primary', description: '时间停止的瞬间穿越' }
  },
  ruins: {
    cityRemains: { name: '城市遗迹', type: '旧世界', ipTier: 'tertiary' },
    techDebris: { name: '科技残骸', type: '旧世界', ipTier: 'secondary' },
    memoryNodes: { name: '记忆节点', type: '旧世界', ipTier: 'primary' }
  },
  phenomena: {
    taisuGlow: { name: '太素光晕', type: '特殊现象', ipTier: 'primary' },
    auraNexus: { name: '光脉能量交汇', type: '特殊现象', ipTier: 'secondary' },
    timeFold: { name: '时间褶皱', type: '特殊现象', ipTier: 'primary' }
  }
};

// ============ 【故事内核融入】异兽IP资产标注 ============
const BEAST_IP_TIERS = {
  primary: ['dijiang', 'baize', 'jiuweihu', 'xuangui', 'zhulong'], // 核心叙事异兽
  secondary: ['kunpeng', 'yinglong', 'fenghuang', 'taotie', 'qiongqi'], // 重要功能异兽
  tertiary: ['zheng', 'gudiao', 'jiaoren', 'yingzhao', 'kui', 'guanguan', 'qilin'] // 世界构建异兽
};

// ============ 一致性规则 ============
const CONSISTENCY_RULES = {
  character: {
    mustMatch: ['appearance.signatureFeature', 'colorPalette.primary', 'soulThreeLayers.instinct.coreDrive'],
    mustEvolve: ['personality.evolution', 'relationships'],
    forbiddenChange: ['appearance.species', 'category']
  },
  location: {
    mustMatch: ['element', 'geography.type', 'atmosphere'],
    mustEvolve: ['seasonalVariation', 'timeOfDay'],
    forbiddenChange: ['name', 'ruler']
  }
};

// ============ IP资产核心类 ============
class IPAssetManager {
  constructor() {
    this.assets = new Map();
    this.categoryRules = CONSISTENCY_RULES;
    this.versionHistory = new Map();
  }

  /**
   * 注册资产
   */
  registerAsset(category, assetId, data, options = {}) {
    const key = `${category}:${assetId}`;
    
    // 如果资产已存在，追加episodes而不是覆盖
    const existing = this.assets.get(key);
    if (existing) {
      const newEpisodes = options.episodes || [];
      newEpisodes.forEach(ep => {
        if (!existing.episodes.includes(ep)) {
          existing.episodes.push(ep);
        }
      });
      existing.updatedAt = Date.now();
      return existing;
    }
    
    const asset = {
      id: assetId,
      category,
      data,
      version: options.version || '1.0',
      ipTier: options.ipTier || 'tertiary',
      episodes: options.episodes || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: options.metadata || {}
    };

    this.assets.set(key, asset);
    this.versionHistory.set(key, [asset.version]);

    return asset;
  }

  /**
   * 获取资产
   */
  getAsset(category, assetId) {
    const key = `${category}:${assetId}`;
    return this.assets.get(key);
  }

  /**
   * 更新资产（带版本控制）
   */
  updateAsset(category, assetId, changes, episodeId = null) {
    const key = `${category}:${assetId}`;
    const asset = this.assets.get(key);

    if (!asset) {
      throw new Error(`[IPAssetManager] 资产不存在: ${key}`);
    }

    // 一致性检查
    const violations = this.checkConsistencyViolations(category, asset.data, changes);
    if (violations.critical.length > 0) {
      throw new Error(`[IPAssetManager] 关键一致性违规: ${violations.critical.join(', ')}`);
    }
    asset.data = { ...asset.data, ...changes };
    asset.version = this.incrementVersion(asset.version);
    asset.updatedAt = Date.now();

    if (episodeId && !asset.episodes.includes(episodeId)) {
      asset.episodes.push(episodeId);
    }

    // 记录版本
    this.versionHistory.get(key).push(asset.version);

    return {
      asset,
      warnings: violations.warning,
      version: asset.version
    };
  }

  /**
   * 检查一致性违规
   */
  checkConsistencyViolations(category, original, changes) {
    const rules = this.categoryRules[category];
    if (!rules) return { critical: [], warning: [] };

    const critical = [];
    const warning = [];

    // 检查 mustMatch（不可变更）
    rules.mustMatch?.forEach(field => {
      if (this.hasFieldChanged(original, changes, field)) {
        critical.push(`mustMatch违规: ${field}`);
      }
    });

    // 检查 forbiddenChange（禁止变更）
    rules.forbiddenChange?.forEach(field => {
      if (changes[field] !== undefined && changes[field] !== original[field]) {
        critical.push(`forbiddenChange违规: ${field}`);
      }
    });

    return { critical, warning };
  }

  hasFieldChanged(original, changes, fieldPath) {
    const parts = fieldPath.split('.');
    let originalValue = original;
    let changesValue = changes;

    for (const part of parts) {
      originalValue = originalValue?.[part];
      changesValue = changesValue?.[part];
    }

    return changesValue !== undefined && JSON.stringify(originalValue) !== JSON.stringify(changesValue);
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[parts.length - 1] = parseInt(parts[parts.length - 1]) + 1;
    return parts.join('.');
  }

  /**
   * 获取跨集复用统计
   */
  getCrossEpisodeReuseStats() {
    const stats = {};

    this.assets.forEach((asset, key) => {
      stats[key] = {
        episodes: asset.episodes.length,
        versionCount: this.versionHistory.get(key)?.length || 1,
        ipTier: asset.ipTier,
        reuseRate: asset.episodes.length / (this.getMaxEpisodeCount() || 1)
      };
    });

    return stats;
  }

  getMaxEpisodeCount() {
    let max = 0;
    this.assets.forEach(asset => {
      max = Math.max(max, ...asset.episodes);
    });
    return max;
  }

  /**
   * 导出资产报告
   */
  generateAssetReport() {
    const categories = {};

    this.assets.forEach(asset => {
      if (!categories[asset.category]) {
        categories[asset.category] = {
          count: 0,
          assets: []
        };
      }
      categories[asset.category].count++;
      categories[asset.category].assets.push({
        id: asset.id,
        version: asset.version,
        ipTier: asset.ipTier,
        episodes: asset.episodes.length
      });
    });

    return {
      totalAssets: this.assets.size,
      categories,
      reuseStats: this.getCrossEpisodeReuseStats(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * 【故事内核融入】获取小G标志性物品
   */
  getXGSignatureProp(propId) {
    return XG_SIGNATURE_PROPS[propId] || null;
  }

  /**
   * 【故事内核融入】获取所有小G标志性物品
   */
  getAllXGSignatureProps() {
    return XG_SIGNATURE_PROPS;
  }

  /**
   * 【故事内核融入】获取世界观核心IP资产
   */
  getWorldIPAsset(category, assetId) {
    const cat = WORLD_IP_ASSETS[category];
    return cat ? cat[assetId] : null;
  }

  /**
   * 【故事内核融入】获取所有世界观IP资产
   */
  getAllWorldIPAssets() {
    return WORLD_IP_ASSETS;
  }

  /**
   * 【故事内核融入】获取异兽IP层级
   */
  getBeastIPTier(beastId) {
    if (BEAST_IP_TIERS.primary.includes(beastId)) return 'primary';
    if (BEAST_IP_TIERS.secondary.includes(beastId)) return 'secondary';
    if (BEAST_IP_TIERS.tertiary.includes(beastId)) return 'tertiary';
    return null;
  }

  /**
   * 【故事内核融入】获取某一层级的所有异兽
   */
  getBeastsByTier(tier) {
    return BEAST_IP_TIERS[tier] || [];
  }

  /**
   * 【故事内核融入】注册小G标志性物品为资产
   */
  registerXGProps() {
    const props = [];
    Object.values(XG_SIGNATURE_PROPS).forEach(prop => {
      const asset = this.registerAsset('prop', prop.id, prop, {
        version: '1.0',
        ipTier: prop.ipTier,
        metadata: { owner: '小G', storyKernel: true }
      });
      props.push(asset);
    });
    return props;
  }

  /**
   * 【故事内核融入】注册世界观IP资产
   */
  registerWorldIPAssets() {
    const assets = [];
    Object.entries(WORLD_IP_ASSETS).forEach(([category, items]) => {
      Object.entries(items).forEach(([id, data]) => {
        const asset = this.registerAsset(category, id, data, {
          version: '1.0',
          ipTier: data.ipTier || 'tertiary',
          metadata: { storyKernel: true, category }
        });
        assets.push(asset);
      });
    });
    return assets;
  }
}

// ============ 导出 ============
module.exports = {
  IPAssetManager,
  ASSET_CATEGORIES,
  CONSISTENCY_RULES,
  XG_SIGNATURE_PROPS,
  WORLD_IP_ASSETS,
  BEAST_IP_TIERS
};

// CLI 测试
if (require.main === module) {
  const manager = new IPAssetManager();

  console.log('\n💎 Nirath原创世界观IP资产管理系统测试\n');

  // 注册守光巨兽角色资产
  const zhulongAsset = manager.registerAsset(
    'character',
    'zhulong',
    {
      appearance: {
        signatureFeature: '竖瞳金睛',
        colorPalette: { primary: '#DC143C' }
      },
      soulThreeLayers: {
        instinct: { coreDrive: '领地守护' }
      },
      category: 'natural_god'
    },
    {
      ipTier: 'primary',
      episodes: [1],
      version: '1.0'
    }
  );

  console.log('注册资产:', zhulongAsset.id, '等级:', zhulongAsset.ipTier);

  // 尝试更新（合法更新）
  const update1 = manager.updateAsset(
    'character',
    'zhulong',
    { personality: { evolution: '从守护到理解' } },
    2
  );
  console.log('合法更新成功，新版本:', update1.version);

  // 尝试违规更新
  try {
    manager.updateAsset(
      'character',
      'zhulong',
      { appearance: { signatureFeature: '蓝色眼睛' } }
    );
  } catch (e) {
    console.log('违规更新被阻止:', e.message);
  }

  // 生成报告
  const report = manager.generateAssetReport();
  console.log('\n资产报告:', JSON.stringify(report, null, 2));
}