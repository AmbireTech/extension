// So that the localization gets initialized at the beginning.
import '@common/config/localization'

import React from 'react'

import { isWeb } from '@common/config/env'
import AppInit from '@common/modules/app-init/screens/AppInit'
import { isExtension } from '@web/constants/browserapi'

const App = () => {
  // Because this tree is only rendered for the extension we check if
  // the window is an extension window and if it is web (not android or ios)
  if (!isExtension && isWeb) return 'Extension build successful! You can now close this window.'

  return <AppInit />
}

export default App
