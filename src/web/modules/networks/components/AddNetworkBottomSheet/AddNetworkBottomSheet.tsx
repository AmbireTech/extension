import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import ChainlistIcon from '@common/assets/svg/ChainlistIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { openInTab } from '@web/extension-services/background/webapi/tab'

import Option from '../Option'

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
  closeBottomSheet: () => void
}

const AddNetworkBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()

  return (
    <BottomSheet
      id="dashboard-add-networks"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <Text fontSize={20} weight="semiBold" style={spacings.mbLg}>
        {t('Add Network')}
      </Text>
      <Option
        renderIcon={<ChainlistIcon width={23} height={32} color={theme.secondaryText} />}
        title={t('Go to Chainlist')}
        text={t('Add any EVM network')}
        onPress={() => openInTab({ url: 'https://chainlist.org/', shouldCloseCurrentWindow: true })}
      />
      <Option
        renderIcon={<SettingsIcon width={20} height={20} color={theme.secondaryText} />}
        title={t('Go to Settings')}
        onPress={() => {
          navigate(WEB_ROUTES.networksSettings)
        }}
      />
    </BottomSheet>
  )
}

export default memo(AddNetworkBottomSheet)
