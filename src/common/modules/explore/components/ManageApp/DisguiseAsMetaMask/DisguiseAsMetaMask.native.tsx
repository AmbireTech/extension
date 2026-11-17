import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import useTheme from '@common/hooks/useTheme'
import useDisguiseAsMetaMask from '@common/modules/explore/hooks/useDisguiseAsMetaMask'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { DisguiseAsMetaMaskProps } from './DisguiseAsMetaMask'

const DisguiseAsMetaMask = ({ dapp, onToggled }: DisguiseAsMetaMaskProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isOn, isUpdating, toggle } = useDisguiseAsMetaMask(dapp, onToggled)

  return (
    <Pressable
      onPress={() => toggle(!isOn)}
      disabled={isUpdating}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        common.borderRadiusPrimary,
        spacings.ph,
        spacings.pvSm,
        { backgroundColor: theme.tertiaryBackground }
      ]}
    >
      <MetamaskIcon width={32} height={32} style={spacings.mrTy} />
      <View style={[flexbox.flex1, spacings.mr]}>
        <Text fontSize={14} weight="medium">
          {t('Show as MetaMask')}
        </Text>
        <Text fontSize={12} appearance="secondaryText">
          {t(
            'Some apps allow connections to a whitelist of wallets. Turn this on to show as MetaMask in this app.'
          )}
        </Text>
      </View>
      <Toggle
        id={`disguise-as-metamask-${dapp.id}`}
        isOn={isOn}
        onToggle={toggle}
        disabled={isUpdating}
        trackStyle={spacings.mr0}
      />
    </Pressable>
  )
}

export default React.memo(DisguiseAsMetaMask)
