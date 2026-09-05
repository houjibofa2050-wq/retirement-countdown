// 纯计算：给定档案 + “现在”，产出口径一致展示值。便于组件复用与后续测试。
import type { Gender, PlanType } from './retirement'
import { estimateRetirementDate, MS_PER_DAY, dayStart } from './retirement'
import { parseISO } from './date'

export interface ReckonIn {
  birthISO: string
  plan: PlanType
  gender: Gender
  customRetireISO: string | null
  now: Date
}

export interface ReckonOut {
  goal: Date | null
  goalISO: string
  cohort: string
  naturalDays: number // 负 = 已超过目标
  naturalAbs: number
  workdays: number
  over: boolean
  yearsRough: number
  remainderDays: number
  progressPct: number
}

export function reckon({
  birthISO,
  plan,
  gender,
  customRetireISO,
  now,
}: ReckonIn): ReckonOut {
  const startToday = dayStart(now)
  let goal: Date | null = null
  if (birthISO && birthISO.length === 10) {
    const birth = parseISO(birthISO)
    goal = customRetireISO
      ? parseISO(customRetireISO)
      : estimateRetirementDate(birth, gender, plan)
  }
  let naturalDays = 0
  if (goal) naturalDays = Math.round((goal.getTime() - startToday.getTime()) / MS_PER_DAY)
  const over = naturalDays < 0
  const naturalAbs = Math.abs(naturalDays)

  let workdays = 0
  if (goal && !over) {
    let d = startToday
    const g = dayStart(goal)
    while (d.getTime() < g.getTime()) {
      const w = d.getDay()
      if (w !== 0 && w !== 6) workdays++
      d = new Date(d.getTime() + MS_PER_DAY)
    }
  }

  let progressPct = 0
  if (goal) {
    const birthMs = birthISO?.length === 10 ? parseISO(birthISO).getTime() : startToday.getTime() - 365 * MS_PER_DAY * 30
    const gMs = goal.getTime()
    const nowMs = startToday.getTime()
    const total = gMs - birthMs
    if (nowMs >= gMs) progressPct = 100
    else if (total > 0) progressPct = Math.max(0, Math.min(100, Math.round(((nowMs - birthMs) / total) * 100)))
  }

  const pad = (n: number) => String(n).padStart(2, '0')
  const goalISO = goal
    ? `${goal.getFullYear()}-${pad(goal.getMonth() + 1)}-${pad(goal.getDate())}`
    : ''

  return {
    goal,
    goalISO,
    cohort: goal ? `${goal.getFullYear()} 届` : '',
    naturalDays,
    naturalAbs,
    workdays,
    over,
    yearsRough: Math.floor(naturalAbs / 365),
    remainderDays: naturalAbs % 365,
    progressPct,
  }
}
