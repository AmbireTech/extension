import { computeAddress, getAddress, isAddress, isHexString } from 'ethers'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Linking, TouchableOpacity, View } from 'react-native'

import { AMBIRE_ACCOUNT_FACTORY } from '@ambire-common/consts/deploy'
import { Account, AccountCreation } from '@ambire-common/interfaces/account'
import { ReadyToAddKeys } from '@ambire-common/interfaces/keystore'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import ImportJsonIcon from '@common/assets/svg/ImportJsonIcon'
import Alert from '@common/components/Alert'
import BackButton from '@common/components/BackButton'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import Stepper from '@web/modules/router/components/Stepper'

import getStyles from './styles'

type ImportedJson = Account & { privateKey: string; creation: AccountCreation; id?: string }

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

  if (!('privateKey' in json) || !isValidPrivateKey(json.privateKey)) {
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

const SmartAccountImportScreen = () => {
  const { updateStepperState } = useStepper()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { dispatch } = useBackgroundService()
  const { statuses } = useKeystoreControllerState()
  const { navigate } = useNavigation()
  const { accounts } = useAccountsControllerState()
  const newAccounts: Account[] = useMemo(() => accounts.filter((a) => a.newlyAdded), [accounts])

  useEffect(() => {
    if (statuses.addKeys === 'SUCCESS') {
      if (newAccounts.length) navigate(WEB_ROUTES.accountPersonalize)
      else navigate(WEB_ROUTES.dashboard)
    }
  }, [statuses.addKeys, newAccounts, navigate])

  useEffect(() => {
    updateStepperState(WEB_ROUTES.importSmartAccountJson, 'import-json')
  }, [updateStepperState])

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

        const readyToAddAccount: Account = {
          addr: accountData.addr,
          associatedKeys: accountData.associatedKeys,
          initialPrivileges: accountData.initialPrivileges,
          creation: accountData.creation,
          newlyAdded: true,
          preferences:
            accountData.preferences ?? getDefaultAccountPreferences(accountData.addr, accounts, 0)
        }
        const keys: ReadyToAddKeys['internal'] = [
          {
            addr: computeAddress(accountData.privateKey),
            label: 'alabala',
            type: 'internal',
            privateKey: accountData.privateKey,
            // TODO: maybe query the blockchain for this data
            dedicatedToOneSA: true,
            meta: { createdAt: Date.now() }
          }
        ]

        dispatch({
          type: 'IMPORT_SMART_ACCOUNT_JSON',
          params: { readyToAddAccount, keys }
        })
      } catch (e) {
        setError('Could not parse file. Please upload a valid json file')
        setIsLoading(false)
      }
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop: handleFileUpload })

  const handleGuideLinkPressed = useCallback(
    () =>
      Linking.openURL(
        'https://help.ambire.com/hc/en-us/articles/15468208978332--Extension-How-to-add-your-v1-account-to-Ambire-Wallet-extension'
      ),
    []
  )

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="md"
      header={
        <Header mode="custom-inner-content" withAmbireLogo>
          <Stepper />
        </Header>
      }
      footer={<BackButton fallbackBackRoute={ROUTES.dashboard} />}
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Import a JSON backup file')}>
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
                <ImportJsonIcon />
                <Trans>
                  {isDragActive ? (
                    <Text weight="regular" style={text.center}>
                      Drop your file here...
                    </Text>
                  ) : (
                    <Text weight="regular" style={text.center}>
                      {'Drag and drop the JSON backup file\nor '}
                      <Text appearance="primary" weight="regular">
                        upload
                      </Text>
                      <Text weight="regular">{' it from your computer'}</Text>
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
              <Trans>
                <Alert
                  title="Ambire v2 Smart Accounts only"
                  type="warning"
                  text={
                    <Text>
                      You can import backups only for v2 Smart Accounts created in the Ambire
                      Extension. If you are looking to import v1 Smart Accounts from the web or
                      mobile wallet check{' '}
                      <TouchableOpacity onPress={handleGuideLinkPressed}>
                        <Text color={theme.infoDecorative} underline weight="regular">
                          this guide
                        </Text>
                      </TouchableOpacity>
                      .
                    </Text>
                  }
                />
              </Trans>
            </View>
          </div>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default SmartAccountImportScreen
