# About 对话框设计

## 目标

标题栏增加「关于」，弹出对话框展示应用名、版本、GitHub 链接与非官方免责声明。

## 方案

- 入口：标题栏语言切换旁按钮（已确认 A）
- UI：`el-dialog`，文案走现有 i18n（中/英）
- 版本：主进程 `app.getVersion()`，经 IPC `app:getVersion` 暴露给渲染进程
- GitHub：固定 URL `https://github.com/gundamff/chaos-front-save-editor`；点击后 IPC `shell:openExternal`（仅允许该 URL）打开系统浏览器
- 不新增 Tab、不改存档逻辑

## 非目标

爱发电、作者联系方式、更新检查。
