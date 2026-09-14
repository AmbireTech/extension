// Font family names shared across all environments (web + native).
//
// The values are the fonts' PostScript names. This is deliberate: on native the fonts are
// embedded and registered at launch (iOS Info.plist UIAppFonts / Android assets/fonts), where
// iOS resolves them by PostScript name and Android by file name - so the embedded files are
// named after the PostScript name too, giving a single fontFamily string that works on both
// platforms and on web (where useFonts registers matching @font-face families).
export enum FONT_FAMILIES {
  LIGHT = 'Poppins-Light',
  REGULAR = 'Poppins-Regular',
  MEDIUM = 'Poppins-Medium',
  SEMI_BOLD = 'Poppins-SemiBold'
}

export enum ROBOTO_FONT_FAMILIES {
  LIGHT = 'Roboto-Light',
  REGULAR = 'Roboto-Regular',
  MEDIUM = 'Roboto-Medium',
  BOLD = 'Roboto-Bold',
  BLACK = 'Roboto-Black'
}

export enum GEIST_MONO_FONT_FAMILIES {
  REGULAR = 'GeistMono-Regular'
}

export interface UseFontsReturnType {
  fontsLoaded: boolean
}
