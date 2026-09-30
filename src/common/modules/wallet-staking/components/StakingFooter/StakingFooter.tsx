import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'

import getStyles from './styles'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

interface Props {
  form: WalletStakingFormState
}

/** The Cancel / Stake (or Unstake, or Withdraw) buttons pinned to the bottom of the screen. */
const StakingFooter = ({ form }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  const { submitButtonText, isSubmitDisabled, onSubmit, onCancel } = form

  return (
    <View style={styles.footerRow}>
      <FooterGlassView
        size="sm"
        absolute={false}
        fullWidth={isNarrowWebLayout}
        innerContainerStyle={isNarrowWebLayout ? styles.footerButtonsCompact : styles.footerButtons}
        mobileStyle={styles.footerButtonsMobile}
      >
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={onCancel}
          hasBottomSpacing={false}
          style={styles.footerButton}
        />
        <Button
          type="primary"
          text={submitButtonText}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          hasBottomSpacing={false}
          style={styles.footerButton}
        />
      </FooterGlassView>
    </View>
  )
}

export default React.memo(StakingFooter)
