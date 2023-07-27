import React, { useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { Trans, useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import AmbireLogo from '@common/modules/auth/components/AmbireLogo'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import AddReferralForm, { AddReferralFormValues } from '@mobile/modules/referral/components/AddReferralForm'
import useReferral from '@mobile/modules/referral/hooks/useReferral'

const AddReferralScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { setPendingReferral, getPendingReferral, checkIfAddressIsEligibleForReferral } =
    useReferral()

  const handleSubmit = useCallback(
    async (values: AddReferralFormValues) => {
      try {
        const response = await checkIfAddressIsEligibleForReferral(values.hexAddress)

        if (!response?.success) {
          addToast(
            response?.message || t('This address is not eligible for invitation reference.'),
            {
              error: true
            }
          )
          return
        }

        addToast(t('Invitation reference added successfully!'))

        setPendingReferral(values)
        closeBottomSheet()

        navigate(ROUTES.getStarted, { replace: true })
      } catch (e) {
        addToast(
          t(
            'Checking if the address is eligible for invitation reference failed. Please try again later.'
          ),
          {
            error: true
          }
        )
      }
    },
    [
      closeBottomSheet,
      checkIfAddressIsEligibleForReferral,
      setPendingReferral,
      navigate,
      addToast,
      t
    ]
  )

  const handleProceedWithoutReferral = useCallback(() => {
    navigate(ROUTES.getStarted, { replace: true })
  }, [navigate])

  const pendingReferral = getPendingReferral()
  const initialValue = pendingReferral ? pendingReferral?.address : ''

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        contentContainerStyle={[spacings.pbLg, flexboxStyles.justifyCenter]}
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={220}
      >
        <View style={spacings.mbLg}>
          <AmbireLogo shouldExpand={false} />

          <Button
            style={spacings.mtTy}
            onPress={handleProceedWithoutReferral}
            text={t('Proceed to Wallet')}
            containerStyle={spacings.mbLg}
          />
          <Trans>
            <Text color={colors.titan} style={spacings.mbLg}>
              <Text color={colors.titan}>{'Somebody invited you to Ambire? '}</Text>
              <Text color={colors.turquoise} underline onPress={openBottomSheet}>
                Continue with referral address.
              </Text>
            </Text>
          </Trans>
        </View>

        <BottomSheet id="add-referral" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
          <Text
            style={[spacings.mbLg, spacings.mt, text.center]}
            color={colors.titan}
            fontSize={16}
          >
            {t('Enter referral address')}
          </Text>
          <AddReferralForm initialValue={initialValue} onSubmit={handleSubmit} />
        </BottomSheet>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default AddReferralScreen
