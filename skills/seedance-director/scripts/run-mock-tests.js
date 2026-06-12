#!/usr/bin/env node
/**
 * Mock 测试脚本 — 5 轮全流程测试（skip-render 模式）
 * 覆盖：action / drama / educational / commercial / documentary
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIRECTOR = path.join(__dirname, 'director.js');
const OUTPUT_BASE = '/tmp/seedance-mock-test';
const NODE = 'node';

// 5 轮测试配置
const testCases = [
  {
    name: 'Round 1: Action 动作片',
    title: '大圣机甲大战',
    type: 'action',
    duration: '180',
    outline: '大圣发现外星机甲入侵花果山，率领猴群奋起反抗，经过三轮激战最终摧毁机甲核心，保卫家园。',
    characters: '大圣:猴形金色生物:火眼金睛+金色毛发+灵巧:燃烧长棒, 银甲机甲:巨型人形机甲:无毛发+冰蓝核心+厚重:能量光束',
  },
  {
    name: 'Round 2: Drama 剧情片',
    title: '雨夜重逢',
    type: 'drama',
    duration: '120',
    outline: '失散多年的兄妹在雨夜的火车站意外重逢，回忆起童年在老家院子里的点点滴滴，最终决定一起回到故乡。',
    characters: '妹妹:年轻女性:短发+风衣+疲惫但坚定的眼神:旧皮箱, 哥哥:中年男性:胡须+旧夹克+沧桑面容:怀表',
  },
  {
    name: 'Round 3: Educational 教育片',
    title: '海姆立克急救法',
    type: 'educational',
    duration: '60',
    outline: '科普演示海姆立克急救法的标准操作流程，从识别窒息症状到施救手势、站位、用力方向，最后验证效果。',
    characters: '施救者:急救员:蓝色急救背心+短发+专注表情:标准环抱手势, 患者:普通人:面色发紫+双手捂喉+弯腰:窒息痛苦表情',
  },
  {
    name: 'Round 4: Commercial 广告片',
    title: '星辰咖啡品牌片',
    type: 'commercial',
    duration: '45',
    outline: '从咖啡豆种植园的日出开始，展示手工采摘、烘焙、研磨到冲泡的全过程，最终呈现一杯完美的手冲咖啡。',
    characters: '咖啡师:专业咖啡师:围裙+专注神情+熟练手法:手冲壶',
  },
  {
    name: 'Round 5: Documentary 纪录片',
    title: '最后的守艺人',
    type: 'documentary',
    duration: '180',
    outline: '记录景德镇最后一位手工青花瓷匠人的日常生活，从选泥、拉坯、施釉到烧制，展现传统工艺的坚守与传承。',
    characters: '老匠人:老年男性:白发+粗糙双手+专注神情:青花瓷笔, 学徒:年轻女性:围裙+好奇眼神+认真学习:笔记本',
  },
];

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${ts}] ${msg}`);
  console.log('='.repeat(60));
}

function runTest(testCase, roundNum) {
  const outputDir = path.join(OUTPUT_BASE, `round-${roundNum}`);
  
  log(`开始 ${testCase.name}`);
  console.log(`  标题: ${testCase.title}`);
  console.log(`  类型: ${testCase.type}`);
  console.log(`  时长: ${testCase.duration}s`);
  console.log(`  输出: ${outputDir}`);
  
  const cmd = [
    NODE, DIRECTOR, 'produce',
    '--title', testCase.title,
    '--outline', testCase.outline,
    '--type', testCase.type,
    '--duration', testCase.duration,
    '--characters', testCase.characters,
    '--skip-render', 'true',
    '--output-dir', outputDir,
    '--notify', 'false',
  ];
  
  console.log(`\n  执行: ${cmd.slice(0, 5).join(' ')} ...`);
  
  try {
    const output = execSync(cmd.join(' '), {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..', '..'),
      timeout: 300000 // 5 分钟
    });
    console.log(output);
    return { success: true, roundNum };
  } catch (e) {
    console.log(`\n  ❌ 第 ${roundNum} 轮失败:`);
    console.log(e.stdout || '');
    console.log(e.stderr || '');
    return { success: false, roundNum, error: e.message };
  }
}

function validateOutput(testCase, roundNum) {
  const outputDir = path.join(OUTPUT_BASE, `round-${roundNum}`);
  const errors = [];
  
  // 检查必要文件
  const requiredFiles = [
    '01-story-plan.json',
    '02-shot-list.md',
    '03-characters',
    '04-prompts',
    '.checkpoint.json',
  ];
  
  for (const f of requiredFiles) {
    const fp = path.join(outputDir, f);
    if (!fs.existsSync(fp)) {
      errors.push(`缺少必要文件/目录: ${f}`);
    }
  }
  
  // 检查 story-plan.json 结构
  const planPath = path.join(outputDir, '01-story-plan.json');
  if (fs.existsSync(planPath)) {
    try {
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
      if (!plan.title) errors.push('story-plan.json 缺少 title');
      if (!plan.totalShots || plan.totalShots < 1) errors.push('story-plan.json totalShots 异常');
      if (!plan.shots || plan.shots.length === 0) errors.push('story-plan.json 缺少 shots');
      if (plan.videoType !== testCase.type) errors.push(`videoType 不匹配: ${plan.videoType} !== ${testCase.type}`);
      
      // 检查每个 shot 的字段
      for (const shot of plan.shots) {
        if (!shot.id) errors.push(`shot 缺少 id`);
        if (!shot.description) errors.push(`${shot.id} 缺少 description`);
      }
    } catch (e) {
      errors.push(`story-plan.json 解析失败: ${e.message}`);
    }
  }
  
  // 检查 checkpoint
  const cpPath = path.join(outputDir, '.checkpoint.json');
  if (fs.existsSync(cpPath)) {
    try {
      const cp = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
      console.log(`  Checkpoint: ${Object.keys(cp.phases).length} 个 Phase 已记录`);
    } catch {
      errors.push('.checkpoint.json 解析失败');
    }
  }
  
  // 检查 prompts
  const promptsDir = path.join(outputDir, '04-prompts');
  if (fs.existsSync(promptsDir)) {
    const promptFiles = fs.readdirSync(promptsDir).filter(f => f.endsWith('.md'));
    console.log(`  Prompts: ${promptFiles.length} 个文件`);
  }
  
  return errors;
}

// ============ 主流程 ============
async function main() {
  log('🧪 Mock 测试开始 — 5 轮全流程（skip-render）');
  console.log(`\n📁 输出基目录: ${OUTPUT_BASE}\n`);
  
  const results = [];
  
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const roundNum = i + 1;
    
    const result = runTest(tc, roundNum);
    results.push({ ...result, testCase: tc.name });
    
    // 验证输出
    const errors = validateOutput(tc, roundNum);
    if (errors.length > 0) {
      console.log(`\n  ⚠️ 第 ${roundNum} 轮验证发现 ${errors.length} 个问题:`);
      for (const err of errors) {
        console.log(`    - ${err}`);
      }
      results[i].errors = errors;
    } else {
      console.log(`\n  ✅ 第 ${roundNum} 轮验证通过`);
    }
    
    // 轮间间隔
    if (i < testCases.length - 1) {
      console.log(`\n  ⏳ 等待 2 秒后进入下一轮...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // 汇总
  log('📊 测试结果汇总');
  const passed = results.filter(r => r.success && !r.errors).length;
  const failed = results.filter(r => !r.success).length;
  const warnings = results.filter(r => r.errors && r.errors.length > 0).length;
  
  console.log(`\n  总计: ${testCases.length} 轮`);
  console.log(`  ✅ 完全通过: ${passed}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  ⚠️ 有告警: ${warnings}`);
  
  for (const r of results) {
    const status = r.success ? (r.errors ? '⚠️' : '✅') : '❌';
    console.log(`  ${status} ${r.testCase} (Round ${r.roundNum})${r.error ? ' — ' + r.error : ''}`);
    if (r.errors) {
      for (const e of r.errors) {
        console.log(`       - ${e}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  if (passed === testCases.length) {
    console.log('🎉 全部通过！');
  } else {
    console.log(`⚠️  ${failed} 轮失败, ${warnings} 轮有告警，需要修复`);
  }
  console.log('='.repeat(60));
}

main().catch(e => {
  console.error('测试脚本异常:', e);
  process.exit(1);
});
