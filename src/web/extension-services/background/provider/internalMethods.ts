import providerController from '@web/extension-services/background/provider/ProviderController'

const tabCheckin = ({
  data: {
    params: { name, icon }
  },
  session,
  origin
}) => {
  session.setProp({ origin, name, icon })
  // TODO:
  // preferenceService.detectPhishing(origin)
}

const getProviderState = async (req) => {
  const isUnlocked = true // TODO: implement in v2
  const chainId = await providerController.ethChainId()
  const networkVersion = await providerController.netVersion()

  return {
    chainId,
    isUnlocked,
    accounts: isUnlocked ? await providerController.ethAccounts(req) : [],
    networkVersion
  }
}

const providerOverwrite = ({
  data: {
    params: [val]
  }
}) => {
  // preferenceService.setHasOtherProvider(val)
  return true
}

const hasOtherProvider = () => {
  // preferenceService.setHasOtherProvider(true)
  // TODO:
  // const isAmbire = preferenceService.getIsDefaultWallet()
  // setPopupIcon(isAmbire ? 'ambire' : 'metamask')
  return true
}

const isDefaultWallet = () => {
  // TODO:
  return true
  // return preferenceService.getIsDefaultWallet()
}

export default {
  tabCheckin,
  getProviderState,
  providerOverwrite,
  hasOtherProvider,
  isDefaultWallet
}
