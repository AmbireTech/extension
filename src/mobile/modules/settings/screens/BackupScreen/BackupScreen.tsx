import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { isAndroid } from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import spacings from '@common/styles/spacings'
import useAccountBackup from '@mobile/modules/settings/hooks/useAccountBackup'

const BackupScreen = () => {
  const { t } = useTranslation()
  const { account } = useAccounts()
  const { exportAccountToJSON } = useAccountBackup()

  return (
    <GradientBackgroundWrapper>
      <Wrapper style={spacings.mt}>
        <Text style={spacings.mb} fontSize={20}>
          {t('Backup current account')}
        </Text>
        <Text style={spacings.mbLg}>
          {t(
            "{{action}} a backup of your current account ({{accountAddress}}) encrypted with your password. It's safe to store in iCloud/Google Drive, but you cannot use it to restore your account if you forget the password. You can only import this in Ambire, it's not importable in other wallets.",
            {
              accountAddress: `${account?.id?.slice(0, 5)}...${account?.id?.slice(-3)}`,
              action: isAndroid ? t('Export') : t('Download')
            }
          )}
        </Text>
        <Button
          type="primary"
          text={t('{{action}} JSON backup', { action: isAndroid ? t('Export') : t('Download') })}
          onPress={exportAccountToJSON}
        />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default BackupScreen
