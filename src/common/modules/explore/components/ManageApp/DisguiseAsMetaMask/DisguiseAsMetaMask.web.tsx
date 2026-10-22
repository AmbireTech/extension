import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useDisguiseAsMetaMask from '@common/modules/explore/hooks/useDisguiseAsMetaMask'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { DisguiseAsMetaMaskProps } from './DisguiseAsMetaMask'

const DisguiseAsMetaMask = ({ dapp, onToggled }: DisguiseAsMetaMaskProps) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isOn, isUpdating, toggle } = useDisguiseAsMetaMask(dapp, onToggled)

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phTy,
        spacings.pvTy,
        animStyle,
        { borderRadius: 8 }
      ]}
      onPress={() => toggle(!isOn)}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mrSm]}>
        <MetamaskIcon width={20} height={20} />
        <Text weight="medium" fontSize={14} style={spacings.mlTy}>
          {t('Show as MetaMask')}
        </Text>
        <InfoIcon
          width={16}
          height={16}
          style={spacings.mlMi}
          dataSet={createGlobalTooltipDataSet({
            id: 'disguise-as-metamask-tooltip',
            content: t(
              'Some apps allow connections to a whitelist of wallets. Turn this on to show as MetaMask in this app. The app reloads when you change it.'
            )
          })}
        />
      </View>
      <Toggle
        id={`disguise-as-metamask-${dapp.id}`}
        isOn={isOn}
        onToggle={toggle}
        disabled={isUpdating}
        stopPropagation
        trackStyle={spacings.mr0}
      />
    </AnimatedPressable>
  )
}

export default React.memo(DisguiseAsMetaMask)
