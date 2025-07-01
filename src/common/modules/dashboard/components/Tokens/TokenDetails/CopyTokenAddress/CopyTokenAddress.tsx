import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

interface Props {
  address: string
  isRewards?: boolean
  isVesting?: boolean
}

const CopyTokenAddress: FC<Props> = ({ address, isRewards, isVesting }) => {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const { theme } = useTheme()
  if (address === `0x${'0'.repeat(40)}`) return null

  return (
    <AnimatedPressable
      style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlMi, animStyle]}
      onPress={() => {
        setStringAsync(address).catch(() => {
          addToast(t('Failed to copy address to clipboard'), { timeout: 2500 })
        })
        addToast(t('Address copied to clipboard!'), { timeout: 2500 })
      }}
      {...bindAnim}
    >
      <Text fontSize={16} weight="number_regular" appearance="secondaryText" style={spacings.mrMi}>
        ({shortenAddress(address, isRewards || isVesting ? 10 : 13)})
      </Text>
      <CopyIcon width={16} height={16} color={theme.iconSecondary} strokeWidth="1.5" />
    </AnimatedPressable>
  )
}

export default CopyTokenAddress
