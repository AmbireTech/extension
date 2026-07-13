import { Session } from '@ambire-common/classes/session'
import { MainController } from '@ambire-common/controllers/main/main'
import { ConnectionSource } from '@ambire-common/interfaces/dapp'
import { isSidePanelView } from '@ambire-common/interfaces/ui'
import { browser } from '@web/constants/browserapi'

const ALLOWED_TAB_URL_PREFIXES = ['http://', 'https://', 'file://']
const FOCUS_DISPATCH_DELAY_MS = 300
const FOCUS_DISPATCH_DEBOUNCE_MS = 1000

let lastFocusDispatchAt = 0
let pendingFocusDispatchTimeout: ReturnType<typeof setTimeout> | undefined

export type DappTabTarget = {
  tabId: number
  windowId?: number
}

export const isSidePanelOpen = (mainCtrl: MainController) =>
  mainCtrl.ui.views.some(isSidePanelView)

const isLikelyChromeTabId = (tabId: number) => tabId > 0 && tabId < 1_000_000_000

const dedupeTabTargets = (targets: DappTabTarget[]) => {
  const uniqueTargets = new Map<number, DappTabTarget>()
  targets.forEach((target) => {
    if (!isLikelyChromeTabId(target.tabId)) return
    uniqueTargets.set(target.tabId, target)
  })

  return [...uniqueTargets.values()]
}

export const getDappTabTargetsFromDappId = (
  mainCtrl: MainController,
  dappId: string,
  source?: ConnectionSource
): DappTabTarget[] => {
  const targets: DappTabTarget[] = []

  const sessions = Object.values(mainCtrl.dapps.dappSessions) as Session[]

  sessions.forEach((session) => {
    if (session.id !== dappId) return

    if (source === 'wc' && !session.wcTopic) return
    if (source === 'injected' && session.wcTopic) return

    targets.push({
      tabId: session.tabId,
      windowId: session.windowId
    })
  })

  return dedupeTabTargets(targets)
}

export const getDappTabTargetsFromDappIds = (
  mainCtrl: MainController,
  dappIds: string[],
  source?: ConnectionSource
): DappTabTarget[] =>
  dedupeTabTargets(
    dappIds.flatMap((dappId) => getDappTabTargetsFromDappId(mainCtrl, dappId, source))
  )

export const dispatchFocusEventToTab = async ({ tabId, windowId }: DappTabTarget) => {
  if (!isLikelyChromeTabId(tabId)) return
  if (!browser?.tabs?.get || !browser?.scripting?.executeScript) return

  try {
    const tab = await browser.tabs.get(tabId)
    const tabUrl = tab?.url

    if (!tabUrl || !ALLOWED_TAB_URL_PREFIXES.some((prefix) => tabUrl.startsWith(prefix))) return

    const resolvedWindowId = windowId ?? tab.windowId

    // Request-window flow returns OS focus to the dapp tab on close. In side-panel mode
    // the browser window stays focused on the panel, so React Query-based dapps stay stale.
    if (resolvedWindowId && browser.windows?.update) {
      await browser.windows.update(resolvedWindowId, { focused: true })
    }

    if (!tab.active) {
      await browser.tabs.update(tabId, { active: true })
    }

    // Match mobile WebView parity: a synthetic window focus is enough for wagmi / React Query.
    await browser.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'MAIN',
      injectImmediately: true,
      func: () => {
        try {
          window.dispatchEvent(new Event('focus'))
        } catch {
          // noop
        }
      }
    })
  } catch (error) {
    console.error('Failed to dispatch focus event to dapp tab', error)
  }
}

export const scheduleDappTabFocusDispatch = (
  targets: DappTabTarget[],
  delayMs = FOCUS_DISPATCH_DELAY_MS
) => {
  if (!browser?.tabs) return

  const validTargets = dedupeTabTargets(targets)
  if (!validTargets.length) return

  if (pendingFocusDispatchTimeout) clearTimeout(pendingFocusDispatchTimeout)

  pendingFocusDispatchTimeout = setTimeout(async () => {
    pendingFocusDispatchTimeout = undefined

    const now = Date.now()
    if (now - lastFocusDispatchAt < FOCUS_DISPATCH_DEBOUNCE_MS) return

    lastFocusDispatchAt = now
    await Promise.all(validTargets.map((target) => dispatchFocusEventToTab(target)))
  }, delayMs)
}

export const dispatchDappTabFocusFromMainCtrl = (
  mainCtrl: MainController,
  targets: DappTabTarget[],
  delayMs?: number
) => {
  if (!isSidePanelOpen(mainCtrl)) return

  scheduleDappTabFocusDispatch(targets, delayMs)
}
