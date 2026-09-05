import { describe, expect, it } from 'vitest'
import { MIN_BIRTH_ISO } from './date'

describe('birth date bounds', () => {
  it('supports people born before 1970', () => {
    expect(MIN_BIRTH_ISO).toBe('1900-01-01')
  })
})
