import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import Alert from '@common/components/Alert'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links'

interface Props {
  pageError: AccountPickerController['pageError']
  page: AccountPickerController['page']
  setPage: (page: number) => void
}

const AccountsRetrieveError: React.FC<Props> = ({ pageError, page, setPage }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [isReady, setIsReady] = useState(false)
  useEffect(() => {
    setTimeout(() => {
      setIsReady(true)
    }, 1000)
  }, [])

  const handleRetrySetPage = useCallback(() => setPage(page), [setPage, page])

  const handleContactSupport = useCallback(async () => {
    try {
      await openInTab({ url: 'https://help.ambire.com/en' })
    } catch {
      addToast("Couldn't open link", { type: 'error' })
    }
  }, [addToast])

  const fallbackText = useMemo(
    () => (
      <Trans>
        <Alert.Text type="warning">
          Please go back and start the account-adding process again. If the problem persists, please{' '}
          <Pressable onPress={handleContactSupport}>
            <Alert.Text type="warning" style={text.underline}>
              contact our support team
            </Alert.Text>
          </Pressable>
          .
        </Alert.Text>
      </Trans>
    ),
    [handleContactSupport]
  )

  if (!isReady) return null

  return (
    <View style={[spacings.mt, spacings.mb]}>
      <Alert
        type="warning"
        title={pageError || t('The process of retrieving accounts was cancelled or it failed.')}
        text={!pageError && fallbackText}
        buttonProps={{
          onPress: handleRetrySetPage,
          text: t('Retry Request (Page {{page}})', { page }),
          type: 'primary'
        }}
      />
    </View>
  )
}

export default React.memo(AccountsRetrieveError)
