import { ethers } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native'

import LeftArrowIcon from '@assets/svg/LeftArrowIcon'
import { useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import NavIconWrapper from '@modules/common/components/NavIconWrapper'
import NumberInput from '@modules/common/components/NumberInput'
import Segments from '@modules/common/components/Segments'
import Select from '@modules/common/components/Select'
import Text from '@modules/common/components/Text'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import {
  ExpandableCardContext,
  ExpandableCardProvider
} from '@modules/earn/contexts/expandableCardContext/expandableCardContext'

import styles from './styles'

const segments = [{ value: 'Deposit' }, { value: 'Withdraw' }]

const Card = ({
  loading,
  unavailable,
  tokensItems,
  Icon,
  details,
  onTokenSelect,
  onValidate
}: any) => {
  const [segment, setSegment] = useState<any>(segments[0].value)
  const [tokens, setTokens] = useState<any>([])
  const [token, setToken] = useState<any>()
  const [amount, setAmount] = useState<any>(0)
  const [disabled, setDisabled] = useState<any>(true)

  const { t } = useTranslation()

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
    if (segment === segments[0]?.value)
      setTokens(sortedTokenItems.filter(({ type }) => type === 'deposit'))
    if (segment === segments[1]?.value)
      setTokens(sortedTokenItems.filter(({ type }) => type === 'withdraw'))
  }, [segment, sortedTokenItems])

  useEffect(() => setAmount(0), [token, segment])

  useEffect(() => {
    onTokenSelect(token)
    setDisabled(!token || !tokens.length)
  }, [token, onTokenSelect, tokens.length])

  const assetsItems = useMemo(
    () =>
      tokens.map(({ label, symbol, value, icon }: any) => ({
        label: label || symbol,
        value,
        icon: () => <Image source={{ uri: icon }} style={{ width: 30, height: 30 }} />
      })),
    [tokens]
  )

  useEffect(() => {
    if (assetsItems.length && !token) setToken(assetsItems[0]?.value)
  }, [assetsItems])

  const amountLabel = (
    <View style={[flexboxStyles.directionRow, spacings.mbMi]}>
      <Text style={flexboxStyles.flex1} color={colors.secondaryTextColor}>
        {t('Available Amount:')}
      </Text>
      <Text color={colors.secondaryTextColor}>
        {!disabled ? `${getMaxAmount()} ${currentToken?.symbol}` : '0'}
      </Text>
    </View>
  )

  useEffect(() => {
    if (loading) setToken(null)
  }, [loading])

  const expandedContent = (
    <>
      {!!loading && <ActivityIndicator />}
      {!loading && !!unavailable && (
        <Text style={[textStyles.center, spacings.pvSm]}>{t('Unavailable on this Network')}</Text>
      )}
      {!loading && !unavailable && (
        <View>
          <Select
            value={token}
            items={assetsItems}
            setValue={setToken}
            containerPropsStyle={spacings.mbSm}
            // TODO:
            //  disabled={disabled}
            label={t('Choose Token')}
          />
          {!disabled ? (
            <View style={[spacings.mbMd]}>
              {details.map(([type, value]: any) => (
                <View key={type + value} style={[spacings.mbMi, flexboxStyles.directionRow]}>
                  <Text style={[textStyles.bold, flexboxStyles.flex1]}>{type}</Text>
                  <Text>{value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.detailsPlaceholderContainer}>
              <View style={styles.detailsPlaceholder} />
              <View style={styles.detailsPlaceholder} />
              <View style={styles.detailsPlaceholder} />
            </View>
          )}
          <View style={spacings.mbLg}>
            <Segments
              defaultValue={segment}
              segments={segments}
              onChange={(value) => setSegment(value)}
            />
          </View>
          <View style={spacings.mbLg}>
            <NumberInput
              onChangeText={setAmount}
              keyboardType="numeric"
              autoCorrect={false}
              value={amount.toString()}
              buttonText={t('MAX')}
              onButtonPress={setMaxAmount}
              disabled={!currentToken?.balance}
              labelComponent={amountLabel}
            />
          </View>
          <Button
            disabled={disabled || amount <= 0 || amount > currentToken?.balance}
            // TODO:
            // icon={segment === segments[0].value ? <BsArrowDownSquare /> : <BsArrowUpSquare />}
            onPress={() => onValidate(segment, token, amount)}
            hasBottomSpacing={false}
            text={segment}
          />
        </View>
      )}
    </>
  )

  return (
    <ExpandableCardProvider>
      <ExpandableCardContext.Consumer>
        {({ isExpanded, expand, collapse }) => (
          <>
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
                {!!Icon && <Icon />}
              </TouchableOpacity>
            </View>
            {isExpanded && expandedContent}
          </>
        )}
      </ExpandableCardContext.Consumer>
    </ExpandableCardProvider>
  )
}

export default Card
