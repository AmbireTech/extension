import { NetworkType } from 'ambire-common/src/constants/networks'
import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import usePrivateMode from '@common/hooks/usePrivateMode'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Props {
  totalSave: string
  totalCashBack: string
  networkName?: NetworkType['name']
}

const GasTankTotalSave = ({ totalSave, totalCashBack, networkName }: Props) => {
  const { t } = useTranslation()
  const { hidePrivateValue } = usePrivateMode()

  return (
    <View style={flexboxStyles.flex1}>
      <View style={[spacings.plSm, flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
        <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
          <Text fontSize={10} color={colors.turquoise} style={flexboxStyles.flex1}>
            {t('Total Saved')}:
          </Text>
          <Text fontSize={10} weight="regular" numberOfLines={1}>
            ${hidePrivateValue(totalSave)}
          </Text>
        </View>
        <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
          <Text fontSize={10} color={colors.heliotrope} style={flexboxStyles.flex1}>
            {t('Cashback')}:
          </Text>
          <Text fontSize={10} weight="regular" numberOfLines={1}>
            ${hidePrivateValue(totalCashBack)}
          </Text>
        </View>
        {!!networkName && (
          <Text color={colors.chetwode} fontSize={10}>
            {t('From gas fees on {{networkName}}', {
              networkName
            })}
          </Text>
        )}
      </View>
    </View>
  )
}

export default React.memo(GasTankTotalSave)
