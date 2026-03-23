import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import LockWithTimerIcon from '@common/assets/svg/LockWithTimerIcon'
import ControlOption from '@common/components/ControlOption'
import Select from '@common/components/Select'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import { AUTO_LOCK_OPTIONS } from '@web/constants/autoLock'
import { AUTO_LOCK_TIMES } from '@web/extension-services/background/controllers/auto-lock'

const AutoLockDeviceControlOption = () => {
  const { t } = useTranslation()
  const {
    state: { autoLockTime },
    dispatch: autoLockDispatch
  } = useController('AutoLockController')

  const selectedOption = useMemo(() => {
    return AUTO_LOCK_OPTIONS.find((option) => option.value === autoLockTime) || AUTO_LOCK_OPTIONS[0]
  }, [autoLockTime])

  return (
    <ControlOption
      style={spacings.mbTy}
      title={t('Auto-lock device')}
      description={t('Set a timer, after which the Ambire Wallet will be automatically locked.')}
      readMoreLink="https://help.ambire.com/en/articles/13714131-locking-the-ambire-wallet-extension"
      renderIcon={<LockWithTimerIcon />}
    >
      <Select
        setValue={(option) => {
          autoLockDispatch({
            type: 'method',
            params: {
              method: 'setAutoLockTime',
              args: [option.value as AUTO_LOCK_TIMES]
            }
          })
        }}
        withSearch={false}
        options={AUTO_LOCK_OPTIONS}
        value={selectedOption}
        containerStyle={{
          width: 120,
          ...spacings.mb0
        }}
        size="sm"
      />
    </ControlOption>
  )
}

export default React.memo(AutoLockDeviceControlOption)
