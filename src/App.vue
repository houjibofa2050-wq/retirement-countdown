<script setup lang="ts">
// 退休倒计时 · 倒数自由 —— 单页 UI（MVP）
import { computed, ref } from 'vue'
import {
  GENDER_OPTIONS,
  PLAN_OPTIONS,
  RESIDENT_START_AGE,
  type Gender,
  type PlanType,
} from './core/retirement'
import { useApp } from './composables/useApp'
import { reckon } from './core/reckon'
import { dailyLine, randomAside, milestoneView } from './core/motivation'
import { yearMonthCN } from './core/date'
import { useTheme } from './composables/useTheme'
import { downloadShareCard } from './core/shareCard'

const app = useApp()
const { isDark, toggle } = useTheme()

// —— 档案顶层 refs（模板可 v-model）——
const birthISO = app.birthISO
const plan = app.plan
const gender = app.gender
const customRetireISO = app.customRetireISO
const name = app.name
const now = app.now

// 参保类型/性别 可写集合
const planPick = computed<PlanType>({
  get: () => plan.value,
  set: (v: PlanType) => (plan.value = v),
})
const genderPick = computed<Gender>({
  get: () => gender.value,
  set: (v: Gender) => (gender.value = v),
})

// 视图切换
const onboarding = ref(true)
const showAbout = ref(false)

// 是否已配置过一次出生（用于决定 preview 用真实还是示例）
const birthEntered = computed(() => birthISO.value && birthISO.value.length === 10)

// demo 快捷体验
function fillDemo() {
  if (!birthISO.value) birthISO.value = '1983-06-15'
  plan.value = 'worker'
  gender.value = 'male'
  customRetireISO.value = ''
  document.querySelector<HTMLInputElement>('[data-testid="name"]')?.focus()
}

// —— 主计算：实时看 now ——
const real = computed(() =>
  reckon({
    birthISO: birthISO.value && birthISO.value.length === 10 ? birthISO.value : '',
    plan: plan.value,
    gender: gender.value,
    customRetireISO: customRetireISO.value || null,
    now: now.value,
  }),
)
// 未填时预览一份示例（城镇职工男演示）
const sample = computed(() =>
  reckon({
    birthISO: '1983-06-15',
    plan: 'worker' as PlanType,
    gender: 'male' as Gender,
    customRetireISO: null,
    now: now.value,
  }),
)
const shown = computed(() => (birthEntered.value ? real.value : sample.value))

const nameText = computed(() =>
  name.value || (real.value.cohort ? real.value.cohort : sample.value.cohort || '打工人届'),
)
const workLabel = computed(() => shown.value.workdays.toLocaleString('zh-CN'))
const naturalLabel = computed(() => shown.value.naturalAbs.toLocaleString('zh-CN'))

const genderShortCN = computed(
  () => GENDER_OPTIONS.find((o) => o.value === gender.value)?.short ?? '',
)
const isResident = computed(() => plan.value === 'resident')
// 主屏/分享处统一“口径摘要”
const policyShort = computed(() =>
  isResident.value ? `城乡居民 · 满 ${RESIDENT_START_AGE} 岁领取` : genderShortCN.value,
)

const mile = computed(() => (birthEntered.value ? milestoneView(real.value.naturalDays) : null))

// —— 动态“今日一句话”：主句按日稳定，轻副句随机且隔段时间换一次（开页/3 分钟各来一次新意）——
const todayMain = computed(() => dailyLine(now.value.getDate()))
const aside = ref(randomAside())
setInterval(() => {
  aside.value = randomAside()
}, 3 * 60 * 1000)
const phrase = computed(() => `${todayMain.value.replace(/。$/, '')} · ${aside.value}`)

const todayISO = computed(() => new Date().toISOString().slice(0, 10))

// —— 下载分享卡 ——
const shareBusy = ref(false)
async function makeShare() {
  const g = real.value.goalISO
  if (!birthEntered.value || !g) return
  shareBusy.value = true
  try {
    await downloadShareCard({
      name: nameText.value || real.value.cohort || '打工人',
      workdays: real.value.workdays,
      natural: real.value.naturalAbs,
      goalISO: g,
      genderShort: policyShort.value,
    })
  } finally {
    shareBusy.value = false
  }
}


// —— 今日“活”节奏：随 now 每秒变化的副信息，让主视觉始终在动 ——
const pad2 = (n: number) => String(n).padStart(2, '0')
const weekCN = ['日', '一', '二', '三', '四', '五', '六']

/** 当前时分秒（每秒跳）例：14:03:52 */
const playClock = computed(
  () =>
    `${pad2(now.value.getHours())}:${pad2(now.value.getMinutes())}:${pad2(now.value.getSeconds())}`,
)

/** 今日完整日期短文案：7月3日 周三 */
const dayLabel = computed(
  () => `${now.value.getMonth() + 1}月${now.value.getDate()}日 周${weekCN[now.value.getDay()]}`,
)

/** 今日日历总量（0..1）：以工作日 9:00–18:00 为示意区间，下班前实时推进 */
const todayProg = computed(() => {
  const h = now.value.getHours() + now.value.getMinutes() / 60 + now.value.getSeconds() / 3600
  const OPEN = 9
  const CLOSE = 18
  if (h < OPEN) return { before: true, after: false, pct: 0 }
  if (h > CLOSE) return { before: false, after: true, pct: 100 }
  return { before: false, after: false, pct: Math.max(0, Math.min(100, ((h - OPEN) / (CLOSE - OPEN)) * 100)) }
})
const todayProgTxt = computed(() => {
  const p = todayProg.value
  const day = now.value.getDay()
  const weekend = day === 0 || day === 6
  if (weekend) return '今天休息 🎉 攒够自由'
  if (p.before) return '还没到时间，先把状态拉满'
  if (p.after) return '今天的班已上完 → 自由时刻'
  return `今日进度 ${Math.floor(p.pct)}% · 时间真的在走`
})
</script>

<template>
  <main class="screen">
    <header class="topbar">
      <strong class="brand">⏳ 退休倒计时</strong>
      <nav>
        <button class="iconbtn" data-testid="about" @click="showAbout = true" aria-label="口径">❓</button>
        <button class="iconbtn" data-testid="theme" :aria-label="isDark ? '切到亮色' : '切到暗色'" @click="toggle">{{ isDark ? '☀️' : '🌙' }}</button>
        <button v-if="!onboarding" class="iconbtn" @click="onboarding = true" aria-label="编辑">✎</button>
      </nav>
    </header>

    <!-- ============ ONBOARDING（首次配） ============ -->
    <section v-if="onboarding" class="onb">
      <div class="intro">
        <h1>算出你真正还要上多少天班</h1>
        <p class="muted">30 秒，立刻看到「工作日」倒计时 · 数据只留在本机。</p>
      </div>

      <!-- 实时预览 -->
      <div class="card preview" :class="{ free: birthEntered && real.over }">
        <div v-if="!birthEntered || !real.over">
          <span class="pill">{{ shown.cohort || '示例展示' }}</span>
          <div class="pv-big">{{ workLabel }}</div>
          <div class="pv-unit">个工作日<small v-if="!birthEntered" class="sample-tag">示例</small></div>
          <p class="muted">≈ {{ naturalLabel }} 个自然日
            <span v-if="shown.goal">· {{ yearMonthCN(shown.goal) }} 见自由</span>
          </p>
        </div>
        <div v-else class="free-box">
          <div class="pv-big free-emoji">🎉 你已自由</div>
          <p class="muted">已超过目标 {{ naturalLabel }} 天。每天都是挣来的。</p>
        </div>
      </div>

      <!-- 表 -->
      <form class="card form" @submit.prevent="onboarding = false">
        <label class="field">
          <span>你的出生日期</span>
          <input v-model="birthISO" type="date" :max="todayISO" required data-testid="birth" />
        </label>
        <div class="field">
          <span class="lbl">参保类型</span>
          <div class="seg">
            <button
              v-for="o in PLAN_OPTIONS"
              :key="o.value"
              type="button"
              class="seg-item"
              :class="{ on: planPick === o.value }"
              @click="planPick = o.value"
            >
              <span class="t">{{ o.label }}</span><small class="muted">{{ o.value === 'resident' ? '男女均 60' : '渐进延退' }}</small>
            </button>
          </div>
          <p class="hint muted">{{ PLAN_OPTIONS.find((x) => x.value === plan)?.desc }}</p>
        </div>

        <div class="field" v-if="!isResident">
          <span class="lbl">性别 / 岗位（原离退休年龄 → 延迟至多少）</span>
          <div class="seg">
            <button v-for="o in GENDER_OPTIONS" :key="o.value" type="button" class="seg-item"
              :class="{ on: genderPick === o.value }" @click="genderPick = o.value">
              <span class="t">{{ o.label }}</span><small class="muted">{{ o.short }}</small>
            </button>
          </div>
        </div>
        <div v-else class="resident-note muted">
          城乡居民 · 不按性别/岗位分档：男、女统一满 {{ RESIDENT_START_AGE }} 周岁领取养老金。
        </div>
        <label class="field">
          <span>自定义到龄日 <small class="muted">{{
            plan === 'resident'
              ? '(留空 = 默认满 60 周岁领取)'
              : '(留空 = 自动按性别/岗位渐进延退估算)'
          }}</small></span>
          <input v-model="customRetireISO" type="date" data-testid="custom" />
        </label>
        <label class="field">
          <span>给这段生涯起个名 <small class="muted">(可选)</small></span>
          <input v-model="name" type="text" placeholder="如：早日自由" data-testid="name" />
        </label>
        <button class="cta" type="submit" data-testid="submit" :disabled="!birthEntered">
            看我的工作日 →</button>
      </form>
      <button class="demo" type="button" @click="fillDemo">👀 先看个示例效果</button>
    </section>

    <!-- ============ MAIN（查倒计时） ============ -->
    <section v-else class="home">
      <div class="hello">
        嗨，<b>{{ nameText }}</b>
        <span class="muted"> ｜ {{ dayLabel }} <b class="dot-pulse">●</b></span>
      </div>

      <div class="card big" :class="{ free: real.over }">
        <template v-if="!real.over">
          <div class="big-label">距离自由，还剩</div>
          <div class="big-num">{{ shown.workdays.toLocaleString('zh-CN') }}</div>
          <div class="big-unit">个工作日</div>
          <div class="big-note muted">
            {{ shown.yearsRough }} 年零 {{ shown.remainderDays }} 天的工作日估算<br />
            （另算 {{ naturalLabel }} 个自然日，目标 {{ shown.goalISO }}）
          </div>
        </template>
        <template v-else>
          <div class="big-free">已自由 {{ naturalLabel }} 天 🎉</div>
          <p class="muted">存点心愿，也留点身体，把日子过成你想要的样子。</p>
        </template>
        <div class="bar-wrap">
          <div class="bar"><i :style="{ width: shown.progressPct + '%' }" /></div>
          <div class="bar-tag"><span>生涯起点</span><span class="muted">已走 {{ shown.progressPct }}%</span></div>
        </div>
        <div class="target muted" v-if="shown.goal">
          目标日 <b>{{ shown.goalISO }}</b> · {{ policyShort }}
          <span class="tag" :class="{ ghost: !customRetireISO }">{{ customRetireISO ? '自定义' : '估算' }}</span>
        </div>

        <!-- 今日活节拍：秒在走、刻度在填 -->
        <div class="today">
          <div class="today-head">
            <span class="t">今日节拍</span>
            <span class="clock"><b class="play-clock">{{ playClock }}</b></span>
          </div>
          <div class="live-bar"><i :style="{ width: todayProg.pct + '%' }"></i></div>
          <div class="today-foot muted">{{ todayProgTxt }}</div>
        </div>
      </div>

      <div class="duo">
        <div class="card mini">
          <div class="mini-h">今日一句话 · 随机</div>
          <p class="word">{{ phrase }}</p>
        </div>
        <div class="card mini">
          <div class="mini-h">里程碑 · 距下一步</div>
          <template v-if="mile">
            <p class="word" v-if="mile.reached">🎉 已经到达——翻篇啦</p>
            <p class="word" v-else-if="mile.daysAway !== null">到「{{ mile.label }}」还差 <b>{{ mile.daysAway }}</b> 天</p>
            <p v-else class="word muted">路还很长，先好好生活</p>
          </template>
          <p v-else class="word muted">填好生日就能看到啦</p>
        </div>
      </div>

      <button class="ghost-btn" @click="onboarding = true">编辑档案 / 重算</button>

      <div class="share-row">
        <button
          class="share-btn"
          data-testid="share"
          :disabled="shareBusy || real.over"
          @click="makeShare"
        >{{ shareBusy ? '生成中…' : '🖼️ 下载分享卡' }}</button>
      </div>
    </section>

    <footer class="foot muted">
      估算仅供参考 · <button class="l" data-testid="foot-about" @click="showAbout = true">口径与免责</button>
    </footer>
    <div v-if="!onboarding" class="dock muted"><span>💾 自动保存到本机</span><span>无账号 · 不上传</span></div>

    <!-- About -->
    <div v-if="showAbout" class="mask" @click.self="showAbout = false">
      <div class="sheet">
        <header><b>口径 · 免责</b>
          <button class="iconbtn" @click="showAbout = false">×</button></header>
        <p v-if="!isResident">
          · 法定退休年龄按 2024-09《渐进式延迟法定退休年龄》折算（2025-01-01 起施行）：<br />
           　男职工 60 → 63 岁 · 女干部/技术岗 55 → 58 岁 · 女工人/普通职工 50 → 55 岁。<br />
          · 采用渐进递延：男与女干部(原55) 每 4 个月递延 1 个月；女工人(原50) 每 2 个月递延 1 个月；按你的出生年/月精确算出目标日。<br />
          · 出生太早（改革前原已到龄）按原龄不再延；出生已跨过递延窗口上限的一律按最终年龄（63/58/55）。<br />
        </p>
        <p v-else>
          · 城乡居民养老保险：不区分性别/岗位，男、女统一于<b>满 60 周岁</b>的当月开始按月领取养老金。<br />
          · 需累计参保/缴费满 15 年（含补缴规则按参保地政策），缴费越长领得越多。<br />
          · 本套“城乡居民 60 岁”与单位职工那套渐进式延退（63/58/55）是两套口径——如果是在职单位职工，请把上面“参保类型”选成「城镇职工」再算。<br />
        </p>
        <p>
          · 以主管部门最终政策为准，本工具仅供习惯养成参考。<br />
          · “工作日”为去掉周六日后的近似倒数，法定节假日近似处理。<br />
          · 数据只存你的浏览器 localStorage，不上传、不追踪。<br />
          · 若能提前自由，这倒计时只会更短——祝你早日自由 🎉
        </p>
        <div class="sbtn"><button class="pill-c" @click="showAbout = false">知道了</button></div>
      </div>
    </div>
  </main>
</template>
