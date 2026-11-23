import { ZeroAddress } from 'ethers'
import React from 'react'
import { View, ViewStyle } from 'react-native'
import { Line, Path, Svg } from 'react-native-svg'

import ClockIcon from '@common/assets/svg/ClockIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import Blockies from '@common/components/Avatar/Blockies'
import Badge from '@common/components/Badge'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

// Fixed, not theme colors: frosted glass over the illustration's background in both themes
const GLASS_BACKGROUND = 'rgba(255, 255, 255, 0.1)'
const GLASS_BACKGROUND_STRONG = 'rgba(255, 255, 255, 0.16)'
const GLASS_SHADOW = '0px 12px 20px 0px rgba(0, 0, 0, 0.12)'
// The orange glow of the Privacy Pools overview card
const PRIVATE_ACCOUNT_BORDER = 'rgba(255, 149, 92, 0.64)'
const PRIVATE_ACCOUNT_SHADOW = '0px 8px 16px 0px rgba(255, 149, 92, 0.24)'
// The connector between the accounts is drawn white in both themes
const CONNECTOR_COLOR = '#FFFFFF'

const AVATAR_SIZE = 40
/** Any public account looks the same here, so its avatar is drawn from a fixed seed */
const PUBLIC_ACCOUNT_AVATAR_SEED = 'privacy-pools-guide-public-account'
/** The width of an account in the transfer between two of them, as in the design */
const TRANSFER_ACCOUNT_WIDTH = 200

// The connector's geometry, in the design's pixels. Its ends overhang the accounts it joins by
// half the diamond, so the diamond sits on the edge of the account above.
const CONNECTOR_HEIGHT = 82
const CONNECTOR_END_SIZE = 8.66
const CONNECTOR_CENTER = CONNECTOR_END_SIZE / 2
const CONNECTOR_ARROW_LENGTH = 7.5
const SEND_BUTTON_HEIGHT = 40
/** Where the Send button's top and bottom are, in the connector's own coordinates */
const SEND_BUTTON_TOP = CONNECTOR_CENTER + (CONNECTOR_HEIGHT - SEND_BUTTON_HEIGHT) / 2
const SEND_BUTTON_BOTTOM = SEND_BUTTON_TOP + SEND_BUTTON_HEIGHT
const CONNECTOR_SVG_HEIGHT = CONNECTOR_HEIGHT + CONNECTOR_CENTER
const CONNECTOR_DASHES = '2 2'

const TOKEN_ROW_WIDTH = 290
const CLOCK_SIZE = 48
/** The clock overlaps the token below it, as in the design */
const CLOCK_OVERLAP = 5

interface AccountChipProps {
  type: 'private' | 'public'
  fontSize?: number
  style?: ViewStyle
}

/** An account as a pill: its avatar and whether it's private or public */
export const PrivacyPoolsGuideAccountChip = ({ type, fontSize = 16, style }: AccountChipProps) => {
  const { t } = useTranslation()
  const isPrivate = type === 'private'

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        {
          columnGap: SPACING_TY,
          paddingLeft: SPACING_MI,
          paddingRight: SPACING,
          paddingVertical: SPACING_MI,
          borderRadius: AVATAR_SIZE,
          backgroundColor: GLASS_BACKGROUND,
          ...(isPrivate
            ? {
                borderWidth: 1,
                borderColor: PRIVATE_ACCOUNT_BORDER,
                boxShadow: PRIVATE_ACCOUNT_SHADOW
              }
            : { boxShadow: GLASS_SHADOW })
        },
        style
      ]}
    >
      {isPrivate ? (
        <PrivacyPoolsAccountAvatar size={AVATAR_SIZE} />
      ) : (
        <Blockies seed={PUBLIC_ACCOUNT_AVATAR_SEED} width={AVATAR_SIZE} height={AVATAR_SIZE} />
      )}
      <Text
        fontSize={fontSize}
        weight="semiBold"
        appearance={isPrivate ? 'primaryText' : 'secondaryText'}
        numberOfLines={1}
      >
        {isPrivate ? t('Private account') : t('Public account')}
      </Text>
    </View>
  )
}

/** The dotted line from one account to the other, with the Send button on it */
const SendConnector = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={[flexbox.center, { height: CONNECTOR_HEIGHT }]}>
      {/* Starts half a diamond higher, so the diamond sits on the edge of the account above */}
      <Svg
        width={CONNECTOR_END_SIZE}
        height={CONNECTOR_SVG_HEIGHT}
        viewBox={`0 0 ${CONNECTOR_END_SIZE} ${CONNECTOR_SVG_HEIGHT}`}
        style={{ position: 'absolute', top: -CONNECTOR_CENTER }}
      >
        <Path
          d={`M${CONNECTOR_CENTER} 0L${CONNECTOR_END_SIZE} ${CONNECTOR_CENTER}L${CONNECTOR_CENTER} ${CONNECTOR_END_SIZE}L0 ${CONNECTOR_CENTER}Z`}
          fill={CONNECTOR_COLOR}
        />
        {/* Stops at the Send button, as its glass background would show the line through */}
        <Line
          x1={CONNECTOR_CENTER}
          y1={CONNECTOR_END_SIZE}
          x2={CONNECTOR_CENTER}
          y2={SEND_BUTTON_TOP}
          stroke={CONNECTOR_COLOR}
          strokeWidth={1.5}
          strokeDasharray={CONNECTOR_DASHES}
        />
        <Line
          x1={CONNECTOR_CENTER}
          y1={SEND_BUTTON_BOTTOM}
          x2={CONNECTOR_CENTER}
          y2={CONNECTOR_SVG_HEIGHT - CONNECTOR_ARROW_LENGTH}
          stroke={CONNECTOR_COLOR}
          strokeWidth={1.5}
          strokeDasharray={CONNECTOR_DASHES}
        />
        <Path
          d={`M${CONNECTOR_CENTER} ${CONNECTOR_SVG_HEIGHT}L0 ${
            CONNECTOR_SVG_HEIGHT - CONNECTOR_ARROW_LENGTH
          }H${CONNECTOR_END_SIZE}Z`}
          fill={CONNECTOR_COLOR}
        />
      </Svg>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phSm,
          {
            height: SEND_BUTTON_HEIGHT,
            columnGap: SPACING_MI,
            borderRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: GLASS_BACKGROUND_STRONG,
            boxShadow: GLASS_SHADOW
          }
        ]}
      >
        <Text fontSize={12} weight="medium">
          {t('Send')}
        </Text>
        <SendIcon width={16} height={16} color={theme.primaryText} />
      </View>
    </View>
  )
}

/** A transfer from one account to another, top to bottom */
export const PrivacyPoolsGuideTransfer = ({
  from,
  to
}: {
  from: AccountChipProps['type']
  to: AccountChipProps['type']
}) => (
  <View style={{ width: TRANSFER_ACCOUNT_WIDTH }}>
    <PrivacyPoolsGuideAccountChip type={from} />
    <SendConnector />
    <PrivacyPoolsGuideAccountChip type={to} />
  </View>
)

/** A deposit of ETH that is still being verified, with a clock over it */
export const PrivacyPoolsGuideVerifyingToken = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={flexbox.alignCenter}>
      <View
        style={[
          flexbox.center,
          {
            width: CLOCK_SIZE,
            height: CLOCK_SIZE,
            marginBottom: -CLOCK_OVERLAP,
            // Over the token, which comes after it
            zIndex: 1,
            borderRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: GLASS_BACKGROUND_STRONG,
            boxShadow: GLASS_SHADOW
          }
        ]}
      >
        <ClockIcon width={28} height={28} color={theme.primaryText} />
      </View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.pvTy,
          {
            width: TOKEN_ROW_WIDTH,
            paddingLeft: SPACING_TY,
            paddingRight: SPACING_SM,
            borderRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            boxShadow: GLASS_SHADOW
          }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_SM }]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_TY }]}>
            <TokenIcon
              withContainer
              withNetworkIcon
              address={ZeroAddress}
              chainId={1n}
              containerWidth={AVATAR_SIZE}
              containerHeight={AVATAR_SIZE}
              width={32}
              height={32}
              networkSize={18}
            />
            <View>
              <Text fontSize={18} weight="semiBold">
                ETH
              </Text>
              <Text fontSize={14} weight="medium" appearance="secondaryText">
                0.005
              </Text>
            </View>
          </View>
          <Badge
            type="info"
            text={t('being verified')}
            style={{ borderWidth: 1, borderColor: theme.infoText }}
          />
        </View>
        <Text fontSize={18} weight="number_bold">
          $500
        </Text>
      </View>
    </View>
  )
}
