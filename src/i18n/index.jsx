import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import vi from './vi.js'
import en from './en.js'

// Tiny i18n: one dictionary per language, Vietnamese is the default.
// A value is either a string with {name} placeholders or a function of the vars.
export const DICTS = { vi, en }
export const LANGS = ['vi', 'en']
const STORE_KEY = 'sodan.lang'

const readLang = () => {
  try {
    const l = localStorage.getItem(STORE_KEY)
    return DICTS[l] ? l : 'vi'
  } catch {
    return 'vi'
  }
}

const format = (val, vars) =>
  typeof val === 'function' ? val(vars || {}) : vars ? val.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : val

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readLang)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = format(DICTS[lang]['app.title'])
    try {
      localStorage.setItem(STORE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      const val = DICTS[lang][key] ?? DICTS.vi[key]
      if (val === undefined) {
        if (import.meta.env.DEV) console.warn('[i18n] missing key', key)
        return key
      }
      return format(val, vars)
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, t, locale: lang === 'vi' ? 'vi-VN' : 'en-US' }),
    [lang, t],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
export const useT = () => useContext(Ctx).t
