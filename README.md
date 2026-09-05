# ⏳ 退休倒计时 · 倒数自由（Web / PWA · MVP）

算出你真正还需要上多少个「工作日」才退休。懂中国退休政策口径、纯本地保存、可安装为主屏的 PWA。

## 运行

```bash
npm install
npm run dev        # 本地开发
npm run build      # 生产构建（含 PWA service worker 与 manifest）
npm run preview    # 本地预览构建产物
```

产物默认输出到 `dist/`（`dist/sw.js`、`dist/manifest.webmanifest` 由 `vite-plugin-pwa` 生成）。

## 功能（MVP，对照产品清单）

- Onboarding 实时「工作日 / 自然日」预览 + 出生日期、性别口径、可选自定义退休日、生涯昵称
- 法定退休口径：按《渐进式延迟法定退休年龄》(2025-01-01 起)：男职工/女干部(原55，→63/58)/女工人(原50，→55)。渐进按 4 月或 2 月递延 1 月精算出生月份。
- 主屏「工作日倒计时」大字 + 自然日换算 + 进度条 + 目标日 + 「今日一句话」「里程碑」卡片
- 跨过退休日前后的「反计（已自由）」状态
- 纯本地持久化：`localStorage`（`storage.ts`），无账号、不上传
- “今日一句话” / “里程碑” 文案模块（`motivation.ts`）内置正向提示

## 代码结构

```
src/
  main.ts / style.css         入口与全局样式
  App.vue                     单页 UI（config onboarding ⇄ count 主屏切换）
  composables/useApp.ts       档案字段、ticker(now)、自动持久化
  core/
    retirement.ts  性别/政策口径、估算法定退休日、工作日循环
    reckon.ts      Net 输出驱动组件的单一计算口径
    storage.ts     localStorage 读写
    motivation.ts  每日一句话 + 里程碑
    demo.ts        示例资料 / 届别命名
    date.ts        ISO/中文日期工具
```

## 口径 / 免责（重要）

- 退休日按 2025-01 起施行的渐进式延迟口径折算：男→63、女干部(原55)→58、女工人(原50)→55（男与女干部每 4 月递延 1 月、女工人每 2 月递延 1 月，按出生月份精算）；若后续政策更新，以国家/主管部门最终规定为准，本工具仅作参考习惯养成。
- 「工作日」= 剔除周六日的近似倒数；法定节假日近似处理（后续可引入全年节假日表）。
- 生涯起点近似为出生年份，仅展示进度观感；精确按实际工作/参保为准。
- 所有数据仅存浏览器 `localStorage`，本项目不上传、不追踪。
