#!/usr/bin/env node
/**
 * 九尾狐8张定妆照生成脚本
 * 基于Seedream API (doubao-seedream-5-0-260128)
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const API_BASE = 'https://ark.cn-beijing.volces.com';
const API_PATH = '/api/v3/images/generations';
const MODEL_ID = 'doubao-seedream-5-0-260128';
const API_KEY = 'ark-0e6994f7-bf34-4f3a-9e78-0fc02aa5fc92-42751';

const OUTPUT_DIR = '/root/.openclaw/workspace/skills/shanhaijing-beast-archive/production/jiuweihu/characters';

// 九尾狐核心外观描述
const BASE_DESC = '纯白九尾狐，身长丈余，体型优雅灵动，全身覆盖月光般雪白毛发浓密柔滑如上等丝绸，每根毛发拥有独立高光与阴影，随呼吸与微风起伏闪烁温润珍珠光泽。九条修长蓬松尾巴从臀部优雅散开如华丽羽扇，每条尾巴拥有独立骨骼系统可各自独立飘动。深邃琥珀色双眼瞳孔在黑暗中发出宝石般微光明亮如星辰。面部轮廓精致秀美如古典美人，嘴角微微上扬带着神秘笑意。皮克斯级别毛发动力学，每根毛发都呈现真实物理飘动';

const STYLE = 'CG超写实数字人风格，UnrealEngine5渲染，工业光魔级VFX，纯黑背景，极致细节，电影级光照';

const SHOTS = [
  {
    id: '08-special-ability',
    name: '特殊能力展示',
    prompt: `${BASE_DESC}，九尾圣光爆发姿态，九条尾巴同时散发柔和神圣白光，每根毛发都发光如月光凝聚，琥珀色双眼射出金色光芒，全身被神圣光晕笼罩，白色光尘粒子环绕飞舞，神圣超凡。${STYLE}`
  }
];

function log(tag, msg) {
  const time = new Date().toLocaleString('zh-CN', { hour12: false });
  console.log(`[${time}] [${tag}] ${msg}`);
}

function postJson(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', reject);
  });
}

async function generateShot(shot) {
  const filename = `jiuweihu-${shot.id}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  log('Seedream', `⏳ [${shot.name}] 生成中...`);
  log('Seedream', `   Prompt长度: ${shot.prompt.length} 字符`);

  try {
    const body = {
      model: MODEL_ID,
      prompt: shot.prompt,
      size: '2K',
      output_format: 'png',
      response_format: 'url',
      watermark: false,
      sequential_image_generation: 'auto',
      sequential_image_generation_options: { max_images: 3 }
    };

    const response = await postJson(
      `${API_BASE}${API_PATH}`,
      { 'Authorization': `Bearer ${API_KEY}` },
      body
    );

    if (response.error) {
      throw new Error(`API错误: ${response.error.code} - ${response.error.message}`);
    }

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error(`API未返回图片URL。响应: ${JSON.stringify(response).substring(0, 500)}`);
    }

    await downloadImage(imageUrl, filepath);
    const stats = fs.statSync(filepath);
    log('Seedream', `   ✅ [${shot.name}] 成功！文件: ${filename} (${(stats.size / 1024).toFixed(1)} KB)`);
    return { shot, status: 'success', filepath, size: stats.size, url: imageUrl };

  } catch (err) {
    log('Seedream', `   ❌ [${shot.name}] 失败: ${err.message}`);
    return { shot, status: 'failed', filepath, error: err.message };
  }
}

async function main() {
  log('Seedream', '🎬 开始生成九尾狐8张定妆照...');
  log('Seedream', `📁 输出目录: ${OUTPUT_DIR}`);
  log('Seedream', `🤖 模型: ${MODEL_ID}`);
  log('Seedream', `📸 共 ${SHOTS.length} 个角度\n`);

  const results = [];
  for (const shot of SHOTS) {
    const result = await generateShot(shot);
    results.push(result);
    // 每个请求之间稍作间隔，避免 rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  // 生成报告
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  log('Seedream', `\n========== 生成报告 ==========`);
  log('Seedream', `总计: ${SHOTS.length} 张 | 成功: ${successCount} | 失败: ${failedCount}`);

  for (const r of results) {
    const icon = r.status === 'success' ? '✅' : '❌';
    const size = r.size ? `(${(r.size / 1024).toFixed(1)} KB)` : '';
    log('Seedream', `  ${icon} [${r.shot.name}] — ${r.status} ${size}`);
    if (r.error) {
      log('Seedream', `     错误: ${r.error}`);
    }
  }

  // 写元数据
  const meta = {
    character: '九尾狐 (Jiuweihu)',
    beastId: 'jiuweihu',
    style: 'CG超写实数字人',
    resolution: '1024x1024',
    format: 'PNG',
    model: MODEL_ID,
    generatedAt: new Date().toISOString(),
    totalShots: SHOTS.length,
    successCount,
    failedCount,
    shots: results.map(r => ({
      id: r.shot.id,
      name: r.shot.name,
      status: r.status,
      filename: r.status === 'success' ? path.basename(r.filepath) : null,
      size: r.size || null,
      error: r.error || null
    }))
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'character-meta.json'), JSON.stringify(meta, null, 2));
  log('Seedream', `\n📝 元数据已保存: character-meta.json`);
  log('Seedream', `✅ 环节0执行完毕！`);
}

main().catch(e => {
  console.error(`❌ 致命错误: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});