import { useCallback, useMemo, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import { LedgerAppInstallStep } from '@common/modules/hardware-wallet/libs/ledgerAppInstall/installLedgerApp'

/** Installs the app on the connected Ledger, reporting the step in flight */
export type AmbireSignerInstaller = (
  onProgress: (step: LedgerAppInstallStep, percent: number) => void
) => Promise<void>

/**
 * Progress and messages of the "Ambire Signer" install (a fork of the Ethereum
 * app that whitelists the Ambire EIP-7702 delegator), needed to authorize the
 * delegation with a Ledger. Each platform passes its own installer, since the
 * device connection differs (WebHID on web, USB or Bluetooth on mobile).
 */
const useAmbireSignerInstall = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [installStep, setInstallStep] = useState<LedgerAppInstallStep | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  // Deliberately not persisted - the only source of truth is the device itself,
  // which the installer checks before installing anything.
  const [isAmbireSignerInstalled, setIsAmbireSignerInstalled] = useState(false)

  // Runs unconditionally, which doubles as the update path - the device asks to
  // remove the old build first when there already is one.
  const installAmbireSigner = useCallback(
    async (installer: AmbireSignerInstaller) => {
      try {
        setInstallStep('connecting')
        setInstallProgress(0)
        await installer((step, percent) => {
          setInstallStep(step)
          setInstallProgress(percent)
        })
        setIsAmbireSignerInstalled(true)
        addToast(
          t('Ambire Signer is ready on your Ledger. You can now turn on the networks below.')
        )
      } catch (error: any) {
        addToast(error?.message || t('Failed to install Ambire Signer on your Ledger.'), {
          type: 'error'
        })
      } finally {
        setInstallStep(null)
      }
    },
    [addToast, t]
  )

  // The device names none of its prompts after Ambire, so spell out what is being
  // asked instead of showing a bare spinner.
  const installStepText = useMemo(() => {
    if (installStep === 'connecting') return t('Unlock your Ledger and keep it on its home screen.')
    if (installStep === 'confirmingInstall')
      return t('On your Ledger: approve the install request.')
    if (installStep === 'loading')
      return t(
        'Installing. Keep your Ledger connected. If you already have an older Ambire Signer, your Ledger will ask to remove it first.'
      )

    return null
  }, [installStep, t])

  const installButtonText = useMemo(() => {
    if (installStep === 'loading')
      return t('Installing... {{progress}}%', { progress: installProgress })
    if (installStep) return t('Check your Ledger')

    return t('Install')
  }, [installProgress, installStep, t])

  return {
    installStep,
    installProgress,
    installStepText,
    installButtonText,
    isAmbireSignerInstalled,
    installAmbireSigner
  }
}

export default useAmbireSignerInstall
