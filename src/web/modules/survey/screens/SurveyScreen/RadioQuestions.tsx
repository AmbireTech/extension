import React, { useCallback, useMemo, useState } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'

import { Survey } from '@ambire-common/interfaces/survey'
import Text from '@common/components/Text'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useSyncedState from '@common/hooks/useSyncedState'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import BatchAdded from '@common/modules/sign-account-op/components/OneClick/BatchModal/BatchAdded'
import Buttons from '@common/modules/sign-account-op/components/OneClick/Buttons'
import Estimation from '@common/modules/sign-account-op/components/OneClick/Estimation'
import TrackProgress from '@common/modules/sign-account-op/components/OneClick/TrackProgress'
import Completed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import Failed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Failed'
import InProgress from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/InProgress'
import useTrackAccountOp from '@common/modules/sign-account-op/hooks/OneClick/useTrackAccountOp'
import GasTankInfoModal from '@common/modules/transfer/components/GasTankInfoModal'
import SendForm from '@common/modules/transfer/components/SendForm/SendForm'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import Modals from '@web/modules/sign-account-op/components/Modals'

import getStyles from './styles'

const { isRequestWindow, isPopup } = getUiType()

type RadioResponsesProps = {
  selectedResponseId: number | null
  setSelectedResponseId: (id: number) => void
  responses: { text: string; id: number }[]
  forceLargeItems?: boolean
  style?: ViewStyle
}

interface ISurveyUiState {
  currentQuestion: Survey['questions'][number] | null
  answers: Record<number, string | number>
}

export const RadioQuestions = React.memo(
  ({ responses, style, setSelectedResponseId, selectedResponseId }: RadioResponsesProps) => {
    const { styles, theme } = useTheme(getStyles)
    const [hovered, setHovered] = useState<number | null>(null)
    const responsesLength = useMemo(() => responses.length, [responses.length])
    return (
      <View style={[style, { gap: 10, flexDirection: 'column' }]}>
        {responses.map(({ text, id }, index) => (
          <Pressable
            key={id}
            style={[
              styles.selectItem,
              index !== responsesLength - 1 && styles.selectItemBorder,

              hovered === id && { backgroundColor: theme.secondaryBackground }
            ]}
            onPress={() => {
              if (id !== selectedResponseId) setSelectedResponseId(id)
            }}
            onHoverIn={() => setHovered(id)}
            onHoverOut={() => setHovered(null)}
          >
            <View style={[styles.radio]}>
              {(selectedResponseId === id || hovered === id) && (
                <View style={styles.radioSelectedInner} />
              )}
            </View>
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
              <Text
                fontSize={14}
                appearance={selectedResponseId === id ? 'primaryText' : 'secondaryText'}
                numberOfLines={1}
                style={flexbox.flex1}
              >
                {text}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    )
  }
)

export default React.memo(RadioQuestions)
