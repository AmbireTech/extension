import { Linking } from 'react-native'

export const openInTab = async ({
  url,
  windowId,
  shouldCloseCurrentWindow
}: {
  url: string
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}) => {
  await Linking.openURL(url)
}

export const openInternalPageInTab = async ({
  route,
  params,
  searchParams,
  windowId,
  shouldCloseCurrentWindow
}: {
  route: string
  params?: any
  searchParams?: any
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}) => {
  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    ;(window as any).ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'action.navigate',
        payload: {
          route,
          params: searchParams || params,
          windowId,
          shouldCloseCurrentWindow
        }
      })
    )
  } else {
    console.warn('openInternalPageInTab called outside of ReactNativeWebView context')
  }
}
