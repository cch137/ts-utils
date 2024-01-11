const isWebdriver = (nav: Navigator) => {
  const webdriver = Boolean(nav?.webdriver)
  if (webdriver) return true
  // 偵測 webdriver 是否有被重新定義，當被重新定義時是不正常請求
  const isRedefinedWebdriver = Object.keys(
    Object.getOwnPropertyDescriptors(nav)
  ).includes('webdriver')
  return isRedefinedWebdriver
}

const isPlatformNotSame = (nav: Navigator) => {
  const { userAgent = '', platform = '' } = nav
  const _platform = platform.startsWith('Win')
    ? 'Win'
    : platform.startsWith('Linux')
      ? 'Linux'
      : platform.startsWith('Mac')
        ? 'Mac'
        : platform
  return !userAgent.includes(_platform)
}

const isPluginsErr = (doc: Document, nav: Navigator) => {
  const { plugins = [] }: { plugins: PluginArray | any[] } = nav
  // 如果是觸屏的話就不檢測了
  if ('ontouchstart' in doc || nav.maxTouchPoints > 0) {
    return false
  }
  // 如果 plugins 不存在或是沒有 plugins，是爬蟲
  if (!plugins || plugins.length === 0) {
    return true
  }
  const pluginList = Object.values(Object.getOwnPropertyDescriptors(plugins)).map(p => p.value)
  // 以下這個情況就是沒有 namedItem 的情況，不正常，是爬蟲
  if (pluginList.length === plugins.length) {
    return true
  }
  // 如果 plugins 裡面的東西不是 Plugin 這個類，是爬蟲
  const pluginsConstructorsTesting = pluginList.map(p => p.constructor === Plugin)
  if (pluginsConstructorsTesting.filter(p => p).length !== pluginsConstructorsTesting.length) {
    return true
  }
  return false
}

const isLanguageErr = (nav: Navigator) => {
  const { language = '', languages = [] } = nav
  return !language || !languages || languages.length === 0
}

const isChromeErr = (win: Window = window, nav: Navigator) => {
  // @ts-ignore
  const { chrome } = win
  const { userAgent = '' } = nav
  return userAgent.includes('Chrome') ? !chrome : false
}
const tryDefault = (callback: () => boolean, defaultValue: boolean = true) => {
  try {
    return callback()
  } catch {
    return defaultValue
  }
}

const isHeadless = (win: Window = window, doc: Document = document, nav: Navigator = navigator) => {
  /** webdriver 存在（通常無頭瀏覽器 webdriver 都是 true） */
  const wd = tryDefault(() => isWebdriver(nav))
  /** Plugins 異常（無頭瀏覽器沒有 Plugins，例如一些瀏覽器的插件，包括 PDF 查看器） */
  const pg = tryDefault(() => isPluginsErr(doc, nav))
  /** language(s) 不存在（只有較舊的無頭請求才被抓到） */
  const lg = tryDefault(() => isLanguageErr(nav))
  /** navigator.platform 和 userAgent 中的 platform 不符合 */
  const pf = tryDefault(() => isPlatformNotSame(nav))
  /** Chromium 瀏覽器的沒有 window.chrome 屬性 */ // @ts-ignore
  const cr = tryDefault(() => isChromeErr(win, nav))
  return {
    valid: cr || lg || pf || pg || wd,
    details: { wd, pg, lg, pf, cr }
  }
}

export default isHeadless
