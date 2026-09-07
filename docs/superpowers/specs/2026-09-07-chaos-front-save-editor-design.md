# Chaos Front 存档修改器 — 设计文档

日期：2026-09-07
状态：已与用户确认设计方向，待实施

## 1. 背景与目标

《Chaos Front》（ChaosGalaxyStudio，Unity Mono）的存档为 **Easy Save 3 (ES3)** 序列化的明文 JSON，位于：

```
%USERPROFILE%\AppData\LocalLow\ChaosGalaxyStudio\Chaos Front\
├── savedata0..5.cf    战役存档槽（0/1/2/5 常用）
├── collection.cf      图鉴（结局/机体/成员收藏度）
├── config.cf          游戏设置
└── break.cf           战斗中断存档（不修改）
```

目标：做一个**图形化存档修改器**（Electron 桌面应用），开源发布到 GitHub，供其他玩家使用。玩家侧**零环境依赖**（下载即用）。

## 2. 已验证的存档格式（逆向结论）

- 文件为 UTF-8 JSON（无加密、无校验和），顶层每个字段是 ES3 包装：`{ "__type": "<CLR类型>", "value": <值> }`
- 内部对象（Unit/Faction/Planet/Battle/EventBattle）为普通 JSON 对象，成员名直接暴露
- 游戏 `RecordController` 用 `ES3.Save/ES3.Load`（LitJson）读写；加载按字段名取值，**JSON 排版无关紧要**，只要语义结构正确
- 游戏自身保存流程：写 `savedataN_temp.cf` → `File.Replace` 原子替换 → 修改器沿用该策略
- `PlayData.Reset()` 后逐字段 Load，字段缺失时用默认值 → 编辑器必须保留全部原有字段

### 关键字段（修改目标）

| 字段 | 类型 | 说明 |
|---|---|---|
| `PlayerCredit` | int | 信用点 |
| `PlayerPrestige` | int | 威望 |
| `PlayerStar` | int | 星级 |
| `PlayerMedals` | int[4] | 勋章 |
| `PlayerRelationships` | int[4] | 关系（影响剧情，UI 需警示） |
| `PlayerUnits` | List\<Unit\> | 机体/飞船，30 条 |
| `PlayerCharacters` | List\<int\> | 驾驶员 id 列表 |
| `PlayerCharacterEXPs` | List\<int\> | 与上表并行的经验值 |
| `PlayerUnlockedUnitTypes` | List\<int\> | 已解锁机型（工厂/船坞购买门槛） |
| `PlayerUnlockedItems` | List\<int\> | 已解锁装备 |
| `PlayerArmyId` | int | 玩家军团 id（新建 Unit 的 armyId 取此值） |

Unit 对象字段：`unitType, armyId, characterId, items[], custom, number[2], exp, playerName`

### 等级规则（已从反编译代码 + resources.assets 提取验证）

- **机体/飞船**：等级 0–6（显示 +0~+6）。`exp` 与 `UnitLevelData.levelType` 对应的等级表比较，≥ `EXP6` 即 +6。
  12 张等级表（Index 1–12），EXP6 最大值为 **11970**（表 11/12）。统一将 exp 设为 ≥11970（建议 12000）即全部 +6。
- **驾驶员**：等级 1–10。`Informations.characterLevelTable = {0, 300, 1050, 2300, 3800, 5800, 8000, 11000, 15000, 20000}`，exp=20000 → Lv10。
- 机型共 **92 种**（ID 1–92）：`Kind=1` 战舰 24 种，`Kind=2` 机体 68 种；机体按 `Size` 分大型(1)/小型(0)。
- 解锁 = `PlayerUnlockedUnitTypes` 包含机型 id（UnlockedShips/UnlockedLArms/UnlockedSArms 均由此过滤）→ 全解锁即写入 1..92。

## 3. 游戏素材提取（开发期一次性）

用 AssetRipper 2.0（GUI Free，headless + 本地 HTTP API）导出：

| 素材 | 来源 | 方式 |
|---|---|---|
| 机型中文名/属性表 | `UnitTypeData` TextAsset（XML） | 从 resources.assets 直接提取 |
| 等级表 | `UnitLevelData` TextAsset | 同上 |
| 驾驶员真名 | `CharacterData` TextAsset + `LanguageData`（Index→CN 文本） | 同上 |
| 装备名/图标 | `ItemData` + `itemIcon_N` 精灵 | 图集矩形裁切 |
| 机体像素图 | `mapUnit<model>_0` 精灵（机型 Model → 精灵名） | 从 `mapUnit<model>.png` 图集按 `Sprite.m_RD.m_TextureRect` 裁切（已验证出图） |
| 驾驶员头像 | `portraitNN` 独立贴图 | 直接拷贝（169 张，已验证） |
| 军团旗帜 | `flagHead/flagRound/flagsquare` | 拷贝 |
| 传统图标 | `traditionIcon_N`（12） | 裁切 |

产出 `src/renderer/src/assets/game/`（PNG）+ `src/common/data/game-data.json`（名字/表数据），入库随应用分发（约 2–5MB）。

**版权说明**：游戏素材版权归 ChaosGalaxyStudio。README 声明素材仅供已购买游戏的玩家本地使用，不用于商业用途。

## 4. 技术架构

```
Electron (electron-vite 脚手架)
├── src/main/         主进程 (TS)：文件IO、存档目录探测、备份管理、IPC handler
├── src/preload/      contextBridge：白名单类型化 API（contextIsolation 开启）
├── src/common/       纯 TS 数据层（main/renderer 共用）：
│   ├── es3.ts        ES3 JSON 解析/序列化（含类型包装的读写助手）
│   ├── saveModel.ts  SaveFile 模型：load → typed snapshot → mutate → serialize
│   └── data/game-data.json
└── src/renderer/     Vue3 + Pinia + Element Plus（中文 UI）
    └── 6 个 Tab 组件
```

- 渲染进程不直接碰 Node API，全部经 IPC 白名单
- 写入流程：读原文件字节 → 备份到 `<存档目录>/backup/savedataN_yyyyMMdd_HHmmss.cf.bak`（保留最近 10 份）→ 写临时文件 → 原子替换
- 解析失败/结构不符 → 拒绝写入，UI 报错
- 图鉴 collection.cf 单独备份、单独写入

## 5. 功能模块（6 个 Tab）

1. **存档**：自动定位存档目录（失败可手动选），槽位列表（旗帜/头像/军团名/天数/保存时间/机体数），加载；备份列表 + 一键还原
2. **资源**：信用点、威望、星级、勋章[4]、关系[4]（带警示）；快捷「拉满」
3. **机体/飞船**：表格（像素图、真名+等级、驾驶员头像+名、改装标记、装备数）；单台 exp/等级编辑；一键全部+6；删除；**添加机体**（92 种机型任选，armyId=PlayerArmyId, exp=等级对应值）
4. **驾驶员**：列表（头像、真名、Lv、经验条）；单人编辑；一键全 Lv10
5. **全解锁**：92 机型按 战舰(24)/大型机体/小型机体 分组图标网格勾选 + 全选；装备全解锁
6. **图鉴**：collection.cf — 8 结局勾选；机体收藏 51 项、成员收藏 42 项拉满（写入前单独备份）

所有「一键」操作可预览变更条数，写盘前二次确认。

## 6. 错误处理

- 原子写（临时文件 + rename 替换）
- ES3 解析容错：字段缺失仅对**编辑目标字段**报错；其余字段原样保留
- 版本防御：顶部字段清单与预期不符 → 提示「游戏可能已更新，格式不兼容」，仍允许以「保守模式」只改资源字段

## 7. 测试

- Vitest：es3.ts 解析/序列化往返一致性；等级↔经验换算；备份轮转
- 夹具：按格式手工构造的最小存档 + 从真实存档**脱敏衍生的结构样例**（不入库真实玩家数据）
- 端到端：用用户真实存档的**副本**跑 修改→游戏可读 验证（开发期本地完成）

## 8. 构建与发布

- `npm run dev` 开发热更新；`npm run build` 类型检查+构建；`npm run dist` electron-builder 打包 portable exe（NSIS 可选）
- README：截图、使用说明、免责声明；MIT LICENSE；.gitignore（node_modules/dist/out/测试存档）

## 9. 里程碑

M1 脚手架+素材提取 → M2 数据层+测试 → M3 六 Tab UI → M4 备份/打包 → M5 真实存档端到端验证
