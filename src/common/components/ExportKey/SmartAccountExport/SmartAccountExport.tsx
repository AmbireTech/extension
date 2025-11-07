import React, { FC, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  account: Account
  privateKey: string | null
  salt: string | null
  iv: string | null
  openConfirmPassword: () => void
  goBack: () => void
}

const SmartAccountExport: FC<Props> = ({
  account,
  privateKey,
  openConfirmPassword,
  goBack,
  salt,
  iv
}) => {
  const { t } = useTranslation()
  const [downloadButtonPressed, setDownloadButtonPressed] = useState(false)

  const smartAccountJson = useMemo(
    () => ({
      addr: account.addr,
      associatedKeys: account.associatedKeys,
      creation: account.creation,
      initialPrivileges: account.initialPrivileges,
      preferences: account.preferences,
      encryptedKey: privateKey,
      salt,
      iv
    }),
    [account, privateKey, salt, iv]
  )

  useEffect(() => {
    if (downloadButtonPressed && privateKey) {
      setDownloadButtonPressed(false)

      if (isWeb) {
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(smartAccountJson)
        )}`
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute('href', dataStr)
        downloadAnchorNode.setAttribute(
          'download',
          `${smartAccountJson.preferences.label || 'smart-account'}.json`
        )
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
      } else {
        // TODO: impl for mobile
      }
      goBack()
    }
  }, [downloadButtonPressed, privateKey, smartAccountJson, goBack])

  return (
    <>
      <View style={[flexbox.flex1, spacings.mb]}>
        <Alert
          size="sm"
          type="warning"
          title={t(
            "Encrypted JSON backup of this smart account, containing the private key that controls it.\n\nImportant: The file is encrypted with your current extension password. If you forget it, the backup is unusable.\n\nChanging extension password won't update the backup. It always requires the password set at download time."
          )}
        />
      </View>

      <View style={flexbox.alignCenter}>
        <Button
          style={[spacings.mb0, spacings.mt0]}
          text="Download"
          size="large"
          onPress={async () => {
            if (!privateKey) {
              openConfirmPassword()
            }

            setDownloadButtonPressed(true)
          }}
        />
      </View>
    </>
  )
}

export default React.memo(SmartAccountExport)
