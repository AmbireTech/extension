import React, { useCallback } from 'react'
import { View } from 'react-native'

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
import AddReferralForm, {
  AddReferralFormValues
} from '@mobile/modules/referral/components/AddReferralForm'

import useReferral from '../../hooks/useReferral'

const AddReferralScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
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
    [checkIfAddressIsEligibleForReferral, setPendingReferral, navigate, addToast, t]
  )

  const handleSkip = useCallback(() => {
    navigate(ROUTES.getStarted, { replace: true })
  }, [navigate])

  const pendingReferral = getPendingReferral()
  const initialValue = pendingReferral ? pendingReferral?.address : ''

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        contentContainerStyle={spacings.pbLg}
        type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
        extraHeight={220}
      >
        <AmbireLogo shouldExpand={false} />
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
          <View style={[spacings.mb, spacings.phTy]}>
            <Text
              weight="light"
              style={[spacings.mb, text.center]}
              color={colors.titan}
              fontSize={20}
            >
              {t('Who invited you to Ambire?')}
            </Text>
          </View>

          <AddReferralForm initialValue={initialValue} onSubmit={handleSubmit} />

          <Trans>
            <Text weight="light" color={colors.titan} fontSize={16} style={spacings.mv}>
              <Text weight="light" color={colors.titan} fontSize={16}>
                {"Don't have an invitation reference? "}
              </Text>
              <Text
                weight="light"
                color={colors.titan}
                fontSize={16}
                underline
                onPress={handleSkip}
              >
                Continue
              </Text>
              <Text weight="light" color={colors.titan} fontSize={16}>
                {' without one.'}
              </Text>
            </Text>
          </Trans>
        </View>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default AddReferralScreen
