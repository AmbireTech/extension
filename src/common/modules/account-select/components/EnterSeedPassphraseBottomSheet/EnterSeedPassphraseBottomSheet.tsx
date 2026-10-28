import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import InputPassword from '@common/components/InputPassword'
import PassphraseBadge from '@common/components/PassphraseBadge'
import SavePassphraseToggle from '@common/components/SavePassphraseToggle'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { NO_AUTOFILL_PROPS } from '@common/constants/textInput'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  seed: { id: string; label: string; passphraseLabel?: string }
  /** Shown next to the phrase name, when set */
  accountsCount?: number
  /** What the passphrase is needed for. Defaults to adding accounts */
  description?: string
  /** Called with the passphrase once it is confirmed to be the one the phrase was added with */
  onConfirmed: (params: { seedPassphrase: string; shouldSavePassphrase: boolean }) => void
  /** Called once the closing animation ends, so the caller can unmount the sheet */
  onClosed: () => void
}

/**
 * Asks for the passphrase of a saved recovery phrase whose passphrase isn't saved, before adding
 * accounts from it. Opens itself on mount and closes itself once the passphrase is confirmed.
 */
const EnterSeedPassphraseBottomSheet = ({
  seed,
  accountsCount,
  description,
  onConfirmed,
  onClosed
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { ref: sheetRef, close } = useModalize()
  const { dispatchAndWait } = useController('KeystoreController')
  const [passphrase, setPassphrase] = useState('')
  const [shouldSavePassphrase, setShouldSavePassphrase] = useState(false)
  const [isWrongPassphrase, setIsWrongPassphrase] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const handleChangePassphrase = useCallback((value: string) => {
    setPassphrase(value)
    setIsWrongPassphrase(false)
  }, [])

  const handleContinue = useCallback(async () => {
    if (!passphrase || isChecking) return

    setIsChecking(true)
    try {
      const isCorrect = await dispatchAndWait<'isSeedPassphraseCorrectAndSendResToUi', boolean>({
        type: 'method',
        params: { method: 'isSeedPassphraseCorrectAndSendResToUi', args: [seed.id, passphrase] }
      })
      if (!isCorrect) {
        setIsWrongPassphrase(true)
        return
      }

      onConfirmed({ seedPassphrase: passphrase, shouldSavePassphrase })
      close()
    } catch (error) {
      // Not reported here, as the controller already reports the failed check
      console.error('Checking the passphrase failed', error)
      addToast(t("Couldn't check the passphrase. Please try again."), { type: 'error' })
    } finally {
      setIsChecking(false)
    }
  }, [
    addToast,
    close,
    dispatchAndWait,
    isChecking,
    onConfirmed,
    passphrase,
    seed.id,
    shouldSavePassphrase,
    t
  ])

  return (
    <BottomSheet
      id="enter-seed-passphrase"
      sheetRef={sheetRef}
      closeBottomSheet={close}
      onClosed={onClosed}
      autoOpen
      HeaderComponent={<ModalHeader handleClose={close} title={t('Enter passphrase')} />}
      FooterComponent={
        <ButtonWithLoader
          type="primary"
          text={isChecking ? '' : t('Continue')}
          onPress={handleContinue}
          disabled={!passphrase || isChecking || isWrongPassphrase}
          isLoading={isChecking}
          testID="enter-seed-passphrase-continue-button"
        />
      }
    >
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
        {description ?? t('To add accounts from this recovery phrase, enter its passphrase.')}
      </Text>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phSm,
          spacings.pvSm,
          spacings.mbMd,
          { borderRadius: BORDER_RADIUS_PRIMARY, backgroundColor: theme.secondaryBackground }
        ]}
      >
        <View style={[flexbox.flex1, flexbox.alignStart]}>
          <Text fontSize={14} weight="semiBold" numberOfLines={1} style={spacings.mbMi}>
            {seed.label}
          </Text>
          <PassphraseBadge passphraseLabel={seed.passphraseLabel} />
        </View>
        {accountsCount !== undefined && (
          <Text fontSize={12} appearance="secondaryText" style={spacings.mlSm}>
            {t('{{count}} account{{s}}', {
              count: accountsCount,
              s: accountsCount === 1 ? '' : 's'
            })}
          </Text>
        )}
      </View>
      <InputPassword
        {...NO_AUTOFILL_PROPS}
        label={t('Passphrase')}
        value={passphrase}
        onChangeText={handleChangePassphrase}
        onSubmitEditing={handleContinue}
        placeholder={t('Enter passphrase')}
        error={isWrongPassphrase ? t('Wrong passphrase.') : undefined}
        backgroundColor={theme.secondaryBackground}
        autoFocus
        testID="enter-seed-passphrase-input"
      />
      <SavePassphraseToggle
        testID="enter-seed-passphrase-save-toggle"
        isOn={shouldSavePassphrase}
        onToggle={() => setShouldSavePassphrase((prev) => !prev)}
        style={spacings.mbLg}
      />
    </BottomSheet>
  )
}

export default React.memo(EnterSeedPassphraseBottomSheet)
