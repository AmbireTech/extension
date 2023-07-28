import { Wallet } from 'ethers'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { Keyboard } from 'react-native'

import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useNavigation from '@common/hooks/useNavigation'
import useStorageController from '@common/hooks/useStorageController'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import useVault from '@common/modules/vault/hooks/useVault'
import { fetchCaught } from '@common/services/fetch'

type FormProps = {
  email?: string
  password?: string
}

type EmailLoginContextData = {
  handleLogin: ({ email, password }: FormProps) => Promise<void>
  cancelLoginAttempts: () => void
  requiresEmailConfFor: FormProps | null
  requiresPassword: boolean
  inProgress: boolean
  pendingLoginAccount: any
}

const EmailLoginContext = createContext<EmailLoginContextData>({
  handleLogin: () => Promise.resolve(),
  cancelLoginAttempts: () => {},
  requiresEmailConfFor: null,
  requiresPassword: false,
  inProgress: false,
  pendingLoginAccount: null
})

const EMAIL_VERIFICATION_RECHECK = 3000

const EmailLoginProvider: React.FC<any> = ({ children }: any) => {
  const { addToast } = useToast()
  const { getItem, setItem, removeItem } = useStorageController()
  const { onAddAccount } = useAccounts()
  const { navigate } = useNavigation()
  const { addToVault } = useVault()
  const { t } = useTranslation()

  const pendingLoginEmail = getItem('pendingLoginEmail')
  const pendingLoginAccount = JSON.parse(getItem('pendingLoginAccount') || null)

  const [requiresEmailConfFor, setRequiresConfFor] = useState<FormProps | null>(
    pendingLoginEmail ? { email: pendingLoginEmail } : null
  )

  const [inProgress, setInProgress] = useState<boolean>(false)

  const requiresPassword = useMemo(() => !!pendingLoginAccount, [pendingLoginAccount])

  const handleAddAccount = useCallback(() => {
    if (!pendingLoginAccount) {
      addToast(t('Email not confirmed'), { error: true })
    }

    const { _id: id, salt, identityFactoryAddr, baseIdentityAddr, bytecode } = pendingLoginAccount
    const { quickAccSigner, primaryKeyBackup } = pendingLoginAccount.meta

    onAddAccount(
      {
        id,
        email: pendingLoginAccount.meta.email,
        primaryKeyBackup,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer: quickAccSigner
      },
      { select: true }
    )
  }, [addToast, onAddAccount, pendingLoginAccount, t])

  const attemptLogin = useCallback(
    async ({ email }: FormProps, ignoreEmailConfirmationRequired?: any) => {
      // try by-email first: if this returns data we can just move on to decrypting
      // does not matter which network we request
      const loginSessionKey = getItem('loginSessionKey')
      const { resp, body, errMsg }: any = await fetchCaught(
        `${CONFIG.RELAYER_URL}/identity/by-email/${encodeURIComponent(email as string)}`,
        {
          headers: {
            authorization: loginSessionKey ? `Bearer ${loginSessionKey}` : null
          }
        }
      )
      if (errMsg) {
        addToast(errMsg, { error: true })

        return
      }

      if (resp.status === 401 && body.errType === 'UNAUTHORIZED') {
        if (ignoreEmailConfirmationRequired) {
          // we still have to call this to make sure the state is consistent and to force a re-render (to trigger the effect again)
          setItem('pendingLoginEmail', email)
          setRequiresConfFor({ email })
          return
        }
        const requestAuthResp = await fetch(
          `${CONFIG.RELAYER_URL}/identity/by-email/${encodeURIComponent(
            email as string
          )}/request-confirm-login`,
          { method: 'POST' }
        )
        if (requestAuthResp.status !== 200) {
          addToast(`Email confirmation needed but unable to request: ${requestAuthResp.status}`, {
            error: true
          })
          return
        }
        const sessionKey = (await requestAuthResp.json()).sessionKey
        setItem('loginSessionKey', sessionKey)
        setItem('pendingLoginEmail', email)
        setRequiresConfFor({ email })
        return
      }
      // If we make it beyond this point, it means no email confirmation will be required
      if (resp.status === 404 && body.errType === 'DOES_NOT_EXIST') {
        removeItem('pendingLoginEmail')
        setRequiresConfFor(null)
        addToast('Account does not exist', {
          error: true
        })

        return
      }

      if (resp.status === 200) {
        setItem('pendingLoginAccount', JSON.stringify(body))
        // Delete the key so that it can't be used anymore on this browser
        removeItem('loginSessionKey')
        navigate(ROUTES.ambireAccountLoginPasswordConfirm, { state: { loginType: 'email' } })
      } else {
        addToast(
          body.message
            ? `Relayer error: ${body.message}`
            : `Unknown no-message error: ${resp.status}`,
          { error: true }
        )
      }
      setRequiresConfFor(null)
    },
    [addToast, getItem, removeItem, setItem, navigate]
  )

  const handleLogin = useCallback(
    async ({ email, password }: FormProps) => {
      Keyboard.dismiss()

      if (!email && !pendingLoginAccount) {
        addToast('Email is required', { error: true })
      }

      setInProgress(true)
      if (!pendingLoginAccount) {
        try {
          await attemptLogin({ email })
        } catch (e: any) {
          addToast(`Unexpected error: ${e.message || e}`, { error: true })
        }
      } else if (pendingLoginAccount && email) {
        navigate(ROUTES.ambireAccountLoginPasswordConfirm, {
          state: {
            loginType: 'email'
          }
        })
      } else if (pendingLoginAccount && !password) {
        addToast('Password is required', { error: true })
      } else if (!pendingLoginAccount.meta.primaryKeyBackup) {
        addToast(
          'No key backup found. You need to import this account from JSON or if you opted in for Ambire cloud - please try to log in again later. In case you lost your JSON backup, you can recover your account from the Ambire web wallet.',
          {
            error: true,
            timeout: 30000
          }
        )
      } else {
        try {
          const wallet = await Wallet.fromEncryptedJson(
            JSON.parse(pendingLoginAccount.meta.primaryKeyBackup),
            password as string
          )

          const addr = await wallet.getAddress()

          addToVault({
            // eslint-disable-next-line no-underscore-dangle
            addr,
            item: {
              signer: wallet.privateKey,
              password,
              type: 'quickAcc'
            }
          })
            .then(() => {
              handleAddAccount()
              setRequiresConfFor(null)
              removeItem('pendingLoginEmail')
              removeItem('pendingLoginAccount')
            })
            .catch((e) => {
              addToast(e.message || e, { error: true })
            })
        } catch (error) {
          addToast('Invalid Account Password', { error: true })
        }
      }

      setInProgress(false)
    },
    [
      addToVault,
      addToast,
      attemptLogin,
      handleAddAccount,
      pendingLoginAccount,
      removeItem,
      navigate
    ]
  )

  const cancelLoginAttempts = useCallback(() => {
    setRequiresConfFor(null)
    removeItem('pendingLoginEmail')
    removeItem('pendingLoginAccount')
  }, [removeItem])

  // try logging in once after EMAIL_VERIFICATION_RECHECK
  useEffect(() => {
    if (requiresEmailConfFor && !pendingLoginAccount) {
      const timer = setTimeout(async () => {
        setInProgress(true)
        await attemptLogin(requiresEmailConfFor, true)
        setInProgress(false)
      }, EMAIL_VERIFICATION_RECHECK)
      return () => clearTimeout(timer)
    }
  })

  return (
    <EmailLoginContext.Provider
      value={useMemo(
        () => ({
          handleLogin,
          cancelLoginAttempts,
          requiresEmailConfFor,
          requiresPassword,
          inProgress,
          pendingLoginAccount
        }),
        [
          handleLogin,
          cancelLoginAttempts,
          requiresEmailConfFor,
          requiresPassword,
          inProgress,
          pendingLoginAccount
        ]
      )}
    >
      {children}
    </EmailLoginContext.Provider>
  )
}

export { EmailLoginContext, EmailLoginProvider }
