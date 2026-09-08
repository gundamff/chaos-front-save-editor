# 编队拖拽 + 完整详情侧栏设计

日期：2026-09-08

## 目标

1. 编队 Tab 以拖拽为主：候补 ↔ 格子、格子 ↔ 格子（上阵/换位/下阵）
2. 选中机体时右侧展示完整信息：机型数值、武器/能力、装备；驾驶员六维、技能、天赋
3. 从游戏 `resources.assets` 扩展提取上述模板数据写入 `game-data.json`

## 非目标

- 装备装卸编辑
- 修改模板数值或存档战斗属性
- 机体多格占位（size）
- 引入第三方拖拽库

## 数据

从 `Chaos Front_Data/resources.assets` 扩展解析：

| 表 | 用途 |
|----|------|
| UnitTypeData | HP/EN/Agility/Move/Weapon1-2/Ablity1-3 等 |
| CharacterData | Shoot/Maneuver/Command/SP/Melee/Reaction、Skill1-3、Talent1-10 |
| SkillData / TalentData / AbilityData / WeaponData | 名称与说明（LanguageData） |
| ItemData | 沿用；侧栏显示已装装备名 |

存档仍只提供：`exp→等级`、`characterId`、`items[]`、`number[]`。

## UI

- HTML5 DnD：候补列表与 4×6 网格互拖；拖到空地/候补区下阵；落到已有机体则交换
- 点击仍选中并刷新侧栏
- 驾驶员 `el-select` 保留
- 侧栏分区：机体 / 武器与能力 / 装备 / 驾驶员（含技能天赋）；文案走 i18n

## 风险

- Ability 字段拼写为游戏原表 `Ablity*`
- 天赋等级与存档等级如何对应：侧栏按驾驶员等级显示对应档 Info（若表为 Info1..Info5）；不确定则显示名称 + 全部说明摘要或当前档
- 提取脚本需用户本机游戏路径；仓库提交更新后的 `game-data.json`
