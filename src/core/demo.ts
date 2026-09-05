import type { Gender, PlanType } from './retirement'
import { dayStart, estimateRetirementDate } from './retirement'

// 演示资料：让第一次打开的用户不填也能感受倒计数的冲击。
// 出生日期尽量取“已明确会走延迟退休新规”以外仍安全的普通档，仅为展示。
export interface DemoTuple {
  birthISO: string
  plan: PlanType
  gender: Gender
  customRetireISO: string | null
}

export function demoProfile(): DemoTuple {
  return {
    birthISO: '1983-06-15',
    plan: 'worker',
    gender: 'male',
    customRetireISO: null
  }
}

/** 界别暱称：直接取估算法定退休年 + “届”。如 “2036 届”。 */
export function cohortName(
  birthISO: string,
  gender: Gender,
  plan: PlanType = 'worker'
): string {
  const birth = dayStart(new Date(birthISO + 'T00:00:00'))
  if (Number.isNaN(birth.getTime())) return '打工人届'
  const retire = estimateRetirementDate(birth, gender, plan)
  return `${retire.getFullYear()} 届`
}
