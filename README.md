# Chaos Front 存档修改器

一款用于《Chaos Front》（混乱前线）的 Windows 桌面存档修改器，基于 Electron 构建，可修改资源、机体、驾驶员、解锁项与图鉴，全部写操作均自动备份且原子落盘。

> **非官方工具。** 与 ChaosGalaxyStudio / 《Chaos Front》官方无任何关联、授权或合作。仅供已购买正版的玩家在本地、单机环境下学习研究；请勿用于联机、商业用途或传播已修改的存档。

## 功能

- **存档**：自动定位存档目录（`%USERPROFILE%\AppData\LocalLow\ChaosGalaxyStudio\Chaos Front`），列出 6 个存档槽的军团、指挥官、天数、机体数与保存时间，支持手动选择目录；保存前自动备份（保留最近 10 份），还原面板可一键恢复或删除任意历史备份
- **资源**：查看并修改军团资金、物资等各类资源数值；勋章/关系显示对应势力真名
- **星球**：编辑各星球经济/工业/防御/稳定与所属势力（改归属时同步势力星球列表）
- **编队**：4×6 网格上阵/下阵/换位，并分配驾驶员（同一驾驶员不能开两台）
- **机体 / 飞船**：查看与编辑机体等级、经验、装备；支持添加/删除
- **驾驶员**：查看与编辑驾驶员的等级、经验、技能等属性
- **全解锁**：一键解锁游戏中的机体、驾驶员、装备等项目
- **图鉴**：一键点亮全部图鉴收集记录

所有修改均遵循「备份 → 临时文件 → 原子替换」的写入流程，写入前会做 JSON 校验，解析失败的存档一律拒绝写入，不会损坏原文件。

## 界面预览

### 存档

![存档槽位](docs/QQ_1788829583073.png)

### 资源

![资源与势力关系](docs/QQ_1788829593107.png)

### 机体 / 飞船

![机体编辑](docs/QQ_1788829598297.png)

### 驾驶员

![驾驶员](docs/QQ_1788829604918.png)

### 全解锁

![全解锁](docs/QQ_1788829613172.png)

### 图鉴

![图鉴](docs/QQ_1788829619780.png)

## 下载

前往 [Releases](../../releases) 页面下载最新的便携版 exe（无需安装，双击即用）：

- `ChaosFrontSaveEditor-<版本号>.exe` — Windows x64 便携版

## 使用方法

1. **退出游戏**：修改前请务必完全退出游戏（游戏退出时可能覆写存档，导致修改丢失或冲突）
2. 启动修改器，它会自动找到存档目录；若未找到，点击「选择存档目录」手动指定
3. 在「存档」页选中要修改的槽位并载入
4. 在对应标签页中修改数据，点击右上角「保存到存档」
5. 每次保存都会先在存档目录的 `backup/` 子目录生成带时间戳的备份（如 `savedata0_20260907_120000.cf.bak`），自动保留最近 10 份
6. **还原 / 删除备份**：在「存档」页下方的备份列表中，可「还原」覆盖当前存档，或「删除」不需要的备份文件
7. 更新说明见 [CHANGELOG.md](CHANGELOG.md)；发行包见 [Releases](../../releases)

## 如何发版（GitHub Actions 自动打包）

你**不需要**在自己电脑上跑 `npm run dist` 再手工上传。仓库已配置：推送一个版本标签 `v*` 后，GitHub 会自动测试、打包便携版 exe，并创建 [Release](../../releases)。

### 第一次先看一眼

1. 打开仓库页 → **Actions**
2. 之后每次 `git push` 到 `main` 会跑 **CI**（测试）；推送 `v1.2.0` 这类标签会跑 **Release**（打包发版）
3. 若 Actions 是灰的，点一次 **I understand my workflows, go ahead and enable them**

### 发一个新版本（例如 1.2.0）

在本地项目目录执行（PowerShell / 终端均可）：

```bash
# 1) 改 CHANGELOG.md：把新内容写在顶部，标题用 ## [1.2.0] - 日期
# 2) 把 package.json 里的 "version" 改成 1.2.0（可选手改；CI 也会按标签再同步一次）

git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: release v1.2.0"
git push origin main

# 3) 打标签并推送 —— 这一步会触发自动发版
git tag v1.2.0
git push origin v1.2.0
```

然后打开 **Actions → Release**，等绿勾；再到 **Releases** 页就能下载 `ChaosFrontSaveEditor-1.2.0.exe`。

### 注意

- 标签必须是 `v` + 数字版本，例如 `v1.2.0`（不要写成 `1.2.0` 或 `release-1.2.0`）
- Release 正文会自动从 `CHANGELOG.md` 里对应版本段落生成
- 打包大约需要几分钟；失败时看 Actions 日志里红色那一步

## 开发者构建

环境要求：Node.js 20+、npm、Windows（打包目标为 win x64）。

```bash
# 安装依赖
npm install

# 开发模式（带热更新）
npm run dev

# 运行单元测试
npm test

# 打包 Windows 便携版 exe（产物位于 dist/）
npm run dist
```

## 素材提取脚本

机体列表、等级表、名称与图标等游戏数据由提取脚本从游戏文件生成（仓库内 `src/common/data/game-data.json` 与 `src/renderer/src/assets/game/` 即为其产物）。

**需要自备**：游戏本体（含 `Chaos Front_Data` 目录）与 [AssetRipper](https://github.com/AssetRipper/AssetRipper)（GUI 免费版即可）。

```bash
node scripts/extract-game-data.mjs --game "游戏目录\Chaos Front_Data" --ripper "C:\tools\AssetRipper.GUI.Free.exe" --out .
```

参数说明：

- `--game`（必填）：游戏的 `Chaos Front_Data` 目录路径
- `--ripper`：AssetRipper 可执行文件路径，用于导出贴图并裁切机体图标、驾驶员头像、装备图标等；省略时仅提取数据表（Phase 1 直接解析 `resources.assets`，无需 AssetRipper）
- `--out`：输出仓库根目录，默认当前目录
- `--export <dir>`：复用已有的 AssetRipper 导出目录（跳过导出步骤，`--ripper` 可省略）

脚本完成后会自动生成数据表 JSON，并输出各类型数量统计（机型应为 92 种，数量异常会报错退出）。

## 免责声明

1. **非官方、无授权**：本项目为第三方爱好者工具，**并非** ChaosGalaxyStudio 或其关联方开发、赞助、认可或附属产品；开发者与游戏官方**无任何隶属、代理或合作关系**。
2. **版权归属**：游戏《Chaos Front》（混乱前线）及其名称、商标、角色、机体、图标、头像、数据表、音频、文本等一切素材与知识产权，均归 **ChaosGalaxyStudio** 及相关权利人所有。本仓库中的展示性素材仅供**已购买正版游戏的用户**在本地学习参考，**不附带游戏本体**，亦不得用于商业用途。
3. **使用范围**：仅限个人、本地、**单机**学习与技术研究。禁止将本工具或经其修改的存档用于联机对战、破坏多人公平、出租/出售、捆绑分发或其他任何商业或侵权场景。
4. **风险自担**：修改存档可能导致进度异常、存档损坏、游戏无法加载或需重装等后果。请务必在修改前完全退出游戏，并依赖本工具自动备份或自行另行备份。**使用本工具即表示你自愿承担全部风险**；由此产生的任何直接或间接损失，开发者与贡献者不承担法律责任。
5. **下架配合**：若权利人认为本项目存在侵权或其他不当内容并提出合理要求，维护者将在核实后配合修改、屏蔽相关内容或下架发行包/仓库公开访问。
6. **请支持正版**：请通过官方渠道购买并游玩《Chaos Front》。本工具不能替代正版游戏，也不鼓励任何盗版行为。

## 许可证

[MIT](LICENSE)
