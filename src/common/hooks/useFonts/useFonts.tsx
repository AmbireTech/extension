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

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum FONT_FAMILIES {
  LIGHT = 'Poppins_300Light',
  REGULAR = 'Poppins_400Regular',
  MEDIUM = 'Poppins_500Medium',
  SEMI_BOLD = 'Poppins_600SemiBold'
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum ROBOTO_FONT_FAMILIES {
  LIGHT = 'Roboto_300Light',
  REGULAR = 'Roboto_400Regular',
  MEDIUM = 'Roboto_500Medium',
  BOLD = 'Roboto_700Bold',
  BLACK = 'Roboto_900Black'
}

export enum GEIST_MONO_FONT_FAMILIES {
  REGULAR = 'GeistMono_400Regular'
}

export interface UseFontsReturnType {
  fontsLoaded: boolean
}

export default function useFonts(): UseFontsReturnType {
  const [fontsLoaded] = useFontsRn({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
    GeistMono_400Regular
  })

  return { fontsLoaded }
}
