import React, { FC, Fragment, memo } from 'react'
import { View } from 'react-native'

import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import ImageIcon from '@web/assets/svg/ImageIcon'
import ManifestImage from '@web/components/ManifestImage'

import { COLLECTIBLE_SIZE } from '../Collectible/styles'
import ChainVisualization from './ChainVisualization/ChainVisualization'
import DeadlineItem from './DeadlineItem'
import Erc7730StructuredVisualization from './Erc7730/Erc7730StructuredVisualization'

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation()
}

type EditApprovalCallInfo = {
  setter: (arg: string, token: string, tokenChainId: bigint, closeModal: () => void) => void
  amount: bigint
  token: string
  callId?: string
}

interface Props {
  item: HumanizerVisualization
  editApprovalCallInfo?: EditApprovalCallInfo
  sizeMultiplierSize: number
  textSize: number
  chainId: bigint
  type: 'history' | 'benzin' | 'default'
  imageSize: number
  erc7730Mode: 'summary' | 'description'
  hideNestedErc7730Rows: boolean
  hideMobileErc7730Title: boolean
  isErc7730TransactionSummaryLayout: boolean
  marginRight: number
}

const HumanizedVisualizationItem: FC<Props> = ({
  item,
  editApprovalCallInfo,
  sizeMultiplierSize,
  textSize,
  chainId,
  type,
  imageSize,
  erc7730Mode,
  hideNestedErc7730Rows,
  hideMobileErc7730Title,
  isErc7730TransactionSummaryLayout,
  marginRight
}) => {
  const { theme } = useTheme()

  if (item.type === 'erc7730') {
    return (
      <Erc7730StructuredVisualization
        item={item}
        chainId={chainId}
        sizeMultiplierSize={sizeMultiplierSize}
        textSize={textSize}
        mode={erc7730Mode}
        editApprovalCallInfo={editApprovalCallInfo}
        hideNestedRows={hideNestedErc7730Rows}
        hideMobileSummaryTitle={hideMobileErc7730Title}
        isTransactionSummaryLayout={isErc7730TransactionSummaryLayout}
      />
    )
  }

  if (item.type === 'token') {
    return (
      <Fragment>
        <TokenOrNft
          sizeMultiplierSize={sizeMultiplierSize}
          value={item.value}
          address={item.address!}
          textSize={textSize}
          chainId={item.chainId || chainId}
        />
        {editApprovalCallInfo && (
          <EditApproval
            editCall={editApprovalCallInfo.setter}
            token={editApprovalCallInfo.token}
            chainId={chainId}
            value={editApprovalCallInfo.amount}
            id={editApprovalCallInfo.callId}
          />
        )}
      </Fragment>
    )
  }

  if (item.type === 'address' && item.address) {
    return (
      <View style={{ flexShrink: 1, marginRight }}>
        <HumanizerAddress
          fontSize={textSize}
          address={item.address}
          chainId={chainId}
          verification={item.verification}
          actionsMode="inline"
        />
      </View>
    )
  }

  if (item.type === 'deadline' && item.value && type !== 'benzin' && type !== 'history') {
    return <DeadlineItem deadline={item.value} textSize={textSize} marginRight={marginRight} />
  }

  if (item.type === 'chain' && item.chainId) {
    return <ChainVisualization chainId={item.chainId} marginRight={marginRight} />
  }

  if (item.type === 'image' && item.content) {
    return (
      <ManifestImage
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

  if (item.type === 'link') {
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
      return <View style={{ maxWidth: '100%', marginRight }}>{content}</View>
    }

    return (
      <a onClick={stopPropagation} style={{ maxWidth: '100%', marginRight }} href={item.url!}>
        {content}
      </a>
    )
  }

  if (item.content) {
    return (
      <Text
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
    return <View style={{ flexBasis: '100%', height: 0 }} />
  }

  return null
}

export default memo(HumanizedVisualizationItem)
