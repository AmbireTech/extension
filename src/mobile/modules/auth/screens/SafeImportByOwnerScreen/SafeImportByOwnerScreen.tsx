import React, { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Keyboard, Pressable, View } from 'react-native'

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
    isSearching,
    isImportButtonDisabled,
    goToPrevRoute,
    owner,
    ownerAddressState,
    ownerAddressValidation,
    safeAccounts,
    setAccountSelected,
    selectedAddresses,
    validateOwnerAddress
  } = useSafeImportByOwner()
  const { t } = useTranslation()
  const { theme } = useTheme()

  // Free up the screen for the search results as soon as the owner address is valid
  useEffect(() => {
    if (owner) Keyboard.dismiss()
  }, [owner])

  return (
    <MobileLayoutContainer
      footer={
        <View style={spacings.ptSm}>
          {!!safeAccounts.length && (
            <View style={spacings.mbSm}>
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
            disabled={isImportButtonDisabled}
          />
        </View>
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Import Safe by owner')}
      >
        {/* Tapping anywhere outside the input (or another touchable) hides the keyboard */}
        <Pressable style={flexbox.flex1} onPress={Keyboard.dismiss}>
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
                withDetails
                validation={ownerAddressValidation}
                resolvedAddress={ownerAddressState.resolvedAddress}
                resolvedAddressType={ownerAddressState.resolvedAddressType}
                isRecipientDomainResolving={ownerAddressState.isDomainResolving}
                backgroundColor={theme.tertiaryBackground}
                autoCorrect={false}
              />
            )}
          />

          {!!safeAccounts.length && (
            <View style={[flexbox.flex1, spacings.mt]}>
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
        </Pressable>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(SafeImportByOwnerScreen)
