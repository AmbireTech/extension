import React, { FC, Fragment, memo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links/links'
import ImageIcon from '@web/assets/svg/ImageIcon'
import ManifestImage from '@web/components/ManifestImage'

import { COLLECTIBLE_SIZE } from '../Collectible/styles'
import ChainVisualization from './ChainVisualization/ChainVisualization'
import DeadlineItem from './DeadlineItem'

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation()
}

interface Props {
  data: IrCall['fullVisualization']
  sizeMultiplierSize?: number
  textSize?: number
  chainId: bigint
  type?: 'history' | 'benzin' | 'default'
  testID?: string
  hasPadding?: boolean
  imageSize?: number
  hideLinks?: boolean
  style?: StyleProp<ViewStyle>
}

const HumanizedVisualization: FC<Props> = ({
  data = [],
  sizeMultiplierSize = 1,
  textSize = 16,
  chainId,
  type = 'default',
  testID,
  hasPadding = true,
  imageSize = 36,
  hideLinks = false,
  style
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const { theme } = useTheme()

  return (
    <View
      testID={testID}
      style={[
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.wrap,
        {
          marginHorizontal: hasPadding
            ? (isMobile ? SPACING_TY : SPACING_SM) * sizeMultiplierSize
            : 0
        },
        style
      ]}
    >
      {data.map((item) => {
        if (!item || item.isHidden) return null
        const key = item.id
        if (item.type === 'token') {
          return (
            <Fragment key={key}>
              <TokenOrNft
                sizeMultiplierSize={sizeMultiplierSize}
                value={item.value}
                address={item.address!}
                textSize={textSize}
                chainId={chainId}
                hideLinks={hideLinks}
              />
              {item.editApprovalData && <EditApproval item={item} />}
            </Fragment>
          )
        }

        if (item.type === 'address' && item.address) {
          return (
            <View key={key} style={{ flexShrink: 1, marginRight }}>
              <HumanizerAddress
                fontSize={textSize}
                address={item.address}
                chainId={chainId}
                verification={item.verification}
              />
            </View>
          )
        }

        if (item.type === 'deadline' && item.value && type !== 'default')
          return (
            <DeadlineItem
              key={key}
              deadline={item.value}
              textSize={textSize}
              marginRight={marginRight}
            />
          )
        if (item.type === 'chain' && item.chainId)
          return (
            <ChainVisualization
              chainId={item.chainId}
              key={key}
              marginRight={marginRight}
              hideLinks={hideLinks}
            />
          )

        if (item.type === 'image' && item.content) {
          return (
            <ManifestImage
              key={key}
              uri={item.content}
              containerStyle={spacings.mrSm}
              size={imageSize}
              skeletonAppearance="primaryBackground"
              fallback={() => (
                <View
                  style={[
                    flexbox.flex1,
                    flexbox.center,
                    { backgroundColor: theme.primaryBackground, width: '100%' }
                  ]}
                >
                  <ImageIcon
                    color={theme.secondaryText}
                    width={COLLECTIBLE_SIZE / 2}
                    height={COLLECTIBLE_SIZE / 2}
                  />
                </View>
              )}
              imageStyle={{
                borderRadius: BORDER_RADIUS_PRIMARY,
                backgroundColor: 'transparent',
                marginRight: 0
              }}
            />
          )
        }
        if (item.type === 'link' && !hideLinks) {
          const content = (
            <Text
              fontSize={textSize}
              weight="semiBold"
              appearance="successText"
              onPress={isMobile ? () => openInTab({ url: item.url! }) : undefined}
            >
              {item.content}
            </Text>
          )

          if (isMobile) {
            return (
              <View key={key} style={{ maxWidth: '100%', marginRight }}>
                {content}
              </View>
            )
          }

          return (
            <a
              onClick={stopPropagation}
              style={{ maxWidth: '100%', marginRight }}
              key={key}
              href={item.url!}
            >
              {content}
            </a>
          )
        }
        if (item.content) {
          return (
            <Text
              key={key}
              style={{ maxWidth: '100%', marginRight }}
              fontSize={textSize}
              weight={item.isBold || item.type === 'action' ? 'semiBold' : 'regular'}
              color={
                item.warning
                  ? theme.warningText
                  : item.type === 'label'
                    ? theme.secondaryText
                    : item.type === 'action'
                      ? theme.secondaryAccent400
                      : theme.primaryText
              }
            >
              {item.content}
            </Text>
          )
        }

        if (item.type === 'break') {
          return <View key={key} style={{ flexBasis: '100%', height: 0 }} />
        }

        return null
      })}
    </View>
  )
}

export default memo(HumanizedVisualization)
