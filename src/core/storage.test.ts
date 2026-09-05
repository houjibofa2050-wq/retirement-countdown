import { describe, expect, it } from 'vitest'
import { migrateLegacyProfile } from './storage'

// 纯函数迁移：旧扁平 v1 存档 → 新双档结构，两档字段各自独立、不互相污染。
describe('migrateLegacyProfile（旧扁平存档 → worker/resident 双档）', () => {
  it('旧 worker 存档：量值整体归属 worker，居民档给空默认且不携带职工自定到龄日', () => {
    const p = migrateLegacyProfile({
      birthISO: '1983-06-15',
      plan: 'worker',
      gender: 'female-cadre',
      customRetireISO: null,
      name: '陈女士届'
    })
    expect(p).not.toBeNull()
    expect(p?.birthISO).toBe('1983-06-15')
    expect(p?.plan).toBe('worker')
    expect(p?.worker.gender).toBe('female-cadre')
    expect(p?.worker.customRetireISO).toBeNull()
    expect(p?.worker.name).toBe('陈女士届')
    // 居民档不应吸附职工侧值
    expect(p?.resident.customRetireISO).toBeNull()
    expect(p?.resident.name).toBe('')
  })

  it('旧 resident 存档：gender 即使残存也不并入居民,带出到居民 custom，worker 留下默认', () => {
    const p = migrateLegacyProfile({
      birthISO: '1970-01-01',
      plan: 'resident',
      gender: 'female-worker',
      customRetireISO: '2040-06-01',
      name: '某某村'
    })
    expect(p?.plan).toBe('resident')
    expect(p?.resident.customRetireISO).toBe('2040-06-01') // 居民自己的到龄日归居民
    expect(p?.resident.name).toBe('某某村')
    expect(p?.worker.customRetireISO).toBeNull() // 不带进职工档
    // worker 侧仍然记住历史上曾选过的性别（即便切换居民也不丢「最近职工选择」）
    expect(p?.worker.gender).toBe('female-worker')
  })

  it('已结构化的新存档直接透传（幂等）', () => {
    const double = migrateLegacyProfile({
      birthISO: '1985-03-03',
      plan: 'worker',
      worker: { gender: 'male', customRetireISO: null, name: 'A' },
      resident: { customRetireISO: '2045-01-01', name: 'B' }
    })
    expect(double?.plan).toBe('worker')
    expect(double?.worker.gender).toBe('male')
    expect(double?.resident.customRetireISO).toBe('2045-01-01')
    expect(double?.resident.name).toBe('B')
  })
})
