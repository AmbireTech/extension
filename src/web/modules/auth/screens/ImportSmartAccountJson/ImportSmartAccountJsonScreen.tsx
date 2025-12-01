import { computeAddress, getAddress, isAddress, isHexString } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Linking, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { AMBIRE_ACCOUNT_FACTORY } from '@ambire-common/consts/deploy'
import { Account, AccountCreation } from '@ambire-common/interfaces/account'
import { ReadyToAddKeys } from '@ambire-common/interfaces/keystore'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import eventBus from '@web/extension-services/event/eventBus'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import PasswordConfirmation from '@web/modules/settings/components/PasswordConfirmation'

import getStyles from './styles'

type ImportedJson = Account & {
  privateKey?: string
  creation: AccountCreation
  id?: string
  encryptedKey?: string
  salt?: string
  iv?: string
}

const validateJson = (json: ImportedJson): { error?: string; success: boolean } => {
  if ('id' in json && isAddress(json.id)) {
    return {
      error: 'Invalid json or you are trying to add Ambire v1 account which is not allowed.',
      success: false
    }
  }

  if (!('addr' in json) || !isAddress(json.addr)) {
    return {
      error:
        'Invalid address in json. Please check if it is present. If it is, make sure it is checksummed.',
      success: false
    }
  }

  if (
    !('associatedKeys' in json) ||
    !Array.isArray(json.associatedKeys) ||
    json.associatedKeys.length !== 1
  ) {
    return {
      error: 'Invalid associatedKeys in json. Please contact support.',
      success: false
    }
  }

  if (!('creation' in json)) {
    return {
      error: 'Creation data missing in provided json.',
      success: false
    }
  }

  const creation = json.creation
  if (!('bytecode' in creation) || !isHexString(creation.bytecode)) {
    return {
      error: 'Invalid bytecode in provided json.',
      success: false
    }
  }

  if (
    !('factoryAddr' in creation) ||
    !isHexString(creation.factoryAddr) ||
    !isAddress(creation.factoryAddr)
  ) {
    return {
      error: 'Invalid factoryAddr in provided json.',
      success: false
    }
  }

  if (creation.factoryAddr !== AMBIRE_ACCOUNT_FACTORY) {
    return {
      error:
        'factoryAddr in json is different than the factory for Ambire accounts. Are you importing an Ambire v1 account? Importing V1 accounts is not supported.',
      success: false
    }
  }

  if (!('salt' in creation) || !isHexString(creation.salt)) {
    return {
      error: 'Invalid salt in provided json.',
      success: false
    }
  }

  if (
    !('initialPrivileges' in json) ||
    !Array.isArray(json.initialPrivileges) ||
    json.initialPrivileges.length !== 1 ||
    !Array.isArray(json.initialPrivileges[0]) ||
    json.initialPrivileges[0].length !== 2
  ) {
    return {
      error: 'Invalid initialPrivileges in provided json.',
      success: false
    }
  }

  // @backwards-compatibility
  // for old jsons that have an unencrypted private key in them
  if (json.privateKey) {
    if (!isValidPrivateKey(json.privateKey)) {
      return {
        error: 'Invalid privateKey in provided json.',
        success: false
      }
    }

    if (computeAddress(json.privateKey) !== getAddress(json.associatedKeys[0])) {
      return {
        error:
          'PrivateKey and associatedKey address mismatch. Are you providing the correct private key?',
        success: false
      }
    }

    return {
      success: true
    }
  }

  if (!json.encryptedKey || !isHexString(json.encryptedKey)) {
    return {
      error: 'Invalid key in provided json.',
      success: false
    }
  }

  if (!json.salt || !json.iv || !isHexString(json.salt) || !isHexString(json.encryptedKey)) {
    return {
      error: 'Invalid encryption information in provided json.',
      success: false
    }
  }

  return {
    success: true
  }
}

const SmartAccountImportScreen = () => {
  const { t } = useTranslation()
  const { theme, styles, themeType } = useTheme(getStyles)
  const [error, setError] = useState('')
  const [accountToImport, setAccountToImport] = useState<Account | null>(null)
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const [encryptedKey, setEncryptedKey] = useState<{
    key: string
    salt: string
    iv: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { dispatch } = useBackgroundService()

  const { accounts } = useAccountsControllerState()
  const newAccounts: Account[] = useMemo(() => accounts.filter((a) => a.newlyAdded), [accounts])
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()

  const {
    ref: sheetRefConfirmKeyPassword,
    open: openConfirmKeyPassword,
    close: closeConfirmKeyPassword
  } = useModalize()

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.privateKey) return

      setPrivateKey(data.privateKey)
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)

    return () => eventBus.removeEventListener('receiveOneTimeData', onReceiveOneTimeData)
  }, [])

  // import the account when all the data is collected successfully
  useEffect(() => {
    if (!privateKey || !accountToImport) return

    const keys: ReadyToAddKeys['internal'] = [
      {
        addr: computeAddress(privateKey),
        label: '',
        type: 'internal',
        privateKey,
        dedicatedToOneSA: true,
        meta: { createdAt: Date.now() }
      }
    ]

    dispatch({
      type: 'IMPORT_SMART_ACCOUNT_JSON',
      params: { readyToAddAccount: accountToImport, keys }
    })

    setPrivateKey(null)
    setAccountToImport(null)
  }, [privateKey, accountToImport, dispatch])

  const handleFileUpload = (files: any) => {
    setError('')
    setIsLoading(true)

    const file = files[0]
    if (file.type !== 'application/json') {
      setError('Please upload a valid json file')
      setIsLoading(false)
      return
    }

    file.text().then((contents: string) => {
      try {
        const accountData: ImportedJson = JSON.parse(contents)
        const validation = validateJson(accountData)
        if (!validation.success) {
          setIsLoading(false)
          validation.error && setError(validation.error)
          return
        }

        setAccountToImport({
          addr: accountData.addr,
          associatedKeys: accountData.associatedKeys,
          initialPrivileges: accountData.initialPrivileges,
          creation: accountData.creation,
          newlyAdded: true,
          preferences:
            accountData.preferences ?? getDefaultAccountPreferences(accountData.addr, accounts, 0)
        })

        if (accountData.privateKey) {
          setPrivateKey(accountData.privateKey)
          return
        }

        // encrypted key handle from now on
        // all the below data has been validated to exist at this point
        setEncryptedKey({
          key: accountData.encryptedKey!,
          salt: accountData.salt!,
          iv: accountData.iv!
        })
        openConfirmKeyPassword()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
        setError('Could not parse file. Please upload a valid json file')
        setIsLoading(false)
      }
    })
  }

  useEffect(() => {
    if (newAccounts.length) goToNextRoute()
  }, [newAccounts.length, goToNextRoute])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handleFileUpload })

  const handleGuideLinkPressed = useCallback(
    () =>
      Linking.openURL(
        'https://help.ambire.com/hc/en-us/articles/15468208978332--Extension-How-to-add-your-v1-account-to-Ambire-Wallet-extension'
      ),
    []
  )

  const onPasswordSubmitted = (password: string) => {
    // shouldn't happen
    if (!encryptedKey || !accountToImport) return

    dispatch({
      type: 'KEYSTORE_CONTROLLER_SEND_PASSWORD_DECRYPTED_PRIVATE_KEY_TO_UI',
      params: {
        secret: password,
        key: encryptedKey.key,
        salt: encryptedKey.salt,
        iv: encryptedKey.iv,
        associatedKeys: accountToImport.associatedKeys
      }
    })
  }

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="md"
      header={<Header mode="custom-inner-content" withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          title={t('Import JSON backup file')}
          type="onboarding"
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
        >
          <div
            {...getRootProps()}
            style={{
              display: 'flex',
              flex: 1,
              flexDirection: 'column'
            }}
          >
            <View style={styles.dropAreaContainer}>
              <View style={styles.dropArea}>
                <input {...getInputProps()} />
                <Trans>
                  {isDragActive ? (
                    <Text appearance="secondaryText" style={text.center}>
                      Drop your file here...
                    </Text>
                  ) : (
                    <Text appearance="secondaryText" style={text.center}>
                      {t('Drag & drop your file here or ')}
                      <Text appearance="primary" weight="medium">
                        upload
                      </Text>
                      <Text appearance="secondaryText">{' it from your computer'}</Text>
                      {isLoading && (
                        <View style={spacings.mlTy}>
                          <Spinner style={{ width: 16, height: 16 }} />
                        </View>
                      )}
                    </Text>
                  )}
                </Trans>
              </View>
              {!!error && (
                <Text weight="regular" fontSize={14} appearance="errorText">
                  {error}
                </Text>
              )}
            </View>
            <Trans>
              <Alert
                title="Ambire v2 Smart Accounts only"
                type="warning"
                size="sm"
                text={
                  <Text fontSize={14} appearance="secondaryText">
                    You can import backups only for v2 Smart Accounts created in the Ambire
                    Extension. If you are looking to import v1 Smart Accounts from the web or mobile
                    wallet check{' '}
                    <TouchableOpacity onPress={handleGuideLinkPressed}>
                      <Text color={theme.infoDecorative} fontSize={14} underline weight="medium">
                        this guide
                      </Text>
                    </TouchableOpacity>
                    .
                  </Text>
                }
              />
            </Trans>
          </div>
        </Panel>
        <BottomSheet
          sheetRef={sheetRefConfirmKeyPassword}
          id="confirm-password-bottom-sheet"
          type="modal"
          backgroundColor={
            themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
          }
          closeBottomSheet={closeConfirmKeyPassword}
          scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
          containerInnerWrapperStyles={{ flex: 1 }}
          style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
        >
          <PasswordConfirmation
            title="Decrypt backup"
            text={t(
              'Please enter the password that encrypted this file - the extension password at the time of export.'
            )}
            onPasswordConfirmed={() => closeConfirmKeyPassword()}
            onCustomSubmit={onPasswordSubmitted}
            onBackButtonPress={() => {
              closeConfirmKeyPassword()
              setIsLoading(false)
            }}
          />
        </BottomSheet>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SmartAccountImportScreen
