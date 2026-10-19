/**
 * Chrome allows one offscreen document per extension at a time, and the Privacy Pools prover and
 * Tornado Cash each have their own. They are never needed together (each serves the private
 * account that is selected), so opening one closes the other, whose owner sees its port
 * disconnect and opens it again when next needed.
 */

// Not in this version of `@types/chrome`
const WORKERS_REASON = 'WORKERS' as chrome.offscreen.Reason
type ChromeRuntimeWithContexts = typeof chrome.runtime & {
  getContexts?: (filter: { contextTypes: string[]; documentUrls?: string[] }) => Promise<unknown[]>
}

/**
 * Serializes opening and closing, so two callers never both see a document open and both close it
 * (the second fails with "No current offscreen document").
 */
let queue: Promise<unknown> = Promise.resolve()

/** Whether an offscreen document is open: `documentUrl`'s, or any when it is left out. */
export const hasOffscreenDocument = async (documentUrl?: string): Promise<boolean> => {
  const runtime: ChromeRuntimeWithContexts = chrome.runtime
  // Chrome 116+. Before it, nothing can tell, and a leftover document makes `createDocument` fail
  if (!runtime.getContexts) return false

  const contexts = await runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    ...(documentUrl ? { documentUrls: [documentUrl] } : {})
  })
  return contexts.length > 0
}

/**
 * Opens `path` as the offscreen document, first closing whichever is open: one left over from
 * before the service worker restarted (which has lost its port), or the other feature's.
 */
export const openOffscreenDocument = ({
  path,
  justification
}: {
  path: string
  justification: string
}): Promise<void> => {
  const open = queue.then(async () => {
    if (await hasOffscreenDocument()) await chrome.offscreen.closeDocument()

    await chrome.offscreen.createDocument({ url: path, reasons: [WORKERS_REASON], justification })
  })
  // The next opening or closing waits for this one, whether it worked or not
  queue = open.catch(() => {})

  return open
}

/** Closes `documentUrl`'s offscreen document if it is the open one, in turn with openings. */
export const closeOffscreenDocument = (documentUrl: string): Promise<void> => {
  const close = queue.then(async () => {
    if (await hasOffscreenDocument(documentUrl)) await chrome.offscreen.closeDocument()
  })
  queue = close.catch(() => {})

  return close
}
