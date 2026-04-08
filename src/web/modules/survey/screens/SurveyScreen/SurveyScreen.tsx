import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useParams } from 'react-router-dom'

import { Survey } from '@ambire-common/interfaces/survey'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG, SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'

import ProgressBar from './ProgressBar'
import RadioQuestions from './RadioQuestions'

interface ISurveyUiState {
  currentQuestion: Survey['questions'][number] | null
  currentResponse: number | string
}

const SurveyScreen = () => {
  const { addToast } = useToast()
  const { theme } = useTheme()
  const {
    dispatch: dispatchToSurvey,
    state: { survey: surveyState }
  } = useController('SurveyController')
  const { surveyId } = useParams<{ surveyId: string }>()

  const [currentQuestion, setCurrentQuestion] = useState<Survey['questions'][number] | null>(null)
  const [inputtedAnswer, setInputtedAnswer] = useState<number | string | null>(null)

  const [recordedAnswers, setRecordedAnswers] = useState<Record<
    Survey['questions'][number]['id'],
    number | string
  > | null>(null)

  useEffect(() => {
    if (!surveyId) return
    // TODO: handle err and loading
    if (surveyState.status === 'empty') {
      dispatchToSurvey({
        type: 'method',
        params: {
          method: 'fetchSurvey',
          args: [surveyId]
        }
      })
      return
    }
    if (surveyState.status === 'success') {
      setCurrentQuestion(surveyState.survey.questions[0] || null)
    }
  }, [surveyId, dispatchToSurvey, surveyState, surveyState.status])

  const findNextQuestion = useCallback(
    (answers: { [qId: number]: number | string }): Survey['questions'][number] | undefined => {
      if (surveyState.status !== 'success') return
      if (!currentQuestion) return
      return surveyState.survey.questions.find(
        (q) =>
          q.questionPosition === currentQuestion.questionPosition + 1 &&
          (!q.requirement || answers[q.requirement.questionId] === q.requirement.responseId)
      )
    },
    [currentQuestion, surveyState]
  )
  const buttonState = useMemo((): { text: string; callback?: () => void; loading?: true } => {
    if (!currentQuestion) return { text: 'Loading', loading: true }
    if (surveyState.status !== 'success') return { text: 'Next' }
    const maxQUestionPosition = Math.max(
      ...surveyState.survey.questions.map((q) => q.questionPosition)
    )
    console.log(currentQuestion, inputtedAnswer)
    let isLastQUestion = currentQuestion.questionPosition === maxQUestionPosition
    if (currentQuestion.responseType === 'singleChoice') {
      if (!currentQuestion.responseOptions) {
        addToast('Error: question does not have valid answers, please contact support ', {
          type: 'error'
        })
        return { text: 'Error' }
      }
      if (typeof inputtedAnswer !== 'number') {
        return { text: isLastQUestion ? 'Submit' : 'Next' }
      }
      if (!currentQuestion.responseOptions.map((o) => o.id).includes(inputtedAnswer)) {
        addToast('Error: answer is not in possible answers ', {
          type: 'error'
        })
        return { text: 'Error' }
      }
    } else if (currentQuestion.responseType !== 'openText') {
      addToast('Error: wrong question type, please contact support ', {
        type: 'error'
      })
      return { text: 'Error' }
    }
    if (inputtedAnswer === null) return { text: isLastQUestion ? 'Submit' : 'Next' }
    const answersToRecord = { ...recordedAnswers, [currentQuestion.id]: inputtedAnswer }
    const nextQuestion = findNextQuestion(answersToRecord)

    if (nextQuestion) {
      return {
        text: 'Next',
        callback: () => {
          setCurrentQuestion(nextQuestion)
          setRecordedAnswers(answersToRecord)
          setInputtedAnswer(null)
        }
      }
    } else {
      return { text: 'Submit', callback: () => console.log('TODO') }
    }
  }, [addToast, currentQuestion, findNextQuestion, inputtedAnswer, recordedAnswers, surveyState])

  const buttons = useMemo(() => {
    return (
      <View
        style={[
          isWeb ? flexbox.directionRow : { flexDirection: 'column-reverse' },
          isWeb && flexbox.alignCenter,
          isMobile && spacings.ptSm,
          flexbox.justifyEnd
        ]}
      >
        <View style={isMobile && spacings.mbSm}>
          <ButtonWithLoader
            text={buttonState.text}
            disabled={!buttonState.callback}
            isLoading={buttonState.loading}
            onPress={buttonState.callback}
            size={isWeb ? 'smaller' : 'regular'}
            testID="proceed-btn"
          />
        </View>
      </View>
    )
  }, [buttonState.callback, buttonState.loading, buttonState.text])

  const percentageDone = useMemo(() => {
    if (surveyState.status !== 'success') return 0
    const maxPositionFromQuestions =
      Math.max(...surveyState.survey.questions.map((q) => q.questionPosition)) || 1
    let lastAnsweredQuestionPosition = currentQuestion?.questionPosition || 0
    if (inputtedAnswer !== null) lastAnsweredQuestionPosition += 1
    return (lastAnsweredQuestionPosition / (maxPositionFromQuestions + 1)) * 100
  }, [currentQuestion, surveyState, inputtedAnswer])

  return (
    <Wrapper>
      <Content buttons={buttons}>
        <View>
          <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={[flexbox.flex1]}>
            <View style={[flexbox.alignCenter, spacings.mb]}>
              <PanelTitle title={'Survey'} />
            </View>
            <View style={[spacings.mh4Xl, spacings.mtMd]}>
              <ProgressBar percentageDone={percentageDone} />
              <View style={[spacings.mtLg]}>
                {currentQuestion && (
                  <View>
                    <Text fontSize={SPACING_MD} weight={'medium'} appearance="primaryText">
                      {currentQuestion.text}
                    </Text>
                    {currentQuestion.responseType === 'singleChoice' &&
                    currentQuestion.responseOptions ? (
                      <View style={[spacings.mtMd, spacings.mlLg]}>
                        <RadioQuestions
                          selectedResponseId={
                            typeof inputtedAnswer === 'string' ? null : inputtedAnswer
                          }
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
                )}
              </View>
            </View>
          </ScrollableWrapper>
        </View>
      </Content>
    </Wrapper>
  )
}

export default React.memo(SurveyScreen)
