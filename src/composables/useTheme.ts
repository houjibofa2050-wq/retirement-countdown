// 主题（亮/暗）：简单持久化两态 + 首次用系统偏好。
import { ref } from 'vue'

const KEY = 'rd-theme' // 'dark' | 'light'

function systemPrefersDark(): boolean {
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(dark: boolean) {
  const el = document.documentElement
  el.setAttribute('data-theme', dark ? 'dark' : 'light')
}

function boot(): boolean {
  let dark: boolean
  const stored = localStorage.getItem(KEY)
  if (stored === 'dark') dark = true
  else if (stored === 'light') dark = false
  else dark = systemPrefersDark()
  apply(dark)
  return dark
}

export function useTheme() {
  const isDark = ref(boot())

  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
    try {
      localStorage.setItem(KEY, isDark.value ? 'dark' : 'light')
    } catch {
      /* noop：隐私模式下仅内存生效 */
    }
  }

  return { isDark, toggle }
}
