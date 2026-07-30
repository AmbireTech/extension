import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeAccountList from '@common/modules/auth/components/SafeAccountList'
import useSafeImportByOwner from '@common/modules/auth/hooks/useSafeImportByOwner'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const SafeImportByOwnerScreen = () => {
  const {
    control,
    errors,
    failedNetworkNames,
    handleImport,
    handleValidation,
    hasSearchCompleted,
    importedAccounts,
    isImporting,
    isSearching,
    isValid,
    goToPrevRoute,
    safeAccounts,
    setAccountSelected,
    selectedAddresses
  } = useSafeImportByOwner()
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
          title={t('Import Safe by owner')}
          step={1}
          totalSteps={1}
        >
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <View>
              <Controller
                control={control}
                rules={{ validate: handleValidation, required: true }}
                name="ownerAddress"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="add-safe-owner-field"
                    onBlur={onBlur}
                    autoFocus
                    placeholder={t('Add Safe owner address')}
                    onChangeText={onChange}
                    value={value}
                    isValid={!handleValidation(value) && !!value.length}
                    inputWrapperStyle={{ borderColor: theme.primaryBorder }}
                    error={value.length ? errors.ownerAddress?.message : ''}
                    autoCorrect={false}
                  />
                )}
              />

              {!!safeAccounts.length && (
                <View style={[{ height: 220 }, spacings.mt]}>
                  <SafeAccountList
                    accounts={safeAccounts}
                    importedAccounts={importedAccounts}
                    selectedAddresses={selectedAddresses}
                    onChangeAccountSelection={setAccountSelected}
                  />
                </View>
              )}

              {isSearching && (
                <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mt]}>
                  <Spinner style={{ width: 16, height: 16 }} />
                  <Text appearance="secondaryText" style={spacings.mlTy} fontSize={14}>
                    {t('Searching all enabled networks...')}
                  </Text>
                </View>
              )}

              {hasSearchCompleted && !safeAccounts.length && (
                <View style={spacings.mt}>
                  <Alert
                    type="warning"
                    text={t('No Safe accounts were found for this owner on your enabled networks.')}
                    style={{ maxWidth: '100%' }}
                  />
                </View>
              )}

              {!!failedNetworkNames.length && hasSearchCompleted && (
                <View style={spacings.mt}>
                  <Alert
                    type="warning"
                    text={`${t('Some networks could not be searched. Please try again later:')} ${failedNetworkNames.join(', ')}.`}
                    style={{ maxWidth: '100%' }}
                  />
                </View>
              )}
            </View>

            <View>
              {!!safeAccounts.length && (
                <View style={spacings.mvTy}>
                  <Alert
                    type="warning"
                    title={t("Don't add accounts you don't recognize")}
                    style={{ maxWidth: '100%' }}
                    titleWeight="light"
                    size="sm"
                  />
                </View>
              )}
              <Button
                testID="import-safe-owner-button"
                size="large"
                text={t('Import')}
                hasBottomSpacing={false}
                onPress={handleImport}
                disabled={
                  !isValid ||
                  isSearching ||
                  isImporting ||
                  (hasSearchCompleted && !safeAccounts.length)
                }
              />
            </View>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(SafeImportByOwnerScreen)
