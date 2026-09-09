import { describe, expect, it } from 'vitest'
import { MIN_BIRTH_ISO, validDaysForMonth, yearsMonthsUntil } from './date'

describe('birth date bounds', () => {
  it('supports people born before 1970', () => {
    expect(MIN_BIRTH_ISO).toBe('1900-01-01')
  })

  it('only offers days that exist in the selected month', () => {
    expect(validDaysForMonth(1968, 4)).toHaveLength(30)
    expect(validDaysForMonth(1968, 4)).not.toContain(31)
  })

  it('only permits February 29 in leap years', () => {
    expect(validDaysForMonth(1968, 2)).toContain(29)
    expect(validDaysForMonth(1969, 2)).not.toContain(29)
  })

  it('formats the remaining full calendar years and months', () => {
    expect(yearsMonthsUntil(new Date(2026, 8, 9), new Date(2052, 6, 1))).toEqual({ years: 25, months: 9 })
  })
})
