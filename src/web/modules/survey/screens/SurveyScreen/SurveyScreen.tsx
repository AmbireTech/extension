import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { useParams } from 'react-router-dom'

import { Survey } from '@ambire-common/interfaces/survey'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import Input from '@common/components/Input'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'

import RadioQuestions from './RadioQuestions'

interface ISurveyUiState {
  currentQuestion: Survey['questions'][number] | null
  currentResponse: number | string
}

const SurveyScreen = () => {
  const { addToast } = useToast()
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

  const QuestionComponent = useCallback(() => {
    // TODO: empty return
    if (!currentQuestion) return
    if (currentQuestion.responseType === 'singleChoice' && currentQuestion.responseOptions)
      return (
        <View style={spacings.mtMd}>
          <RadioQuestions
            selectedResponseId={typeof inputtedAnswer === 'string' ? null : inputtedAnswer}
            setSelectedResponseId={setInputtedAnswer}
            responses={currentQuestion.responseOptions}
          />
        </View>
      )

    return (
      <View style={spacings.mtMd}>
        <Input
          autoFocus={true}
          value={inputtedAnswer?.toString()}
          onChangeText={setInputtedAnswer}
        />
      </View>
    )
  }, [currentQuestion, inputtedAnswer])

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
            // TODO
            isLoading={buttonState.loading}
            onPress={buttonState.callback}
            size={isWeb ? 'smaller' : 'regular'}
            testID="proceed-btn"
          />
        </View>
      </View>
    )
  }, [buttonState.callback, buttonState.loading, buttonState.text])

  return (
    <Wrapper>
      <Content buttons={buttons}>
        <View>
          <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={[flexbox.flex1]}>
            <View style={[flexbox.alignCenter, spacings.mb]}>
              <PanelTitle title={'Survey'} />
            </View>
            <View style={[spacings.mhLg]}>
              {currentQuestion && (
                <View>
                  <Text fontSize={SPACING_LG} appearance="primaryText">
                    {currentQuestion.text}
                  </Text>
                  <QuestionComponent />
                </View>
              )}
            </View>
          </ScrollableWrapper>
        </View>
      </Content>
    </Wrapper>
  )
}

export default React.memo(SurveyScreen)
