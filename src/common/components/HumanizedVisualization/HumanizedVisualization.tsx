import React, { FC, memo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { isMobile } from '@common/config/env'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import HumanizedVisualizationItem from './HumanizedVisualizationItem'

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
  hideNestedErc7730Rows?: boolean
  hideMobileErc7730Title?: boolean
  disableFlex?: boolean
  dapp?: IrCall['dapp']
  editApprovalCallInfo?: {
    setter: (arg: string, token: string, closeModal: () => void) => void
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
  hideNestedErc7730Rows = false,
  hideMobileErc7730Title = false,
  disableFlex = false,
  dapp
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const dappIcon = dapp?.icon || undefined
  const shouldShowDappIcon = !!dappIcon && !data.some((item) => item?.type === 'erc7730')

  return (
    <View
      testID={testID}
      style={[
        !disableFlex && flexbox.flex1,
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
      {shouldShowDappIcon && (
        <ManifestImage
          uri={dappIcon}
          containerStyle={spacings.mrSm}
          size={24 * sizeMultiplierSize}
          skeletonAppearance="secondaryBackground"
          imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
        />
      )}
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
            hideNestedErc7730Rows={hideNestedErc7730Rows}
            hideMobileErc7730Title={hideMobileErc7730Title}
            marginRight={marginRight}
          />
        ) : null
      )}
    </View>
  )
}

export default memo(HumanizedVisualization)
