// 纯本地存储（localStorage）。不设置任何上传逻辑。
import type { Gender, PlanType } from './retirement'

/** 城镇职工侧：带性别/岗位（渐进延退口径）。 */
export interface WorkerSide {
  gender: Gender
  customRetireISO: string | null
  name: string
}
/** 城乡居民侧：无性别概念，只保留“自定义到龄日/昵称”——与职工侧互不串。 */
export interface ResidentSide {
  customRetireISO: string | null
  name: string
}

export interface Profile {
  birthISO: string // YYYY-MM-DD（同一份档案的共享主体）
  /** 当前激活的参保类型 */
  plan: PlanType
  worker: WorkerSide // 职工档：出生 + gender/自定/名称
  resident: ResidentSide // 居民档：独立 自定/名称
}

export interface AppState {
  profile: Profile | null
  seed: number
  staleDate: string | null
}

const KEY = 'retirement-countdown:v1'

function defaultWorker(): WorkerSide {
  return { gender: 'male', customRetireISO: null, name: '' }
}
function defaultResident(): ResidentSide {
  return { customRetireISO: null, name: '' }
}

/**
 * 兼容旧存档（v1 扁平结构：birthISO/gender/customRetireISO/name/plan，无 worker/resident）。
 * 旧 worker 用户若保留在旧档，则把平级量整体认作 worker 侧；若旧档曾切过 resident，
 * 我们只迁移当前活跃档，居民另一侧给空默认（首次居民时用户自行填）。
 */
export function migrateLegacyProfile(old: any): Profile | null {
  if (!old || typeof old !== 'object') return null
  if (old.worker && old.resident) return old as Profile // 已是新结构

  const birthISO = String(old.birthISO ?? '')
  if (birthISO.length !== 10) return null

  const plan: PlanType = old.plan === 'resident' ? 'resident' : 'worker'
  const worker: WorkerSide = {
    gender: old.gender === 'female-worker' || old.gender === 'female-cadre' ? old.gender : 'male',
    customRetireISO:
      plan === 'worker' &&
      typeof old.customRetireISO === 'string' &&
      old.customRetireISO
        ? old.customRetireISO
        : null,
    name: plan === 'worker' && typeof old.name === 'string' ? old.name : ''
  }
  const resident: ResidentSide = {
    customRetireISO:
      plan === 'resident' &&
      typeof old.customRetireISO === 'string' &&
      old.customRetireISO
        ? old.customRetireISO
        : null,
    name: plan === 'resident' && typeof old.name === 'string' ? old.name : ''
  }
  return { birthISO, plan, worker, resident }
}

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    if (!parsed) return null
    if (parsed.profile && !parsed.profile.worker) {
      const migrated = migrateLegacyProfile(parsed.profile)
      if (!migrated) return null
      parsed.profile = migrated
    }
    return parsed
  } catch {
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 存储不可用时静默降级（如隐私模式），界面仍可见当前倒计时 */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

export { defaultResident, defaultWorker }
