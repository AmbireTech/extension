import { Mnemonic } from 'ethers'
import React, { useCallback, useEffect } from 'react'

import {
  HD_PATH_TEMPLATE_TYPE,
  SMART_ACCOUNT_SIGNER_KEY_DERIVATION_OFFSET
} from '@ambire-common/consts/derivation'
import { Key } from '@ambire-common/interfaces/keystore'
import {
  derivePrivateKeyFromAnotherPrivateKey,
  getPrivateKeyFromSeed,
  isValidPrivateKey
} from '@ambire-common/libs/keyIterator/keyIterator'
import useNavigation from '@common/hooks/useNavigation'
import useStepper from '@common/modules/auth/hooks/useStepper'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useTaskQueue from '@web/modules/hardware-wallet/hooks/useTaskQueue'

import { getDefaultSelectedAccount } from '../../helpers/account'

interface Props {
  keyType: Key['type']
  keyLabel?: string
  privKeyOrSeed?: string
}

const useAccountAdder = ({ keyType, privKeyOrSeed, keyLabel }: Props) => {
  const { navigate } = useNavigation()
  const { updateStepperState } = useStepper()
  const { createTask } = useTaskQueue()
  const { dispatch, dispatchAsync } = useBackgroundService()
  const accountAdderState = useAccountAdderControllerState()
  const mainControllerState = useMainControllerState()
  const keystoreState = useKeystoreControllerState()

  const setPage: any = React.useCallback(
    (page = 1) => {
      createTask(() =>
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SET_PAGE', params: { page } })
      )
    },
    [dispatch, createTask]
  )

  useEffect(() => {
    const step = keyType === 'internal' ? 'legacy' : 'hw'
    updateStepperState(WEB_ROUTES.accountAdder, step)
  }, [keyType, updateStepperState])

  useEffect(() => {
    if (!mainControllerState.isReady) return
    if (accountAdderState.isInitialized) return

    const init = {
      internal: () => {
        if (!privKeyOrSeed) return

        dispatch({
          type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_PRIVATE_KEY_OR_SEED_PHRASE',
          params: { privKeyOrSeed }
        })
      },
      trezor: () => dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_TREZOR' }),
      ledger: async () => {
        // Ensures account adder is initialized with unlocked key iterator
        await createTask(() => dispatchAsync({ type: 'LEDGER_CONTROLLER_UNLOCK' }))

        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LEDGER' })
      },
      lattice: () => dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_INIT_LATTICE' })
    }

    init[keyType]()
  }, [
    accountAdderState.isInitialized,
    createTask,
    dispatch,
    dispatchAsync,
    mainControllerState.isReady,
    privKeyOrSeed,
    keyType
  ])

  useEffect(() => {
    if (!accountAdderState.isInitialized) return

    setPage()
  }, [accountAdderState.isInitialized, setPage])

  useEffect(() => {
    return () => {
      dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_RESET' })
    }
  }, [dispatch])

  useEffect(() => {
    if (accountAdderState.addAccountsStatus === 'SUCCESS') {
      const defaultSelectedAccount = getDefaultSelectedAccount(accountAdderState.readyToAddAccounts)
      if (!defaultSelectedAccount) {
        // TODO: display error toast instead
        // eslint-disable-next-line no-alert
        alert(
          'Failed to select default account. Please try to start the process of selecting accounts again. If the problem persist, please contact support.'
        )
        return
      }

      dispatch({
        type: 'MAIN_CONTROLLER_SELECT_ACCOUNT',
        params: { accountAddr: defaultSelectedAccount.addr }
      })

      if (keyType === 'internal') {
        try {
          if (!privKeyOrSeed) throw new Error('No private key or seed provided.')
          if (!accountAdderState.hdPathTemplate)
            throw new Error(
              'No HD path template provided. Please try to start the process of selecting accounts again. If the problem persist, please contact support.'
            )

          const keysToAddToKeystore = accountAdderState.selectedAccounts.map((acc) => {
            let privateKey = privKeyOrSeed

            // In case it is a seed, the private keys have to be extracted
            if (Mnemonic.isValidMnemonic(privKeyOrSeed)) {
              privateKey = getPrivateKeyFromSeed(
                privKeyOrSeed,
                acc.index,
                // should always be provided, otherwise it would have thrown an error above
                accountAdderState.hdPathTemplate as HD_PATH_TEMPLATE_TYPE
              )
            }

            // Private keys for accounts used as smart account keys should be derived
            const isPrivateKeyThatShouldBeDerived =
              isValidPrivateKey(privKeyOrSeed) &&
              acc.index >= SMART_ACCOUNT_SIGNER_KEY_DERIVATION_OFFSET
            if (isPrivateKeyThatShouldBeDerived) {
              privateKey = derivePrivateKeyFromAnotherPrivateKey(privKeyOrSeed)
            }

            return {
              privateKey,
              label: `${keyLabel} for the account on slot ${acc.slot}`
            }
          })

          dispatch({
            type: 'KEYSTORE_CONTROLLER_ADD_KEYS',
            params: { keys: keysToAddToKeystore }
          })
        } catch (error: any) {
          console.error(error)
          // TODO: display error toast
          // eslint-disable-next-line no-alert
          alert(
            'The selected accounts got imported, but Ambire failed to retrieve their keys. Please log out of these accounts and try to import them again. Until then, these accounts will be view only. If the problem persists, please contact support.'
          )
        }
      } else {
        dispatch({
          type: 'KEYSTORE_CONTROLLER_ADD_KEYS_EXTERNALLY_STORED',
          params: { keyType }
        })
      }
    }
  })

  const completeStep = useCallback(
    (hasAccountsToImport: boolean = true) => {
      navigate(hasAccountsToImport ? WEB_ROUTES.accountPersonalize : '/')
    },
    [navigate]
  )

  useEffect(() => {
    const latestMethodCall = keyType === 'internal' ? 'addKeys' : 'addKeysExternallyStored'
    if (keystoreState.status === 'DONE' && keystoreState.latestMethodCall === latestMethodCall) {
      completeStep()
    }
  }, [completeStep, keystoreState, keyType])

  const onImportReady = useCallback(() => {
    if (accountAdderState.selectedAccounts.length) {
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_ADD_ACCOUNTS',
        params: { accounts: accountAdderState.selectedAccounts }
      })
      return
    }

    completeStep(false)
  }, [accountAdderState.selectedAccounts, dispatch, completeStep])

  return { setPage, onImportReady }
}

export default useAccountAdder
