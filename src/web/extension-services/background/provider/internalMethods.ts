import { networks } from 'ambire-common/src/consts/networks'

import providerController from '@web/extension-services/background/provider/ProviderController'

import permission from '../services/permission'

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
  const isUnlocked = req.mainCtrl.keystore.isUnlocked
  const defaultChainId = permission.getWithoutUpdate(origin)?.chainId
  const chainId = defaultChainId
    ? intToHex(defaultChainId)
    : await providerController.ethChainId(req)
  let networkVersion = '1'

  try {
    networkVersion = parseInt(chainId, 16).toString()
  } catch (error) {
    networkVersion = '1'
  }

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
