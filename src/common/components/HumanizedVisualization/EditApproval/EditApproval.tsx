import { formatUnits, Interface, parseUnits } from 'ethers'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import AmountInput from '@common/components/AmountInput'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const EditApproval = ({ item }: { item: HumanizerVisualization }) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
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
  const { state: signAccountOpState, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const [amount, setAmount] = useState<string>('0')
  const [initialValueSet, setInitialValueSet] = useState<boolean>(false)

  const portfolioToken = useMemo(() => {
    return portfolio.tokens.find((t) => t.address.toLowerCase() === item.address?.toLowerCase())
  }, [portfolio.tokens, item])

  useEffect(() => {
    if (!portfolioToken || !item.value || initialValueSet) return
    setAmount(formatUnits(item.value.toString(), portfolioToken.decimals))
    setInitialValueSet(true)
  }, [portfolioToken, item.value, initialValueSet])

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
        style={[
          editApprovalsStyle,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mrTy,
          // @ts-ignore
          { marginLeft: '-8px' }
        ]}
        {...bindEditApprovals}
        onPress={() => openEditApprovals()}
      >
        <Text fontSize={14} color={theme.tertiaryText}>
          {'['}
        </Text>
        <EditPenIcon width={20} height={20} color={theme.tertiaryText} />
        <Text fontSize={14} color={theme.tertiaryText}>
          {t('Edit')}
        </Text>
        <Text fontSize={14} color={theme.tertiaryText}>
          {']'}
        </Text>
      </AnimatedPressable>
      <BottomSheet
        sheetRef={editApprovalsSheetRef}
        id={`edit-approvals-bottom-sheet-${item.id}`}
        type="modal"
        closeBottomSheet={closeEditApprovals}
        style={{ maxWidth: 460 }}
      >
        <View style={flexbox.alignCenter}>
          <Text fontSize={20} weight="medium" style={[spacings.mbXl, spacings.mtTy]}>
            {t('Grant approval for')}
          </Text>
          <View style={{ width: '100%' }}>
            <View>
              <View
                style={[
                  {
                    borderRadius: BORDER_RADIUS_PRIMARY,
                    borderWidth: 1,
                    borderColor: 'transparent',
                    backgroundColor: themeType === THEME_TYPES.LIGHT ? '#fff' : '#000',
                    paddingLeft: 41,
                    paddingRight: 16
                  }
                ]}
              >
                <AmountInput
                  type="token"
                  value={amount}
                  onChangeText={handleOnChangeTextAndFormat}
                  fontSize={16}
                  inputWrapperStyle={{ height: 40 }}
                />
              </View>
              {portfolioToken && (
                <TokenIcon
                  containerStyle={{ position: 'absolute', top: 6, left: 6 }}
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
            {portfolioToken && (
              <View style={spacings.mtSm}>
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
          </View>
          <FooterGlassView absolute={false} style={spacings.mt2Xl}>
            <Button
              type="secondary"
              text={t('Cancel')}
              onPress={() => closeEditApprovals()}
              hasBottomSpacing={false}
              size="small"
              style={[{ width: 100, height: 44 }, spacings.mr]}
            />
            <Button
              type="primary"
              text={t('Save')}
              onPress={() => {
                if (!signAccountOpState || !item.address || !item.spenderAddr || !portfolioToken)
                  return
                const approveAbi = [
                  {
                    inputs: [
                      {
                        internalType: 'address',
                        name: 'spender',
                        type: 'address'
                      },
                      {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256'
                      }
                    ],
                    name: 'approve',
                    outputs: [
                      {
                        internalType: 'bool',
                        name: '',
                        type: 'bool'
                      }
                    ],
                    stateMutability: 'nonpayable',
                    type: 'function'
                  }
                ]
                const approveInterface = new Interface(approveAbi)
                const calldata = approveInterface.encodeFunctionData('approve', [
                  item.spenderAddr,
                  parseUnits(amount, portfolioToken.decimals)
                ])
                // shallow copy each call just in case so the controller properly
                // understands that a change to the calls array has been made
                const calls = signAccountOpState.accountOp.calls.map((call) => ({ ...call }))
                const replacedCall = calls.find((c) => c.id === item.callId)
                if (!replacedCall) return
                // replace the data with the new approval
                replacedCall.data = calldata

                signAccountOpDispatch({
                  type: 'method',
                  params: {
                    method: 'update',
                    args: [{ accountOpData: { calls } }]
                  }
                })
                closeEditApprovals()
              }}
              hasBottomSpacing={false}
              size="small"
              style={[{ width: 100, height: 44 }]}
            />
          </FooterGlassView>
        </View>
      </BottomSheet>
    </>
  )
}

export default memo(EditApproval)
