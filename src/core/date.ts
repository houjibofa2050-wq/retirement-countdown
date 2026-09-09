import { dayStart } from './retirement'

// Native mobile date pickers need an explicit lower bound to show older years.
export const MIN_BIRTH_ISO = '1900-01-01'

/** 返回指定年月实际存在的日期，供日期选择器避免无效组合。 */
export function validDaysForMonth(year: number, month: number): number[] {
  const days = new Date(year, month, 0).getDate()
  return Array.from({ length: days }, (_, index) => index + 1)
}

/** 两个日期之间相隔的完整日历年与月，用于人类可读的长期倒计时。 */
export function yearsMonthsUntil(from: Date, to: Date): { years: number; months: number } {
  let totalMonths = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth()
  if (to.getDate() < from.getDate()) totalMonths--
  totalMonths = Math.max(0, totalMonths)
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 }
}

/** 解析 YYYY-MM-DD 为 Day 零点 Date；非法回退到今天。 */
export function parseISO(iso: string): Date {
  const d = dayStart(new Date(iso + 'T00:00:00'))
  return Number.isNaN(d.getTime()) ? dayStart(new Date()) : d
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Date -> YYYY-MM-DD */
export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Date -> 中文 “2036 年 4 月” */
export function yearMonthCN(d: Date): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
}
