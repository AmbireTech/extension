import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { SurveyAnswers } from '@ambire-common/interfaces/survey'
import { getNextQuestionForAnswers } from '@ambire-common/utils/survey'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Content, Wrapper } from '@web/components/TransactionsScreen'
import { getExtensionInstanceId } from '@web/utils/analytics'

import ProgressBar from './ProgressBar'
import SurveyInnerState from './SurveyInnerState'

const SurveyScreen = () => {
  const { addToast } = useToast()
  const {
    dispatch: dispatchToSurvey,
    state: { status, questions, answers, currentQuestion, errorMessage }
  } = useController('SurveyController')

  const {
    state: { keyStoreUid }
  } = useController('KeystoreController')

  const {
    state: { account }
  } = useController('SelectedAccountController')

  const {
    state: { verifiedCode }
  } = useController('InviteController')

  const { navigate } = useNavigation()

  const [inputtedAnswer, setInputtedAnswer] = useState<{
    questionPosition: number
    ans: number | string | null
  }>({ questionPosition: 0, ans: null })
  const hasNextQuestion = useMemo(() => {
    if (!currentQuestion) return false

    const answersPlusUncommited: SurveyAnswers = { ...answers }
    if (inputtedAnswer.ans !== null)
      answersPlusUncommited[currentQuestion.id] = {
        questionPosition: currentQuestion?.questionPosition,
        answer: inputtedAnswer.ans
      }

    return !!getNextQuestionForAnswers(questions || [], answersPlusUncommited)
  }, [answers, currentQuestion, inputtedAnswer, questions])

  const buttonState = useMemo((): { text: string; callback?: () => void; loading?: true } => {
    if (
      status === 'success-submitted' ||
      status === 'error-submitting' ||
      status === 'error-fetching'
    )
      return {
        text: 'Close',
        callback: () => {
          dispatchToSurvey({
            type: 'method',
            params: {
              method: 'clearSurveyState',
              args: []
            }
          })
          navigate(ROUTES.dashboard)
        }
      }

    const currentAns = inputtedAnswer.ans
    if (currentAns === null) return { text: 'Next' }
    if (!currentQuestion) return { text: 'Error' }

    return {
      text: hasNextQuestion ? 'Next' : 'Submit',
      callback: () => {
        if (!account) {
          addToast('Connect an account to continue with the survey', { type: 'error' })
          return
        }
        const instanceId = getExtensionInstanceId(keyStoreUid, verifiedCode)

        dispatchToSurvey({
          type: 'method',
          params: {
            method: 'answerQuestion',
            args: [
              currentQuestion.id,
              currentQuestion.questionPosition,
              currentAns,
              instanceId,
              account.addr
            ]
          }
        })

        if (hasNextQuestion)
          setInputtedAnswer({ questionPosition: inputtedAnswer.questionPosition + 1, ans: null })
      }
    }
  }, [
    account,
    addToast,
    currentQuestion,
    dispatchToSurvey,
    hasNextQuestion,
    inputtedAnswer.ans,
    inputtedAnswer.questionPosition,
    keyStoreUid,
    navigate,
    status,
    verifiedCode
  ])

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
    if (status === 'success-submitted') return 100
    if (status === 'loading-sending') return 100
    if (status === 'error-submitting') return 0
    if (!questions) return 0

    const maxPositionFromQuestions = Math.max(...questions.map((q) => q.questionPosition)) || 1
    let lastAnsweredQuestionPosition = currentQuestion?.questionPosition || 0
    if (
      inputtedAnswer.ans !== null ||
      !currentQuestion ||
      inputtedAnswer.questionPosition === currentQuestion.questionPosition + 1
    )
      lastAnsweredQuestionPosition += 1

    return (lastAnsweredQuestionPosition / (maxPositionFromQuestions + 1)) * 100
  }, [currentQuestion, inputtedAnswer, questions, status])

  const updateInputtedAns = useCallback(
    (ans: string | number) => {
      setInputtedAnswer({ questionPosition: inputtedAnswer.questionPosition, ans })
    },
    [inputtedAnswer]
  )
  return (
    <Wrapper>
      <Content buttons={buttons}>
        <View>
          <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={[flexbox.flex1]}>
            <View style={[flexbox.alignCenter, spacings.mb]}>
              <PanelTitle title={'Survey'} />
            </View>
            <View style={[spacings.mh2Xl, spacings.mtMd]}>
              <ProgressBar percentageDone={percentageDone} />
              <View style={[spacings.mtLg]}>
                <SurveyInnerState
                  currentQuestion={currentQuestion || null}
                  inputtedAnswer={inputtedAnswer.ans}
                  setInputtedAnswer={updateInputtedAns}
                  surveyStatus={status}
                  errorMessage={errorMessage}
                />
              </View>
            </View>
          </ScrollableWrapper>
        </View>
      </Content>
    </Wrapper>
  )
}

export default React.memo(SurveyScreen)
