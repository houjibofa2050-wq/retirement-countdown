import { describe, it, expect } from 'vitest'
import { computeRetirement } from './retirement'

function b(y: number, m: number, day = 15): Date {
  return new Date(y, m - 1, day)
}
type G = Parameters<typeof computeRetirement>[1]
function expectPlan(
  name: string,
  birth: Date,
  gender: G,
  want: { delay: number; y: number; m: number; capped?: boolean }
) {
  const p = computeRetirement(birth, gender)
  expect(p, `${name}: 不应为 null`).not.toBeNull()
  if (!p) return
  const gm = p.goal.getMonth() + 1
  expect(p.delayMonths, `${name} delayMonths`).toBe(want.delay)
  expect(p.goal.getFullYear(), `${name} 目标年`).toBe(want.y)
  expect(gm, `${name} 目标月`).toBe(want.m)
  if (want.capped !== undefined) expect(p.capped, `${name} capped`).toBe(want.capped)
}

describe('渐进式延迟法定退休年龄 computeRetirement', () => {
  it('男职工：样本匹配官方对照表（每4月+1，1965-01 起 +1）', () => {
    expectPlan('male 1965-01', b(1965, 1), 'male', { delay: 1, y: 2025, m: 2 })
    expectPlan('male 1965-05', b(1965, 5), 'male', { delay: 2, y: 2025, m: 7 })
    expectPlan('male 1966-09', b(1966, 9), 'male', { delay: 6, y: 2027, m: 3 })
    expectPlan('male 1972-09', b(1972, 9), 'male', { delay: 24, y: 2034, m: 9 })
  })

  it('男职工高阶封顶：1976-09 起即达 63 岁（capped delay36）', () => {
    expectPlan('male 1976-09 capped', b(1976, 9), 'male', { delay: 36, y: 2039, m: 9, capped: true })
    expectPlan('male 1983-06 capped', b(1983, 6), 'male', { delay: 36, y: 2046, m: 6, capped: true })
  })

  it('女干部(原55)：1970-01 起 +1，按 4 月档，约 1981 后封顶 58', () => {
    expectPlan('cadre 1970-01', b(1970, 1), 'female-cadre', { delay: 1, y: 2025, m: 2 })
    expectPlan('cadre 1975-01', b(1975, 1), 'female-cadre', { delay: 16, y: 2031, m: 5 })
    expectPlan('cadre 1982-01 capped→58', b(1982, 1), 'female-cadre', { delay: 36, y: 2040, m: 1, capped: true })
  })

  it('女工人(原50)：1975-01 起 +1，按 2 月档逐步到 55', () => {
    expectPlan('worker 1975-01', b(1975, 1), 'female-worker', { delay: 1, y: 2025, m: 2 })
    expectPlan('worker 1976-05', b(1976, 5), 'female-worker', { delay: 9, y: 2027, m: 2 })
  })

  it('城乡居民：不分男女/岗位，统一出生满 60 周岁领取，且不参与渐进延迟', () => {
    const rMale = computeRetirement(b(1965, 5), 'male', 'resident')
    expect(rMale).not.toBeNull()
    expect(rMale?.delayMonths).toBe(0)
    expect(rMale?.capped).toBe(false)
    expect(rMale?.goal).toEqual(new Date(2025, 4, 15)) // 1965-05 + 60 岁

    const rFem = computeRetirement(b(1970, 1), 'female-cadre', 'resident')
    expect(rFem?.goal).toEqual(new Date(2030, 0, 15)) // 1970-01 + 60 岁（与性别无关）
    expect(rFem?.delayMonths).toBe(0)
  })
})
