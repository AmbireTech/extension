import { Linking } from 'react-native'

export const openInTab = async ({ url }: { url: string; shouldCloseCurrentWindow?: boolean }) => {
  await Linking.openURL(url)
}
