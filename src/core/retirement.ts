// 核心领域逻辑：与 UI 无关的纯 TS。
// 口径：依据2024-09全国人大决定《渐进式延迟法定退休年龄》，自 2025-01-01 起施行；
//   男职工 60→63、女·干部(原55) 55→58、女·工人(原50) 50→55。
//   男 + 女干部：每 4 个月递延 1 个月；女工人：每 2 个月递延 1 个月。
//   精确到“出生月份 → 应延迟月数”，并据此推得目标退休日期。
// 注：官方出生对照表覆盖到“延迟已达上限”的出生之后即不再增加，我们都 clamp 到上限。
// 说明始终是“估算”，显著提示以国家现行/最终政策为准。

export const MS_PER_DAY = 86400000

export type Gender = 'male' | 'female-worker' | 'female-cadre'

/** 参保/待遇类型：worker=城镇职工(渐进式延迟)，resident=城乡居民(不分男女、统一 60 岁起领) */
export type PlanType = 'worker' | 'resident'

export const RESIDENT_START_AGE = 60

export interface GenderSpec {
  /** 原（改革前）法定退休年龄，岁 */
  oldAge: number
  /** 渐进延迟后最终法定退休年龄，岁 */
  newAge: number
  /** 出生对照表中首个出现 +1 个月的出生月份锚点（对应“首批延迟”） */
  anchor: { y: number; m: number } // m: 1..12
  /** 每多少个出生月 → 延迟再 +1 个月（男/女干部4，女工人2） */
  step: number
}

export const GENDER_SPEC: Record<Gender, GenderSpec> = {
  male: { oldAge: 60, newAge: 63, anchor: { y: 1965, m: 1 }, step: 4 },
  'female-cadre': { oldAge: 55, newAge: 58, anchor: { y: 1970, m: 1 }, step: 4 },
  'female-worker': { oldAge: 50, newAge: 55, anchor: { y: 1975, m: 1 }, step: 2 }
}

/** 把出生日期规范到“年-月”序号（绝对月计数，用于递延对照表跨段检索）。 */
function yMonthIndex(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth() // Jan=0
}

export interface RetirePlan {
  goal: Date
  /** 相比原龄多延的月份；0 = 未触发放延迟（改革前已到原龄） */
  delayMonths: number
  /** 用到的口径说明（给 UI 展示是否已触顶） */
  capped: boolean
}

/**
 * 依新政策估算法定退休日期（含渐进延迟）。
 * 输入出生“生日当天”的 Date。
 * 返回：goalDate（目标退休日）+ delayMonths + capped 标识。
 */
export function computeRetirement(
  birth: Date,
  gender: Gender,
  plan: PlanType = 'worker'
): RetirePlan | null {
  const d = dayStart(birth)
  if (Number.isNaN(d.getTime())) return null

  // 城乡居民：不分男女，统一 60 岁起领（不参与城镇职工的渐进式延迟）
  if (plan === 'resident') {
    const goal = new Date(d)
    goal.setFullYear(goal.getFullYear() + RESIDENT_START_AGE)
    return { goal: dayStart(goal), delayMonths: 0, capped: false }
  }

  // ——— 城镇职工：渐进式延迟 ———
  const spec = GENDER_SPEC[gender]

  // 原满龄日期 = 出生满 oldAge 岁的那个“同月同日”
  const oldReach = new Date(d)
  oldReach.setFullYear(oldReach.getFullYear() + spec.oldAge)
  const oldReachStart = dayStart(oldReach)

  const maxDelayMonths = (spec.newAge - spec.oldAge) * 12

  // 出生月距锚点月数（>=0 才进入递延窗口；<锚的一律不延）
  const bIdx = yMonthIndex(d)
  const aIdx = spec.anchor.y * 12 + (spec.anchor.m - 1)
  let delay = 0
  let capped = false
  if (bIdx >= aIdx) {
    const m = bIdx - aIdx
    // 首批 +1 开始，每 step 个出生月递延 +1，直至上限
    let raw = 1 + Math.floor(m / spec.step)
    if (raw >= maxDelayMonths) {
      raw = maxDelayMonths
      capped = true
    }
    delay = raw
  }

  // 目标退休日 = 原满龄日 + delay 个月
  const goal = new Date(oldReachStart)
  goal.setMonth(goal.getMonth() + delay)
  return { goal: dayStart(goal), delayMonths: delay, capped }
}

/** 兼容外部调用：保留 estimateRetirementDate(birth, gender) => Date（取 goal）。plan 可选，默认 worker。 */
export function estimateRetirementDate(
  birth: Date,
  gender: Gender,
  plan: PlanType = 'worker'
): Date {
  const r = computeRetirement(birth, gender, plan)
  return r?.goal ?? dayStart(birth)
}

/** 取“今天”日期并清零时间（历史方法，外部可能仍引用）。 */
export function todayStart(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** 把传入日期清零到当日零点，避免时区/时间的误差。 */
export function dayStart(input: Date): Date {
  const d = new Date(input)
  d.setHours(0, 0, 0, 0)
  return d
}

/** 两个日期相隔的完整自然日数（end-start，可为负）。 */
export function diffDays(start: Date, end: Date): number {
  return Math.round((dayStart(end).getTime() - dayStart(start).getTime()) / MS_PER_DAY)
}

/** 简易工作日数：剔除周六/周日（供 MVP 使用；法定节假日后续可补）。 */
export function countWorkdays(today: Date, target: Date): number {
  let d = dayStart(today)
  const goal = dayStart(target)
  if (d.getTime() >= goal.getTime()) return 0
  let count = 0
  while (d.getTime() < goal.getTime()) {
    const w = d.getDay()
    if (w !== 0 && w !== 6) count++
    d = new Date(d.getTime() + MS_PER_DAY)
  }
  return count
}

/** 把 Date 格式化为 YYYY-MM-DD。 */
export function k(d: Date): string {
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-')
}
function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 把目标日转成年月文本，如 “2036-04”。 */
export function yearMonthLabel(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
}

export interface GenderOption {
  value: Gender
  label: string
  /** UI 简短说明：显示“要延到几岁”，以及是否需要渐进（最终都触顶时老用户感知） */
  short: string
  note: string
}

export const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'male',
    label: '男',
    short: '延迟至 63 岁',
    note: '男职工 · 原 60 岁，渐进递延，最终 63 岁'
  },
  {
    value: 'female-cadre',
    label: '女 · 干部/技术岗',
    short: '延迟至 58 岁',
    note: '原 55 岁的女干部/技术岗，渐进递延，最终 58 岁'
  },
  {
    value: 'female-worker',
    label: '女 · 工人/普通职工',
    short: '延迟至 55 岁',
    note: '原 50 岁的女工人/普通职工，渐进递延，最终 55 岁'
  }
]

export const genderShort = (g: Gender): string =>
  GENDER_OPTIONS.find((o) => o.value === g)?.short ?? ''

/** 参保类型选单（UI 用）。*/
export interface PlanOption {
  value: PlanType
  label: string
  desc: string
}

export const PLAN_OPTIONS: PlanOption[] = [
  {
    value: 'worker',
    label: '城镇职工',
    desc: '在单位交职工社保 · 渐进式延迟（男 60→63、女干部 55→58、女工人 50→55）'
  },
  {
    value: 'resident',
    label: '城乡居民',
    desc: '居民养老险 · 不分男女，统一满 60 周岁领取'
  }
]

export const planLabel = (p: PlanType): string =>
  PLAN_OPTIONS.find((o) => o.value === p)?.label ?? ''
