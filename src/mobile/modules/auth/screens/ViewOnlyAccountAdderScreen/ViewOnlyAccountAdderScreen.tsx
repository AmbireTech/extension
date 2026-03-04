import React from 'react'
import { ScrollView, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import ViewOnlyAccountAdderAddressField from '@common/modules/auth/components/ViewOnlyAccountAdderAddressField'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useViewOnlyAccountAdder from '@common/modules/auth/hooks/useViewOnlyAccountAdder'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const ViewOnlyAccountAdderScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    control,
    watch,
    setValue,
    handleSubmit,
    trigger,
    fields,
    append,
    remove,
    disabled,
    buttonText,
    handleFormSubmit,
    duplicateAccountsIndexes,
    isLoading,
    isSubmitting,
    DEFAULT_ADDRESS_FIELD_VALUE
  } = useViewOnlyAccountAdder()
  const { goToPrevRoute } = useOnboardingNavigation()
  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        step={1}
        totalSteps={2}
        title={t('Import a view-only address')}
      >
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <ScrollView style={spacings.mbLg}>
            <View>
              {fields.map((field, index) => (
                <ViewOnlyAccountAdderAddressField
                  duplicateAccountsIndexes={duplicateAccountsIndexes}
                  key={field.id}
                  control={control}
                  index={index}
                  remove={remove}
                  isLoading={isLoading || isSubmitting}
                  handleSubmit={handleSubmit(handleFormSubmit)}
                  disabled={disabled}
                  field={field}
                  watch={watch}
                  setValue={setValue}
                  trigger={trigger}
                />
              ))}
              <Button
                type="outline"
                testID="add-one-more-address"
                disabled={isSubmitting}
                style={{ height: 40 }}
                size="tiny"
                onPress={() => append({ ...DEFAULT_ADDRESS_FIELD_VALUE })}
                childrenPosition="left"
                text={t('Add another address')}
              >
                <AddCircularIcon
                  width={20}
                  height={20}
                  color={theme.primaryText}
                  style={spacings.mrMi}
                />
              </Button>
            </View>
          </ScrollView>
          <Button
            testID="view-only-button-import"
            size="large"
            disabled={disabled}
            hasBottomSpacing={false}
            text={buttonText}
            onPress={handleSubmit(handleFormSubmit)}
          />
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ViewOnlyAccountAdderScreen)
