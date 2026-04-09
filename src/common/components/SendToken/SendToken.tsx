import React, { FC, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import FlipIcon from '@common/assets/svg/FlipIcon'
import AmountInput from '@common/components/AmountInput'
import Select, { SectionedSelect } from '@common/components/Select'
import { SectionedSelectProps, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { ItemPanel } from '@web/components/TransactionsScreen'

import getStyles from './styles'

const SECTION_MENU_HEADER_HEIGHT = 50

type Props = {
  label: string
  fromTokenOptions: SelectValue[]
  fromTokenValue?: SelectValue
  fromAmountValue: string
  fromTokenAmountSelectDisabled: boolean
  handleChangeFromToken: (value: SelectValue) => void
  fromSelectedToken: TokenResult | null
  fromAmount?: string
  fromAmountInFiat?: string
  fromAmountFieldMode: 'token' | 'fiat'
  maxFromAmount: string
  validateFromAmount: { message?: string; success?: boolean }
  onFromAmountChange: (value: string) => void
  handleSwitchFromAmountFieldMode: () => void
  handleSetMaxFromAmount: () => void
  inputTestId?: string
  selectTestId?: string
  maxAmountDisabled?: boolean
  simulationFailed?: boolean
  sections?: SectionedSelectProps['sections']
  renderSectionHeader?: SectionedSelectProps['renderSectionHeader']
}

const SendToken: FC<Props> = ({
  label,
  fromTokenOptions,
  fromTokenValue,
  fromAmountValue,
  fromTokenAmountSelectDisabled,
  handleChangeFromToken,
  fromSelectedToken,
  fromAmount,
  fromAmountInFiat,
  fromAmountFieldMode,
  maxFromAmount,
  validateFromAmount,
  onFromAmountChange,
  handleSwitchFromAmountFieldMode,
  handleSetMaxFromAmount,
  inputTestId,
  selectTestId,
  maxAmountDisabled,
  simulationFailed,
  sections,
  renderSectionHeader
}) => {
  const {
    state: { portfolio }
  } = useController('SelectedAccountController')
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()

  const handleOnChangeTextAndFormat = useCallback(
    (text: string) => {
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

      if (formatted !== fromAmountValue) {
        onFromAmountChange(formatted)
      }
    },
    [fromAmountValue, onFromAmountChange]
  )

  return (
    <>
      <View
        style={[
          styles.outerContainer,
          validateFromAmount?.message ? styles.outerContainerWarning : {}
        ]}
      >
        <ItemPanel
          style={{
            // magic number to match the curve of the outer container
            // which is with borderRadius: 16
            borderRadius: 13,
            ...spacings.pv,
            ...(isWeb ? spacings.prMd : spacings.prSm),
            ...(validateFromAmount?.message ? styles.containerWarning : {})
          }}
        >
          <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
            {label}
          </Text>
          <View
            style={[
              flexbox.flex1,
              flexbox.directionRow,
              flexbox.alignCenter,
              { columnGap: isMobile ? SPACING_SM : SPACING }
            ]}
          >
            <View style={flexbox.flex1}>
              {sections ? (
                <SectionedSelect
                  setValue={handleChangeFromToken}
                  sections={sections}
                  value={fromTokenValue}
                  testID={selectTestId}
                  bottomSheetTitle={t('Send token')}
                  searchPlaceholder={t('Token name or address...')}
                  emptyListPlaceholderText={t('No tokens found.')}
                  containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
                  selectStyle={{ ...spacings.plTy, ...spacings.prSm }}
                  mode="bottomSheet"
                  headerHeight={SECTION_MENU_HEADER_HEIGHT}
                  renderSectionHeader={renderSectionHeader}
                  stickySectionHeadersEnabled
                />
              ) : (
                <Select
                  setValue={handleChangeFromToken}
                  options={fromTokenOptions}
                  value={fromTokenValue}
                  testID={selectTestId}
                  bottomSheetTitle={t('Send token')}
                  searchPlaceholder={t('Token name or address...')}
                  emptyListPlaceholderText={t('No tokens found.')}
                  containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
                  selectStyle={{ ...spacings.plTy, ...spacings.prSm }}
                  mode="bottomSheet"
                />
              )}
            </View>
            <AmountInput
              type={fromAmountFieldMode}
              value={fromAmountValue}
              onChangeText={handleOnChangeTextAndFormat}
              disabled={fromTokenAmountSelectDisabled}
              inputTestId={inputTestId}
            />
          </View>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.ptMd
            ]}
          >
            {!fromTokenAmountSelectDisabled ? (
              <MaxAmount
                isLoading={!portfolio?.isReadyToVisualize}
                maxAmount={Number(maxFromAmount)}
                selectedTokenSymbol={fromSelectedToken?.symbol || ''}
                onMaxButtonPress={handleSetMaxFromAmount}
                disabled={maxAmountDisabled}
                simulationFailed={simulationFailed}
              />
            ) : (
              // Prevent layout shifting
              <View style={{ height: 22 }} />
            )}
            {fromSelectedToken && fromSelectedToken.priceIn.length !== 0 ? (
              <>
                <Pressable
                  onPress={handleSwitchFromAmountFieldMode}
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.alignSelfStart,
                    {
                      position: 'absolute',
                      right: 0,
                      top: -6
                    }
                  ]}
                  disabled={fromTokenAmountSelectDisabled}
                >
                  {({ hovered }: any) => (
                    <View
                      style={{
                        ...flexbox.center,
                        borderRadius: 10,
                        backgroundColor: hovered
                          ? hexToRgba(theme.primaryAccent200, 0.16)
                          : theme.primaryAccent100,
                        width: 20,
                        height: 20
                      }}
                    >
                      <FlipIcon width={11} height={11} color={theme.primary} />
                    </View>
                  )}
                </Pressable>
                <Text
                  fontSize={12}
                  color={theme.secondaryText}
                  weight="medium"
                  testID="switch-currency-sab"
                >
                  {fromAmountFieldMode === 'token'
                    ? `${
                        fromAmountInFiat
                          ? formatDecimals(parseFloat(fromAmountInFiat || '0'), 'price')
                          : '$0'
                      }`
                    : `${fromAmount ? formatDecimals(parseFloat(fromAmount), 'amount') : 0} ${
                        fromSelectedToken?.symbol
                      }`}
                </Text>
              </>
            ) : (
              <View />
            )}
          </View>
        </ItemPanel>
      </View>
      {validateFromAmount?.message && (
        <Text fontSize={12} style={[spacings.mlMi, spacings.mtMi]} appearance="errorText">
          {validateFromAmount?.message}
        </Text>
      )}
    </>
  )
}

export default memo(SendToken)
