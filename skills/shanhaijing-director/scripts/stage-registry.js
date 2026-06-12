/**
 * stage-registry.js
 * Stage Registry - 统一管理所有 Stage 及其依赖关系
 * v6.21-Peng Phase 6 (完整12 Stage)
 */
const { stage1_PRDGeneration }         = require('./stage1-prd');
const { stage2_RequirementAlignment }  = require('./stage2-alignment');
const { stage3_SchemaValidation }      = require('./stage3-schema');
const { stage4_StoryboardCheck,
        stage5_CharacterPromptBuild,
        stage6_ComplianceCheck,
        stage7_DurationAllocation,
        stage7_5_DialogueAnnotation }   = require('./pipeline-story-support');
const { stage8_Cinematography }        = require('./stage8-cinematography');
const { stage8_RhythmIntensification } = require('./stage8-rhythm');
const { stage8_PromptPreGeneration }   = require('./stage8-pregeneration');
const { stage9_DirectorOptimize }      = require('./stage9-director-optimize');
const { stage10_ScriptwriterOptimize } = require('./stage10-scriptwriter-optimize');
const { stage11_QualityCheck,
        stage12_Render,
        stage12_PostProduction }       = require('./pipeline-render-support');

/**
 * 完整12 Stage 注册表
 */
const STAGE_REGISTRY = [
  { id: 'stage1-prd',           name: 'PRD生成',       fn: (p, u) => stage1_PRDGeneration(p, u),           deps: [] },
  { id: 'stage2-alignment',     name: '需求对齐',       fn: p => stage2_RequirementAlignment(p),            deps: ['stage1-prd'] },
  { id: 'stage3-schema',         name: 'Schema校验',     fn: p => stage3_SchemaValidation(p),                deps: ['stage2-alignment'] },
  { id: 'stage4-storyboard',    name: '故事板审片',     fn: p => stage4_StoryboardCheck(p),                 deps: ['stage3-schema'] },
  { id: 'stage5-characters',    name: '角色定妆照',     fn: p => stage5_CharacterPromptBuild(p),            deps: ['stage4-storyboard'] },
  { id: 'stage6-compliance',    name: '合规检查',        fn: p => stage6_ComplianceCheck(p),                 deps: ['stage5-characters'] },
  { id: 'stage7-duration',      name: '时长分配',        fn: p => stage7_DurationAllocation(p),              deps: ['stage6-compliance'] },
  { id: 'stage8-cinematography',name: '运镜控制',       fn: p => stage8_Cinematography(p),                  deps: ['stage7-duration'] },
  { id: 'stage8-rhythm',        name: '节奏强化',        fn: p => stage8_RhythmIntensification(p),           deps: ['stage8-cinematography'] },
  { id: 'stage8-pregeneration', name: 'Prompt预生成',   fn: p => stage8_PromptPreGeneration(p),             deps: ['stage8-rhythm'] },
  { id: 'stage9-director',      name: '导演优化',        fn: p => stage9_DirectorOptimize(p),                deps: ['stage8-pregeneration'] },
  { id: 'stage10-scriptwriter', name: '编剧优化',        fn: p => stage10_ScriptwriterOptimize(p),           deps: ['stage9-director'] }
];

function getStage(id) { return STAGE_REGISTRY.find(s => s.id === id); }
function printRegistry() {
  console.log('\n📋 Stage Registry (12 Stage):');
  for (const s of STAGE_REGISTRY) {
    console.log(`  ${s.id.padEnd(26)} | ${s.name.padEnd(12)} | deps:[${s.deps.join(', ')}]`);
  }
}

module.exports = { STAGE_REGISTRY, getStage, printRegistry };
