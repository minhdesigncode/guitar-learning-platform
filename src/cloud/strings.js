// Account / cloud strings, vi + en. Follows the key style of src/i18n so they can move into
// the main dictionaries once that lands; until then the language comes from <html lang>.
const DICT = {
  vi: {
    'auth.signIn': 'Đăng nhập',
    'auth.signInGoogle': 'Đăng nhập bằng Google',
    'auth.signOut': 'Đăng xuất',
    'auth.why': 'Đăng nhập để lưu bài hát và bản thu lên cloud, mở trên máy nào cũng thấy.',
    'auth.notConfigured': 'Chưa bật cloud: thiếu cấu hình Supabase.',
    'auth.menu': 'Tài khoản',
    'sync.syncing': 'Đang đồng bộ…',
    'sync.ok': 'Đã đồng bộ {time}',
    'sync.error': 'Đồng bộ lỗi, sẽ thử lại',
    'sync.offline': 'Đang offline, dữ liệu vẫn lưu trên máy',
    'sync.now': 'Đồng bộ ngay',
    'auth.required': 'Cần đăng nhập để dùng chức năng này.',
  },
  en: {
    'auth.signIn': 'Sign in',
    'auth.signInGoogle': 'Sign in with Google',
    'auth.signOut': 'Sign out',
    'auth.why': 'Sign in to save songs and recordings to the cloud and open them on any device.',
    'auth.notConfigured': 'Cloud is off: Supabase is not configured.',
    'auth.menu': 'Account',
    'sync.syncing': 'Syncing…',
    'sync.ok': 'Synced {time}',
    'sync.error': 'Sync failed, will retry',
    'sync.offline': 'Offline, data is still saved on this device',
    'sync.now': 'Sync now',
    'auth.required': 'Sign in to use this feature.',
  },
}

export function ta(key, vars) {
  const lang = (typeof document !== 'undefined' && document.documentElement.lang) === 'en' ? 'en' : 'vi'
  const s = DICT[lang][key] ?? DICT.vi[key] ?? key
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s
}
