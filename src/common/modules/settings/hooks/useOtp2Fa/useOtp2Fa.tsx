import { ethers } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import CONFIG from '@common/config/env'
import useToast from '@common/hooks/useToast'
import { fetchPost } from '@common/services/fetch'
import { authenticator } from '@otplib/preset-default'

const useOtp2Fa = ({ email, accountId }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  const [otpAuth, setOtpAuth] = useState('')
  const [secret, setSecret] = useState('')
  const [hexSecret, setHexSecret] = useState('')

  const isValidToken = (token: string) => authenticator.verify({ token, secret })

  const sendEmail = async () => {
    const nextSecret = authenticator.generateSecret(20)
    const nextHexSecret = ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(JSON.stringify({ otp: secret, timestamp: new Date().getTime() }))
    )

    if (!CONFIG.RELAYER_URL) {
      addToast(t('Email/pass accounts not supported without a relayer connection'), { error: true })
      return
    }

    setIsSendingEmail(true)
    try {
      const { success, confCodeRequired } = await fetchPost(
        // network doesn't matter when signing
        `${CONFIG.RELAYER_URL}/second-key/${accountId}/ethereum/sign`,
        {
          toSign: nextHexSecret
        }
      )

      if (!success || confCodeRequired !== 'email') {
        addToast(
          t('Unexpected error. This should never happen, please report this on help.ambire.com'),
          { error: true }
        )

        setIsSendingEmail(false)
        return false
      }

      addToast(t('A confirmation code was sent to your email, please enter it along...'))

      setSecret(nextSecret)
      setHexSecret(nextHexSecret)
      setOtpAuth(authenticator.keyuri(email, 'Ambire Wallet', secret))

      setIsSendingEmail(false)
      return true
    } catch {
      addToast(t('The request for sending an email failed. Please try again later.'), {
        error: true
      })

      setIsSendingEmail(false)
      return false
    }
  }

  return {
    sendEmail,
    isValidToken,
    isSendingEmail,
    otpAuth,
    secret
  }
}

export default useOtp2Fa
