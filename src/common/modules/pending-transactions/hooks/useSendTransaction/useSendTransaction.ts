import erc20Abi from 'adex-protocol-eth/abi/ERC20.json'
import { Bundle } from 'adex-protocol-eth/js'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { getFeesData, isTokenEligible, toHexAmount } from 'ambire-common/src/helpers/sendTxnHelpers'
import { getProvider } from 'ambire-common/src/services/provider'
import { toBundleTxn } from 'ambire-common/src/services/requestToBundleTxn'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import CONFIG from '@common/config/env'
import i18n from '@common/config/localization/localization'
import useAccounts from '@common/hooks/useAccounts'
import useGasTank from '@common/hooks/useGasTank'
import useNetwork from '@common/hooks/useNetwork'
import useRequests from '@common/hooks/useRequests'
import useToast from '@common/hooks/useToast'
import useVault from '@common/modules/vault/hooks/useVault'
import { SIGNER_TYPES } from '@common/modules/vault/services/VaultController/types'
import { fetchPost } from '@common/services/fetch'
import { getWallet } from '@common/services/getWallet/getWallet'
import { sendNoRelayer } from '@common/services/sendNoRelayer'
import isInt from '@common/utils/isInt'
import { errorCodes, errorValues } from '@web/constants/errors'

type Props = {
  hardwareWalletOpenBottomSheet: () => void
}

const relayerURL = CONFIG.RELAYER_URL
const DEFAULT_SPEED = 'fast'
const REESTIMATE_INTERVAL = 15000

const ERC20 = new Interface(erc20Abi)

const WALLET_TOKEN_SYMBOLS: string[] = [
  // Temporarily disable prioritization of $WALLET tokens as of v3.11.11
  // 'xWALLET', 'WALLET'
]

const getDefaultFeeToken = (
  remainingFeeTokenBalances: any,
  network: any,
  feeSpeed: any,
  estimation: any,
  currentAccGasTankState: any
) => {
  if (!remainingFeeTokenBalances?.length) {
    return {
      symbol: network.nativeAssetSymbol,
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000'
    }
  }

  return (
    remainingFeeTokenBalances
      .sort(
        (a, b) =>
          WALLET_TOKEN_SYMBOLS.indexOf(b?.symbol) - WALLET_TOKEN_SYMBOLS.indexOf(a?.symbol) ||
          (b?.discount || 0) - (a?.discount || 0) ||
          a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
      )
      // move gas tank tokens to the top
      .sort((a: any, b: any) => {
        // skip sorting if the same
        if (a.isGasTankToken === b.isGasTankToken) return 0

        return a.isGasTankToken ? -1 : 1
      })
      .find((token: any) =>
        isTokenEligible(token, feeSpeed, estimation, !!token.isGasTankToken, network)
      ) || remainingFeeTokenBalances[0]
  )
}

function makeBundle(account: any, networkId: any, requests: any) {
  const bundle = new Bundle({
    network: networkId,
    identity: account.id,
    // checking txn isArray because sometimes we receive txn in array from walletconnect. Also we use Array.isArray because txn object can have prop 0
    txns: requests.map(({ txn }: any) =>
      toBundleTxn(Array.isArray(txn) ? txn[0] : txn, account.id)
    ),
    signer: account.signer
  })
  bundle.extraGas = requests.map((x: any) => x.extraGas || 0).reduce((a: any, b: any) => a + b, 0)
  bundle.requestIds = requests.map((x: any) => x.id)

  // Attach bundle's meta
  if (requests.some((item: any) => item.meta)) {
    bundle.meta = {}

    if (requests.some((item: any) => item.meta?.addressLabel)) {
      bundle.meta.addressLabel = requests.map((x: any) =>
        x.meta?.addressLabel ? x.meta.addressLabel : { addressLabel: '', address: '' }
      )
    }

    const xWalletReq = requests.find((x: any) => x.meta?.xWallet)
    if (xWalletReq) {
      bundle.meta.xWallet = xWalletReq.meta.xWallet
    }
  }

  return bundle
}

function getErrorMessage(e: any) {
  if (e && e.message === 'NOT_TIME') {
    return i18n.t(
      "Your 72 hour recovery waiting period still hasn't ended. You will be able to use your account after this lock period."
    )
  }
  if (e && e.message === 'WRONG_ACC_OR_NO_PRIV') {
    return i18n.t('Unable to sign with this email/password account. Please contact support.')
  }
  if (e && e.message === 'INVALID_SIGNATURE') {
    return i18n.t(
      'Invalid signature. This may happen if you used password/derivation path on your hardware wallet.'
    )
  }
  if (e && e.message === 'INSUFFICIENT_PRIVILEGE') {
    return 'Wrong signature. This may happen if you used password/derivation path on your hardware wallet.'
  }
  return (e && e?.message) || e
}

const useSendTransaction = ({ hardwareWalletOpenBottomSheet }: Props) => {
  const [estimation, setEstimation] = useState<any>(null)
  const [signingStatus, setSigningStatus] = useState<any>(false)
  const [feeSpeed, setFeeSpeed] = useState<any>(DEFAULT_SPEED)

  const { addToast } = useToast()
  const { network }: any = useNetwork()
  const { account } = useAccounts()
  const { currentAccGasTankState } = useGasTank()
  const {
    onBroadcastedTxn,
    setSendTxnState,
    resolveMany,
    sendTxnState,
    eligibleRequests,
    requestPendingState
  } = useRequests()
  const { signTxnQuckAcc, signTxnExternalSigner, getSignerType } = useVault()

  const [replaceTx, setReplaceTx] = useState(!!sendTxnState.replaceByDefault)

  const bundle = useMemo(
    () => sendTxnState.replacementBundle || makeBundle(account, network?.id, eligibleRequests),
    [sendTxnState?.replacementBundle, network?.id, account, eligibleRequests]
  )

  // Safety check: make sure our input parameters make sense
  if (
    isInt(sendTxnState.mustReplaceNonce) &&
    !(sendTxnState.replaceByDefault || isInt(bundle.nonce))
  ) {
    console.error(
      'ERROR: SendTransactionWithBundle: mustReplaceNonce is set but we are not using replacementBundle or replaceByDefault'
    )
    console.error(
      'ERROR: SendTransactionWithBundle: This is a huge logical error as mustReplaceNonce is intended to be used only when we want to replace a txn'
    )
  }

  // Keep track of unmounted: we need this to not try to modify state after async actions if the component is unmounted
  const isMounted = useRef(false)
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  })

  // Reset the estimation when there are no txns in the bundle
  useEffect(() => {
    if (!bundle?.txns?.length) return
    setEstimation(null)
  }, [bundle, setEstimation])

  // Estimate the bundle & reestimate periodically
  const currentBundle = useRef(null)
  currentBundle.current = bundle

  useEffect(() => {
    // We don't need to reestimate the fee when a signing process is in progress
    if (signingStatus) return
    // nor when there are no txns in the bundle, if this is even possible
    if (!bundle.txns.length) return

    // track whether the effect has been unmounted
    let unmounted = false

    // Note: currently, there's no point of getting the nonce if the bundle already has a nonce
    // We may want to change this if we make a check if the currently replaced txn was already mined
    const reestimate = () =>
      (relayerURL
        ? bundle.estimate({
            relayerURL,
            fetch,
            replacing: !!bundle.minFeeInUSDPerGas,
            getNextNonce: true,
            gasTank: currentAccGasTankState.isEnabled
          })
        : bundle.estimateNoRelayer({ provider: getProvider(network.id) })
      )
        // eslint-disable-next-line @typescript-eslint/no-shadow
        .then((estimation: any) => {
          if (unmounted || bundle !== currentBundle.current) return
          estimation.relayerless = !relayerURL
          const gasTankTokens = estimation.gasTank?.map((item) => {
            return {
              ...item,
              isGasTankToken: true,
              symbol: `${item.symbol.toUpperCase()} on Gas Tank`,
              balance: ethers.utils
                .parseUnits(item.balance.toFixed(item.decimals).toString(), item.decimals)
                .toString(),
              nativeRate:
                item.address === '0x0000000000000000000000000000000000000000'
                  ? null
                  : estimation.nativeAssetPriceInUSD / item.price
            }
          })
          if (currentAccGasTankState.isEnabled) {
            // Combine the fee tokens and gas tank tokens, since in v3.11.0
            // both should be visible in the fee selector.
            const nextCombinedRemainingFeeTokenBalances = [
              ...(estimation.remainingFeeTokenBalances || []),
              ...(gasTankTokens || [])
            ]

            // In case there are no eligible tokens fallback to `gasTankTokens`,
            // which also covers the case when a transaction is meant to fail
            // (the `remainingFeeTokenBalances` being empty array breaks the logic)
            estimation.remainingFeeTokenBalances = nextCombinedRemainingFeeTokenBalances.length
              ? nextCombinedRemainingFeeTokenBalances
              : gasTankTokens
          }
          estimation.selectedFeeToken = getDefaultFeeToken(
            estimation.remainingFeeTokenBalances,
            network,
            feeSpeed,
            estimation,
            currentAccGasTankState.isEnabled
          )
          setEstimation((prevEstimation) => {
            if (prevEstimation && prevEstimation.customFee) return prevEstimation
            if (estimation.remainingFeeTokenBalances) {
              // If there's no eligible token, set it to the first one cause it looks more user friendly (it's the preferred one, usually a stablecoin)
              estimation.selectedFeeToken =
                (prevEstimation &&
                  isTokenEligible(
                    prevEstimation.selectedFeeToken,
                    feeSpeed,
                    estimation,
                    !!prevEstimation.selectedFeeToken?.isGasTankToken,
                    network
                  ) &&
                  prevEstimation.selectedFeeToken) ||
                getDefaultFeeToken(
                  estimation.remainingFeeTokenBalances,
                  network,
                  feeSpeed,
                  estimation,
                  currentAccGasTankState.isEnabled
                )
            }
            return estimation
          })
        })
        .catch((e: any) => {
          if (unmounted) return
          console.error('estimation error', e)
          addToast(`Estimation error: ${e.message || e}`, { error: true })
        })

    reestimate()
    const intvl = setInterval(reestimate, REESTIMATE_INTERVAL)

    return () => {
      unmounted = true
      clearInterval(intvl)
    }
  }, [
    bundle,
    setEstimation,
    feeSpeed,
    addToast,
    network,
    signingStatus,
    currentAccGasTankState.isEnabled
  ])

  // keep values such as replaceByDefault and mustReplaceNonce; those will be reset on any setSendTxnState/showSendTxns
  // we DONT want to keep replacementBundle - closing the dialog means you've essentially dismissed it
  // also, if you used to be on a replacementBundle, we DON'T want to keep those props
  const onDismissSendTxns = () =>
    // @ts-ignore
    setSendTxnState((prev: any) =>
      prev.replacementBundle
        ? { showing: false }
        : {
            showing: false,
            replaceByDefault: prev.replaceByDefault,
            mustReplaceNonce: prev.mustReplaceNonce
          }
    )

  // The final bundle is used when signing + sending it
  // the bundle before that is used for estimating
  const getFinalBundle = useCallback(() => {
    if (!relayerURL) {
      return new Bundle({
        ...bundle,
        gasLimit: estimation.gasLimit
      })
    }

    const feeToken = estimation.selectedFeeToken

    const {
      feeInNative,
      // feeInUSD, // don't need fee in USD for stables as it will work with feeInFeeToken
      // Also it can be stable but not in USD
      feeInFeeToken,
      addedGas
    } = getFeesData(feeToken, estimation, feeSpeed, !!feeToken.isGasTankToken, network)
    const feeTxn =
      feeToken.symbol === network.nativeAssetSymbol
        ? // TODO: check native decimals
          [accountPresets.feeCollector, toHexAmount(feeInNative, 18), '0x']
        : [
            feeToken.address,
            '0x0',
            ERC20.encodeFunctionData('transfer', [
              accountPresets.feeCollector,
              toHexAmount(feeInFeeToken, feeToken.decimals)
            ])
          ]

    const nextFreeNonce = estimation.nextNonce?.nonce
    const nextNonMinedNonce = estimation.nextNonce?.nextNonMinedNonce

    // If we've passed in a bundle, use it's nonce (when using a replacementBundle); else, depending on whether we want to replace the current pending bundle,
    // either use the next non-mined nonce or the next free nonce
    // eslint-disable-next-line no-nested-ternary
    const nonce = isInt(bundle.nonce) ? bundle.nonce : replaceTx ? nextNonMinedNonce : nextFreeNonce
    if (feeToken.isGasTankToken) {
      let gasLimit
      if (bundle.txns.length > 1) gasLimit = estimation.gasLimit + (bundle.extraGas || 0)
      else gasLimit = estimation.gasLimit

      let value
      if (feeToken.address === '0x0000000000000000000000000000000000000000') value = feeInNative
      else {
        const fToken = estimation.remainingFeeTokenBalances.find((i) => i.id === feeToken.id)
        value = fToken && estimation.feeInNative[feeSpeed] * fToken.nativeRate
      }

      return new Bundle({
        ...bundle,
        gasTankFee: {
          assetId: feeToken.id,
          value: ethers.utils
            .parseUnits(value.toFixed(feeToken.decimals), feeToken.decimals)
            .toString()
        },
        txns: [...bundle.txns],
        gasLimit,
        nonce
      })
    }

    return new Bundle({
      ...bundle,
      txns: [...bundle.txns, feeTxn],
      gasTankFee: null,
      gasLimit: estimation.gasLimit + addedGas + (bundle.extraGas || 0),
      nonce
    })
  }, [bundle, estimation, feeSpeed, network, currentAccGasTankState.isEnabled, replaceTx])

  const approveTxnImplExternalSigner = async () => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    // a bit redundant cause we already called it at the beginning of approveTxn, but
    // we need to freeze finalBundle in the UI in case signing takes a long time (currently only to freeze the fee selector)
    setSigningStatus({ inProgress: true, finalBundle })

    const res = await signTxnExternalSigner({
      finalBundle,
      feeSpeed,
      estimation,
      account,
      network
    })

    return res
  }

  const approveTxnImplHW = async ({ device }: { device: any }) => {
    if (!estimation) throw new Error('no estimation: should never happen')

    const finalBundle = getFinalBundle()
    const provider = getProvider(network.id)
    const signer = finalBundle.signer

    // a bit redundant cause we already called it at the beginning of approveTxn, but
    // we need to freeze finalBundle in the UI in case signing takes a long time (currently only to freeze the fee selector)
    setSigningStatus({ inProgress: true, finalBundle })

    addToast(i18n.t('Please confirm this transaction on your Ledger device.') as string, {
      timeout: 5000
    })

    const wallet = getWallet(
      {
        signer,
        signerExtra: account.signerExtra,
        chainId: network.chainId
      },
      device
    )

    if (relayerURL) {
      // Temporary way of debugging the fee cost
      // const initialLimit = finalBundle.gasLimit - getFeePaymentConsequences(estimation.selectedFeeToken, estimation).addedGas
      // finalBundle.estimate({ relayerURL, fetch }).then(estimation => console.log('fee costs: ', estimation.gasLimit - initialLimit), estimation.selectedFeeToken).catch(console.error)
      await finalBundle.sign(wallet)
      // eslint-disable-next-line @typescript-eslint/return-await
      return await finalBundle.submit({ relayerURL, fetch })
    }
    // eslint-disable-next-line @typescript-eslint/return-await
    return await sendNoRelayer({
      finalBundle,
      account,
      network,
      wallet,
      estimation,
      feeSpeed,
      provider
    })
  }

  const approveTxnImplQuickAcc = async ({ code }: { code?: string }) => {
    if (!estimation) throw new Error('no estimation: should never happen')
    if (!relayerURL)
      throw new Error('Email/Password account signing without the relayer is not supported yet')

    const finalBundle = (signingStatus && signingStatus.finalBundle) || getFinalBundle()
    const signer = finalBundle.signer

    const canSkip2FA = signingStatus && signingStatus.confCodeRequired === 'notRequired'

    const { signature, success, message, confCodeRequired } = await fetchPost(
      `${relayerURL}/second-key/${bundle.identity}/${network.id}/sign`,
      {
        signer,
        txns: finalBundle.txns,
        nonce: finalBundle.nonce,
        gasLimit: finalBundle.gasLimit,
        ...(!canSkip2FA && { code }),
        // This can be a boolean but it can also contain the new signer/primaryKeyBackup, which instructs /second-key to update acc upon successful signature
        recoveryMode: finalBundle.recoveryMode,
        canSkip2FA,
        isGasTankEnabled: currentAccGasTankState.isEnabled && !!relayerURL,
        meta: (!!finalBundle.meta && finalBundle.meta) || null
      }
    )
    if (!success) {
      if (!message) throw new Error('Secondary key: no success but no error message')
      if (message.includes('invalid confirmation code')) {
        addToast(i18n.t('Unable to sign: wrong confirmation code') as string, { error: true })
        return
      }
      throw new Error(`Secondary key error: ${message}`)
    }
    if (confCodeRequired) {
      setSigningStatus({
        quickAcc: true,
        finalBundle,
        confCodeRequired
      })
    } else {
      if (!signature) throw new Error('QuickAcc internal error: there should be a signature')
      if (!account.primaryKeyBackup)
        throw new Error(
          'No key backup found: you need to import the account from JSON or login again.'
        )
      setSigningStatus({
        quickAcc: true,
        inProgress: true,
        confCodeRequired: canSkip2FA ? 'notRequired' : undefined
      })

      const res = await signTxnQuckAcc({
        finalBundle,
        primaryKeyBackup: account.primaryKeyBackup,
        signature
      })

      return res
    }
  }

  const approveTxn = async ({ code, device }: { code?: string; device?: any }) => {
    if (signingStatus && signingStatus.inProgress) return
    setSigningStatus(signingStatus || { inProgress: true })

    const finalBundle = (signingStatus && signingStatus.finalBundle) || getFinalBundle()
    const signer = finalBundle.signer

    let signerType
    try {
      const signerAddr = signer?.quickAccManager ? signer.one : signer.address
      signerType = await getSignerType({ addr: signerAddr })
    } catch (error) {}

    const requestIds = bundle.requestIds
    let approveTxnPromise

    if (signerType === SIGNER_TYPES.quickAcc) {
      try {
        approveTxnPromise = await approveTxnImplQuickAcc({ code })
      } catch (error) {
        addToast(
          i18n.t('Transaction error: {{error}}', {
            error: error?.message || 'Signing failed for unknown reason.'
          }) as string,
          { error: true }
        )
        setSigningStatus(null)
        return
      }
    }

    if (signerType === SIGNER_TYPES.external) {
      try {
        approveTxnPromise = await approveTxnImplExternalSigner()
      } catch (error) {
        addToast(
          i18n.t('Transaction error: {{error}}', {
            error: error?.message || 'Signing failed for unknown reason.'
          }) as string,
          { error: true }
        )
        setSigningStatus(null)
        return
      }
    }

    // TODO: If possible move the signing with HW in the vault
    if (signerType === SIGNER_TYPES.hardware || !signerType) {
      if (!device) {
        !!hardwareWalletOpenBottomSheet && hardwareWalletOpenBottomSheet()
        setSigningStatus(null)
        return
      }

      try {
        approveTxnPromise = await approveTxnImplHW({ device })
      } catch (error) {
        addToast(
          i18n.t('Transaction error: {{error}}', {
            error: error?.message || 'Signing failed for unknown reason.'
          }) as string,
          { error: true }
        )
        setSigningStatus(null)
        return
      }
    }

    try {
      const bundleResult = await approveTxnPromise
      requestPendingState.current = true
      // special case for approveTxnImplQuickAcc
      if (!bundleResult) return

      // do not to call this after onDismiss, cause it might cause state to be changed post-unmount
      if (isMounted.current) setSigningStatus(null)

      // Inform everything that's waiting for the results (eg WalletConnect)
      const skipResolve =
        !bundleResult.success && bundleResult.message && bundleResult.message.match(/underpriced/i)
      if (!skipResolve && requestIds)
        resolveMany(requestIds, {
          success: bundleResult.success,
          result: bundleResult.txId,
          message: bundleResult.message
        })

      if (bundleResult.success) {
        onBroadcastedTxn(bundleResult.txId)
        onDismissSendTxns()
      } else {
        // to force replacementBundle to be null, so it's not filled from previous state change in App.js in useEffect
        // basically close the modal if the txn was already mined
        if (bundleResult.message.includes('was already mined')) {
          onDismissSendTxns()
        }
        addToast(
          i18n.t('Transaction error: {{error}}', {
            error: getErrorMessage(bundleResult)
          }) as string,
          { error: true }
        )
      }
    } catch (e) {
      if (isMounted.current) setSigningStatus(null)
      if (e && e.message.includes('must provide an Ethereum address')) {
        addToast(
          i18n.t(
            "Signing error: not connected with the correct address. Make sure you're connected with {{address}}.",
            { address: bundle.signer.address }
          ) as string,
          { error: true }
        )
      } else if (e && e.message.includes('0x6b0c')) {
        // not sure if that's actually the case with this hellish error, but after unlocking the device it no longer appeared
        // however, it stopped appearing after that even if the device is locked, so I'm not sure it's related...
        addToast(
          i18n.t(
            'Ledger: unknown error (0x6b0c): is your Ledger unlocked and in the Ethereum application?'
          ) as string,
          { error: true }
        )
      } else {
        addToast(i18n.t('Signing error: {{error}}', { error: getErrorMessage(e) }) as string, {
          error: true
        })
      }
    }
  }

  // Not applicable when .requestIds is not defined (replacement bundle)
  const rejectTxn = () => {
    onDismissSendTxns()
    bundle.requestIds &&
      resolveMany(bundle.requestIds, {
        ...errorValues[errorCodes.provider.userRejectedRequest],
        code: errorCodes.provider.userRejectedRequest
      })
  }

  // Only for replacement flow
  const rejectTxnReplace = () => {
    resolveMany(sendTxnState.replacementBundle.replacedRequestIds, {
      ...errorValues[errorCodes.provider.userRejectedRequest],
      code: errorCodes.provider.userRejectedRequest
    })
  }

  // `mustReplaceNonce` is set on speedup/cancel, to prevent the user from broadcasting the txn if the same nonce has been mined
  // eslint-disable-next-line no-nested-ternary
  const canProceed = isInt(sendTxnState.mustReplaceNonce)
    ? isInt(estimation?.nextNonce?.nextNonMinedNonce)
      ? sendTxnState.mustReplaceNonce >= estimation?.nextNonce?.nextNonMinedNonce
      : null // null = waiting to get nonce data from relayer
    : true

  return {
    bundle,
    estimation,
    signingStatus,
    feeSpeed,
    canProceed,
    mustReplaceNonce: sendTxnState.mustReplaceNonce,
    replaceTx,
    rejectTxn,
    setReplaceTx,
    approveTxn,
    setFeeSpeed,
    setEstimation,
    setSigningStatus,
    rejectTxnReplace
  }
}

export default useSendTransaction
