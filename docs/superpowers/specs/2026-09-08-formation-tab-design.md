# 编队 Tab（站位 + 驾驶员）

**日期：** 2026-09-08  
**状态：** 已批准（用户选 B + go）

## 目标

新增「编队」Tab：可视化网格编辑上阵站位（`Unit.number`）与驾驶员（`characterId`）。

## 数据

- 未上阵：`number === [0, 0]`
- 上阵：`number === [row, col]`，实档 row∈{1,2,3…}、col∈{0..5}
- 网格常量：4 行 × 6 列；UI 行 0..3 对应存档 row = 行+1；列 0..5 原样写入

## API（SaveData）

- `deployUnit(unitIndex, row, col)`：放到格；若目标有机则交换站位
- `undeployUnit(unitIndex)`：设为 `[0,0]`
- `setUnitPilot(unitIndex, characterId)`：`characterId>0` 且已被其他机占用则抛错
- `unitAt(row, col)`：返回单位下标或 -1

## UI

- 上：4×6 格子（图标、机名、驾驶员；点击选中/放置/交换）
- 下：未上阵列表 + 驾驶员下拉
- 操作：上阵、下阵、换位、改驾驶员、清空驾驶员

## 非目标

- 不按 size 占多格；不增删机体；去掉机体 Tab 上误导性「编队」只读列
