import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Survey } from '@ambire-common/interfaces/survey'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import Completed from '@common/components/TrackProgress/ByStatus/Completed'
import Failed from '@common/components/TrackProgress/ByStatus/Failed'
import InProgress from '@common/components/TrackProgress/ByStatus/InProgress'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MD } from '@common/styles/spacings'

import RadioQuestions from './RadioQuestions'

import type { SurveyController } from '@ambire-common/controllers/survey/survey'
interface Props {
  currentQuestion: Survey['questions'][number] | null
  inputtedAnswer: number | string | null
  setInputtedAnswer: (ans: number | string) => void
  surveyStatus: SurveyController['status']
  errorMessage: SurveyController['errorMessage']
}

const SurveyInnerState = ({
  currentQuestion,
  surveyStatus,
  inputtedAnswer,
  setInputtedAnswer,
  errorMessage
}: Props) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  switch (surveyStatus) {
    case 'not-started':
      return null

    case 'loading-fetching':
      return <InProgress title={t('Getting the survey...')} />

    case 'success-fetched':
      return (
        currentQuestion && (
          <View>
            <Text fontSize={SPACING_MD} weight="medium" appearance="primaryText">
              {currentQuestion.text}
            </Text>
            {currentQuestion.responseType === 'singleChoice' && currentQuestion.responseOptions ? (
              <View style={[spacings.mtMd, spacings.mlLg]}>
                <RadioQuestions
                  selectedResponseId={typeof inputtedAnswer === 'string' ? null : inputtedAnswer}
                  setSelectedResponseId={setInputtedAnswer}
                  responses={currentQuestion.responseOptions}
                />
              </View>
            ) : (
              <TextArea
                // the key is added so the component remounts and resets its height when the
                // question changes
                key={currentQuestion.id}
                placeholder="Write down your thoughts..."
                value={inputtedAnswer?.toString() || ''}
                onChangeText={setInputtedAnswer}
                containerStyle={spacings.ptLg}
                inputWrapperStyle={{
                  borderColor: theme.neutral600,
                  borderWidth: 1,
                  alignItems: 'baseline'
                }}
                multiline
                enableGrowHeightRange={[100, 200]}
              />
            )}
          </View>
        )
      )

    case 'loading-sending':
      return (
        <Completed
          title={t('Thank you!')}
          titleSecondary={t('Your answers are being sent.')}
          isLoading
          openExplorerText=""
        />
      )

    case 'success-submitted':
      return (
        <Completed
          title={t('Thank you!')}
          titleSecondary={t('Your answers have been sent successfully.')}
          openExplorerText=""
        />
      )

    case 'error-submitting':
      return (
        <Failed
          alertStyle={{ maxWidth: '100%' }}
          title={t('We failed to send your response.')}
          errorMessage={`We couldn't send your survey response right now. Please check your connection and try again.${errorMessage ? ` Details: ${errorMessage}` : ''}`}
        />
      )

    case 'error-fetching':
      return (
        <Failed
          alertStyle={{ maxWidth: '100%' }}
          title={t('We failed to fetch the survey.')}
          errorMessage={`We couldn't load the survey at this time. Please check your internet connection and try again.${errorMessage ? ` Details: ${errorMessage}` : ''}`}
        />
      )
    default:
      return (
        <Failed
          alertStyle={{ maxWidth: '100%' }}
          title={t('Internal error, contact support and restart the extension.')}
          errorMessage={`Something went wrong with the survey. Please restart the app and try again. If the problem persists, contact support.${errorMessage ? ` Details: ${errorMessage}` : ''}`}
        />
      )
  }
}

export default React.memo(SurveyInnerState)
