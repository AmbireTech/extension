import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import { Avatar } from '@common/components/Avatar'
import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconNameType } from '@common/components/NetworkIcon/NetworkIcon'
import Text from '@common/components/Text'
import { DEFAULT_ACCOUNT_LABEL } from '@common/constants/account'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING_3XL, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import shortenAddress from '@web/utils/shortenAddress'

import getStyles from './styles'

interface Props {
  networkName?: string
  networkId?: NetworkIconNameType
  withAmbireLogo?: boolean
}
const HeaderAccountAndNetworkInfo: FC<Props> = ({
  networkName,
  networkId,
  withAmbireLogo = true
}) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const mainCtrl = useMainControllerState()
  const settingsCtrl = useSettingsControllerState()
  const selectedAccount = mainCtrl.selectedAccount || ''
  const selectedAccountPref = settingsCtrl.accountPreferences[selectedAccount]
  const selectedAccountLabel = selectedAccountPref?.label || DEFAULT_ACCOUNT_LABEL
  const { minWidthSize, maxWidthSize } = useWindowSize()

  const fontSize = useMemo(() => {
    return maxWidthSize(650) ? 16 : 14
  }, [maxWidthSize])

  return (
    <View
      style={[
        styles.container,
        {
          // to be aligned with the tabLayoutWrapper
          paddingHorizontal: maxWidthSize('xl') ? SPACING_3XL : SPACING_XL
        }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Avatar pfp={selectedAccountPref?.pfp} />
        <Text appearance="secondaryText" weight="medium" fontSize={fontSize}>
          {selectedAccountLabel}{' '}
        </Text>
        <Text appearance="primaryText" weight="medium" fontSize={fontSize}>
          ({minWidthSize(800) && shortenAddress(selectedAccount, 12)}
          {maxWidthSize(800) && minWidthSize(900) && shortenAddress(selectedAccount, 20)}
          {maxWidthSize(900) && minWidthSize(1050) && shortenAddress(selectedAccount, 30)}
          {maxWidthSize(1050) && selectedAccount}){' '}
        </Text>
        {!!networkName && !!networkId && (
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
            <Text appearance="secondaryText" weight="regular" fontSize={fontSize}>
              {t('on')}{' '}
            </Text>
            <Text appearance="secondaryText" weight="regular" style={spacings.mrMi} fontSize={16}>
              {networkName || t('Unknown network')}
            </Text>
            {networkId && maxWidthSize(700) ? (
              <NetworkIcon name={networkId} style={styles.networkIcon} />
            ) : null}
          </View>
        )}
      </View>

      {!!withAmbireLogo && maxWidthSize(600) && <AmbireLogoHorizontal />}
    </View>
  )
}

export default React.memo(HeaderAccountAndNetworkInfo)
