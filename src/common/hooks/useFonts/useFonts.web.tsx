import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono'
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  useFonts as useFontsRn
} from '@expo-google-fonts/poppins'
import {
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black
} from '@expo-google-fonts/roboto'

import { UseFontsReturnType } from './constants'

// Web implementation: fonts are loaded at runtime and registered as @font-face families.
// The family names (map keys) are the PostScript names so they match the enums in `constants`
// and the native embedded fonts. On native this file is overridden by `useFonts.native`, which
// relies on the natively embedded fonts and needs no runtime loading.
export default function useFonts(): UseFontsReturnType {
  const [fontsLoaded] = useFontsRn({
    'Poppins-Light': Poppins_300Light,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Roboto-Light': Roboto_300Light,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
    'Roboto-Bold': Roboto_700Bold,
    'Roboto-Black': Roboto_900Black,
    'GeistMono-Regular': GeistMono_400Regular
  })

  return { fontsLoaded }
}
