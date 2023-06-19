import {
  getDiscountApplied,
  getFeesData,
  isTokenEligible,
  mapTxnErrMsg
} from 'ambire-common/src/helpers/sendTxnHelpers'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import { ethers } from 'ethers'
import React, { useEffect, useState } from 'react'
import { TouchableOpacity, View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Select from '@common/components/Select'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import CustomFee from './CustomFee'
import styles from './styles'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const OVERPRICED_MULTIPLIER = 1.2

// NOTE: Order matters for for secondary fort after the one by discount
const DISCOUNT_TOKENS_SYMBOLS = ['xWALLET', 'WALLET-STAKING', 'WALLET']

function getBalance(token: any) {
  const { balance, decimals, priceInUSD } = token
  return (balance / decimals) * priceInUSD
}

const WalletDiscountBanner = ({
  t,
  assetsItems,
  tokens,
  estimation,
  setCurrency,
  feeSpeed,
  isGasTankEnabled,
  network
}: any) => {
  if (
    estimation.selectedFeeToken?.symbol &&
    (DISCOUNT_TOKENS_SYMBOLS.includes(estimation.selectedFeeToken?.symbol) ||
      estimation.selectedFeeToken?.discount)
  ) {
    return null
  }
  const walletDiscountTokens = [...tokens]
    .filter(
      (x) =>
        DISCOUNT_TOKENS_SYMBOLS.includes(x.symbol) &&
        x.discount &&
        isTokenEligible(x, feeSpeed, estimation, x.isGasTankToken, network)
    )
    .sort(
      (a, b) =>
        b.discount - a.discount ||
        // eslint-disable-next-line radix
        (!parseInt(a.balance) || !parseInt(b.balance) ? getBalance(b) - getBalance(a) : 0) ||
        DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol)
    )

  if (!walletDiscountTokens.length) return null

  const discountToken = walletDiscountTokens[0]

  const { discount } = discountToken
  const eligibleWalletToken = assetsItems.find(
    (x: any) => x.value && (x.value === 'WALLET' || x.value === discountToken.address)
  )
  const action = eligibleWalletToken ? () => setCurrency(eligibleWalletToken.value) : () => null
  // TODO: implement go to swap when not eligible
  const actionTxt = eligibleWalletToken
    ? t('Use {{symbol}}', { symbol: discountToken.symbol })
    : t('Buy {{symbol}}', { symbol: discountToken.symbol })

  return (
    <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mb]}>
      <InfoIcon />
      <View style={[flexboxStyles.flex1, spacings.plTy]}>
        <Text fontSize={12}>{`Get ${discount * 100}% fees discount`}</Text>
        <Text>
          <Text fontSize={12}>{'with '}</Text>
          <Text weight="medium" fontSize={12}>
            $WALLET
          </Text>
        </Text>
      </View>
      <Button
        text={actionTxt}
        // TODO: remove when navigate to swap is implemented
        disabled={!eligibleWalletToken}
        type="outline"
        hasBottomSpacing={false}
        size="small"
        onPress={action}
      />
    </View>
  )
}

const mapGasTankTokens = (nativePrice: number) => (item: any) => {
  const nativeRate =
    item.address === '0x0000000000000000000000000000000000000000' ? null : nativePrice / item.price
  return {
    ...item,
    symbol: item.symbol.toUpperCase(),
    balance: ethers.utils
      .parseUnits(item.balance.toFixed(item.decimals).toString(), item.decimals)
      .toString(),
    nativeRate
  }
}

const FeeSelector = ({
  disabled,
  signer,
  estimation,
  setEstimation,
  feeSpeed,
  setFeeSpeed,
  network,
  isGasTankEnabled
}: any) => {
  const [currency, setCurrency] = useState<any>(null)
  const [editCustomFee, setEditCustomFee] = useState(false)
  const { navigate } = useNavigation()
  const { t } = useTranslation()

  // Initially sets a value in the Select
  useEffect(() => {
    if (!currency && estimation?.selectedFeeToken?.symbol) {
      setCurrency(estimation?.selectedFeeToken?.symbol)
    }
  }, [currency, estimation?.selectedFeeToken?.symbol])

  useEffect(() => {
    if (currency) {
      const tokens = estimation?.remainingFeeTokenBalances || [
        { symbol: network.nativeAssetSymbol, decimals: 18 }
      ]
      const token = tokens.find(({ symbol }: any) => symbol === currency)
      setEstimation({ ...estimation, selectedFeeToken: token })
    }
  }, [currency])

  const renderFeeSelector = () => {
    if (!estimation || !estimation?.selectedFeeToken)
      return (
        <View
          style={[
            spacings.pb,
            spacings.ptTy,
            flexboxStyles.alignCenter,
            flexboxStyles.justifyCenter
          ]}
        >
          <Spinner />
        </View>
      )

    // Only check for insufficient fee in relayer mode (.feeInUSD is available)
    // Otherwise we don't care whether the user has enough for fees, their signer wallet will take care of it
    const insufficientFee =
      estimation &&
      estimation.feeInUSD &&
      !isTokenEligible(
        estimation.selectedFeeToken,
        feeSpeed,
        estimation,
        !!estimation.selectedFeeToken.isGasTankToken,
        network
      )
    if (estimation && !estimation.success)
      return (
        <Text appearance="danger" fontSize={14}>
          {t('The current transaction batch cannot be sent because it will fail: {{msg}}', {
            msg: mapTxnErrMsg(estimation.message)
          })}
        </Text>
      )

    if (!estimation.feeInNative) return null

    if (estimation && !estimation.feeInUSD && estimation.gasLimit < 40000) {
      return (
        <Text fontSize={14}>
          {t(
            "WARNING: Fee estimation unavailable when you're doing your first account transaction and you are not connected to a relayer. You will pay the fee from {{address}}, make sure you have {{symbol}} there.",
            { address: signer.address, symbol: network.nativeAssetSymbol }
          )}
        </Text>
      )
    }
    if (estimation && estimation.feeInUSD && !estimation.remainingFeeTokenBalances) {
      return (
        <Text fontSize={14} appearance="danger">
          {t(
            'Internal error: fee balances not available. This should never happen, please report this on help.ambire.com'
          )}
        </Text>
      )
    }

    estimation.gasTank?.map(mapGasTankTokens(estimation.nativeAssetPriceInUSD))

    const { nativeAssetSymbol } = network
    const tokens = estimation.remainingFeeTokenBalances || [
      {
        symbol: nativeAssetSymbol,
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000'
      }
    ]

    const assetsItems = tokens
      .sort(
        (a: any, b: any) =>
          isTokenEligible(b, SPEEDS[0], estimation, !!b.isGasTankToken, network) -
            isTokenEligible(a, SPEEDS[0], estimation, !!a.isGasTankToken, network) ||
          DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol) ||
          (b.discount || 0) - (a.discount || 0) ||
          a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
      )
      .map(({ address, label, symbol, discount, icon, ...rest }: any) => ({
        label: label || symbol,
        value: symbol,
        isGasTankToken: rest.isGasTankToken,
        disabled: !isTokenEligible(
          { address, symbol, discount, ...rest },
          SPEEDS[0],
          estimation,
          !!rest.isGasTankToken,
          network
        ),
        icon: () => <TokenIcon uri={icon} withContainer networkId={network?.id} address={address} />
      }))
      // mort alphabetically
      .sort((a: any, b: any) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1))
      // move gas tank tokens to the top
      .sort((a: any, b: any) => {
        // skip sorting if the same
        if (a.isGasTankToken === b.isGasTankToken) return 0

        return a.isGasTankToken ? -1 : 1
      })
      // move disabled tokens to the bottom
      .sort((a: any, b: any) => {
        // skip sorting if the same
        if (a.disabled === b.disabled) return 0

        return a.disabled ? 1 : -1
      })

    const { discount = 0, symbol, nativeRate = null, decimals } = estimation.selectedFeeToken
    const feeCurrencySelect = estimation.feeInUSD ? (
      <Select
        value={currency}
        setValue={setCurrency}
        items={assetsItems}
        disabled={disabled}
        label={t('Fee currency')}
        extraText={discount ? `-${discount * 100}%` : ''}
      />
    ) : null

    const setCustomFee = (value: any) =>
      setEstimation((prevEstimation: any) => ({
        ...prevEstimation,
        customFee: value
      }))

    const selectFeeSpeed = (speed: any) => {
      setFeeSpeed(speed)
      setCustomFee(null)
      setEditCustomFee(false)
    }

    const checkIsSelectorDisabled = (speed: any) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const insufficientFee = !isTokenEligible(
        estimation.selectedFeeToken,
        speed,
        estimation,
        !!estimation.selectedFeeToken.isGasTankToken,
        network
      )
      return disabled || insufficientFee
    }

    const feeAmountSelectors = SPEEDS.map((speed) => {
      const {
        feeInFeeToken,
        feeInUSD
        // NOTE: get the estimation res data w/o custom fee for the speeds
      } = getFeesData(
        { ...estimation.selectedFeeToken },
        { ...estimation, customFee: null },
        speed,
        !!estimation.selectedFeeToken.isGasTankToken,
        network
      )

      const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
      const discountInFeeInUSD = getDiscountApplied(feeInUSD, discount)

      const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
      const baseFeeInFeeUSD = feeInUSD ? feeInUSD + discountInFeeInUSD : null

      const showInUSD = nativeRate !== null && baseFeeInFeeUSD

      return (
        <View style={flexboxStyles.flex1} key={speed}>
          <TouchableOpacity
            key={speed}
            onPress={() => {
              !checkIsSelectorDisabled(speed) && selectFeeSpeed(speed)
            }}
            style={[
              styles.feeSelector,
              !estimation.customFee && feeSpeed === speed && styles.selected,
              !!disabled && { opacity: 0.6 }
            ]}
            disabled={checkIsSelectorDisabled(speed)}
          >
            <Text
              numberOfLines={1}
              fontSize={12}
              weight="regular"
              style={[spacings.mbTy, textStyles.capitalize]}
            >
              {speed}
            </Text>
            <Text
              numberOfLines={2}
              fontSize={12}
              style={
                // Workaround for react-native-web issue, happening with long
                // continuous strings. Otherwise, those strings go beyond the
                // layout and break the UI.
                // {@link https://github.com/necolas/react-native-web/issues/760#issuecomment-816941918}
                // @ts-ignore-next-line
                isWeb && { wordBreak: 'break-word' }
              }
            >
              {showInUSD
                ? `$${formatFloatTokenAmount(baseFeeInFeeUSD, true, 4)}`
                : formatFloatTokenAmount(baseFeeInFeeToken, true, decimals)}
            </Text>
            {!showInUSD && (
              <Text fontSize={10} weight="regular" color={colors.titan_50}>
                {estimation.selectedFeeToken.symbol}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )
    })

    const { feeInFeeToken, feeInUSD, savedGas } = getFeesData(
      estimation.selectedFeeToken,
      estimation,
      feeSpeed,
      !!estimation.selectedFeeToken.isGasTankToken,
      network
    )

    const { feeInFeeToken: minFee, feeInUSD: minFeeUSD } = getFeesData(
      { ...estimation.selectedFeeToken },
      { ...estimation, customFee: null },
      'slow',
      !!estimation.selectedFeeToken.isGasTankToken,
      network
    )

    const { feeInFeeToken: maxFee, feeInUSD: maxFeeUSD } = getFeesData(
      { ...estimation.selectedFeeToken },
      { ...estimation, customFee: null },
      'ape',
      !!estimation.selectedFeeToken.isGasTankToken,
      network
    )

    const discountMin = getDiscountApplied(minFee, discount)
    const discountMax = getDiscountApplied(maxFee, discount)

    const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
    const discountInUSD = getDiscountApplied(feeInUSD, discount)
    const discountBaseMinInUSD = getDiscountApplied(minFeeUSD, discount)
    const discountBaseMaxInUSD = getDiscountApplied(maxFeeUSD, discount)

    // Fees with no discounts applied
    const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
    const baseFeeInUSD = feeInUSD + discountInUSD
    const baseMinFee = minFee + discountMin
    const baseMaxFee = (maxFee + discountMax) * OVERPRICED_MULTIPLIER
    const baseMinFeeUSD = minFeeUSD + discountBaseMinInUSD
    const baseMaxFeeUSD = (maxFeeUSD + discountBaseMaxInUSD) * OVERPRICED_MULTIPLIER

    const isUnderpriced =
      !!estimation.customFee &&
      !Number.isNaN(parseFloat(estimation.customFee)) &&
      baseFeeInFeeToken < baseMinFee

    const isOverpriced =
      !!estimation.customFee &&
      !Number.isNaN(parseFloat(estimation.customFee)) &&
      baseFeeInFeeToken > baseMaxFee

    return (
      <>
        {WalletDiscountBanner({
          t,
          assetsItems,
          selectedFeeToken: estimation.selectedFeeToken,
          tokens,
          estimation,
          setCurrency,
          navigate,
          feeSpeed,
          isGasTankEnabled,
          network
        })}
        <View
          style={[spacings.mbMi, flexboxStyles.directionRow, flexboxStyles.justifySpaceBetween]}
        >
          <Text fontSize={14}>{t('Transaction speed')}</Text>
          {/* Since v3.11.0, gas tank is treated as "always enabled" */}
          {/* and gas tank tokens are always visible in the tokens fee list */}
          {/* <Text fontSize={14}>
            {t('Gas Tank: ')}
            <Text fontSize={14} color={isGasTankEnabled ? colors.turquoise : colors.pink}>
              {isGasTankEnabled ? t('Enabled') : t('Disabled')}
            </Text>
          </Text> */}
        </View>
        <View style={styles.selectorsContainer}>{feeAmountSelectors}</View>

        <CustomFee
          isEditEnabled={editCustomFee}
          setEnableEdit={() => setEditCustomFee(true)}
          setCustomFee={setCustomFee}
          value={estimation.customFee}
          disabled={disabled}
          symbol={symbol}
          info={
            (isUnderpriced || isOverpriced) && (
              <>
                {isUnderpriced && (
                  <>
                    <Text fontSize={12} color={colors.mustard} style={spacings.mbMi}>
                      {t(
                        'Custom Fee too low. You can try to "sign and send" the transaction but most probably it will fail.'
                      )}
                    </Text>
                    {'\n'}
                    <Text fontSize={12} color={colors.mustard}>
                      {t('Min estimated fee: ')}
                      {'\n'}

                      <Text
                        underline
                        fontSize={12}
                        onPress={() => setCustomFee(baseMinFee.toString())}
                        weight="regular"
                      >
                        {baseMinFee} {symbol}
                      </Text>
                      {!Number.isNaN(baseMinFeeUSD) && (
                        <Text fontSize={12} color={colors.mustard}>
                          {' '}
                          (~${formatFloatTokenAmount(baseMinFeeUSD, true, 4)}){' '}
                        </Text>
                      )}
                    </Text>
                  </>
                )}
                {isOverpriced && (
                  <>
                    <Text fontSize={12} color={colors.mustard} style={spacings.mbMi}>
                      {t(
                        'Custom Fee is higher than the APE speed. You will pay more than probably needed. Make sure you know what are you doing!'
                      )}
                    </Text>
                    {'\n'}
                    <Text fontSize={12} color={colors.mustard}>
                      {t('Recommended max fee: ')}
                      {'\n'}

                      <Text
                        underline
                        fontSize={12}
                        onPress={() => setCustomFee(baseMaxFee.toString())}
                        weight="regular"
                      >
                        {baseMaxFee} {symbol}
                      </Text>
                      {!Number.isNaN(baseMaxFeeUSD) && (
                        <Text fontSize={12} color={colors.mustard}>
                          {' '}
                          (~${formatFloatTokenAmount(baseMaxFeeUSD, true, 4)}){' '}
                        </Text>
                      )}
                    </Text>
                  </>
                )}
              </>
            )
          }
        />

        {insufficientFee ? (
          <Text fontSize={12} appearance="danger" style={[spacings.mbTy, spacings.phSm]}>
            {t('Insufficient balance for the fee. Accepted tokens: ')}
            {(estimation.remainingFeeTokenBalances || []).map((x: any) => x.symbol).join(', ')}.
            {/* Since v3.11.0, gas tank is treated as "always enabled" */}
            {/* {isGasTankEnabled && (
              <Text fontSize={12} appearance="danger">
                {t('. Disable your Gas Tank to use the default fee tokens.')}
              </Text>
            )} */}
          </Text>
        ) : (
          <View style={spacings.mbTy}>{feeCurrencySelect}</View>
        )}

        <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}>
          <Text style={spacings.mrMi} fontSize={12}>
            {t('Fee: ')}
          </Text>
          {!Number.isNaN(baseFeeInFeeToken) && (
            <Text numberOfLines={2} fontSize={12}>
              {`${formatFloatTokenAmount(baseFeeInFeeToken, true, decimals)} ${
                estimation.selectedFeeToken.symbol
              }`}
            </Text>
          )}
          <View style={[flexboxStyles.alignEnd, flexboxStyles.flex1]}>
            {!Number.isNaN(baseFeeInUSD) && (
              <Text fontSize={12}>{`~ $${formatFloatTokenAmount(baseFeeInUSD, true, 4)}`}</Text>
            )}
          </View>
        </View>
        {estimation.selectedFeeToken.isGasTankToken && (
          <>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}>
              <Text style={spacings.mrMi} fontSize={12} color={colors.turquoise}>
                {t('Fee token balance: ')}
              </Text>
              <View style={[flexboxStyles.alignEnd, flexboxStyles.flex1]}>
                <Text fontSize={12} color={colors.turquoise}>{`$${formatFloatTokenAmount(
                  estimation.selectedFeeToken.balanceInUSD,
                  true,
                  4
                )}`}</Text>
              </View>
            </View>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}>
              <Text style={spacings.mrMi} fontSize={12} color={colors.turquoise}>
                {t('You save: ')}
              </Text>
              <View style={[flexboxStyles.alignEnd, flexboxStyles.flex1]}>
                <Text fontSize={12} color={colors.turquoise}>{`$${formatFloatTokenAmount(
                  (feeInUSD / estimation.gasLimit) * savedGas,
                  true,
                  4
                )}`}</Text>
              </View>
            </View>
          </>
        )}

        {!!discount && (
          <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}>
            <Text fontSize={12} color={colors.heliotrope}>
              You save ({discount * 100}%):
            </Text>
            <View style={[flexboxStyles.alignEnd, flexboxStyles.flex1]}>
              <Text fontSize={12} color={colors.heliotrope}>
                ~${formatFloatTokenAmount(discountInUSD, true, 4)}
              </Text>
            </View>
          </View>
        )}

        {!!discount && (
          <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mbTy]}>
            <Text fontSize={12} color={colors.heliotrope}>
              You pay:
            </Text>
            <View style={[flexboxStyles.alignEnd, flexboxStyles.flex1]}>
              <Text fontSize={12} color={colors.heliotrope}>
                ~${formatFloatTokenAmount(feeInUSD, true, 4)}
              </Text>
            </View>
          </View>
        )}

        {!estimation.feeInUSD ? (
          <Text style={spacings.phSm} fontSize={12} color={colors.mustard}>
            {t(
              'WARNING: Paying fees in tokens other than {{symbol}} is unavailable because you are not connected to a relayer. You will pay the fee from {{address}}.',
              { symbol: nativeAssetSymbol, address: signer.address }
            )}
          </Text>
        ) : null}
      </>
    )
  }

  return (
    <Panel type="filled">
      <Title type="small" style={textStyles.center}>
        {t('Fee')}
      </Title>

      {renderFeeSelector()}
    </Panel>
  )
}

export default React.memo(FeeSelector)
