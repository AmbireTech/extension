import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Survey } from '@ambire-common/interfaces/survey'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import useTheme from '@common/hooks/useTheme'
import Completed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Completed'
import Failed from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/Failed'
import InProgress from '@common/modules/sign-account-op/components/OneClick/TrackProgress/ByStatus/InProgress'
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
  if (surveyStatus === 'not-started') return null
  else if (surveyStatus === 'loading-fetching')
    return <InProgress title={t('Getting the survey...')} />
  else if (surveyStatus === 'success-fetched')
    return (
      currentQuestion && (
        <View>
          <Text fontSize={SPACING_MD} weight={'medium'} appearance="primaryText">
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
              placeholder="Write down your thoughts..."
              value={inputtedAnswer?.toString() || ''}
              onChangeText={setInputtedAnswer}
              containerStyle={spacings.ptLg}
              inputWrapperStyle={{
                height: 100,
                borderColor: theme.neutral600,
                borderWidth: 1,
                alignItems: 'baseline'
              }}
              multiline
            />
          )}
        </View>
      )
    )
  else if (surveyStatus === 'loading-sending')
    return (
      <Completed
        title={t('Thank you!')}
        titleSecondary={t('Your answers are being sent.')}
        isLoading
        openExplorerText={''}
      />
    )
  else if (surveyStatus === 'success-submitted')
    return (
      <Completed
        title={t('Thank you!')}
        titleSecondary={t('Your answers have been sent successfully.')}
        openExplorerText={''}
      />
    )
  else if (surveyStatus === 'error-submitting')
    return (
      <Failed
        alertStyle={{ maxWidth: '100%' }}
        title={t('We failed to send your response.')}
        errorMessage={`Error: ${errorMessage || 'unknown submitting error'}`}
      />
    )
  // if (surveyStatus === 'error-fetching')
  else
    return (
      <Failed
        alertStyle={{ maxWidth: '100%' }}
        title={t('We failed to fetch the survey.')}
        errorMessage={`Error: ${errorMessage || 'unknown fetching error'}`}
      />
    )
}

export default React.memo(SurveyInnerState)
