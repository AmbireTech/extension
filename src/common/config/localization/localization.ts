// import * as Localization from 'expo-localization'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { Locale } from '@common/config/localization/constants'
import bg from '@common/config/localization/translations/bg.json'
import en from '@common/config/localization/translations/en.json'

// Set the key-value pairs for the different languages you want to support.
i18n.use(initReactI18next).init({
  // The v4 is causing an issue on Android, because of a change in the lib
  // regarding suffixing plurals. Figure out when we roll out translations.
  // This change streamlines the suffix with the one used in the Intl API.
  // We may need to polyfill the Intl.PluralRules API, in case it is not
  // available it will fallback to the i18next JSON format v3 plural handling.
  // {@link https://stackoverflow.com/a/70521614/1333836}
  // {@link https://www.i18next.com/misc/migration-guide#json-format-v4-pluralization}
  compatibilityJSON: 'v3',
  // In future, when a second language gets activated, uncomment this
  // in order to set the initial language to device language.
  // lng: Localization.locale
  lng: Locale.EN,
  fallbackLng: Locale.EN,
  supportedLngs: Object.values(Locale),
  defaultNS: 'app',
  // Our keys are whole English sentences, not dotted paths, so the nesting and
  // namespace lookups have nothing to resolve. Declaring the separators off
  // skips the check i18next otherwise runs per t() call, which builds a fresh
  // RegExp every time, and stops a sentence containing a colon from being read
  // as a namespace.
  keySeparator: false,
  nsSeparator: false,
  resources: { [Locale.EN]: { app: en }, [Locale.BG]: { app: bg } },
  interpolation: {
    escapeValue: false
  }
})

export const changeLanguage = (locale: Locale) => i18n.changeLanguage(locale)

export default i18n
export * from 'react-i18next'
