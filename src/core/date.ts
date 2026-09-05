import { dayStart } from './retirement'

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
