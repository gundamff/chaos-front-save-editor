# Chaos Front 存档修改器

一款用于《Chaos Front》（混乱前线）的 Windows 桌面存档修改器，基于 Electron 构建，可修改资源、机体、驾驶员、解锁项与图鉴，全部写操作均自动备份且原子落盘。

> 本工具仅供单机学习与研究使用，请勿用于联机或任何破坏游戏平衡传播的场景。

## 功能

- **存档**：自动定位存档目录（`%USERPROFILE%\AppData\LocalLow\ChaosGalaxyStudio\Chaos Front`），列出 6 个存档槽的军团、指挥官、天数、机体数与保存时间，支持手动选择目录；保存前自动备份（保留最近 10 份），还原面板可一键恢复或删除任意历史备份
- **资源**：查看并修改军团资金、物资等各类资源数值
- **机体 / 飞船**：查看与编辑编队内各机型的等级、经验、装备等属性
- **驾驶员**：查看与编辑驾驶员的等级、经验、技能等属性
- **全解锁**：一键解锁游戏中的机体、驾驶员、装备等项目
- **图鉴**：一键点亮全部图鉴收集记录

所有修改均遵循「备份 → 临时文件 → 原子替换」的写入流程，写入前会做 JSON 校验，解析失败的存档一律拒绝写入，不会损坏原文件。

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

- 本工具**仅供单机学习与技术交流使用**，请勿用于联机对战或任何商业用途
- 游戏内素材（图标、头像、名称、数据表等）版权归 **ChaosGalaxyStudio** 所有，本仓库仅作本地学习展示，请支持正版游戏
- 修改存档存在一定风险（如存档损坏、进度异常），**风险自担**，请在操作前确认自动备份已生效，**务必依赖自动备份**或自行手动备份后再进行修改
- 使用本工具产生的一切后果由使用者自行承担，与开发者无关

## 许可证

[MIT](LICENSE)
