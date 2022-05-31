import { validateImportedAccountProps } from 'ambire-common/src/services/validations'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { useState } from 'react'

import { useTranslation } from '@config/localization'
import useAccounts from '@modules/common/hooks/useAccounts'

export default function useJsonLogin() {
  const { t } = useTranslation()
  const [error, setError] = useState<null | string>(null)
  const [inProgress, setInProgress] = useState<boolean>(false)
  const { onAddAccount } = useAccounts()

  const handleLogin = async () => {
    setError('')
    setInProgress(true)

    const document = await DocumentPicker.getDocumentAsync({ type: 'application/json' })

    if (document.type !== 'success') {
      setInProgress(false)
      return setError(t('JSON file was not selected or something went wrong selecting it.'))
    }

    let fileContent
    try {
      fileContent = await FileSystem.readAsStringAsync(document.uri)
      fileContent = JSON.parse(fileContent)
    } catch (exception) {
      setInProgress(false)
      return setError(
        'Something went wrong with pulling the information from the JSON file selected.'
      )
    }

    const validatedFile = validateImportedAccountProps(fileContent)
    if (!validatedFile.success) {
      setInProgress(false)
      return setError(
        validatedFile.message || t('The imported file does not contain needed account data.')
      )
    }

    onAddAccount(fileContent, { select: true })
    setInProgress(false)
  }

  return { handleLogin, error, inProgress }
}
