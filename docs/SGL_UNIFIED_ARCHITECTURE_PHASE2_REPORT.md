# SGL Unified Architecture — Phase 2 Controlled Consolidation Report

日期：2026-11-09（Asia/Shanghai）
状态：保护、权威源核验与第一批本地整合完成；未部署、未迁移生产数据库、未重启生产服务。

## 1. 唯一主仓库与分支结构

- Git 主仓库：`sgl-website`
- Remote：`https://github.com/zhanghanyue123/sgl-website.git`
- Admin 整合 worktree：`/Users/hanyue/Documents/Codex/sgl-unified-admin-release`
- 分支：`release/unified-admin-20261109`
- 用户指定基线：`9e25df6c90ce6cd70930318a7f864eecd8d8b894`
- 第一批整合提交：`f182ed3743c1bf33d0c31bdae38d49ed28060ea7`
- `main` 继续作为已发布网站代码线；未把本地整合分支推送或部署。

第一批只整合 Unified Overview、Agent Operations 总览/详情、两个只读 BFF 和现有 Admin Shell 导航。没有复制整个 Fries worktree，没有修改 Airwallex、订单、支付或公开网站布局。

## 2. Fries 69 项改动保护

保护对象：`/Users/hanyue/Documents/Codex/sgl-sprint01-airwallex`，分支 `phase2f/fries-agent`，HEAD `5dc91ee2edf5f34d4c75c8f1d9b3a3cc03c40943`。

- `git status --short` 摘要：69 条
- 展开后的实际路径：87 条
- tracked 修改：38 条
- untracked 文件：49 条
- 备份：`/Users/hanyue/Documents/Codex/.sgl-consolidation-backups/fries-phase2f-20261109-174527`
- `SHA256SUMS` 文件 SHA-256：`a8b81ac957ae88eeea28594f8d4d1f984cb241ae6fc3610898a359269b87f64e`
- 恢复验证：从精确 HEAD 重建、应用 binary patch、恢复 untracked archive，再逐文件比对 SHA-256，PASS。
- 备份目录权限 0700，备份文件权限 0600。

原 worktree 未被修改、重置、清理、切换分支或提交。`sgl-app-showcase` 的 99 条状态保持原样。

## 3. Station OS 权威源码核验

生产位置：`/opt/sgl-station-os`，主机 `VM-0-17-ubuntu`。

### 3.1 已确认事实

- 目录不是 Git checkout；没有可核验的 Git remote、branch 或 commit。
- systemd：`sgl-station-os.service`，active/running。
- WorkingDirectory：`/opt/sgl-station-os`
- ExecStart：虚拟环境 Uvicorn 启动 `app.main:app --host 0.0.0.0 --port 8099`
- 环境文件由 systemd 加载；`.env` 权限为 root:root 0600，未读取内容。
- 数据库：`/opt/sgl-station-os/data/agent_ops.sqlite3`，root:root 0600。
- 本机 `/health`：HTTP 200。
- 运行源码哈希已核验：
  - `app/main.py`：`e61ba57129bdd57af344f2134b02d846b6f9740cf6fff47fa6b0cfec7355d48a`
  - `app/hello_integration.py`：`617f583369e29a5b1c033bf22f03b055e4f9e2d253e48111cbb465a19fee6bef`
  - `app/write_auth.py`：`d141054d2b44beaf7393b0537d11fe84c3091861f5748598a56f3e8711f72e67`
- 安全审批拒绝把生产源码复制到本地；本轮没有绕过，只使用远程 AST、OpenAPI 和响应结构进行只读核验。

### 3.2 API 结论

真实存在：daily operations、products、materials、inventory、purchases、purchase suggestions、staff、availability、schedule、camera、AI briefings，以及 Hello customer/task integration。

P0：`GET /ops/bom/list` 被动态路由 `/ops/bom/{product_id}` 截获并返回错误。必须在 Station OS 后端使用不冲突路径或调整声明顺序，并独立测试、备份和重启 Station 服务后才可恢复 BOM 投影。

生产源码没有 Git 历史是发布风险。下一步应先把精确生产源码以受控方式导入独立 Station OS Git 历史，并记录初始 tree hash；任何本地快照均不得覆盖生产。

## 4. 数据库迁移统一

Admin 基线保留连续迁移 `0001`–`0013`。保护 worktree 与整合基线中的每个同名 SQL SHA-256 完全一致。

- `0012_support_event_outbox.sql`：`d1d818b66c770db5c6cf777e9fcd844d307932ebc0c486899d679131b2a2ba69`
- `0013_station_admin_projection.sql`：`782b66046e665455bcc9bbaa4bb5f27a8f2caca79b6ede2595e13d5f5a1c6478`

不得修改这些文件内容。若 Preview 或 Production 已记录不同 checksum，使用新的唯一迁移编号前向修复。

Vercel Production 与 Preview 都存在独立 `DATABASE_URL` 配置。实际 `schema_migrations` registry 尚未读取：自动安全审批拒绝 `vercel env pull`，因为该操作会导出整个 Production 环境和全部密钥。后续应提供只读数据库审计凭证，或部署仅返回 migration version/checksum 的受保护内部审计端点。未核验 registry 前不得执行 Production migration。

Station SQLite 发现 `migrations/001_hello_integration.sql`，但 audit 用户无权读取数据库 schema；本轮没有提权或修改。

## 5. Unified Admin 页面与 API 映射

| 页面 | 数据源 | BFF / API | 当前状态 |
|---|---|---|---|
| `/admin` | Website PostgreSQL + Retail/Hello 投影 + Fries Website DB | `/api/admin/unified/overview` | 本地整合完成；外部源未配置时明确 Not Connected |
| `/admin/agents` | Retail、Hello 只读 projection；Fries Website DB | `/api/admin/unified/agents` | 本地整合完成，只读 |
| `/admin/agents/{retail,hello,fries}` | 同上 | 同上 | 本地整合完成，只读 |
| `/admin/station` | Website `station_admin_snapshots` projection | `/api/admin/station` | 已有；真实连接器尚未部署验收 |
| Products / Inventory / Orders / Payments | Website PostgreSQL | 现有 Admin BFF | 保留原主数据职责 |
| Customers / Agent approvals / Audit / Settings | Website PostgreSQL | 现有 Admin BFF | 保留原实现 |

浏览器只访问同源 BFF。Retail、Hello、Station、Fries Token 只允许存在于服务端环境。

## 6. Station CRUD 完成清单

| 模块 | Station API | Admin 展示 | Admin 写入 |
|---|---|---|---|
| Store Dashboard / Daily | GET 已有 | snapshot 已有 | 不适用 |
| POS / Sales | daily 与小程序镜像只读 | 部分 | 没有可验收写 API |
| Products | list + upsert | 已有 | connector 有 allow-list，但 Website 命令尚未开放 |
| Inventory | status/ledger + consume | 已有 | 未开放，库存扣减需更高权限与确认 |
| BOM | get/upsert/list | list 当前路由冲突 | 不得开放至 P0 修复 |
| Purchasing | list/add/suggestions | 已有 | connector 有 allow-list，Website 命令尚未开放 |
| Suppliers | 仅材料/采购记录中的字符串 | 部分 | 没有独立 Supplier CRUD |
| Staff | list + upsert | 已有 | connector 有 allow-list，Website 命令尚未开放 |
| Attendance | Station API 未发现 | 未连接 | 缺 API；员工端 CloudBase operations 有独立实现 |
| Scheduling | week/generate + availability | 已有 | connector 有 allow-list，Website 命令尚未开放 |
| Reports | daily/manager/boss/AI briefing | 部分 | 生成与 WeCom 发送必须分权 |
| Settings | 未发现 | 未连接 | 缺 API |
| Hello Customer / Task | GET/PATCH/event | 已有 projection | Customer/Task 命令已实现并有 ACK |

没有真实写 API 的模块不应显示编辑按钮。下一批应先修 BOM 路由和建立 Station Git 来源，再按 Products → Materials → Purchasing → Staff → Scheduling 的顺序扩展 BFF 命令、RBAC、审计、ACK 和保存后重读验证。

## 7. 三个 Agent 连接状态

### Retail

- Retail container：running / healthy
- HTTP health：200
- Tavily：已配置
- Retail mailbox：enabled
- `ENABLE_SENDING=false`：生产容器实测为 false，P0 安全条件满足
- Research timer：disabled / inactive
- Station connector 环境：未配置
- Admin Production 的 Retail projection URL/Token：Vercel 变量清单未发现，因此 Admin 将显示 Not Connected

### Hello

- Hello mailbox：enabled
- Retail/Hello 共用容器 health：200
- 专用配置文件存在，root:root 0600
- Station Hello integration API 已部署在 Station OS
- Admin Production 的 Hello projection URL/Token：Vercel 变量清单未发现，因此 Admin 将显示 Not Connected
- 本轮没有同步邮件、自动回复或发送 WeCom。

### Fries

- Website 的 Fries Adapter Provider 已在另一 release 线上提交中实现。
- Production 尚缺 `SGL_FRIES_ADAPTER_URL`、`SGL_FRIES_ADAPTER_TOKEN`、`SGL_FRIES_OPENCLAW_AGENT`。
- 腾讯云尚未验收独立 HTTPS Fries Adapter 与 dedicated `fries` OpenClaw agent。
- Production shared Redis 未在变量清单中确认。
- 结论：Not Connected / Not Operational；不得仅凭网站部署 Ready 宣称开始运营。

## 8. 员工小程序唯一版本

- 唯一维护源码：`/Users/hanyue/Documents/Codex/2026-05-27/sgl-app/src/miniprogram-2/apps/staff-miniprogram`
- 原最小源码备份：`/Users/hanyue/Documents/Codex/.sgl-consolidation-backups/staff-miniprogram-source-before-consolidation-20261109.tar.gz`
- 备份 SHA-256：`3d660e2d67b7f9abbad1be2ef6c91d1a7e6b3af48e5ace2b481b2df64bd8c6e9`
- 可导入 ZIP：`/Users/hanyue/Documents/Codex/SGL-Station-Employee-Miniprogram-Unified-2026-11-09.zip`
- ZIP SHA-256：`70a024a89030854c8de33aee6b97e9919659fd9f3c75c0b4498970b7bec2ea3e`
- AppID：留空
- 页面：登录、首页、资料、门店、打卡、排班/任务、公告、业务操作
- `operations` 服务端测试：42/42 PASS
- 未接入：公告 API、完整员工/门店资料、工资账本 API、测试 CloudBase、真实 AppID 和真机验收。

其余三个导出包保留为历史参考，不再分别开发。

## 9. 测试结果

- Unified Admin TypeScript：PASS
- Unified Admin tests：95/95 PASS
- Next.js Production Build：Webpack PASS，52 个页面生成完成
- Turbopack build：因 `node_modules` 指向另一个 worktree 的外部 symlink而失败；属于本地依赖隔离问题，Preview 前需在本 worktree 执行独立 `npm ci`
- Employee operations：42/42 PASS
- Employee client structure：8 页面、41 个客户端文件，PASS
- ZIP import structure：52 个文件，AppID 空、CloudFunction 路径存在，PASS
- 生产服务：Station HTTP 200；Retail HTTP 200；无服务重启。

## 10. Preview 与 Production 顺序

1. 在整合 worktree 安装独立依赖，消除跨 worktree `node_modules` symlink。
2. 配置隔离 Preview PostgreSQL/Redis；读取 registry 后确认 `0001`–`0013` checksum。
3. 部署 Admin Preview，只启用 Overview 与 Agent read-only 页面；缺凭证显示 Not Connected。
4. 为 Station OS 建立可追溯 Git 来源，修复 BOM 路由并完成服务级测试。
5. 部署 Station connector Preview，验证 snapshot、command lease、ACK/NACK、幂等与保存后重读。
6. 逐模块开放 Station 写权限，不批量开放库存扣减、退款或 WeCom 发送。
7. 配置 Retail/Hello 专用只读 projection Token，验证 Admin 状态和过期标识。
8. 独立完成 Fries Redis、HTTPS Adapter、OpenClaw、WireGuard Gateway 与降级表单验收。
9. 微信员工端连接测试 CloudBase 和 AppID，完成 DevTools/真机验收。
10. 每一批 Preview 验收后再申请 Production；数据库只用向前兼容迁移，回滚应用 deployment，不删除业务数据。

## 11. 当前阻塞

1. Station OS 生产源码没有 Git remote/commit。
2. BOM list 路由冲突。
3. Production/Preview migration registry 未获安全的只读访问方式。
4. Vercel Production 缺 Retail/Hello projection 和 Fries Adapter/Redis 配置。
5. Station connector 尚未配置和部署验收。
6. 员工小程序缺真实 AppID、测试 CloudBase、公告/资料/工资 API 与真机验收。

这些阻塞均保持显式状态，不用模拟数据或静态按钮冒充完成。
