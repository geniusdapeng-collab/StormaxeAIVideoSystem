#!/usr/bin/env node
/**
 * CallbackServer — Seedance 回调接收服务器 V1.0
 * 
 * 解决问题：
 * 1. 轮询导致 429 限流 → 改为回调，零轮询
 * 2. 尾帧连续生成 → 回调触发下一镜头提交
 * 
 * 工作原理：
 * 1. 启动 HTTP 服务器，监听回调
 * 2. 提交任务时附带 callback_url
 * 3. API 完成后 POST 回调到本服务器
 * 4. 服务器收到回调后：下载结果 + 触发下一镜头（尾帧衔接）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CALLBACK_PORT = 9876;
const PENDING_TASKS_FILE = '/tmp/seedance-callback-tasks.json';
const RESULTS_DIR = '/tmp/seedance-callback-results';

class CallbackServer {
  constructor(port = CALLBACK_PORT) {
    this.port = port;
    this.server = null;
    this.pendingTasks = new Map(); // taskId → { shotId, nextShot, onNextReady }
    this.results = new Map();      // taskId → result data
    this.onTaskComplete = null;    // 外部回调函数
    this.onLastFrameReady = null;  // 尾帧就绪回调

    // 确保目录存在
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    this._loadPendingTasks();
  }

  /**
   * 启动回调服务器
   */
  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        if (req.method === 'POST' && req.url === '/callback') {
          await this._handleCallback(req, res);
        } else if (req.method === 'GET' && req.url === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            pendingTasks: this.pendingTasks.size,
            completedTasks: this.results.size,
            status: 'running'
          }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.server.listen(this.port, () => {
        console.log(`📡 [CallbackServer] 回调服务器已启动: http://localhost:${this.port}/callback`);
        resolve();
      });

      // P0-3: 修复 EADDRINUSE —— 先关闭旧实例再重试
      this.server.on('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`📡 [CallbackServer] 端口 ${this.port} 被占用，尝试关闭旧连接...`);
          // 给旧连接一点时间释放
          await new Promise(r => setTimeout(r, 2000));
          // 创建新 server 实例重试
          this.server = http.createServer(async (req, res) => {
            if (req.method === 'POST' && req.url === '/callback') {
              await this._handleCallback(req, res);
            } else if (req.method === 'GET' && req.url === '/status') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                pendingTasks: this.pendingTasks.size,
                completedTasks: this.results.size,
                status: 'running'
              }));
            } else {
              res.writeHead(404);
              res.end('Not Found');
            }
          });
          this.server.listen(this.port, () => {
            console.log(`📡 [CallbackServer] 重试成功: http://localhost:${this.port}/callback`);
            resolve();
          });
          this.server.on('error', (err2) => {
            if (err2.code === 'EADDRINUSE') {
              console.log(`📡 [CallbackServer] 端口 ${this.port} 仍被占用，使用随机端口`);
              this.server = http.createServer(async (req, res) => {
                if (req.method === 'POST' && req.url === '/callback') {
                  await this._handleCallback(req, res);
                } else {
                  res.writeHead(404);
                  res.end('Not Found');
                }
              });
              this.server.listen(0, () => {
                this.port = this.server.address().port;
                console.log(`📡 [CallbackServer] 已使用随机端口: ${this.port}`);
                resolve();
              });
            } else {
              reject(err2);
            }
          });
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * 停止回调服务器
   */
  stop() {
    if (this.server) {
      this.server.close();
      console.log('📡 [CallbackServer] 回调服务器已停止');
    }
  }

  /**
   * 获取回调 URL
   */
  getCallbackUrl() {
    // 如果有公网域名，用域名；否则用 localhost（需要端口转发）
    const host = process.env.CALLBACK_HOST || 'localhost';
    return `http://${host}:${this.port}/callback`;
  }

  /**
   * 注册待处理任务
   * @param {string} taskId - Seedance 任务 ID
   * @param {Object} meta - 任务元数据
   * @param {string} meta.shotId - 镜头 ID
   * @param {boolean} meta.needLastFrame - 是否需要尾帧
   * @param {Object|null} meta.nextShot - 下一个镜头（用于尾帧衔接）
   */
  registerTask(taskId, meta) {
    this.pendingTasks.set(taskId, {
      ...meta,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    });
    this._savePendingTasks();
    console.log(`📋 [CallbackServer] 注册任务: ${taskId} (镜头: ${meta.shotId})`);
  }

  /**
   * 处理回调请求
   */
  async _handleCallback(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const taskId = data.task_id || data.id;
        
        console.log(`📨 [CallbackServer] 收到回调: ${taskId}`);
        console.log(`   状态: ${data.status || 'unknown'}`);

        // 保存结果
        this.results.set(taskId, {
          ...data,
          receivedAt: new Date().toISOString()
        });

        // 从待处理列表中移除
        const taskMeta = this.pendingTasks.get(taskId);
        if (taskMeta) {
          taskMeta.status = data.status || 'completed';
          this.pendingTasks.delete(taskId);
          this._savePendingTasks();

          // 下载结果
          if (data.status === 'succeeded' || data.video_url || data.output) {
            const downloadDir = path.join(RESULTS_DIR, taskId);
            if (!fs.existsSync(downloadDir)) {
              fs.mkdirSync(downloadDir, { recursive: true });
            }

            // 下载视频
            if (data.video_url) {
              try {
                execSync(`curl -sL "${data.video_url}" -o "${path.join(downloadDir, 'video.mp4')}"`, { timeout: 60000 });
                console.log(`   ✅ 视频已下载: ${downloadDir}/video.mp4`);
              } catch (e) {
                console.log(`   ⚠️ 视频下载失败: ${e.message}`);
              }
            }

            // 下载尾帧（如果开启了 return_last_frame）
            if (data.last_frame_url || (data.output && data.output.last_frame)) {
              const lastFrameUrl = data.last_frame_url || data.output.last_frame;
              const lastFramePath = path.join(downloadDir, 'last_frame.png');
              try {
                execSync(`curl -sL "${lastFrameUrl}" -o "${lastFramePath}"`, { timeout: 30000 });
                console.log(`   ✅ 尾帧已下载: ${lastFramePath}`);

                // 触发尾帧就绪回调
                if (this.onLastFrameReady && taskMeta.nextShot) {
                  this.onLastFrameReady(taskMeta.shotId, lastFramePath, taskMeta.nextShot);
                }
              } catch (e) {
                console.log(`   ⚠️ 尾帧下载失败: ${e.message}`);
              }
            }

            // 触发任务完成回调
            if (this.onTaskComplete) {
              this.onTaskComplete(taskId, taskMeta, downloadDir);
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (e) {
        console.error(`❌ [CallbackServer] 回调处理失败: ${e.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }

  /**
   * 保存待处理任务到磁盘（断点续传基础）
   */
  _savePendingTasks() {
    const data = Object.fromEntries(this.pendingTasks);
    fs.writeFileSync(PENDING_TASKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * 从磁盘加载待处理任务
   */
  _loadPendingTasks() {
    if (fs.existsSync(PENDING_TASKS_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(PENDING_TASKS_FILE, 'utf-8'));
        for (const [taskId, meta] of Object.entries(data)) {
          this.pendingTasks.set(taskId, meta);
        }
        console.log(`📋 [CallbackServer] 加载 ${this.pendingTasks.size} 个待处理任务`);
      } catch (e) {
        console.log(`⚠️ [CallbackServer] 加载待处理任务失败: ${e.message}`);
      }
    }
  }

  /**
   * 获取任务结果
   */
  getTaskResult(taskId) {
    return this.results.get(taskId) || null;
  }

  /**
   * 获取所有待处理任务
   */
  getPendingTaskIds() {
    return Array.from(this.pendingTasks.keys());
  }
}

module.exports = CallbackServer;

// 独立运行模式
if (require.main === module) {
  const server = new CallbackServer();
  server.start().then(() => {
    console.log('按 Ctrl+C 停止服务器');
  });
}
