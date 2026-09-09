import { memo, useMemo } from 'react'
import { StyleProp, View } from 'react-native'

import ManifestImage from '@common/components/ManifestImage'
import { isMobile } from '@common/config/env'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import HumanizedVisualizationItem from './HumanizedVisualizationItem'

import type { FC } from 'react'
import type { ViewStyle } from 'react-native'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'

interface Props {
  data: IrCall['fullVisualization']
  sizeMultiplierSize?: number
  textSize?: number
  chainId: bigint
  type?: 'history' | 'benzin' | 'default'
  testID?: string
  hasPadding?: boolean
  imageSize?: number
  style?: StyleProp<ViewStyle>
  erc7730Mode?: 'summary' | 'description'
  showErc7730DescriptionTitle?: boolean
  hideNestedErc7730Rows?: boolean
  hideMobileErc7730Title?: boolean
  isErc7730TransactionSummaryLayout?: boolean
  erc7730TransactionSummarySection?: 'all' | 'title' | 'rows'
  hasErc7730TransactionSummaryHeaderRightControl?: boolean
  disableFlex?: boolean
  inlineDappIcon?: boolean
  dappIconSize?: number
  dapp?: IrCall['dapp']
  editApprovalCallInfo?: {
    setter: (arg: string, token: string, tokenChainId: bigint, closeModal: () => void) => void
    amount: bigint
    token: string
    callId?: string
  }
}

const HumanizedVisualization: FC<Props> = ({
  data = [],
  editApprovalCallInfo,
  sizeMultiplierSize = 1,
  textSize = 16,
  chainId,
  type = 'default',
  testID,
  hasPadding = true,
  imageSize = 36,
  style,
  erc7730Mode = 'summary',
  showErc7730DescriptionTitle = false,
  hideNestedErc7730Rows = false,
  hideMobileErc7730Title = false,
  isErc7730TransactionSummaryLayout = false,
  erc7730TransactionSummarySection = 'all',
  hasErc7730TransactionSummaryHeaderRightControl = false,
  disableFlex = false,
  inlineDappIcon = false,
  dappIconSize = 24 * sizeMultiplierSize,
  dapp
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const horizontalPadding = hasPadding
    ? (isMobile ? SPACING_TY : SPACING_SM) * sizeMultiplierSize
    : 0
  const dappIcon = dapp?.icon || undefined
  const shouldShowDappIcon = !!dappIcon && !data.some((item) => item?.type === 'erc7730')
  const dappIconVisualization = useMemo(
    () =>
      shouldShowDappIcon ? (
        <ManifestImage
          uri={dappIcon}
          containerStyle={{
            marginLeft: inlineDappIcon ? 0 : SPACING_TY * sizeMultiplierSize,
            // When the content has padding its own left margin already separates it
            // from the icon, so adding a right margin here would double the gap
            marginRight: horizontalPadding ? 0 : SPACING_TY * sizeMultiplierSize
          }}
          size={dappIconSize}
          skeletonAppearance="secondaryBackground"
          imageStyle={{ borderRadius: dappIconSize / 2, backgroundColor: 'transparent' }}
          hideOnError
        />
      ) : null,
    [
      dappIcon,
      dappIconSize,
      horizontalPadding,
      inlineDappIcon,
      shouldShowDappIcon,
      sizeMultiplierSize
    ]
  )

  return (
    <>
      {!inlineDappIcon && dappIconVisualization}
      <View
        testID={testID}
        style={[
          !disableFlex && flexbox.flex1,
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.wrap,
          { marginHorizontal: horizontalPadding },
          style
        ]}
      >
        {inlineDappIcon && dappIconVisualization}
        {data.map((item) =>
          item ? (
            <HumanizedVisualizationItem
              key={item.id}
              item={item}
              editApprovalCallInfo={editApprovalCallInfo}
              sizeMultiplierSize={sizeMultiplierSize}
              textSize={textSize}
              chainId={chainId}
              type={type}
              imageSize={imageSize}
              erc7730Mode={erc7730Mode}
              showErc7730DescriptionTitle={showErc7730DescriptionTitle}
              hideNestedErc7730Rows={hideNestedErc7730Rows}
              hideMobileErc7730Title={hideMobileErc7730Title}
              isErc7730TransactionSummaryLayout={isErc7730TransactionSummaryLayout}
              erc7730TransactionSummarySection={erc7730TransactionSummarySection}
              hasErc7730TransactionSummaryHeaderRightControl={
                hasErc7730TransactionSummaryHeaderRightControl
              }
              dappIconSize={dappIconSize}
              marginRight={marginRight}
            />
          ) : null
        )}
      </View>
    </>
  )
}

export default memo(HumanizedVisualization)
