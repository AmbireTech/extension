import { memo, useMemo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { toPersonalSignHex } from '@ambire-common/libs/signMessage/utils'
import HumanizedVisualization, {
  shouldUseErc7730DetailedLayout
} from '@common/components/HumanizedVisualization'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-message/components/FallbackVisualization/FallbackVisualization'
import spacings from '@common/styles/spacings'
import { getMessageAsText } from '@common/utils/messageToString'

import type { Message, UserRequest } from '@ambire-common/interfaces/userRequest'
import type { IrMessage } from '@ambire-common/libs/humanizer/interfaces'

type SignMessageRequest = Extract<UserRequest, { kind: 'message' | 'typedMessage' }>

type Props = {
  request: SignMessageRequest
  humanizedMessage?: IrMessage
  style?: StyleProp<ViewStyle>
}

const visualizationStyle = { width: '100%', minWidth: 0 } as const
const fallbackVisualizationStyle = {
  backgroundColor: 'transparent',
  flex: 0,
  minHeight: 0
} as const
const markPreviewAsRead = () => undefined

const CompactMessagePreview = ({ request, humanizedMessage, style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const plainTextMessage = useMemo(() => {
    if (request.kind !== 'message') return undefined

    return getMessageAsText(toPersonalSignHex(request.meta.params.message)) || t('(Empty message)')
  }, [request, t])
  const typedMessageToSign = useMemo<Message | null>(() => {
    if (request.kind !== 'typedMessage') return null

    return {
      fromRequestId: request.id,
      content: { kind: request.kind, ...request.meta.params },
      accountAddr: request.meta.accountAddr,
      chainId: request.meta.chainId,
      signature: null
    }
  }, [request])
  const visualization =
    humanizedMessage?.fromRequestId === request.id ? humanizedMessage.fullVisualization : undefined
  const shouldUseDetailedErc7730Layout = useMemo(
    () =>
      visualization?.some(
        (item) => item?.type === 'erc7730' && shouldUseErc7730DetailedLayout(item)
      ) || false,
    [visualization]
  )

  if (request.kind === 'message') {
    return (
      <View style={style}>
        <Text selectable fontSize={12} appearance="secondaryText">
          {plainTextMessage}
        </Text>
      </View>
    )
  }

  if (!visualization?.length) {
    return (
      <View style={style}>
        <FallbackVisualization
          messageToSign={typedMessageToSign}
          humanizedMessage={humanizedMessage}
          setHasReachedBottom={markPreviewAsRead}
          hasReachedBottom
          scrollEnabled={false}
          withTwoColumnDataRow
          withDecimalIntegerRows
          disableScroll
          containerStyle={[fallbackVisualizationStyle, spacings.ph0, spacings.pv0]}
          separatorColor={theme.primaryBorder}
        />
      </View>
    )
  }

  return (
    <View style={style}>
      <HumanizedVisualization
        data={visualization}
        chainId={request.meta.chainId}
        sizeMultiplierSize={0.5}
        textSize={12}
        imageSize={12}
        hasPadding={false}
        erc7730Mode={shouldUseDetailedErc7730Layout ? 'description' : 'summary'}
        showErc7730DescriptionTitle={shouldUseDetailedErc7730Layout}
        isErc7730TransactionSummaryLayout={!shouldUseDetailedErc7730Layout}
        disableFlex
        style={visualizationStyle}
      />
    </View>
  )
}

export default memo(CompactMessagePreview)
