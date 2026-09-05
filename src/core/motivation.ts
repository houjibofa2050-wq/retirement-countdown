// 文案：正向打气主句 + 轻副句 + 动态里程碑。
// 主句按“日”稳定（读感一致）；副句/里程碑随日期与剩余天数动态，避免每次都一模一样。

export type Rng = () => number

const MAIN_LINES: string[] = [
  '每上一天班，都离那份自由更近一步。',
  '你为准备的每一天，都在给未来的自己存假期。',
  '把它当作为一趟远行在筹备——现在正是攒经费的冲刺期。',
  '好好吃饭，准时下班，别让未来的你背现在的包袱。',
  '今天的你，正在替几年后的你悄悄铺路。',
  '数清剩余的日子是本事，把当下过好更是本事。',
  '这不是倒数刑期，是翻开下一章前的页码。',
  '自由不是终点，是你早就在积攒的一张通行证。',
  '偶尔觉得漫长，是因为离得越近，愿望越清晰。',
  '把目标写下来，日子会替你先出发。',
  '不必熬到按钮变绿，先让今天有个小小的盼头。',
  '认真上班是对现在的负责，认真向往是对未来的深情。',
  '每填一格进度，都是在给“退休生活”充值。',
  '别人倒计时的是假期，你倒计时的是下一段自己。',
]

const ASIDE_POOL: string[] = [
  '少加班，多攒点回忆。',
  '午休晒晒太阳，也算在为自由热身。',
  '今天也记得喝水。',
  '给十年后的自己写一小句，现在就能做。',
  '发呆五分钟，不算浪费。',
  '把工位收拾干净，心情会跟着松动。',
  '存个小金库，专给“自由后的第一年”。',
  '试着早睡半小时。',
  '列一个退休愿望清单，愿望要有名字。',
  '下次休假，试着不设行程。',
  '善待同事，他们之后可能还是你的牌友。',
  '别把身体当透支额度用。',
  '学会拒绝一次不必要的加班。',
  '给家里打个电话，提醒自己为何在坚持。',
  '放下手机走一圈，思路和心情会一起回正。',
  '想象一下：到了那一天，你会先做哪一件事？',
]

/** 主句：按“天”稳定（同一天内一致，读感好）。 */
export function dailyLine(dayNumber: number): string {
  const idx = ((dayNumber % MAIN_LINES.length) + MAIN_LINES.length) % MAIN_LINES.length
  return MAIN_LINES[idx]
}

/** 今日完整话术：主句（稳定）+ 「轻副句」。副句让随随机从池抽。 */
export function fullDailyLine(dayNumber: number, rng: Rng = Math.random): string {
  return `${dailyLine(dayNumber)} · ${randomAside(rng)}`
}

/** 轻副句：短、不扰眼，动态可选。 */
export function randomAside(rng: Rng = Math.random): string {
  const i = Math.floor(rng() * ASIDE_POOL.length)
  return ASIDE_POOL[i]
}

/** 里程碑节点（自然日，升序）。取最近一个严格“大于剩余”的档位作为下一个目标。 */
const MILESTONES: Array<[number, string]> = [
  [1, '最后 1 天'],
  [100, '最后 100 天'],
  [365, '最后 1 年'],
  [1000, '最后 1000 天'],
  [2000, '还剩 2000 天'],
  [5000, '还剩 5000 天'],
  [10000, '还剩 10000 天'],
]

export interface MilestoneView {
  reached: boolean
  label: string
  /** 距下一个里程碑还有多少自然日（>0） */
  daysAway: number | null
}

/** 给你“距最近一个里程碑还差几天”，从而随剩余天数动态变化。 */
export function milestoneView(daysLeft: number): MilestoneView {
  // 已自由（<=0）
  if (daysLeft <= 0) return { reached: true, label: '到达 / 已翻篇', daysAway: null }
  const next = MILESTONES.find(([n]) => daysLeft < n)
  if (!next) return { reached: false, label: '再往后就到', daysAway: null }
  return { reached: false, label: next[1], daysAway: next[0] - daysLeft }
}
