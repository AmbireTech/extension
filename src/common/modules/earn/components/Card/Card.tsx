import usePrevious from 'ambire-common/src/hooks/usePrevious'
import { ethers } from 'ethers'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BackHandler, Image, TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Button from '@common/components/Button'
import NavIconWrapper from '@common/components/NavIconWrapper'
import NumberInput from '@common/components/NumberInput'
import Panel from '@common/components/Panel'
import Select from '@common/components/Select'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useNetwork from '@common/hooks/useNetwork'
import { CARDS, CardsVisibilityContext } from '@common/modules/earn/contexts/cardsVisibilityContext'
import { LINEAR_OPACITY_ANIMATION, triggerLayoutAnimation } from '@common/services/layoutAnimation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

type Segment = 'Deposit' | 'Withdraw'

const Card = ({
  name,
  loading,
  unavailable,
  tokensItems,
  icon,
  details,
  onTokenSelect,
  onValidate,
  warning,
  areDepositsDisabled,
  iconStyle,
  customInfo
}: any) => {
  const [segment, setSegment] = useState<Segment>(areDepositsDisabled ? 'Withdraw' : 'Deposit')
  const { network }: any = useNetwork()
  const [tokens, setTokens] = useState<any>([])
  const prevTokens = usePrevious(tokens)
  const [token, setToken] = useState<any>()
  const [amount, setAmount] = useState<any>(0)
  const [disabled, setDisabled] = useState<any>(true)
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const { visibleCard, setVisibleCard } = useContext(CardsVisibilityContext)

  useEffect(() => {
    if (!isExpanded) {
      return
    }

    const backAction = () => {
      if (isExpanded) {
        triggerLayoutAnimation({
          config: LINEAR_OPACITY_ANIMATION,
          forceAnimate: true
        })
        setIsExpanded(false)
        setVisibleCard(null)
        // Returning true prevents execution of the default native back handling
        return true
      }

      return false
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
  }, [isExpanded])

  const expand = () => {
    triggerLayoutAnimation({
      config: LINEAR_OPACITY_ANIMATION,
      forceAnimate: true
    })
    setVisibleCard(name)
    setIsExpanded(true)
  }

  const collapse = () => {
    triggerLayoutAnimation({
      config: LINEAR_OPACITY_ANIMATION,
      forceAnimate: true
    })
    setVisibleCard(null)
    setIsExpanded(false)
  }

  const currentToken = useMemo(
    () => tokens.find(({ value }: any) => value === token),
    [token, tokens]
  )

  // Sort tokens items by balance
  const getEquToken = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-shadow
    (token) =>
      tokensItems.find(
        ({ address, type }: any) =>
          address === token.address &&
          (token.type === 'deposit' ? type === 'withdraw' : type === 'deposit')
      ),
    [tokensItems]
  )
  const sortedTokenItems = useMemo(
    () =>
      [...tokensItems].sort(
        (a: any, b: any) =>
          // eslint-disable-next-line no-unsafe-optional-chaining
          b?.balance + getEquToken(b)?.balance - (a?.balance + getEquToken(a)?.balance)
      ),
    [tokensItems, getEquToken]
  )

  const getMaxAmount = () => {
    if (!currentToken) return 0
    const { balanceRaw, decimals } = currentToken
    return ethers.utils.formatUnits(balanceRaw, decimals)
  }

  const setMaxAmount = () => setAmount(getMaxAmount())

  useEffect(() => {
    if (segment === 'Deposit') setTokens(sortedTokenItems.filter(({ type }) => type === 'deposit'))
    if (segment === 'Withdraw')
      setTokens(sortedTokenItems.filter(({ type }) => type === 'withdraw'))
  }, [segment, sortedTokenItems])

  useEffect(() => {
    setAmount(0)
  }, [token, segment])

  useEffect(() => {
    onTokenSelect(token)
    setDisabled(!token || !tokens.length)
  }, [token, onTokenSelect, tokens.length])

  const assetsItems = useMemo(
    () =>
      tokens.map(({ label, symbol, value, icon, address }: any) => ({
        label: label || symbol,
        value,
        icon: () => <TokenIcon withContainer uri={icon} networkId={network?.id} address={address} />
      })),
    [network?.id, tokens]
  )
  useEffect(() => {
    if (!assetsItems.length) return

    if (!token) {
      let defaultToken = assetsItems[0]

      // For the Ambire card, bypass the default sorting and always set the
      // $WALLET token by default
      if (name === CARDS.Ambire) {
        const walletToken = assetsItems.find(({ label }: { label: string }) => label === 'WALLET')
        if (walletToken) {
          defaultToken = walletToken
        }
      }

      setToken(defaultToken.value)
      return
    }

    if (assetsItems.every(({ value }) => value !== token)) {
      // Try persisting the currently selected by it's label, instead of address.
      // Use case: WALLET and ADX tokens withdraw and deposit addresses are
      // different. However, they are displayed with the same label. So try to
      // match the label and persist the currently selected one.
      const prevTokenLabel = prevTokens?.find(({ value }) => value === token)?.label
      const nextToken = assetsItems.find(({ label }) => label === prevTokenLabel) || assetsItems[0]

      setToken(nextToken.value)
    }
  }, [assetsItems, name, prevTokens, token])

  const amountLabel = (
    <View style={[flexboxStyles.directionRow, spacings.mbMi]}>
      <Text style={spacings.mr}>{t('Available Amount:')}</Text>

      <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
        <Text numberOfLines={1} style={{ flex: 1, textAlign: 'right' }} ellipsizeMode="tail">
          {!disabled ? `${getMaxAmount()}` : '0.0'}
        </Text>
        {currentToken && <Text>{` ${currentToken?.symbol}`}</Text>}
      </View>
    </View>
  )

  useEffect(() => {
    if (loading) setToken(null)
  }, [loading])

  const expandedContent = (
    <>
      {!!loading && <Spinner />}
      {!loading && !!unavailable && (
        <Text style={[textStyles.center, spacings.pvSm]}>{t('Unavailable on this Network')}</Text>
      )}
      {!loading && !unavailable && (
        <View>
          <Select
            value={token}
            items={assetsItems.sort((a, b) =>
              a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1
            )}
            setValue={setToken}
            label={t('Choose Token')}
          />
          {warning && <View style={spacings.mbMd}>{warning}</View>}
          <View style={[flexboxStyles.directionRow, spacings.mbTy]}>
            <View style={[flexboxStyles.flex1, spacings.prTy]}>
              <Button
                text={t('Deposit')}
                textStyle={[
                  segment === 'Deposit' ? { color: colors.titan } : { color: colors.waikawaGray },
                  { fontSize: 14 }
                ]}
                type={segment === 'Deposit' ? 'outline' : 'secondary'}
                onPress={() => setSegment('Deposit')}
                disabled={areDepositsDisabled}
              />
            </View>
            <View style={[flexboxStyles.flex1, spacings.plTy]}>
              <Button
                text={t('Withdraw')}
                textStyle={[
                  segment === 'Withdraw' ? { color: colors.titan } : { color: colors.waikawaGray },
                  { fontSize: 14 }
                ]}
                type={segment === 'Withdraw' ? 'outline' : 'secondary'}
                onPress={() => setSegment('Withdraw')}
              />
            </View>
          </View>
          {!!customInfo && segment === 'Withdraw' ? (
            customInfo
          ) : (
            <>
              <NumberInput
                onChangeText={setAmount}
                keyboardType="numeric"
                autoCorrect={false}
                value={amount.toString()}
                button={t('MAX')}
                onButtonPress={setMaxAmount}
                disabled={Number(currentToken?.balance || 0) === 0}
                labelComponent={amountLabel}
              />
              <Button
                disabled={
                  disabled ||
                  amount <= 0 ||
                  amount > Number(currentToken?.balance || 0) ||
                  (areDepositsDisabled && segment === 'Deposit')
                }
                onPress={() => onValidate(segment, token, amount)}
                text={segment}
              />
            </>
          )}
          {!disabled && (
            <View style={spacings.pt}>
              <Text style={spacings.mbTy} fontSize={16} color={colors.baileyBells} weight="medium">
                {t('Details')}
              </Text>
              <View>
                {details.map(([type, value]: any, idx: number) => (
                  <View
                    key={type + value}
                    style={[
                      styles.detailsItem,
                      idx !== details.length - 1 && { borderBottomWidth: 1 }
                    ]}
                  >
                    <Text
                      weight="medium"
                      style={[flexboxStyles.flex1, spacings.prTy]}
                      numberOfLines={1}
                    >
                      {type}
                    </Text>
                    <Text color={colors.baileyBells}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </>
  )

  return (
    <View>
      <Panel
        type="filled"
        style={[
          !isExpanded && { minHeight: 120 },
          !!visibleCard && visibleCard !== name && { display: 'none' }
        ]}
        contentContainerStyle={{ height: '100%' }}
      >
        <View
          style={[
            !isExpanded && flexboxStyles.flex1,
            isExpanded && { width: '100%', marginBottom: 40 }
          ]}
        >
          {isExpanded && (
            <NavIconWrapper style={styles.backButton} onPress={collapse}>
              <LeftArrowIcon />
            </NavIconWrapper>
          )}
          <TouchableOpacity
            style={[
              flexboxStyles.alignCenter,
              isExpanded && spacings.ptMi,
              !isExpanded && flexboxStyles.flex1,
              !isExpanded && flexboxStyles.justifyCenter
            ]}
            activeOpacity={isExpanded ? 1 : 0.7}
            onPress={() => (isExpanded ? null : expand())}
          >
            {!!icon && <Image source={icon} style={iconStyle || {}} />}
          </TouchableOpacity>
        </View>
        {isExpanded && expandedContent}
      </Panel>
    </View>
  )
}

export default Card
