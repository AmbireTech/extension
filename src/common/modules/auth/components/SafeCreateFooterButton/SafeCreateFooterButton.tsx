import React from 'react'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'

type Props = {
  safeCreate: ReturnType<typeof useSafeCreate>
}

/**
 * The footer button of the Safe create screen (web and mobile). It prepares the Safe and
 * goes on to the personalize step, which adds it once the user proceeds.
 */
const SafeCreateFooterButton = ({ safeCreate }: Props) => {
  const { t } = useTranslation()
  const { isCreateButtonDisabled, handleCreate } = safeCreate

  return (
    <Button
      testID="safe-create-button"
      size="large"
      text={t('Continue')}
      hasBottomSpacing={false}
      onPress={handleCreate}
      disabled={isCreateButtonDisabled}
    />
  )
}

export default React.memo(SafeCreateFooterButton)
