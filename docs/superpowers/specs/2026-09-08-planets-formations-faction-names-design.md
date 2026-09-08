# 星球 / 编队 / 势力真名 + README 截图

**日期：** 2026-09-08  
**状态：** 已批准（用户选 C）

## 目标

1. README 嵌入 `docs/` 下 6 张界面截图  
2. 资源页勋章/关系显示势力真名（非 1/2/3/4）  
3. 新增星球编辑 Tab（`PlanetData`，改归属时同步 `FactionData.planets`）  
4. 机体 Tab 展示编队坐标 `number[2]`（本阶段只读 + 警示；不开放乱改）

## 非目标

- 不改战斗/剧情/任务字段  
- 本阶段不提供编队坐标写回（等实机确认语义）  
- 暂不加捐助链接

## 数据依据

- `PlanetData[]`：economics/industry/defense/stability（含 Max）、faction、buildings  
- `FactionData[]`：`planets[]` 与星球归属双向一致  
- `PlayerMedals[4]` / `PlayerRelationships[4]`：下标 `i` ↔ `FactionData.id === i+1` 的军团名（`armies` 表）  
- `Unit.number[2]`：编队格；`[0,0]` 视为未上阵/默认

## UI

- README：「界面预览」六图  
- 资源：`勋章 · {势力名}` / `关系 · {势力名}`  
- 新 Tab「星球」：表格编辑数值与所属势力  
- 机体：列「编队」只读显示 `row,col` 或「—」

## 风险

- 改星球归属必须同步 FactionData，否则地图与势力列表分裂  
- 关系/勋章改值仍影响剧情（保留现有警示）
