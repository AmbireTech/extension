import { SwapAndBridgeRoute } from '@ambire-common/interfaces/swapAndBridge'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import getStyles from '../styles'
import PayOption from './PayOption'

const ServiceFee = ({
  nativeFeeOption,
  paidByNativeValue,
  serviceFee
}: {
  nativeFeeOption?: FeePaymentOption
  paidByNativeValue?: SelectValue | null
  serviceFee?: SwapAndBridgeRoute['serviceFee']
}) => {
  const { t } = useTranslation()
  const { themeType, styles } = useTheme(getStyles)

  if (!serviceFee || !paidByNativeValue || !nativeFeeOption) return null

  return (
    <>
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        <Text fontSize={12} style={spacings.mvTy}>
          {t('Additional bridge fee')}
        </Text>
        <InfoIcon width={16} height={16} data-tooltip-id="bridge-fee-icon" style={spacings.mlTy} />
        <Tooltip id="bridge-fee-icon" clickable>
          <View>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
              {t(
                `The selected bridge provider demands an additional service fee, paid out in ${paidByNativeValue.token.symbol}. `
              )}
              <Pressable
                onPress={() => {
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  openInTab({ url: 'https://help.ambire.com/hc/en-us/articles/20618326653596' })
                }}
              >
                <Text fontSize={14} weight="medium" appearance="primary">
                  {t('Learn more')}
                </Text>
              </Pressable>
            </Text>
          </View>
        </Tooltip>
      </View>
      <Select
        options={[paidByNativeValue]}
        containerStyle={spacings.mb0}
        value={paidByNativeValue}
        disabled
        defaultValue={paidByNativeValue}
        selectStyle={{
          borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1
        }}
        renderSelectedOption={() => (
          <View style={styles.nativeBridgeFeeContainer}>
            <PayOption
              amount={BigInt(serviceFee.amount)}
              amountUsd={serviceFee.amountUSD}
              feeOption={nativeFeeOption}
            />
          </View>
        )}
        withSearch={false}
      />
    </>
  )
}

export default React.memo(ServiceFee)
