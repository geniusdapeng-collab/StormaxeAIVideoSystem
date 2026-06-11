#!/usr/bin/env python3
"""
Phase 8: LLM 配置数据分离迁移脚本
将所有硬编码的 temperature/maxTokens 替换为 getLLMConfig(stage) 调用

Usage: python3 phase8-llm-config-migrate.py [--dry-run]
"""

import re
import os
import sys

DRY_RUN = '--dry-run' in sys.argv

SCRIPTS_DIR = '/home/gem/workspace/agent/skills/shanhaijing-director/scripts'

# ============================================================================
# 迁移规则：每个文件的替换映射
# ============================================================================

# director-pipeline.js — 3个 llmOptions 内联调用 → 改为 pipeline.getLLMConfig(stage)
DIRECTOR_PIPELINE_REPLACEMENTS = [
    # Stage 7.5 对白生成 (line ~1582)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('dialogue-generation')"
    ),
    # Stage 6 合规检查 (line ~1354)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('compliance-check')"
    ),
    # Stage 7 时长分配 (line ~128)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('duration-allocation')"
    ),
    # Stage 4 故事板审片 (line ~565)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('storyboard-review')"
    ),
    # _autoFixPRD helper (line ~930)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('storyplan-repair')"
    ),
    # Stage 9 导演优化 (line ~4195)
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "llmOptions: pipeline.getLLMConfig('director-optimize')"
    ),
]

# pipeline-story-support.js — 5个 llmOptions → 改为 getLLMConfig
STORY_SUPPORT_REPLACEMENTS = [
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "pipeline.getLLMConfig('duration-allocation')"
    ),
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "pipeline.getLLMConfig('storyboard-review')"
    ),
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "pipeline.getLLMConfig('storyplan-repair')"
    ),
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "pipeline.getLLMConfig('compliance-check')"
    ),
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "pipeline.getLLMConfig('dialogue-generation')"
    ),
]

# llm-reasoning-layer.js — MODEL 常量 + 硬编码 temperature/maxTokens
LLM_REASONING_REPLACEMENTS = [
    # MODEL 常量 → 使用 getLLMConfig
    (
        r"const MODEL = '[^']+';",
        "const { getLLMConfig } = require('./config-center');\nconst MODEL = getLLMConfig('default').model;"
    ),
    # llmOptions 内联 → 改为 getLLMConfig
    (
        r'temperature:\s*options\.temperature\s*\?\?\s*[\d.]+,\s*\n\s*max_tokens:\s*options\.maxTokens\s*\|\|\s*options\.max_tokens\s*\|\|\s*[\d,]+',
        "const cfg = getLLMConfig(options.stage || 'default');\n      temperature: options.temperature ?? cfg.temperature,\n      max_tokens: options.maxTokens || options.max_tokens || cfg.maxTokens"
    ),
]

# Stage 模块文件 — llmOptions 内联 → 改为 getLLMConfig(pipeline)
STAGE_MODULE_REPLACEMENTS = [
    (
        r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}',
        "getLLMConfig(pipeline, '{STAGE}')"
    ),
]

def process_file(filepath, replacements, description):
    """处理单个文件"""
    if not os.path.exists(filepath):
        print(f"  ⚠️  文件不存在: {filepath}")
        return False

    with open(filepath, 'r') as f:
        content = f.read()
    original = content

    count = 0
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, content)
        if new_content != content:
            count += 1
            content = new_content

    if count > 0:
        if not DRY_RUN:
            with open(filepath, 'w') as f:
                f.write(content)
        print(f"  {'[DRY]'} {description}: {count} 处已替换")
    else:
        print(f"  — {description}: 无需替换（可能已迁移或格式不匹配）")

    return count > 0


def main():
    print("=" * 60)
    print("Phase 8: LLM 配置数据分离迁移")
    print(f"{'[DRY RUN]' if DRY_RUN else '[LIVE RUN]'}")
    print("=" * 60)

    # 1. director-pipeline.js — 添加 getLLMConfig 引用
    print("\n[1] director-pipeline.js")
    pipeline_path = os.path.join(SCRIPTS_DIR, 'director-pipeline.js')
    with open(pipeline_path, 'r') as f:
        content = f.read()

    # 检查是否已有 require('./config-center')
    if "require('./config-center')" not in content:
        # 在文件顶部添加 require
        insert_point = content.find("// ============================================================================\n// Stage 1")
        if insert_point == -1:
            insert_point = content.find("// ============================================================================\n// LLM")
        if insert_point == -1:
            insert_point = content.find("// =====")
        if insert_point > 0:
            if not DRY_RUN:
                content = content[:insert_point] + \
                    "const { getLLMConfig } = require('./config-center');\n\n" + \
                    content[insert_point:]
            print("  + 添加 require('./config-center')")
        else:
            print("  ⚠️  未找到插入点，跳过 require 添加")

    # 替换 llmOptions 内联为 getLLMConfig 调用
    count = 0
    # Stage 7.5 对白生成
    old = r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}'
    # Stage 7.5 对白生成
    new_content = re.sub(old, "llmOptions: getLLMConfig('dialogue-generation')", content)
    count += len(re.findall(old, content))
    content = new_content

    # Stage 6 合规检查
    new_content = re.sub(old, "llmOptions: getLLMConfig('compliance-check')", content)
    count += len(re.findall(old, content))
    content = new_content

    # Stage 7 时长分配
    new_content = re.sub(old, "llmOptions: getLLMConfig('duration-allocation')", content)
    count += len(re.findall(old, content))
    content = new_content

    # Stage 4 故事板审片
    new_content = re.sub(old, "llmOptions: getLLMConfig('storyboard-review')", content)
    count += len(re.findall(old, content))
    content = new_content

    # _autoFixPRD
    new_content = re.sub(old, "llmOptions: getLLMConfig('storyplan-repair')", content)
    count += len(re.findall(old, content))
    content = new_content

    # Stage 9 导演优化
    new_content = re.sub(old, "llmOptions: getLLMConfig('director-optimize')", content)
    count += len(re.findall(old, content))
    content = new_content

    if count > 0:
        print(f"  {'[DRY]'} 替换了 {count} 处 llmOptions 内联")
        if not DRY_RUN:
            with open(pipeline_path, 'w') as f:
                f.write(content)
    else:
        print("  — llmOptions: 无需替换（可能已迁移）")

    # 2. pipeline-story-support.js
    print("\n[2] pipeline-story-support.js")
    support_path = os.path.join(SCRIPTS_DIR, 'pipeline-story-support.js')
    with open(support_path, 'r') as f:
        content = f.read()

    if "require('./config-center')" not in content:
        insert_point = content.find("const path = require('path');")
        if insert_point > 0:
            insert_point = content.find('\n', insert_point) + 1
            if not DRY_RUN:
                content = content[:insert_point] + "const { getLLMConfig } = require('./config-center');\n" + content[insert_point:]
            print("  + 添加 require('./config-center')")

    replacements = [
        (r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}', "getLLMConfig('duration-allocation')"),
    ]
    count = 0
    for old, new in replacements:
        new_content = re.sub(old, new, content)
        if new_content != content:
            count += 1
            content = new_content

    if count > 0:
        print(f"  {'[DRY]'} 替换了 {count} 处 llmOptions")
        if not DRY_RUN:
            with open(support_path, 'w') as f:
                f.write(content)
    else:
        print("  — 无需替换")

    # 3. llm-reasoning-layer.js — MODEL 常量 + inline defaults
    print("\n[3] llm-reasoning-layer.js")
    llm_layer_path = os.path.join(SCRIPTS_DIR, 'llm-reasoning-layer.js')
    with open(llm_layer_path, 'r') as f:
        content = f.read()

    # MODEL 常量
    old_model = r"const MODEL = '[^']+';"
    new_model = "const { getLLMConfig: _cfg } = require('./config-center');\nconst MODEL = 'deepseek-chat';  // 兼容旧接口"
    if re.search(old_model, content):
        content = re.sub(old_model, new_model, content)
        print("  + MODEL 常量保持（向后兼容），添加 config-center require")

    # temperature/maxTokens inline defaults
    old_inline = r"temperature:\s*options\.temperature\s*\?\?\s*[\d.]+,\s*\n\s*max_tokens:\s*options\.maxTokens\s*\|\|\s*options\.max_tokens\s*\|\|\s*[\d,]+"
    new_inline = "const _c = _cfg(options.stage || 'default');\n      temperature: options.temperature ?? _c.temperature,\n      max_tokens: options.maxTokens || options.max_tokens || _c.maxTokens"
    new_content = re.sub(old_inline, new_inline, content)
    if new_content != content:
        print("  + 替换 temperature/maxTokens inline defaults")
        content = new_content
    else:
        print("  — temperature/maxTokens: 无需替换")

    if not DRY_RUN:
        with open(llm_layer_path, 'w') as f:
            f.write(content)

    # 4. llm-caller.js — 默认值
    print("\n[4] llm-caller.js")
    caller_path = os.path.join(SCRIPTS_DIR, 'llm-caller.js')
    with open(caller_path, 'r') as f:
        content = f.read()

    if "require('./config-center')" not in content:
        insert_point = content.find("const fs = require('fs');")
        if insert_point > 0:
            insert_point = content.find('\n', insert_point) + 1
            if not DRY_RUN:
                content = content[:insert_point] + "const { getLLMConfig: _cc } = require('./config-center');\n" + content[insert_point:]
            print("  + 添加 require('./config-center')")

    old = r"temperature:\s*options\.temperature\s*\|\|\s*[\d.]+"
    new = "temperature: options.temperature ?? _cc('default').temperature"
    new_content = re.sub(old, new, content)
    if new_content != content:
        print("  + 替换 temperature 默认值")
        content = new_content
    else:
        print("  — temperature: 无需替换")

    old2 = r"const maxTokens = options\.maxTokens\s*\|\|\s*this\.options\.maxTokens;"
    new2 = "const maxTokens = options.maxTokens ?? _cc('default').maxTokens;"
    new_content = re.sub(old2, new2, content)
    if new_content != content:
        print("  + 替换 maxTokens 默认值")
        content = new_content
    else:
        print("  — maxTokens: 无需替换")

    if not DRY_RUN:
        with open(caller_path, 'w') as f:
            f.write(content)

    # 5. Stage 模块文件 — stage2/3/8/9/10
    print("\n[5] Stage 模块文件")
    stage_files = [
        ('stage2-alignment.js', 'requirement-alignment'),
        ('stage3-schema.js', 'schema-generation'),
        ('stage8-cinematography.js', 'cinematography'),
        ('stage9-director-optimize.js', 'director-optimize'),
        ('stage10-scriptwriter-optimize.js', 'scriptwriter'),
        ('stage1-prd.js', 'prd-generation'),
    ]

    for filename, stage in stage_files:
        filepath = os.path.join(SCRIPTS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  ⚠️  {filename}: 文件不存在，跳过")
            continue

        with open(filepath, 'r') as f:
            content = f.read()

        old = r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}'
        new = f"getLLMConfig(pipeline, '{stage}')"
        new_content = re.sub(old, new, content)

        if new_content != content:
            # 添加 require if missing
            if "require('./config-center')" not in new_content:
                insert = "const { getLLMConfig } = require('./config-center');\n"
                if "const path" in new_content:
                    new_content = re.sub(r"(const path = require\([^)]+\);)", r"\1\n" + insert, new_content)
                elif "const fs" in new_content:
                    new_content = re.sub(r"(const fs = require\([^)]+\);)", r"\1\n" + insert, new_content)

            print(f"  {'[DRY]'} {filename}: 替换 llmOptions → getLLMConfig('{stage}')")
            if not DRY_RUN:
                with open(filepath, 'w') as f:
                    f.write(new_content)
        else:
            print(f"  — {filename}: 无需替换（可能已迁移）")

    # 6. 其他 Agent 文件
    print("\n[6] Agent 文件")
    agent_files = [
        ('storyplan-repair-agent.js', 'storyplan-repair'),
        ('director-optimize-agent.js', 'director-optimize'),
        ('scriptwriter-optimizer.js', 'scriptwriter'),
        ('serial-promptforge-v6.12.js', 'prompt-pregeneration'),
        ('prompt-length-optimizer.js', 'default'),
    ]

    for filename, stage in agent_files:
        filepath = os.path.join(SCRIPTS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  ⚠️  {filename}: 文件不存在，跳过")
            continue

        with open(filepath, 'r') as f:
            content = f.read()

        old = r'llmOptions:\s*\{\s*temperature:\s*[\d.]+,\s*maxTokens:\s*[\d,]+\s*\}'
        new = f"getLLMConfig(pipeline, '{stage}')"
        new_content = re.sub(old, new, content)

        if new_content != content:
            if "require('./config-center')" not in new_content:
                insert = "const { getLLMConfig } = require('./config-center');\n"
                if "const path" in new_content:
                    new_content = re.sub(r"(const path = require\([^)]+\);)", r"\1\n" + insert, new_content)
                elif "const fs" in new_content:
                    new_content = re.sub(r"(const fs = require\([^)]+\);)", r"\1\n" + insert, new_content)
                elif "const {" in new_content:
                    insert_at = new_content.find("const {")
                    newline_after = new_content.find("\n", insert_at)
                    new_content = new_content[:newline_after+1] + insert + new_content[newline_after+1:]

            print(f"  {'[DRY]'} {filename}: 替换 llmOptions → getLLMConfig('{stage}')")
            if not DRY_RUN:
                with open(filepath, 'w') as f:
                    f.write(new_content)
        else:
            print(f"  — {filename}: 无需替换（可能已迁移或只有1处）")

    print("\n" + "=" * 60)
    print(f"迁移{'模拟' if DRY_RUN else '完成'}")
    print("=" * 60)
    if DRY_RUN:
        print("\n⚠️  [DRY RUN] — 未实际写入文件")
        print("   确认无误后，重新运行不带 --dry-run 参数执行实际迁移")


if __name__ == '__main__':
    main()
