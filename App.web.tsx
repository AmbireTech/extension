// So that the localization gets initialized at the beginning.
import '@common/config/localization'

import React from 'react'

import { isWeb } from '@common/config/env'
import AppInit from '@common/modules/app-init/screens/AppInit'
import { isExtension } from '@web/constants/browserapi'

// eslint-disable-next-line no-console
const consoleWarn = console.warn
const SUPPRESSED_WARNINGS = [
  // 2 <Routes > components are rendered in the tree at the same time to allow for lazy loading.
  'No routes matched location',
  'setNativeProps is deprecated. Please update props using React state instead.',
  'Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation.'
]

// eslint-disable-next-line no-console
console.warn = function filterWarnings(msg, ...args) {
  if (!SUPPRESSED_WARNINGS.some((entry) => msg?.includes(entry))) {
    consoleWarn(msg, ...args)
  }
}

const App = () => {
  // Because this tree is only rendered for the extension we check if
  // the window is an extension window and if it is web (not android or ios)
  if (!isExtension && isWeb) return 'Extension build successful! You can now close this window.'

  return <AppInit />
}

export default App
