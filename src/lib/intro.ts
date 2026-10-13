import { useSyncExternalStore } from 'react'

/** Состояние вступления: пока false, Hero ждёт; true — шторки открылись, можно играть вход. */
let done = false
const subs = new Set<() => void>()

export const markIntroDone = () => {
  if (done) return
  done = true
  subs.forEach((f) => f())
}

export const useIntroDone = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => done,
    () => true,
  )

const KEY = 'nagoo:preloaded'

/** Прелоадер только при первом визите в сессии. ?preload=1 форсирует показ, ?preload=0 отключает. */
export function shouldPreload(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('preload')
    if (q === '0') return false
    if (q === '1') return true
    return sessionStorage.getItem(KEY) !== '1'
  } catch {
    return true
  }
}

export function rememberPreload() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {
    /* приватный режим: просто покажем снова */
  }
}
