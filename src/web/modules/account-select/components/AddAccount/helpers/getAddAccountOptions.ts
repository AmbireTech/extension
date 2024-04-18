import CreateWalletIcon from '@common/assets/svg/CreateWalletIcon'
import HWIcon from '@common/assets/svg/HWIcon'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import ViewModeIcon from '@common/assets/svg/ViewModeIcon'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'
import { getUiType } from '@web/utils/uiType'

const { isNotification } = getUiType()

const getAddAccountOptions = ({
  navigate,
  t
}: {
  navigate: ReturnType<typeof useNavigation>['navigate']
  t: (str: string) => string
}) => {
  const navigateWrapped = (route: string) => {
    if (isNotification) {
      openInternalPageInTab(route)
      return
    }
    navigate(route)
  }

  return [
    {
      key: 'hw',
      text: t('Connect a hardware wallet'),
      icon: HWIcon,
      onPress: () => navigateWrapped(ROUTES.hardwareWalletSelect)
    },
    {
      key: 'hot-wallet',
      text: t('Import an existing hot wallet'),
      icon: ImportAccountIcon,
      onPress: () => navigateWrapped(ROUTES.importHotWallet)
    },
    {
      key: 'create-wallet',
      text: t('Create a new hot wallet'),
      icon: CreateWalletIcon,
      onPress: () => navigateWrapped(ROUTES.createHotWallet),
      hasLargerBottomSpace: true
    },
    {
      key: 'view-only',
      text: t('Watch an address'),
      icon: ViewModeIcon,
      onPress: () => navigateWrapped(ROUTES.viewOnlyAccountAdder)
    }
  ]
}

export { getAddAccountOptions }
