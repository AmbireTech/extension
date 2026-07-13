import { THEME_TYPES } from './types'

const ACCENT_PRIMITIVES = {
  primaryAccent100: {
    [THEME_TYPES.LIGHT]: '#EFEAFF',
    [THEME_TYPES.DARK]: '#2B273D'
  },
  primaryAccent200: {
    [THEME_TYPES.LIGHT]: '#9D7AFF',
    [THEME_TYPES.DARK]: '#9D7AFF'
  },
  primaryAccent300: {
    [THEME_TYPES.LIGHT]: '#6C38F7',
    [THEME_TYPES.DARK]: '#9D7AFF'
  },
  primaryAccent400: {
    [THEME_TYPES.LIGHT]: '#7F52FF',
    [THEME_TYPES.DARK]: '#7F52FF'
  },
  primaryAccent500: {
    [THEME_TYPES.LIGHT]: '#2B273D',
    [THEME_TYPES.DARK]: '#2B273D'
  },
  secondaryAccent100: {
    [THEME_TYPES.LIGHT]: '#DFFEFC',
    [THEME_TYPES.DARK]: '#204041'
  },
  secondaryAccent200: {
    [THEME_TYPES.LIGHT]: '#7AFFF9',
    [THEME_TYPES.DARK]: '#7AFFF9'
  },
  secondaryAccent300: {
    [THEME_TYPES.LIGHT]: '#39F7EF',
    [THEME_TYPES.DARK]: '#39F7EF'
  },
  secondaryAccent400: {
    [THEME_TYPES.LIGHT]: '#0B7772',
    [THEME_TYPES.DARK]: '#7AFFF9'
  },
  secondaryAccent500: {
    [THEME_TYPES.LIGHT]: '#DFFEFC',
    [THEME_TYPES.DARK]: '#204041'
  }
} as const

const NEUTRAL_PRIMITIVES = {
  neutral100: {
    [THEME_TYPES.LIGHT]: '#F2F4F7',
    [THEME_TYPES.DARK]: '#2C2F33'
  },
  neutral200: {
    [THEME_TYPES.LIGHT]: '#F9FAFB',
    [THEME_TYPES.DARK]: '#F9FAFB'
  },
  neutral300: {
    [THEME_TYPES.LIGHT]: '#FFFFFF',
    [THEME_TYPES.DARK]: '#1B1D20'
  },
  neutral400: {
    [THEME_TYPES.LIGHT]: '#E3E6EB',
    [THEME_TYPES.DARK]: '#0D0E0F'
  },
  neutral600: {
    [THEME_TYPES.LIGHT]: '#808EA1',
    [THEME_TYPES.DARK]: '#96A1B1'
  },
  neutral700: {
    [THEME_TYPES.LIGHT]: '#50555D',
    [THEME_TYPES.DARK]: '#B9BFC9'
  },
  neutral800: {
    [THEME_TYPES.LIGHT]: '#1B1D20',
    [THEME_TYPES.DARK]: '#F9FAFB'
  },
  neutral900: {
    [THEME_TYPES.LIGHT]: '#0D0E0F',
    [THEME_TYPES.DARK]: '#FFFFFF'
  }
} as const

const FEEDBACK_PRIMITIVES = {
  info100: {
    [THEME_TYPES.LIGHT]: '#E8F3FF',
    [THEME_TYPES.DARK]: '#293544'
  },
  info200: {
    [THEME_TYPES.LIGHT]: '#70B4FF',
    [THEME_TYPES.DARK]: '#70B4FF'
  },
  info300: {
    [THEME_TYPES.LIGHT]: '#1563B6',
    [THEME_TYPES.DARK]: '#70B4FF'
  },
  info400: {
    [THEME_TYPES.LIGHT]: '#09386A',
    [THEME_TYPES.DARK]: '#09386A'
  },
  info500: {
    [THEME_TYPES.LIGHT]: '#293544',
    [THEME_TYPES.DARK]: '#293544'
  },
  success100: {
    [THEME_TYPES.LIGHT]: '#E8FFED',
    [THEME_TYPES.DARK]: '#294132'
  },
  success200: {
    [THEME_TYPES.LIGHT]: '#70FF8D',
    [THEME_TYPES.DARK]: '#70FF8D'
  },
  success300: {
    [THEME_TYPES.LIGHT]: '#29963F',
    [THEME_TYPES.DARK]: '#29963F'
  },
  success400: {
    [THEME_TYPES.LIGHT]: '#00861B',
    [THEME_TYPES.DARK]: '#70FF8D'
  },
  success500: {
    [THEME_TYPES.LIGHT]: '#294132',
    [THEME_TYPES.DARK]: '#E8FFED'
  },
  warning100: {
    [THEME_TYPES.LIGHT]: '#FFF9E8',
    [THEME_TYPES.DARK]: '#403B2D'
  },
  warning200: {
    [THEME_TYPES.LIGHT]: '#FFD970',
    [THEME_TYPES.DARK]: '#FFD970'
  },
  warning300: {
    [THEME_TYPES.LIGHT]: '#967929',
    [THEME_TYPES.DARK]: '#967929'
  },
  warning400: {
    [THEME_TYPES.LIGHT]: '#936C00',
    [THEME_TYPES.DARK]: '#FFD970'
  },
  warning500: {
    [THEME_TYPES.LIGHT]: '#403B2D',
    [THEME_TYPES.DARK]: '#403B2D'
  },
  error100: {
    [THEME_TYPES.LIGHT]: '#FFE8EC',
    [THEME_TYPES.DARK]: '#402A31'
  },
  error200: {
    [THEME_TYPES.LIGHT]: '#FF7089',
    [THEME_TYPES.DARK]: '#FF7089'
  },
  error300: {
    [THEME_TYPES.LIGHT]: '#B30522',
    [THEME_TYPES.DARK]: '#FF7089'
  },
  error400: {
    [THEME_TYPES.LIGHT]: '#6A0919',
    [THEME_TYPES.DARK]: '#6A0919'
  },
  error500: {
    [THEME_TYPES.LIGHT]: '#402A31',
    [THEME_TYPES.DARK]: '#402A31'
  }
}

export { ACCENT_PRIMITIVES, NEUTRAL_PRIMITIVES, FEEDBACK_PRIMITIVES }
