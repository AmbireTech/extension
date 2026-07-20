import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import NetworkIcon from '@common/components/NetworkIcon'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useSafeImport from '@common/modules/auth/hooks/useSafeImport'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const SafeImportScreen = () => {
  const {
    control,
    errors,
    isValid,
    statuses,
    importError,
    safeInfo,
    safe,
    isSafeImported,
    btnText,
    handleValidation,
    handleFormSubmit,
    goToPrevRoute
  } = useSafeImport()
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          title={t('Import Safe address')}
          step={1}
          totalSteps={1}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <View>
              <Controller
                control={control}
                rules={{ validate: (value) => handleValidation(value), required: true }}
                name="safeAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="add-safe-address-field"
                    onBlur={onBlur}
                    autoFocus
                    placeholder={t('Add Safe address')}
                    onChangeText={onChange}
                    value={value}
                    isValid={!handleValidation(value) && !!value.length}
                    error={value.length ? errors?.safeAddress?.message : ''}
                    autoCorrect={false}
                    onSubmitEditing={handleFormSubmit}
                    disabled={false}
                  />
                )}
              />
              {statuses.findSafe === 'LOADING' ? (
                <View style={[flexbox.directionRow, flexbox.alignSelfCenter]}>
                  <Spinner />
                </View>
              ) : (
                <View>
                  {safe && safeInfo && safe === safeInfo.address && (
                    <View style={[flexbox.directionRow, flexbox.justifySpaceBetween]}>
                      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                        <SafeIcon width={20} height={20} />
                        <Text style={spacings.mlTy}>{t('Deployed on:')}</Text>
                      </View>
                      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                        {safeInfo.deployedOn.map((c, i) => (
                          <NetworkIcon
                            key={c}
                            id={c.toString()}
                            style={i === 0 ? { marginLeft: 0 } : { marginLeft: -11 }}
                            size={22}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {isSafeImported && (
                    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mt]}>
                      <SuccessIcon color={theme.successDecorative} width={20} height={20} />
                      <Text appearance="successText" style={spacings.mlTy}>
                        {t('Safe already imported')}
                      </Text>
                    </View>
                  )}

                  {safe && safeInfo && safeInfo.requiresModules && (
                    <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.mt]}>
                      <Alert
                        type="warning"
                        text={t(
                          'To send transactions, this Safe account requires modules that are not implemented in Ambire. You can still import it as a view-only account.'
                        )}
                        style={{ maxWidth: '100%' }}
                      />
                    </View>
                  )}

                  {importError && safe && safe === importError.address && (
                    <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                      <Alert type="error" text={importError.message} style={{ maxWidth: '100%' }} />
                    </View>
                  )}
                </View>
              )}
            </View>

            <Button
              testID="import-button"
              size="large"
              text={`${t(btnText)}`}
              hasBottomSpacing={false}
              onPress={handleFormSubmit}
              disabled={!isValid || !!importError || statuses.findSafe === 'LOADING'}
            />
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SafeImportScreen
