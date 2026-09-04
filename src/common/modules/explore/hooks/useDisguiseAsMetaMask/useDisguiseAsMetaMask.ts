import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'

const selectDisguisedAsMetaMaskDappIds = (state: AllControllersMappingType['DappsController']) =>
  state.disguisedAsMetaMaskDappIds

const useDisguiseAsMetaMask = (dapp: Dapp, onToggled: () => void) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state: disguisedDappIds, dispatchAndWait } = useController(
    'DappsController',
    selectDisguisedAsMetaMaskDappIds
  )
  const [isUpdating, setIsUpdating] = useState(false)

  const isOn = useMemo(
    () => (disguisedDappIds ?? []).includes(dapp.id),
    [disguisedDappIds, dapp.id]
  )

  const toggle = useCallback(
    async (nextIsOn: boolean) => {
      if (isUpdating) return
      setIsUpdating(true)

      try {
        await dispatchAndWait({
          type: 'method',
          params: {
            method: 'setDappDisguisedAsMetaMask',
            args: [dapp.id, nextIsOn]
          }
        })

        addToast(
          nextIsOn
            ? t('Ambire will now show up as MetaMask on this app. Reloading it.')
            : t('Ambire will now show up as Ambire on this app. Reloading it.')
        )
        onToggled()
      } catch (error: any) {
        addToast(t("Couldn't change this setting. Please try again."), { type: 'error' })
        captureException(error)
      } finally {
        setIsUpdating(false)
      }
    },
    [isUpdating, dispatchAndWait, dapp.id, addToast, onToggled, t]
  )

  return { isOn, isUpdating, toggle }
}

export default useDisguiseAsMetaMask
