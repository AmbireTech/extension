import { Linking } from 'react-native'

export const openInTab = async ({ url }: { url: string; shouldCloseCurrentWindow?: boolean }) => {
  await Linking.openURL(url)
}

export const openInternalPageInTab = async ({
  route,
  params
}: {
  route: string
  params?: any
}) => {
  if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
    ;(window as any).ReactNativeWebView.postMessage(JSON.stringify({
      type: 'action.navigate',
      payload: { route, params }
    }))
  } else {
    console.warn('openInternalPageInTab called outside of ReactNativeWebView context')
  }
}
