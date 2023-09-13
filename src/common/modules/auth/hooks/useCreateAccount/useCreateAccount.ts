import accountPresets from 'ambire-common/src/constants/accountPresets'
import { generateAddress2 } from 'ethereumjs-util'
import { Wallet } from 'ethers'
import { AbiCoder, getAddress, id, keccak256 } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'
import performance from 'react-native-performance'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useToast from '@common/hooks/useToast'
import { getProxyDeployBytecode } from '@common/modules/auth/services/IdentityProxyDeploy'
import useVault from '@common/modules/vault/hooks/useVault'
import { fetchGet, fetchPost } from '@common/services/fetch'
import useReferral from '@mobile/modules/referral/hooks/useReferral'

type Props = {
  inProgress: string | boolean
  addAccErr: string
  err: string
  resendTimeLeft: any
  isEmailConfirmed: boolean
  requiresEmailConfFor: boolean
  handleAddNewAccount: (req: FormProps) => Promise<void>
  wrapErr: (fn: () => any) => Promise<void>
  wrapProgress: (fn: () => any, type?: boolean | string) => Promise<void>
  sendConfirmationEmail: () => Promise<void>
}

type FormProps = {
  email: string
  password: string
  backup: boolean
}
const TIMER_REFRESH_TIME = 1000
const EMAIL_REFRESH_TIME = 5000
const RESEND_EMAIL_TIMER_INITIAL = 60000

export default function useCreateAccount(): Props {
  const [err, setErr] = useState<string>('')
  const [addAccErr, setAddAccErr] = useState<string>('')
  const [inProgress, setInProgress] = useState<boolean | string>(false)

  const [isCreateRespCompleted, setIsCreateRespCompleted] = useState<any>(null)
  const [requiresEmailConfFor, setRequiresConfFor] = useState<boolean>(false)
  const [resendTimeLeft, setResendTimeLeft] = useState<any>(null)
  const [isEmailConfirmed, setEmailConfirmed] = useState<boolean>(false)

  const { getPendingReferral, removePendingReferral } = useReferral()

  const { onAddAccount } = useAccounts()
  const { addToast } = useToast()
  const { addToVault } = useVault()

  const wrapProgress = async (fn: () => any, type: boolean | string = true) => {
    setInProgress(type)
    try {
      await fn()
    } catch (e: any) {
      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
    setInProgress(false)
  }

  const wrapErr = async (fn: () => any) => {
    setAddAccErr('')
    try {
      await fn()
    } catch (e: any) {
      setInProgress(false)
      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
  }

  const createQuickAcc = async (req: FormProps) => {
    setErr('')

    // async hack to let React run a tick so it can re-render before the blocking Wallet.createRandom()
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, 0))

    const extraEntropy = id(
      `${req.email}:${Date.now()}:${Math.random()}:${
        typeof performance === 'object' && performance.now()
      }`
    )
    const firstKeyWallet = Wallet.createRandom({ extraEntropy })
    // 6 words is 2048**6
    const secondKeySecret = `${Wallet.createRandom({ extraEntropy })
      .mnemonic.phrase.split(' ')
      .slice(0, 6)
      .join(' ')} ${req.email}`

    const secondKeyResp = await fetchPost(`${CONFIG.RELAYER_URL}/second-key`, { secondKeySecret })
    if (!secondKeyResp.address)
      throw new Error(
        `second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`
      )

    const { salt, baseIdentityAddr, identityFactoryAddr, quickAccManager, quickAccTimelock } =
      accountPresets
    const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
    const signer = {
      quickAccManager,
      timelock: quickAccountTuple[0],
      one: quickAccountTuple[1],
      two: quickAccountTuple[2]
    }
    const abiCoder = new AbiCoder()
    const accHash = keccak256(
      abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple])
    )
    const privileges = [[quickAccManager, accHash]]
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress(
      `0x${generateAddress2(
        // Converting to buffer is required in ethereumjs-util version: 7.1.3
        // Version 6 allows Buffer or string types but installed in RN proj brakes with: Can't find variable: Buffer
        Buffer.from(identityFactoryAddr.slice(2), 'hex'),
        Buffer.from(salt.slice(2), 'hex'),
        Buffer.from(bytecode.slice(2), 'hex')
      ).toString('hex')}`
    )
    const primaryKeyBackup = JSON.stringify(
      await firstKeyWallet.encrypt(req.password, accountPresets.encryptionOpts)
    )

    const referral = getPendingReferral()

    const createResp = await fetchPost(`${CONFIG.RELAYER_URL}/identity/${identityAddr}`, {
      email: req.email,
      primaryKeyBackup: req.backup ? primaryKeyBackup : undefined,
      secondKeySecret,
      salt,
      identityFactoryAddr,
      baseIdentityAddr,
      privileges,
      quickAccSigner: signer,
      registeredFrom: Platform.OS,
      ...(!!referral && { referralAddr: referral.hexAddress })
    })
    if (createResp.message === 'EMAIL_ALREADY_USED') {
      setErr('An account with this email already exists')
      return
    }
    if (!createResp.success) {
      setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
      return
    }

    removePendingReferral()

    setIsCreateRespCompleted([
      {
        id: identityAddr,
        email: req.email,
        primaryKeyBackup,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer,
        emailConfRequired: true
      },
      { select: true, isNew: true },
      firstKeyWallet,
      req.password
    ])

    setRequiresConfFor(true)
    setResendTimeLeft(RESEND_EMAIL_TIMER_INITIAL)
  }

  const checkEmailConfirmation = async () => {
    if (!isCreateRespCompleted) return
    const relayerIdentityURL = `${CONFIG.RELAYER_URL}/identity/${isCreateRespCompleted[0].id}`
    try {
      const identity = await fetchGet(relayerIdentityURL)
      if (identity) {
        const { emailConfirmed } = identity.meta
        const isConfirmed = !!emailConfirmed
        setEmailConfirmed(isConfirmed)
        if (isConfirmed) {
          setRequiresConfFor(!isConfirmed)
          const firstKey = isCreateRespCompleted[2]
          const pass = isCreateRespCompleted[3]
          const addr = await firstKey.getAddress()
          addToVault({
            addr,
            item: {
              signer: firstKey.privateKey,
              password: pass,
              type: 'quickAcc'
            }
          })
            .then(() => {
              onAddAccount(
                {
                  ...isCreateRespCompleted[0],
                  emailConfRequired: false
                },
                isCreateRespCompleted[1]
              )
            })
            .catch((e) => {
              addToast(e.message || e, { error: true })
            })
        }
      }
    } catch (e) {
      console.error(e)
      addToast('Could not check email confirmation.', { error: true })
    }
  }

  useEffect(() => {
    if (requiresEmailConfFor) {
      const interval = setInterval(async () => {
        checkEmailConfirmation()
      }, EMAIL_REFRESH_TIME)
      return () => clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiresEmailConfFor])

  const sendConfirmationEmail = useCallback(async () => {
    try {
      const response = await fetchGet(
        `${CONFIG.RELAYER_URL}/identity/${
          isCreateRespCompleted.length > 0 && isCreateRespCompleted[0].id
        }/resend-verification-email`
      )
      if (!response.success) throw new Error('Relayer did not return success.')

      addToast('Verification email sent!')
      setResendTimeLeft(RESEND_EMAIL_TIMER_INITIAL)
    } catch (e) {
      console.error(e)
      addToast('Could not resend verification email.', { error: true })
    }
  }, [addToast, isCreateRespCompleted])

  useEffect(() => {
    if (resendTimeLeft) {
      const resendInterval = setInterval(
        () => setResendTimeLeft((prev: any) => (prev > 0 ? prev - TIMER_REFRESH_TIME : 0)),
        TIMER_REFRESH_TIME
      )
      return () => clearInterval(resendInterval)
    }
  })

  const handleAddNewAccount = async (req: FormProps) => {
    Keyboard.dismiss()
    await wrapProgress(() => createQuickAcc(req), 'email')
  }

  return {
    inProgress,
    addAccErr,
    err,
    isEmailConfirmed,
    requiresEmailConfFor,
    resendTimeLeft,
    handleAddNewAccount,
    wrapErr,
    wrapProgress,
    sendConfirmationEmail
  }
}
