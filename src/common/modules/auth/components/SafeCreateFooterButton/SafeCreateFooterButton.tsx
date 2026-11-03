import React from 'react'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useSafeCreate from '@common/modules/auth/hooks/useSafeCreate'

type Props = {
  safeCreate: ReturnType<typeof useSafeCreate>
}

/**
 * The footer button of the Safe create screen (web and mobile): Continue on the owners
 * form, then Create Multisig on the preview step.
 */
const SafeCreateFooterButton = ({ safeCreate }: Props) => {
  const { t } = useTranslation()
  const {
    preview,
    isContinueButtonDisabled,
    handleContinue,
    isCreateButtonDisabled,
    handleCreate
  } = safeCreate

  return preview ? (
    <Button
      testID="safe-create-button"
      size="large"
      text={t('Create Multisig')}
      hasBottomSpacing={false}
      onPress={handleCreate}
      disabled={isCreateButtonDisabled}
    />
  ) : (
    <Button
      testID="safe-create-continue-button"
      size="large"
      text={t('Continue')}
      hasBottomSpacing={false}
      onPress={handleContinue}
      disabled={isContinueButtonDisabled}
    />
  )
}

export default React.memo(SafeCreateFooterButton)
