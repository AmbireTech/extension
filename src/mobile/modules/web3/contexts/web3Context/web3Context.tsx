/* eslint-disable @typescript-eslint/no-use-before-define */
import networks, { NetworkType } from 'ambire-common/src/constants/networks'
import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import usePrevious from 'ambire-common/src/hooks/usePrevious'
import { serializeError } from 'eth-rpc-errors'
import { intToHex } from 'ethereumjs-util'
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useAccounts from '@common/hooks/useAccounts'
import useNetwork from '@common/hooks/useNetwork'
import CustomJsonRpcProvider from '@common/services/CustomJsonRpcProvider/CustomJsonRpcProvider'
import getHostname from '@common/utils/getHostname'
import { delayPromise } from '@common/utils/promises'
import ApprovalBottomSheets from '@mobile/modules/web3/components/ApprovalBottomSheets'
import providerController from '@mobile/modules/web3/services/webview-background/provider/provider'
import { Approval } from '@mobile/modules/web3/services/webview-background/services/notification'
import sessionService, {
  Session
} from '@mobile/modules/web3/services/webview-background/services/session'
import { ETH_RPC_METHODS_AMBIRE_MUST_HANDLE } from '@web/constants/common'
import { DAPP_PROVIDER_URLS } from '@web/extension-services/inpage/config/dapp-providers'

import { Web3ContextData } from './types'
import useApproval from './useApproval'
import useNotification from './useNotification'
import usePermission from './usePermission'

async function asyncForEach(array: any[], callback: (item: any) => any) {
  // eslint-disable-next-line no-restricted-syntax
  for (const item of array) {
    // eslint-disable-next-line no-await-in-loop
    await callback(item)
  }
}

const Web3Context = createContext<Web3ContextData>({
  approval: null,
  requests: null,
  selectedDapp: null,
  selectedDappUrl: '',
  checkHasPermission: () => false,
  addPermission: () => {},
  setSelectedDapp: () => {},
  setApproval: () => {},
  setWeb3ViewRef: () => {},
  handleWeb3Request: () => {},
  getApproval: () => Promise.resolve(null),
  resolveApproval: () => {},
  rejectApproval: () => {},
  resolveMany: () => {},
  rejectAllApprovals: () => {}
})

const Web3Provider: React.FC<any> = ({ children }) => {
  const { selectedAcc } = useAccounts()
  const { network } = useNetwork()
  const [selectedDapp, setSelectedDapp] = useState<DappManifestData | null>(null)
  const selectedDappUrl = useMemo(() => (selectedDapp ? selectedDapp.url : ''), [selectedDapp])
  const prevSelectedDappUrl = usePrevious(selectedDappUrl)
  const [web3ViewRef, setWeb3ViewRef] = useState<any>(null)
  const prevWeb3ViewRef = usePrevious(web3ViewRef)
  const [approval, setApproval] = useState<Approval | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [tabSessionData, setTabSessionData] = useState<any>(null)
  const [dappProviders, setDappsProviders] = useState<
    {
      network: NetworkType
      provider: any
    }[]
  >([])
  const handledMethodsTimestamps: any = useRef({})

  const {
    checkHasPermission,
    addPermission,
    removePermission,
    grantPermission,
    sheetRefPermission,
    openBottomSheetPermission,
    closeBottomSheetPermission
  } = usePermission({
    selectedDappUrl
  })

  const { requestNotificationServiceMethod } = useNotification({
    setApproval
  })

  const {
    requests,
    getApproval,
    resolveApproval,
    rejectApproval,
    resolveMany,
    rejectAllApprovals
  } = useApproval({ requestNotificationServiceMethod, approval, setApproval })

  useEffect(() => {
    if ((!selectedDappUrl && !!prevSelectedDappUrl) || (!web3ViewRef && !!prevWeb3ViewRef)) {
      setApproval(null)
      setSession(null)
      setTabSessionData(null)
      setDappsProviders([])
      handledMethodsTimestamps.current = {}
    }
  }, [
    requests,
    selectedDappUrl,
    prevSelectedDappUrl,
    web3ViewRef,
    prevWeb3ViewRef,
    rejectAllApprovals
  ])

  useEffect(() => {
    ;(async () => {
      try {
        if (!selectedDappUrl || !tabSessionData?.params?.origin) return
        const providers: {
          network: NetworkType
          provider: any
        }[] = []
        const dappUrls: any =
          DAPP_PROVIDER_URLS?.[getHostname(tabSessionData?.params?.origin) as string]
        if (dappUrls) {
          asyncForEach(Object.keys(dappUrls), async (rpcNetwork: any) => {
            const net: NetworkType =
              networks.find((n) => n.id === rpcNetwork) || (network as NetworkType)
            if (!dappUrls[rpcNetwork].startsWith('wss:')) {
              const provider = new CustomJsonRpcProvider(
                { url: dappUrls[rpcNetwork], origin: tabSessionData?.params?.origin },
                {
                  name: net?.name,
                  chainId: net?.chainId
                }
              )

              await Promise.race([
                provider?.getNetwork(),
                // Timeouts after 3 secs because sometimes the `provider.send` hangs with no response
                delayPromise(3000)
              ])
              providers.push({
                network: net as NetworkType,
                provider
              })
            }
          })

          setDappsProviders(providers)
        }
      } catch (error) {}
    })()
  }, [selectedDappUrl, tabSessionData, network])

  const handleWeb3Request = useCallback(
    async ({ data }: { data: any }) => {
      if (!selectedDappUrl) return

      // If the method was called in the last 2 secs return the stored result and skip calling the RPC
      if (
        handledMethodsTimestamps?.current?.[data.method] &&
        Date.now() - handledMethodsTimestamps?.current?.[data.method]?.date < 2000
      ) {
        const result = handledMethodsTimestamps.current[data.method].result
        const response = { id: data.id, result: data.method === 'tabCheckin' ? true : result }
        web3ViewRef?.injectJavaScript(`
        if (window.ethereum.promises[${response.id}]) {
          window.ethereum.promises[${response.id}].resolve(${JSON.stringify(response.result)});
          delete window.ethereum.promises[${response.id}]
        }

        true;
      `)
        return
      }

      try {
        if (data.method === 'tabCheckin') {
          setTabSessionData(data)
          if (!checkHasPermission(selectedDappUrl)) {
            openBottomSheetPermission()
            return
          }
        }

        if (data.method === 'disconnect') {
          removePermission(selectedDappUrl)
          return
        }

        const sessionId = selectedDappUrl
        const origin = tabSessionData?.params?.origin || data?.params?.origin || selectedDappUrl
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const s = sessionService.getOrCreateSession(sessionId, origin, web3ViewRef)
        const req = { data, session: s, origin }

        if (!session) {
          setSession(session)
        }

        let result: any

        const dappProvider = dappProviders.find(
          (item) => intToHex(item?.network?.chainId) === data?.chainId
        )?.provider

        if (
          dappProvider &&
          data.method.startsWith('eth_') &&
          !ETH_RPC_METHODS_AMBIRE_MUST_HANDLE.includes(data.method)
        ) {
          try {
            result = await Promise.race([
              dappProvider.send(data.method, data.params),
              // Timeouts after 3 secs because sometimes the `provider.send` hangs with no response
              delayPromise(3000)
            ])
          } catch (e) {
            console.error('dapp provider error', e)
          }
        }

        if (!result) {
          result = await providerController(req, requestNotificationServiceMethod)
        }

        const response = { id: data.id, result: data.method === 'tabCheckin' ? true : result }
        handledMethodsTimestamps.current[data.method] = {
          date: Date.now(),
          result: data.method === 'tabCheckin' ? true : result
        }
        web3ViewRef?.injectJavaScript(`
            if (window.ethereum.promises[${response.id}]) {
              window.ethereum.promises[${response.id}].resolve(${JSON.stringify(response.result)});
              delete window.ethereum.promises[${response.id}]
            }

            true;
          `)
      } catch (error) {
        const response = { id: data.id, error }
        web3ViewRef?.injectJavaScript(`
        if (window.ethereum.promises[${response.id}]) {
          window.ethereum.promises[${response.id}].reject(${JSON.stringify(
          serializeError({ message: error.message || 'User rejected the request.' })
        )});
          delete window.ethereum.promises[${response.id}]
        }

        true;
      `)
      }
    },
    [
      web3ViewRef,
      session,
      dappProviders,
      tabSessionData?.params?.origin,
      selectedDappUrl,
      requestNotificationServiceMethod,
      removePermission,
      checkHasPermission,
      openBottomSheetPermission
    ]
  )

  useEffect(() => {
    if (network && selectedDappUrl) {
      const networkChange = (net: NetworkType) => {
        sessionService.broadcastEvent('chainChanged', {
          chain: intToHex(net.chainId),
          networkVersion: `${net.chainId}`
        })
      }
      handledMethodsTimestamps.current = {}
      networkChange(network)
    }
  }, [network, selectedDappUrl])

  useEffect(() => {
    if (selectedAcc && selectedDappUrl) {
      const accountChange = (acc: string) => {
        const account = acc ? [acc] : []
        sessionService.broadcastEvent('accountsChanged', account)
      }
      handledMethodsTimestamps.current = {}
      accountChange(selectedAcc)
    }
  }, [selectedAcc, selectedDappUrl])

  const handleGrantPermission = async () => {
    grantPermission()
    setTimeout(() => {
      handleWeb3Request({ data: tabSessionData })
    }, 100)
  }

  return (
    <Web3Context.Provider
      value={useMemo(
        () => ({
          approval,
          requests,
          selectedDapp,
          selectedDappUrl,
          setWeb3ViewRef,
          checkHasPermission,
          addPermission,
          setSelectedDapp,
          setApproval,
          handleWeb3Request,
          getApproval,
          resolveApproval,
          rejectApproval,
          resolveMany,
          rejectAllApprovals
        }),
        [
          approval,
          requests,
          selectedDapp,
          selectedDappUrl,
          checkHasPermission,
          addPermission,
          setApproval,
          handleWeb3Request,
          getApproval,
          resolveApproval,
          rejectApproval,
          resolveMany,
          rejectAllApprovals
        ]
      )}
    >
      {children}
      <ApprovalBottomSheets
        approval={approval}
        resolveApproval={resolveApproval}
        rejectApproval={rejectApproval}
        tabSessionData={tabSessionData}
        selectedDapp={selectedDapp}
        checkHasPermission={checkHasPermission}
        grantPermission={handleGrantPermission}
        sheetRefPermission={sheetRefPermission}
        closeBottomSheetPermission={closeBottomSheetPermission}
      />
    </Web3Context.Provider>
  )
}

export { Web3Context, Web3Provider }
