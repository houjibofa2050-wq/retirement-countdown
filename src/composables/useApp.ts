import { computed, reactive, ref, watch } from 'vue'
import type { Gender, PlanType } from '../core/retirement'
import { estimateRetirementDate, todayStart } from '../core/retirement'
import { parseISO, dateToISO } from '../core/date'
import { loadState, saveState } from '../core/storage'

/**
 * 同一个人的档案（出生日期共享），但「城镇职工 worker」与「城乡居民 resident」
 * 两档口径字段彼此独立：各自保留“自定义到龄日 / 昵称”，worker 另有性别(岗位)。
 * 切参保类型时出生日不变，各自档位回到它为它设的值——互不覆盖。
 * 对外仍暴露 gender / customRetireISO / name 三个可变引用，模板零改动。
 */

export function useApp() {
  const saved = loadState()
  const p = saved?.profile ?? null

  const birthISO = ref<string>(p?.birthISO ?? '')
  const plan = ref<PlanType>(p?.plan ?? 'worker')

  // 两档各自的持久字段
  const worker = reactive({
    gender: (p?.worker?.gender ?? 'male') as Gender,
    custom: p?.worker?.customRetireISO ?? '',
    name: p?.worker?.name ?? ''
  })
  const resident = reactive({
    custom: p?.resident?.customRetireISO ?? '',
    name: p?.resident?.name ?? ''
  })

  const profileSeen = ref(!!p)
  const showConfig = ref(!p)

  const birthDate = computed<Date | null>(() =>
    birthISO.value.length === 10 ? parseISO(birthISO.value) : null
  )

  function buildProfile() {
    if (birthISO.value.length !== 10) return null
    return {
      birthISO: birthISO.value,
      plan: plan.value,
      worker: {
        gender: worker.gender,
        customRetireISO: worker.custom || null,
        name: worker.name
      },
      resident: {
        customRetireISO: resident.custom || null,
        name: resident.name
      }
    }
  }
  function persist() {
    const prof = buildProfile()
    if (!prof) return
    profileSeen.value = true
    // eslint-disable-next-line @typescript-eslint/unbound-method
    saveState({ profile: prof, seed: 1, staleDate: todayStart().toISOString() })
  }

  // —— 对外可变引用（模板沿用原名，App.vue 无需改动） ——
  // gender：worker 专属；居民界面不渲染，仅保留“上次职工选择”。
  const gender = computed<Gender>({
    get: () => worker.gender,
    set: (v: Gender) => (worker.gender = v)
  })

  const customRetireISO = computed<string>({
    get: () => (plan.value === 'worker' ? worker.custom : resident.custom),
    set: (v: string) => {
      if (plan.value === 'worker') worker.custom = v
      else resident.custom = v
    }
  })

  const name = computed<string>({
    get: () => (plan.value === 'worker' ? worker.name : resident.name),
    set: (v: string) => {
      if (plan.value === 'worker') worker.name = v
      else resident.name = v
    }
  })

  const usesCustom = computed(() =>
    plan.value === 'worker' ? !!worker.custom : !!resident.custom
  )

  const targetDate = computed<Date | null>(() => {
    const b = birthDate.value
    if (!b) return null
    const custom = plan.value === 'worker' ? worker.custom : resident.custom
    if (custom) return parseISO(custom)
    return estimateRetirementDate(b, worker.gender, plan.value)
  })
  const targetYear = computed(() => targetDate.value?.getFullYear() ?? null)
  const displayName = computed(() => {
    const nm = plan.value === 'worker' ? worker.name : resident.name
    return nm || (targetYear.value ? `${targetYear.value} 届` : '打工人届')
  })
  const retireDateLabel = computed(() =>
    targetDate.value ? dateToISO(targetDate.value) : ''
  )
  const whoLabel = computed(() =>
    plan.value === 'resident' ? '城乡居民 · 满60领取' : ''
  )

  // 任意字段（含切档）变化均落盘
  watch(
    [
      () => birthISO.value,
      () => plan.value,
      () => worker.gender,
      () => worker.custom,
      () => worker.name,
      () => resident.custom,
      () => resident.name
    ],
    persist,
    { flush: 'sync' }
  )

  function openConfig() {
    showConfig.value = true
  }
  function confirmConfig() {
    persist()
    showConfig.value = false
  }

  const now = ref(new Date())
  setInterval(() => (now.value = new Date()), 1000)

  return {
    birthISO,
    plan,
    gender,
    customRetireISO,
    name,
    usesCustom,
    whoLabel,
    birthDate,
    targetDate,
    targetYear,
    displayName,
    retireDateLabel,
    profileSeen,
    showConfig,
    openConfig,
    confirmConfig,
    now
  }
}
