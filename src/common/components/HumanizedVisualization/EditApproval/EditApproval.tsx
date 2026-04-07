import { formatUnits } from 'ethers'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import EditIcon from '@common/assets/svg/EditIcon'
import AmountInput from '@common/components/AmountInput'
import BottomSheet from '@common/components/BottomSheet'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { ItemPanel } from '@web/components/TransactionsScreen'

const EditApproval = ({ item }: { item: HumanizerVisualization }) => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  const [bindEditApprovals, editApprovalsStyle] = useHover({
    preset: 'opacityInverted'
  })
  const {
    ref: editApprovalsSheetRef,
    open: openEditApprovals,
    close: closeEditApprovals
  } = useModalize()
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const [amount, setAmount] = useState<string>(item.value?.toString() || '0')

  const portfolioToken = useMemo(() => {
    return portfolio.tokens.find((t) => t.address.toLowerCase() === item.address?.toLowerCase())
  }, [portfolio.tokens, item])

  const handleOnChangeTextAndFormat = useCallback((text: string) => {
    let formatted = text

    // Remove invalid chars (only digits and dots allowed)
    formatted = formatted.replace(/[^0-9.]/g, '')

    // If input starts with ".", prefix with "0"
    if (formatted.startsWith('.')) {
      formatted = `0${formatted}`
    }

    // Prevent multiple decimals
    const parts = formatted.split('.')
    if (parts.length > 2) {
      formatted = `${parts[0]}.${parts.slice(1).join('')}`
    }

    formatted = formatted.replace(/^0+(?=\d)/, '')
    if (formatted === '') formatted = '0'

    setAmount(formatted)
  }, [])

  return (
    <>
      <AnimatedPressable
        style={[editApprovalsStyle, flexbox.directionRow, flexbox.alignCenter]}
        {...bindEditApprovals}
        onPress={() => openEditApprovals()}
      >
        <EditIcon />
        <Text>{t('Edit Approval')}</Text>
      </AnimatedPressable>
      <BottomSheet
        sheetRef={editApprovalsSheetRef}
        id={`edit-approvals-bottom-sheet-${item.id}`}
        type="bottom-sheet"
        closeBottomSheet={closeEditApprovals}
        scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
        containerInnerWrapperStyles={{ flex: 1 }}
      >
        <ItemPanel>
          <View style={flexbox.alignCenter}>
            {portfolioToken && (
              <View style={spacings.mbTy}>
                <MaxAmount
                  isLoading={false}
                  maxAmount={Number(
                    formatUnits(getTokenAmount(portfolioToken), portfolioToken.decimals)
                  )}
                  selectedTokenSymbol={portfolioToken.symbol}
                  onMaxButtonPress={() =>
                    setAmount(formatUnits(getTokenAmount(portfolioToken), portfolioToken.decimals))
                  }
                  simulationFailed={false}
                />
              </View>
            )}
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text style={spacings.mrTy}>{t('Grant approval for')}</Text>
              <View
                style={[
                  {
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    borderWidth: 1,
                    borderColor: 'transparent',
                    backgroundColor: themeType === THEME_TYPES.LIGHT ? '#fff' : '#000',
                    maxWidth: 400
                  },
                  spacings.ph
                ]}
              >
                <AmountInput
                  type="token"
                  value={amount}
                  onChangeText={handleOnChangeTextAndFormat}
                />
              </View>
              {portfolioToken && (
                <TokenIcon
                  containerStyle={spacings.mlTy}
                  address={portfolioToken.address}
                  chainId={portfolioToken.chainId}
                  containerHeight={28}
                  containerWidth={28}
                  width={28}
                  height={28}
                  withNetworkIcon={false}
                />
              )}
            </View>
            <View>
              <ButtonWithLoader
                type="primary"
                isLoading={false}
                text="Save"
                onPress={() => {
                  console.log('testing')
                }}
                size="small"
                style={spacings.mtTy}
              />
            </View>
          </View>
        </ItemPanel>
      </BottomSheet>
    </>
  )
}

export default memo(EditApproval)
