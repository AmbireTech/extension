import React, { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import WarningIcon from '@common/assets/svg/WarningIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

const ICON_SIZE = 16

type Props = {
  chainId: number
  address: string
}

/**
 * Shown next to a receive token that none of the enabled swap providers lists. The token data was read
 * from the network, so no swap provider has checked the token.
 */
const UnverifiedTokenWarning: FC<Props> = ({ chainId, address }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View
      dataSet={createGlobalTooltipDataSet({
        id: `token-${chainId}-${address}-unverified`,
        content: t(
          'None of your enabled swap providers lists this token. Make sure it is the token you want before you swap.'
        )
      })}
      style={spacings.mlTy}
    >
      <WarningIcon width={ICON_SIZE} height={ICON_SIZE} color={theme.warningDecorative} />
    </View>
  )
}

export default memo(UnverifiedTokenWarning)
