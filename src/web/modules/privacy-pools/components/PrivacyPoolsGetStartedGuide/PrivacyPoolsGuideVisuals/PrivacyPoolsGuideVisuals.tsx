import { ZeroAddress } from 'ethers'
import React from 'react'
import { View } from 'react-native'
import { Line, Path, Svg } from 'react-native-svg'

import SendIcon from '@common/assets/svg/SendIcon'
import TimeIcon from '@common/assets/svg/TimeIcon'
import Blockies from '@common/components/Avatar/Blockies'
import Badge from '@common/components/Badge'
import GlassView from '@common/components/GlassView'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles, {
  AVATAR_SIZE,
  CONNECTOR_END_SIZE,
  CONNECTOR_HEIGHT,
  glassCssStyles,
  SEND_BUTTON_HEIGHT
} from './styles'

// The connector between the accounts is drawn white in both themes
const CONNECTOR_COLOR = '#FFFFFF'

/** Any public account looks the same here, so its avatar has the design's own colors */
const PUBLIC_ACCOUNT_AVATAR = {
  seed: 'privacy-pools-guide-public-account',
  bgcolor: '#DCEE6A',
  color: '#2BB385',
  spotcolor: '#4876DA'
}

// The connector's geometry, in the design's pixels. Its ends overhang the accounts it joins by
// half the diamond, so the diamond sits on the edge of the account above.
const CONNECTOR_CENTER = CONNECTOR_END_SIZE / 2
const CONNECTOR_ARROW_LENGTH = 7.5
/** Where the Send button's top and bottom are, in the connector's own coordinates */
const SEND_BUTTON_TOP = CONNECTOR_CENTER + (CONNECTOR_HEIGHT - SEND_BUTTON_HEIGHT) / 2
const SEND_BUTTON_BOTTOM = SEND_BUTTON_TOP + SEND_BUTTON_HEIGHT
const CONNECTOR_SVG_HEIGHT = CONNECTOR_HEIGHT + CONNECTOR_CENTER
const CONNECTOR_DASHES = '2 2'

const SEND_ICON_SIZE = 16
/** The design draws the icon with a 1.5px line at 16px. SendIcon's line is set in its 24px box */
const SEND_ICON_STROKE_WIDTH = (1.5 * 24) / SEND_ICON_SIZE

interface AccountChipProps {
  type: 'private' | 'public'
  fontSize?: number
}

/** An account as a pill: its avatar and whether it's private or public */
export const PrivacyPoolsGuideAccountChip = ({ type, fontSize = 16 }: AccountChipProps) => {
  const { t } = useTranslation()
  const isPrivate = type === 'private'

  return (
    <GlassView
      borderRadius={AVATAR_SIZE / 2 + SPACING_MI}
      cssStyle={isPrivate ? glassCssStyles.privateAccountChip : glassCssStyles.publicAccountChip}
    >
      {isPrivate ? (
        <PrivacyPoolsAccountAvatar size={AVATAR_SIZE} />
      ) : (
        <Blockies
          {...PUBLIC_ACCOUNT_AVATAR}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          borderRadius={AVATAR_SIZE / 2}
        />
      )}
      <Text
        fontSize={fontSize}
        weight="semiBold"
        appearance={isPrivate ? 'primaryText' : 'secondaryText'}
        numberOfLines={1}
      >
        {isPrivate ? t('Private account') : t('Public account')}
      </Text>
    </GlassView>
  )
}

/** The dotted line from one account to the other, with the Send button on it */
const SendConnector = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={styles.connector}>
      <Svg
        width={CONNECTOR_END_SIZE}
        height={CONNECTOR_SVG_HEIGHT}
        viewBox={`0 0 ${CONNECTOR_END_SIZE} ${CONNECTOR_SVG_HEIGHT}`}
        style={styles.connectorLine}
      >
        <Path
          d={`M${CONNECTOR_CENTER} 0L${CONNECTOR_END_SIZE} ${CONNECTOR_CENTER}L${CONNECTOR_CENTER} ${CONNECTOR_END_SIZE}L0 ${CONNECTOR_CENTER}Z`}
          fill={CONNECTOR_COLOR}
        />
        {/* Stops at the Send button, as its glass would show the line through */}
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
      <GlassView cssStyle={glassCssStyles.sendButton}>
        <Text fontSize={12} weight="medium">
          {t('Send')}
        </Text>
        <SendIcon
          width={SEND_ICON_SIZE}
          height={SEND_ICON_SIZE}
          strokeWidth={SEND_ICON_STROKE_WIDTH}
          color={theme.primaryText}
        />
      </GlassView>
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
}) => {
  const { styles } = useTheme(getStyles)

  return (
    <View style={styles.transfer}>
      <PrivacyPoolsGuideAccountChip type={from} />
      <SendConnector />
      <PrivacyPoolsGuideAccountChip type={to} />
    </View>
  )
}

/** A deposit of ETH that is still being verified, with a clock over it */
export const PrivacyPoolsGuideVerifyingToken = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  return (
    <View style={flexbox.alignCenter}>
      <GlassView cssStyle={glassCssStyles.clock}>
        <TimeIcon />
      </GlassView>
      <GlassView cssStyle={glassCssStyles.tokenRow}>
        <View style={styles.tokenDetails}>
          <View style={styles.tokenNameAndIcon}>
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
              <Text fontSize={14} weight="number_medium" appearance="secondaryText">
                0.1
              </Text>
            </View>
          </View>
          <Badge type="info" text={t('being verified')} style={styles.verifyingBadge} />
        </View>
        <Text fontSize={18} weight="number_bold">
          $500
        </Text>
      </GlassView>
    </View>
  )
}
