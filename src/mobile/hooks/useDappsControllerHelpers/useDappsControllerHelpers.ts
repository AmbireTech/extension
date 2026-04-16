import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { isValidURL } from '@ambire-common/services/validations'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import useControllerState from '@common/hooks/useControllerState'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'

export default function useDappsControllerHelpers(
  dispatch: (action: MethodAction | Action) => void
) {
  const { state, updateHelpers } = useControllerState({
    id: 'DappsController',
    subscriptionEnabled: true
  })

  const [dappUrl, setDappUrlState] = useState<string>('')
  const route = useRoute()

  const getCurrentDapp = useCallback(
    async (urlToResolve?: string) => {
      const url = urlToResolve ?? dappUrl
      if (!url) return null

      const requestId = nanoid()
      const dappId = getDappIdFromUrl(new URL(url).origin)

      console.log('dispatching', dappId)
      dispatch({
        type: 'method',
        params: {
          ctrlName: 'DappsController',
          method: 'getCurrentDappAndSendResToUi',
          args: [{ requestId, dappId, currentSessionId: undefined }]
        }
      })

      return new Promise<Dapp | null>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          eventBus.removeEventListener('receiveOneTimeData', onResponse)
          clearTimeout(timeoutId)
        }

        const onResponse = (data: any) => {
          if (data?.type !== 'GetCurrentDappRes' || data?.requestId !== requestId) return
          if (settled) return

          settled = true
          cleanup()
          console.log('data returned', data.res)
          if (!data.ok) return reject(new Error(data.error ?? 'Getting current dapp failed'))
          if (data.res) return resolve(data.res as Dapp)

          const missingInAppsCatalogButStillValidDapp = isValidURL(url)

          if (missingInAppsCatalogButStillValidDapp)
            return resolve({
              id: dappId,
              url,
              name: new URL(url).hostname, // Fallback name
              icon: '',
              isConnected: false,
              description: '',
              chainId: 1,
              favorite: false,
              category: null,
              twitter: null,
              tvl: null,
              chainIds: [],
              geckoId: null,
              isCustom: true,
              blacklisted: 'VERIFIED',
              isFeatured: false
            })

          return resolve(data.res as null)
        }

        const timeoutId = setTimeout(() => {
          if (settled) return
          settled = true

          cleanup()
          reject(new Error('Getting current dapp timed out after 10 seconds'))
        }, 10_000)

        eventBus.addEventListener('receiveOneTimeData', onResponse)
      })
    },
    [dispatch, dappUrl]
  )

  const setDappUrl = useCallback(
    (url: string) => {
      setDappUrlState(url)

      if (!url) {
        updateHelpers({ currentDapp: null, isLoadingCurrentDapp: false })
        return
      }

      updateHelpers({ isLoadingCurrentDapp: true })
      getCurrentDapp(url)
        .then((dapp) => {
          updateHelpers({ currentDapp: dapp, isLoadingCurrentDapp: false })
        })
        .catch((error) => {
          captureException(error)
          updateHelpers({ currentDapp: null, isLoadingCurrentDapp: false })
        })
    },
    [getCurrentDapp, updateHelpers]
  )

  // Reset when routing away from dappWebView
  useEffect(() => {
    if (!!dappUrl && !route.pathname.includes(ROUTES.dappWebView)) setDappUrl('')
  }, [dappUrl, route.pathname, setDappUrl])

  useEffect(() => {
    updateHelpers({ getCurrentDapp, setDappUrl, dappUrl })
  }, [getCurrentDapp, setDappUrl, dappUrl, updateHelpers])
}
