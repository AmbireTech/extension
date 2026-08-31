import { UseFontsReturnType } from './constants'

// Native implementation: fonts are embedded in the native binary and registered by the OS at
// launch (iOS Info.plist UIAppFonts / Android assets/fonts), so there is nothing to load at
// runtime - they are ready before the first React render. This deliberately avoids expo-font's
// runtime registration, which resolves the font files from the JS bundle assets. Under a
// Stallion OTA that means the mutable OTA bundle slot, and reshuffling it (on OTA download or
// restart) breaks font application for text rendered afterwards - the tofu we are fixing here.
export default function useFonts(): UseFontsReturnType {
  return { fontsLoaded: true }
}
