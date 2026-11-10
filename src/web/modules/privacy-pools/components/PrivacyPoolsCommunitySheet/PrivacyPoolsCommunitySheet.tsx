import React, { FC, useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PrivacyPoolsCommunityNotice } from '@ambire-common/interfaces/privacyPools'
import PrivacyPoolsLogoIcon from '@common/assets/svg/PrivacyPoolsLogoIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Stage = 'on-add' | 'before-deposit'

const selectCommunityNotice = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.communityNotice

/** Whether the screen is still due at a stage, as it never shows twice for the same one. */
const isDue = (stage: Stage, communityNotice: PrivacyPoolsCommunityNotice) =>
  stage === 'on-add' ? communityNotice === 'not-shown' : communityNotice !== 'shown-before-deposit'

const MESSAGES = [
  'Privacy Pools gets stronger as more people use it. The pool is still small.',
  'Start with a small amount and leave it in for a while. Each new deposit helps hide yours.',
  "Your deposit also helps hide other people's transfers."
] as const

type Props = {
  /** Once the first Privacy Pools account is added, or before the first deposit into one. */
  stage: Stage
  /** False while the screen it belongs to is not reached yet, like no Privacy Pools recipient. */
  isEnabled?: boolean
}

/**
 * Tells the user that privacy grows with the pool, so they start small. Opens by itself once per
 * stage and is recorded as seen once it closes.
 */
const PrivacyPoolsCommunitySheet: FC<Props> = ({ stage, isEnabled = true }) => {
  const { t } = useTranslation()
  const { ref: sheetRef, close: closeSheet } = useModalize()
  const { state: communityNotice, dispatch } = useController(
    'PrivacyPoolsController',
    selectCommunityNotice
  )
  const handleClose = useCallback(() => closeSheet(), [closeSheet])

  const handleClosed = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'markCommunityNoticeShown', args: [stage] } })
  }, [dispatch, stage])

  return (
    <BottomSheet
      id={`privacy-pools-community-${stage}`}
      sheetRef={sheetRef}
      closeBottomSheet={closeSheet}
      onClosed={handleClosed}
      autoOpen={isEnabled && !!communityNotice && isDue(stage, communityNotice)}
      backgroundColor="primaryBackground"
    >
      <View style={[flexbox.alignCenter, spacings.mbLg]}>
        <PrivacyPoolsLogoIcon width={40} height={40} style={spacings.mbMd} />
        <Text fontSize={20} weight="medium" style={text.center}>
          {t('Privacy Pools is a community effort')}
        </Text>
      </View>
      {MESSAGES.map((message) => (
        <Text key={message} fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
          {t(message)}
        </Text>
      ))}
      <Button
        testID={`privacy-pools-community-${stage}-close`}
        text={t('Got it')}
        onPress={handleClose}
        hasBottomSpacing={false}
        style={spacings.mtLg}
      />
    </BottomSheet>
  )
}

export default React.memo(PrivacyPoolsCommunitySheet)
