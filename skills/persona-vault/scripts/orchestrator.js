#!/usr/bin/env node
/**
 * PersonaVault — 角色灵魂铸造系统 Orchestrator v1.0.0
 * 
 * 6 Agent 协同：Wound Miner → Gravity Weaver → Empathy Engine → Evolution Tracker → Mirror Engine → Guardian
 * 
 * 用法:
 *   node orchestrator.js forge --name "孙悟空" --desc "..." --role protagonist --episodes 80 --project "西游记重构"
 *   node orchestrator.js state --project "西游记重构" --character C01
 *   node orchestrator.js guard --episode E25 --project "西游记重构"
 */

const fs = require('fs');
const path = require('path');
const stateBus = require('./utils/state-bus');

const AGENTS_DIR = path.join(__dirname, 'agents');
const OUTPUT_DIR = path.join(__dirname, '..', 'outputs');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function log(section, msg, level = 'info') {
  const ts = new Date().toISOString().slice(11, 19);
  const icon = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️', phase: '🔮', progress: '⏳' }[level] || 'ℹ️';
  console.log(`${icon} [${ts}] [${section}] ${msg}`);
}
function loadAgent(name) {
  const p = path.join(AGENTS_DIR, `${name}.js`);
  return fs.existsSync(p) ? require(p) : null;
}
function parseArgs() {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const raw = process.argv[i];
    if (!raw.startsWith('--')) { if (!args.command) args.command = raw; continue; }
    const key = raw.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = process.argv[i + 1];
    if (val && !val.startsWith('--')) { args[key] = val; i++; } else { args[key] = true; }
  }
  return args;
}
function getStatePath(project) {
  ensureDir(OUTPUT_DIR);
  const name = (project || 'persona').replace(/[^\w\u4e00-\u9fa5-]/g, '_');
  return path.join(OUTPUT_DIR, `${name}-state.json`);
}

// ====== 命令：完整铸造 ======
async function cmdForge(args) {
  const statePath = getStatePath(args.project);
  const charId = args.id || 'C01';
  const name = args.name || '未知角色';
  const episodes = parseInt(args.episodes) || 80;

  log('PersonaVault', `🔮 开始铸造: ${name} (${charId})`, 'phase');

  // 初始化状态
  let state = stateBus.loadState(statePath);
  if (!state.characters[charId]) {
    state.characters[charId] = { id: charId, name, role: args.role || 'protagonist', oneLiner: args.desc || '', worldContext: args.world || '', themeAnchor: args.theme || '' };
    stateBus.saveState(statePath, state);
  }

  // Agent 1: Wound Miner
  const woundMiner = loadAgent('wound-miner');
  const wound = woundMiner ? woundMiner.run({ characterId: charId, characterName: name, oneLiner: args.desc || '', role: args.role || 'protagonist', worldContext: args.world || '', themeAnchor: args.theme || '' }, statePath) : null;
  log('WoundMiner', `✅ 伤口挖掘完成: ${wound?.wound?.surface?.event?.slice(0, 40) || wound?.surface?.event?.slice(0, 40) || '内置伤口已加载'}...`, 'success');

  // Agent 2: Gravity Weaver
  const gravityWeaver = loadAgent('gravity-weaver');
  if (gravityWeaver) {
    const others = Object.values(state.characters).filter(c => c.id !== charId);
    if (others.length > 0) {
      const gravity = gravityWeaver.run({ sourceCharacter: state.characters[charId], woundProfile: wound?.wound, otherCharacters: others }, statePath);
      log('GravityWeaver', `✅ 引力场完成: ${Object.keys(gravity.gravityMap).length} 个关系`, 'success');
    }
  }

  // Agent 3: Empathy Engine（反派）
  if (args.role === 'antagonist' || args.role === 'tragic-hero') {
    const empathy = loadAgent('empathy-engine');
    if (empathy) {
      const result = empathy.run({ characterId: charId, characterName: name, woundProfile: wound?.wound, role: args.role }, statePath);
      log('EmpathyEngine', `✅ 共情矩阵: 同情${result.empathyMatrix.sympathyScore}/反感${result.empathyMatrix.repulsionScore}`, 'success');
    }
  }

  // Agent 4: Evolution Tracker
  const evolution = loadAgent('evolution-tracker');
  if (evolution) {
    const result = evolution.run({ characterId: charId, characterName: name, woundProfile: wound?.wound, totalEpisodes: episodes }, statePath);
    log('EvolutionTracker', `✅ 成长弧线: ${result.evolutionTrack.keyTurningPoints?.length || 0} 个转折点`, 'success');
  }

  // Agent 5: Mirror Engine（多角色）
  const allChars = Object.values(state.characters);
  if (allChars.length >= 2) {
    const mirror = loadAgent('mirror-engine');
    if (mirror) {
      const personaStates = {};
      for (const c of allChars) personaStates[c.id] = stateBus.getCharacterPersona(state, c.id);
      const result = mirror.run({ characters: allChars, personaStates }, statePath);
      log('MirrorEngine', `✅ 镜像关系: ${result.mirrors.length} 对`, 'success');
    }
  }

  // Agent 6: Guardian
  const guardian = loadAgent('guardian');
  if (guardian) {
    const report = guardian.run({ episode: 'E01', characterIds: [charId], state: stateBus.loadState(statePath) }, statePath);
    log('Guardian', `✅ 一致性校验: ${report.overallScore}分`, report.status === 'PASS' ? 'success' : 'warn');
  }

  // 最终报告
  state = stateBus.loadState(statePath);
  log('PersonaVault', `🎉 ${name} 灵魂铸造完成！`, 'success');
  log('PersonaVault', `  伤口档案: ✅`, 'info');
  log('PersonaVault', `  引力场: ${state.gravity[charId] ? '✅' : '⏳'}`, 'info');
  log('PersonaVault', `  共情矩阵: ${state.empathy[charId] ? '✅' : '⏳ (非反派)'}`, 'info');
  log('PersonaVault', `  成长弧线: ${state.evolution[charId] ? '✅' : '⏳'}`, 'info');
  log('PersonaVault', `  镜像关系: ${state.mirrors?.length || 0} 对`, 'info');
  log('PersonaVault', `  状态总线: ${statePath}`, 'info');

  return state;
}

// ====== 命令：查看状态 ======
async function cmdState(args) {
  const statePath = getStatePath(args.project);
  const state = stateBus.loadState(statePath);
  log('PersonaVault', `📊 状态总线: ${state.project}`, 'phase');
  log('PersonaVault', `  角色: ${Object.keys(state.characters).length}`, 'info');
  log('PersonaVault', `  伤口: ${Object.keys(state.wounds).length}`, 'info');
  log('PersonaVault', `  引力: ${Object.keys(state.gravity).length}`, 'info');
  log('PersonaVault', `  共情: ${Object.keys(state.empathy).length}`, 'info');
  log('PersonaVault', `  成长: ${Object.keys(state.evolution).length}`, 'info');
  log('PersonaVault', `  镜像: ${state.mirrors?.length || 0} 对`, 'info');
  if (args.character) {
    const persona = stateBus.getCharacterPersona(state, args.character);
    console.log(JSON.stringify(persona, null, 2));
  }
  return state;
}

// ====== 命令：一致性校验 ======
async function cmdGuard(args) {
  const statePath = getStatePath(args.project);
  const episode = args.episode || 'E01';
  log('PersonaVault', `🛡️ 一致性校验: ${episode}`, 'phase');
  const guardian = loadAgent('guardian');
  const state = stateBus.loadState(statePath);
  const report = guardian.run({ episode, characterIds: Object.keys(state.characters), state }, statePath);
  log('Guardian', `✅ 校验完成: ${report.overallScore}分`, report.status === 'PASS' ? 'success' : 'warn');
  for (const c of report.checks) console.log(`  ${c.status === 'PASS' ? '✅' : '❌'} ${c.characterId} ${c.checkType}: ${c.note}`);
  return report;
}

// ====== 主入口 ======
async function main() {
  const args = parseArgs();
  ensureDir(OUTPUT_DIR);
  switch (args.command) {
    case 'forge': await cmdForge(args); break;
    case 'state': await cmdState(args); break;
    case 'guard': await cmdGuard(args); break;
    default:
      console.log(`\nPersonaVault v1.0.0 — 角色灵魂铸造系统\n\n用法:\n  node orchestrator.js forge --name "xxx" --desc "..." --role protagonist --episodes 80\n  node orchestrator.js state --project "xxx" [--character C01]\n  node orchestrator.js guard --episode E25 --project "xxx"\n`);
  }
}

main().catch(e => { console.error(`❌ ${e.message}`); process.exit(1); });
