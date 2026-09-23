import React, { ComponentProps, FC, memo, ReactNode } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import FlipIcon from '@common/assets/svg/FlipIcon'
import AmountInput from '@common/components/AmountInput'
import AmountSlider from '@common/components/AmountSlider'
import MaxButton from '@common/components/MaxButton'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import MaxAmount from '@common/modules/swap-and-bridge/components/MaxAmount'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { ItemPanel } from '@web/components/TransactionsScreen'

import getStyles from './styles'

type Props = {
  /** Shown above the balance, e.g. "You send". */
  label?: string
  /** What sits left of the amount: a token select, or a `FixedToken` when the token can't change. */
  token: ReactNode
  /** What the account holds of the token. Leave it out while there is nothing to show yet. */
  balance?: {
    amount: number | null
    symbol: string
    isLoading?: boolean
    /** Flags the balance as possibly inaccurate, e.g. after a failed simulation. */
    isInaccurate?: boolean
  }
  /** The other unit's amount next to the flip icon that switches between token and USD. Left out
   * when the token has no price to convert with. */
  amountFieldModeSwitch?: { label: string; onPress: () => void; disabled?: boolean }
  amountFieldMode: 'token' | 'fiat'
  amount: string
  onAmountChange: (value: string) => void
  /** Decimals the amount field accepts. */
  precision?: number
  /** Disables the whole field: the amount, the unit switch, the slider and the Max button. */
  disabled?: boolean
  /** Shown right of the amount, e.g. how much of the balance it takes. */
  amountAccessory?: ReactNode
  /** Splits the token row evenly instead of giving the token the wider part of it. */
  isTokenRowSplitEvenly?: boolean
  slider: Pick<
    ComponentProps<typeof AmountSlider>,
    'value' | 'maximumValue' | 'onValueChange' | 'tierOffset' | 'marks'
  >
  onMaxPress: () => void
  isMaxDisabled?: boolean
  message?: {
    text?: string
    severity?: 'error' | 'warning' | 'info' | 'success'
  }
  testIDs?: { amount?: string; amountFieldModeSwitch?: string; maxButton?: string }
  /** Extra styling for the amount slider's own row, e.g. to give it room before the panel ends. */
  sliderStyle?: ViewStyle
  /** Shown at the bottom of the panel. */
  children?: ReactNode
}

/** Picks a token and an amount of it: the balance, the token (a select, or fixed) next to the
 * token/USD amount, and the slider with the Max button, framed in red while there is an error and
 * followed by its message. */
const TokenAndAmountSelector: FC<Props> = ({
  label,
  token,
  balance,
  amountFieldModeSwitch,
  amountFieldMode,
  amount,
  onAmountChange,
  precision,
  disabled,
  amountAccessory,
  isTokenRowSplitEvenly,
  slider,
  onMaxPress,
  isMaxDisabled,
  message,
  testIDs,
  sliderStyle,
  children
}) => {
  const { theme, styles } = useTheme(getStyles)
  const isError = message?.severity === 'error' && !!message?.text
  const isWarning = message?.severity === 'warning' && !!message?.text

  const amountColumnStyle = isTokenRowSplitEvenly
    ? styles.evenAmountColumn
    : isWeb
      ? styles.amountColumn
      : styles.nativeAmountColumn

  return (
    <>
      <View style={[styles.outerContainer, isError && styles.outerContainerError]}>
        <ItemPanel style={{ ...styles.container, ...(isError ? styles.containerError : {}) }}>
          {!!label && (
            <Text appearance="secondaryText" fontSize={14} weight="medium" style={spacings.mbSm}>
              {label}
            </Text>
          )}
          <View style={styles.balanceRow}>
            {balance && !disabled ? (
              <MaxAmount
                isLoading={!!balance.isLoading}
                maxAmount={balance.amount}
                selectedTokenSymbol={balance.symbol}
                simulationFailed={balance.isInaccurate}
              />
            ) : (
              // Prevent layout shifting
              <View style={{ height: 22 }} />
            )}
            {amountFieldModeSwitch ? (
              <Pressable
                onPress={amountFieldModeSwitch.onPress}
                style={styles.switchAmountFieldMode}
                disabled={disabled || amountFieldModeSwitch.disabled}
              >
                {({ hovered }: any) => (
                  <>
                    <Text
                      fontSize={12}
                      color={theme.secondaryText}
                      weight="medium"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.switchAmountFieldModeValue}
                      testID={testIDs?.amountFieldModeSwitch}
                    >
                      {amountFieldModeSwitch.label}
                    </Text>
                    <View
                      style={[
                        styles.switchAmountFieldModeIcon,
                        {
                          backgroundColor: hovered
                            ? hexToRgba(theme.primaryAccent200, 0.16)
                            : theme.primaryAccent100
                        }
                      ]}
                    >
                      <FlipIcon width={11} height={11} color={theme.primary} />
                    </View>
                  </>
                )}
              </Pressable>
            ) : (
              <View />
            )}
          </View>
          <View style={[styles.tokenRow, isTokenRowSplitEvenly && styles.tokenRowEven]}>
            <View style={flexbox.flex1}>{token}</View>
            <View
              style={amountColumnStyle}
              // On the web the column runs under the select's last stretch, so it must not swallow
              // the clicks that belong to it - its own content is padded clear of it
              pointerEvents="box-none"
            >
              <View style={styles.amount} pointerEvents="box-none">
                <AmountInput
                  type={amountFieldMode}
                  value={amount}
                  onChangeText={onAmountChange}
                  precision={precision}
                  disabled={disabled}
                  inputTestId={testIDs?.amount}
                  // Matches the received amount ToToken renders right below it on Swap & Bridge
                  fontSize={20}
                />
                {!!amountAccessory && <View style={styles.amountAccessory}>{amountAccessory}</View>}
              </View>
            </View>
          </View>
          <View style={[styles.sliderRow, sliderStyle]}>
            <View style={flexbox.flex1}>
              <AmountSlider
                value={slider.value}
                maximumValue={disabled ? 0n : slider.maximumValue}
                onValueChange={slider.onValueChange}
                tierOffset={slider.tierOffset}
                marks={slider.marks}
              />
            </View>
            <MaxButton
              onPress={onMaxPress}
              disabled={disabled || isMaxDisabled}
              testID={testIDs?.maxButton}
              style={styles.maxButton}
            />
          </View>
          {children}
        </ItemPanel>
      </View>
      {!!message?.text && (
        <Text
          fontSize={12}
          style={styles.message}
          appearance={isWarning ? 'warningText' : 'errorText'}
        >
          {message.text}
        </Text>
      )}
    </>
  )
}

export default memo(TokenAndAmountSelector)
