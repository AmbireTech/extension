import { formatUnits } from 'ethers'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import { PrivacyPoolsQuote } from '@ambire-common/interfaces/privacyPools'
import { FeeSpeed } from '@ambire-common/interfaces/signAccountOp'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Select from '@common/components/Select'
import { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  chainId: string
  tokenAddress: string
  symbol: string
  decimals: number
  quote: PrivacyPoolsQuote
  /** USD price of the sent token, or null when unknown. */
  tokenPrice: number | null
}

/** The regular fee selector's speeds, in its order. */
const FEE_SPEEDS = [FeeSpeed.Slow, FeeSpeed.Medium, FeeSpeed.Fast, FeeSpeed.Ape]

/** The SDK always prices at Pimlico's "standard" gas price, which the fee selector calls Medium. */
const PRIVACY_POOLS_FEE_SPEED = FeeSpeed.Medium

const getFeeSpeedLabelText = (speed: FeeSpeed) => speed.charAt(0).toUpperCase() + speed.slice(1)

/**
 * Network fee of a Privacy Pools transfer, laid out like the regular fee selector. Read-only: the
 * fee comes out of the sent amount (paying it from anything else would link it to the transfer)
 * and is locked into the proof with the speed. The speed select lists every speed only to look
 * like the regular one; each shows the same fee and the pick changes nothing.
 *
 * Shows the expected fee when the transfer could be simulated, otherwise the maximum. The
 * difference is refunded to the recipient in the same transaction.
 */
const PrivacyPoolsNetworkFee: FC<Props> = ({
  chainId,
  tokenAddress,
  symbol,
  decimals,
  quote,
  tokenPrice
}) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  const { feeAmount, expectedFeeAmount } = quote
  const shownFee = expectedFeeAmount ?? feeAmount
  const [selectedSpeed, setSelectedSpeed] = useState<FeeSpeed>(PRIVACY_POOLS_FEE_SPEED)

  const formatAmount = useCallback(
    (value: bigint) => formatDecimals(Number(formatUnits(value, decimals)), 'amount'),
    [decimals]
  )

  const shownFeeUsd = useMemo(
    () =>
      tokenPrice === null
        ? null
        : formatDecimals(Number(formatUnits(shownFee, decimals)) * tokenPrice, 'value'),
    [decimals, shownFee, tokenPrice]
  )

  const shownFeeText = `${formatAmount(shownFee)} ${symbol}`

  const speedOptions = useMemo(
    () =>
      FEE_SPEEDS.map((speed) => ({
        value: speed,
        label: (
          <View
            style={[
              flexbox.flex1,
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween
            ]}
            testID={`privacy-pools-fee-speed-${speed}`}
          >
            <Text fontSize={12} style={spacings.mrMi}>
              {t(getFeeSpeedLabelText(speed))}
            </Text>
            <Text fontSize={14} appearance="secondaryText" numberOfLines={1}>
              {shownFeeUsd ?? shownFeeText}
            </Text>
          </View>
        )
      })),
    [shownFeeText, shownFeeUsd, t]
  )

  const selectedSpeedOption = useMemo(
    () => speedOptions.find(({ value }) => value === selectedSpeed) ?? null,
    [selectedSpeed, speedOptions]
  )

  const selectSpeed = useCallback(({ value }: SelectValue) => {
    const speed = FEE_SPEEDS.find((feeSpeed) => feeSpeed === value)
    if (speed) setSelectedSpeed(speed)
  }, [])

  const renderSelectedSpeed = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => (
      <Pressable
        onPress={toggleMenu}
        style={[flexbox.directionRow, flexbox.alignCenter]}
        testID="privacy-pools-fee-speed-select-trigger"
      >
        <View ref={selectRef} style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={14} appearance="secondaryText">
            {t(getFeeSpeedLabelText(selectedSpeed))}
          </Text>
          <View style={spacings.mlMi}>
            {isMenuOpen ? (
              <UpArrowIcon width={12} height={7} />
            ) : (
              <DownArrowIcon width={12} height={7} />
            )}
          </View>
        </View>
      </Pressable>
    ),
    [selectedSpeed, t]
  )

  return (
    <View style={spacings.mbSm} testID="privacy-pools-network-fee">
      <Text fontSize={18} weight="medium" style={spacings.mbTy}>
        {t('Network fee')}
      </Text>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbTy}>
        {t('Pay with')}
      </Text>
      <View style={styles.payWith}>
        <TokenIcon
          containerStyle={{ width: 32, height: 32 }}
          withContainer
          width={28}
          height={28}
          networkSize={14}
          address={tokenAddress}
          chainId={BigInt(chainId)}
        />
        <View style={[flexbox.flex1, spacings.mlTy]}>
          {shownFeeUsd === null ? (
            <Text weight="semiBold" fontSize={14} numberOfLines={1}>
              {shownFeeText}
            </Text>
          ) : (
            <>
              <Text weight="semiBold" fontSize={14} numberOfLines={1}>
                {shownFeeUsd}
              </Text>
              <Text weight="medium" fontSize={12} appearance="secondaryText" numberOfLines={1}>
                {shownFeeText}
              </Text>
            </>
          )}
        </View>
      </View>
      <Text fontSize={12} appearance="secondaryText" style={spacings.mtTy}>
        {t('The network fee is deducted automatically from the {{symbol}} you send.', { symbol })}
      </Text>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mtSm
        ]}
      >
        <Text fontSize={14} appearance="secondaryText">
          {t('Speed')}
        </Text>
        {/* Mirrors the regular fee selector's speed select */}
        <Select
          value={selectedSpeedOption}
          setValue={selectSpeed}
          options={speedOptions}
          renderSelectedOption={renderSelectedSpeed}
          menuOptionHeight={40}
          menuLeftHorizontalOffset={100}
          menuPosition="top"
          bottomSheetTitle={t('Network fee')}
          withSearch={false}
          containerStyle={{
            ...spacings.mb0,
            ...spacings.mrTy,
            width: 'auto',
            alignSelf: 'flex-end'
          }}
          testID="privacy-pools-fee-speed-select"
        />
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsNetworkFee)
