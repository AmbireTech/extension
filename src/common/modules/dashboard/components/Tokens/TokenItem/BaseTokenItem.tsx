import React, { useMemo } from 'react'
import { Image, View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { FormatType } from '@ambire-common/utils/formatDecimals/formatDecimals'
// @ts-ignore
import rewardsImage from '@common/assets/images/AmbireLogoLikeCoin.png'
import BatchIcon from '@common/assets/svg/BatchIcon'
import PendingToBeConfirmedIcon from '@common/assets/svg/PendingToBeConfirmedIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_2XL, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import { getTokenId } from '@common/utils/token'

import PendingBadge from './PendingBadge'
import getStyles from './styles'

type Props = {
  token: TokenResult
  extraActions?: React.ReactNode
  rewardsStyle?: boolean
  label?: string | React.ReactNode
  borderRadius?: number
  decimalRulesType?: FormatType
  hasBottomSpacing?: boolean
  onPress?: () => void
  wrapperTestID?: string
}

const BaseTokenItem = ({
  token,
  extraActions,
  rewardsStyle,
  borderRadius,
  decimalRulesType = 'amount',
  hasBottomSpacing = false,
  onPress,
  wrapperTestID
}: Props) => {
  const { state: portfolio } = useController(
    'SelectedAccountController',
    (state) => state.portfolio
  )

  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()

  const [bindAnim, animStyle, isHovered] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })
  const [bindAnimPending, animStylePending, isHoveredPending] = useCustomHover({
    property: 'borderColor',
    values: { from: 'transparent', to: theme.warningText }
  })

  const tokenId = getTokenId(token)
  const simulatedAccountOp = portfolio.networkSimulatedAccountOp[token.chainId.toString()]

  const {
    symbol,
    address,
    chainId,
    flags: { onGasTank }
  } = token

  const {
    balanceFormatted,
    balance,
    balanceLatestFormatted,
    priceUSDFormatted,
    balanceUSDFormatted,
    isPending: hasPendingBadges,
    pendingBalance,
    change24h,
    change24hFormatted,
    pendingBalanceFormatted,
    pendingBalanceUSDFormatted,
    pendingToBeSigned,
    pendingToBeSignedFormatted,
    pendingToBeConfirmed,
    pendingToBeConfirmedFormatted
  } = getAndFormatTokenDetails(token, networks, simulatedAccountOp, { decimalRulesType })

  const isPending = !!hasPendingBadges

  const textColor = useMemo(() => {
    if (!isPending) return theme.primaryText
    return pendingToBeSigned ? theme.warningText : theme.infoText
  }, [isPending, pendingToBeSigned, theme.primaryText, theme.warningText, theme.infoText])

  return (
    <AnimatedPressable
      testID={wrapperTestID || undefined}
      onPress={() =>
        rewardsStyle && onPress
          ? onPress()
          : navigate(ROUTES.tokenDetails, {
              state: {
                tokenId
              }
            })
      }
      style={[
        styles.container,
        {
          borderRadius: borderRadius || BORDER_RADIUS_PRIMARY,
          marginBottom: hasBottomSpacing ? SPACING_TY : 0,
          ...(rewardsStyle && {
            boxShadow: `0 ${isHovered ? 2 : 3}px 0 0 ${String(theme.primaryAccent)}`
          })
        },
        animStyle
      ]}
      {...bindAnim}
    >
      <View style={flexboxStyles.flex1}>
        <View style={[flexboxStyles.directionRow, flexboxStyles.flex1]}>
          <View style={[spacings.mrTy, flexboxStyles.justifyCenter]}>
            {rewardsStyle ? (
              <Image source={rewardsImage as any} style={{ width: 40, height: 40 }} />
            ) : (
              <TokenIcon
                withContainer
                address={address}
                chainId={chainId}
                onGasTank={onGasTank}
                containerHeight={40}
                containerWidth={40}
                width={32}
                height={32}
                networkSize={16}
              />
            )}
          </View>

          <View style={[flexboxStyles.flex1, spacings.mr]}>
            <View
              style={[
                flexboxStyles.flex1,
                flexboxStyles.directionRow,
                flexboxStyles.justifySpaceBetween,
                flexboxStyles.alignCenter
              ]}
            >
              <View>
                <Text
                  selectable
                  color={textColor}
                  fontSize={15}
                  weight="semiBold"
                  numberOfLines={1}
                  style={{ lineHeight: 20 }}
                >
                  {symbol}
                </Text>
                <Text
                  selectable
                  fontSize={13}
                  weight="number_medium"
                  numberOfLines={1}
                  dataSet={createGlobalTooltipDataSet({
                    id: `${tokenId}-balance`,
                    content: String(isPending ? pendingBalance : balance)
                  })}
                  appearance="secondaryText"
                  testID={`token-balance-${tokenId}`}
                >
                  {isPending ? pendingBalanceFormatted : balanceFormatted}
                </Text>
              </View>
              {/* area for optional actions (Claim button etc) */}
              {extraActions}
            </View>
          </View>
          <View style={[flexboxStyles.alignEnd, flexboxStyles.justifyCenter]}>
            <Text
              selectable
              fontSize={15}
              weight="number_bold"
              color={textColor}
              style={{ lineHeight: 20 }}
            >
              {isPending ? pendingBalanceUSDFormatted : balanceUSDFormatted}
            </Text>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
              <Text
                style={{
                  lineHeight: 15
                }}
                selectable
                fontSize={13}
                appearance="secondaryText"
                weight="number_medium"
              >
                {priceUSDFormatted}
              </Text>
              {typeof change24h === 'number' && (
                <Text
                  fontSize={13}
                  style={{
                    lineHeight: 15,
                    ...spacings.mlMi
                  }}
                  weight="number_medium"
                  appearance={change24h >= 0 ? 'successText' : 'errorText'}
                >
                  {change24hFormatted}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View>
          {!!pendingToBeSigned && !!pendingToBeSignedFormatted && isPending && (
            <AnimatedPressable
              onPress={() => {
                if (!simulatedAccountOp) return
                requestsDispatch({
                  type: 'method',
                  params: {
                    method: 'setCurrentUserRequestById',
                    args: [`${simulatedAccountOp.accountAddr}-${simulatedAccountOp.chainId}`]
                  }
                })
              }}
              style={[
                {
                  marginLeft: SPACING_2XL + SPACING_TY,
                  // @ts-ignore react-native-web supports `cursor`, but it's missing from React Native StyleProp<ViewStyle> types
                  cursor: simulatedAccountOp ? 'pointer' : 'auto'
                },
                spacings.mtSm,
                animStylePending
              ]}
              {...bindAnimPending}
            >
              <PendingBadge
                amount={pendingToBeSigned}
                amountFormatted={pendingToBeSignedFormatted}
                label="awaiting signature"
                backgroundColor={theme.warningBackground}
                textColor={theme.warningText}
                Icon={BatchIcon}
                borderColor={isHoveredPending ? theme.warningText : 'transparent'}
              />
            </AnimatedPressable>
          )}

          {!!pendingToBeConfirmed && !!pendingToBeConfirmedFormatted && (
            <PendingBadge
              amount={pendingToBeConfirmed}
              amountFormatted={pendingToBeConfirmedFormatted}
              label="confirming"
              backgroundColor={theme.infoBackground}
              textColor={theme.infoText}
              Icon={PendingToBeConfirmedIcon}
              borderColor={'transparent'}
            />
          )}
        </View>

        {!!pendingToBeSigned && !!pendingToBeSignedFormatted && isPending && (
          <View
            style={[
              flexboxStyles.directionRow,
              flexboxStyles.alignCenter,
              spacings.phSm,
              {
                height: 30
              }
            ]}
          >
            <Text
              selectable
              color={theme.successText}
              weight="medium"
              fontSize={12}
              numberOfLines={1}
            >
              {balanceLatestFormatted} {t('(Onchain)')}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(BaseTokenItem)
