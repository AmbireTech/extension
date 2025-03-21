import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import OpenIcon from '@common/assets/svg/OpenIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import i18n from '@common/config/localization/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

import Option from '../Option'
import getStyles from './styles'

export const NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP = i18n.t(
  'No block explorer available for this network.'
)

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
  networkId: Network['id'] | null
  closeBottomSheet: () => void
  openBlockExplorer: (url?: string) => void
}

const NetworkBottomSheet = ({
  sheetRef,
  networkId,
  closeBottomSheet,
  openBlockExplorer
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const { theme, styles } = useTheme(getStyles)
  const { networks } = useNetworksControllerState()
  const networkData = networks.find((network) => network.id === networkId)

  const handleOpenBlockExplorer = useCallback(
    () => openBlockExplorer(networkData?.explorerUrl),
    [networkData, openBlockExplorer]
  )

  const isMissingBlockExplorer = !networkData?.explorerUrl

  return (
    <BottomSheet
      id="dashboard-networks-network"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <View style={[styles.item, spacings.pvSm, spacings.mb3Xl]}>
        {!!networkId && <NetworkIcon size={32} id={networkId} />}
        <Text fontSize={16} weight="medium" style={spacings.mlMi}>
          {networkData?.name || t('Unknown Network')}
        </Text>
      </View>
      <Option
        renderIcon={<SettingsIcon width={27} height={27} color={theme.secondaryText} />}
        title={t('Go to Network Settings')}
        onPress={() => {
          try {
            navigate(`${WEB_ROUTES.networksSettings}?networkId=${networkId}`)
          } catch {
            addToast(t('Failed to open network settings.'), { type: 'error' })
          }
        }}
      />
      <Option
        renderIcon={<OpenIcon width={20} height={20} color={theme.secondaryText} />}
        title={t('Open current account in block explorer')}
        disabled={isMissingBlockExplorer}
        tooltip={isMissingBlockExplorer ? NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP : ''}
        onPress={handleOpenBlockExplorer}
      />
    </BottomSheet>
  )
}

export default memo(NetworkBottomSheet)
