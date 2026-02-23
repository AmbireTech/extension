import { Linking } from 'react-native'

export const openInTab = async ({ url }: { url: string; shouldCloseCurrentWindow?: boolean }) => {
  await Linking.openURL(url)
}

export const createTab = async (url: string) => {
  await Linking.openURL(url)
}
