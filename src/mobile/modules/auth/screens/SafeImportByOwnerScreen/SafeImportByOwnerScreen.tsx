import React from 'react'
import { Controller } from 'react-hook-form'
import { View } from 'react-native'

import AddressInput from '@common/components/AddressInput'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SafeAccountList from '@common/modules/auth/components/SafeAccountList'
import useSafeImportByOwner from '@common/modules/auth/hooks/useSafeImportByOwner'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const SafeImportByOwnerScreen = () => {
  const {
    control,
    failedNetworkNames,
    handleImport,
    hasSearchCompleted,
    importedAccounts,
    isMainBusy,
    isSearching,
    isValid,
    goToPrevRoute,
    ownerAddressState,
    ownerAddressValidation,
    safeAccounts,
    setAccountSelected,
    selectedAddresses,
    validateOwnerAddress
  } = useSafeImportByOwner()
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <MobileLayoutContainer
      footer={
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
              !isValid || isSearching || isMainBusy || (hasSearchCompleted && !safeAccounts.length)
            }
          />
        </View>
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import Safe by owner')}
        step={1}
        totalSteps={1}
      >
        <Controller
          control={control}
          rules={{ validate: validateOwnerAddress, required: true }}
          name="ownerAddress.fieldValue"
          render={({ field: { onChange, onBlur, value } }) => (
            <AddressInput
              testID="add-safe-owner-field"
              onBlur={onBlur}
              autoFocus
              placeholder={t('Add Safe owner address')}
              onChangeText={onChange}
              onScanAddress={onChange}
              value={value}
              validation={ownerAddressValidation}
              resolvedAddress={ownerAddressState.resolvedAddress}
              resolvedAddressType={ownerAddressState.resolvedAddressType}
              isRecipientDomainResolving={ownerAddressState.isDomainResolving}
              backgroundColor={theme.secondaryBackground}
              autoCorrect={false}
            />
          )}
        />

        {!!safeAccounts.length && (
          <View style={[{ height: 280 }, spacings.mt]}>
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SafeImportByOwnerScreen)
