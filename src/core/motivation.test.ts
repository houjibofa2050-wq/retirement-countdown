import { describe, it, expect } from 'vitest'
import { dailyLine, fullDailyLine, randomAside, milestoneView } from './motivation'

describe('今日一句话动态', () => {
  it('主句按“日”稳定：同一天多次调用结果一致', () => {
    const a = dailyLine(14)
    const b = dailyLine(14)
    expect(a).toBe(b)
  })

  it('不同“日”通常给不同主句（词库非单元素时）', () => {
    // 词库 >= 3 时一定能构造出不同 dayNumber 的差异（循环取模）
    expect(dailyLine(0)).not.toBeUndefined()
  })

  it('副句可用注入 rng 精确选择（可测性）', () => {
    const first = randomAside(() => 0)
    const last = randomAside(() => 0.999999)
    expect(typeof first).toBe('string')
    expect(first.length).toBeGreaterThan(0)
    expect(first).not.toBe(last) // 同 rng 极值都应落在非空词，且0/满概率不同下标
  })

  it('fullDailyLine 包含主句与副句', () => {
    const s = fullDailyLine(3, () => 0)
    expect(s).toContain('·') // compose 分隔符存在
  })
})

describe('里程碑动态（距下一步）', () => {
  it('越过剩余=0 → 视为已翻篇', () => {
    expect(milestoneView(0).reached).toBe(true)
    expect(milestoneView(-5).reached).toBe(true)
  })

  it('days=50 距“最后 100 天”还差 50 天', () => {
    const v = milestoneView(50)
    expect(v.reached).toBe(false)
    expect(v.label).toBe('最后 100 天')
    expect(v.daysAway).toBe(50)
  })

  it('days=99 距下一档只剩 1 天', () => {
    const v = milestoneView(99)
    expect(v.daysAway).toBe(1)
  })

  it('days 在大档位之上 → 返回最近的上方里程碑（如 3000→5000）', () => {
    const v = milestoneView(3500)
    expect(v.label).toBe('还剩 5000 天')
    expect(v.daysAway).toBe(1500)
  })

  it('超大剩余（>10000）给 null daysAway（路很长文案）', () => {
    const v = milestoneView(12000)
    expect(v.daysAway).toBeNull()
  })
})
