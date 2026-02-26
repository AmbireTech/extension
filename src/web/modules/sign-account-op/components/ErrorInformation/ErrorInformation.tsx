import { Interface } from 'ethers'
import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import AmbireAccount from '@ambire-common/../contracts/compiled/AmbireAccount.json'
import AmbireFactory from '@ambire-common/../contracts/compiled/AmbireFactory.json'
import { DEPLOYLESS_SIMULATION_FROM } from '@ambire-common/consts/deploy'
import { getSpoof } from '@ambire-common/libs/account/account'
import { getSignableCalls } from '@ambire-common/libs/accountOp/accountOp'
import { getErrorCodeStringFromReason } from '@ambire-common/libs/errorDecoder/helpers'
import CopyIcon from '@common/assets/svg/CopyIcon'
import AlertVertical from '@common/components/AlertVertical'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const ErrorInformation = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { state: signAccountOpState } = useController('SignAccountOpController')
  const { state: accountsState } = useController('AccountsController')
  const { accountStates } = accountsState

  const state = useMemo(() => {
    if (!signAccountOpState) return undefined
    return accountStates[signAccountOpState.accountOp.accountAddr]?.[
      signAccountOpState.accountOp.chainId.toString()
    ]
  }, [signAccountOpState, accountStates])

  const estimationUsesStateOverrides = useMemo(() => {
    if (!signAccountOpState || !!signAccountOpState.account.safeCreation || !state) return false

    return state.isEOA && !state.isSmarterEoa && signAccountOpState.accountOp.calls.length > 1
  }, [signAccountOpState, state])

  const tenderlyLink = useMemo(() => {
    if (
      !signAccountOpState ||
      !signAccountOpState.accountOp.calls.length ||
      !state ||
      estimationUsesStateOverrides
    )
      return null

    let params

    if (signAccountOpState.account.creation || state.isSmarterEoa) {
      if (signAccountOpState.account.creation && !state.isDeployed) {
        const ambireFactory = new Interface(AmbireFactory.abi)
        const executeData = ambireFactory.encodeFunctionData('deployAndExecute', [
          signAccountOpState.account.creation.bytecode,
          signAccountOpState.account.creation.salt,
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.account.creation.factoryAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      } else {
        const ambireAccount = new Interface(AmbireAccount.abi)
        const executeData = ambireAccount.encodeFunctionData('execute', [
          getSignableCalls(signAccountOpState.accountOp),
          getSpoof(signAccountOpState.account)
        ])
        params = new URLSearchParams({
          network: signAccountOpState.accountOp.chainId.toString(),
          from: DEPLOYLESS_SIMULATION_FROM,
          contractAddress: signAccountOpState.accountOp.accountAddr,
          rawFunctionInput: executeData,
          value: '0'
        })
      }
    } else {
      // only a single call for EOAs
      const call = signAccountOpState.accountOp.calls[0]!
      params = new URLSearchParams({
        network: signAccountOpState.accountOp.chainId.toString(),
        from: signAccountOpState.accountOp.accountAddr,
        contractAddress: call.to,
        rawFunctionInput: call.data,
        value: call.value.toString()
      })
    }

    const base = 'https://dashboard.tenderly.co/simulator/new'
    return `${base}?${params.toString()}`
  }, [signAccountOpState, estimationUsesStateOverrides, state])

  const copySignAccountOpError = useCallback(async () => {
    let devInfo = tenderlyLink ? `URL: ${tenderlyLink}` : ''

    if (signAccountOpState?.errors?.length) {
      const { code, text, title } = signAccountOpState.errors[0]!
      if (code) {
        devInfo = `${devInfo}\nError code: ${code}`
      } else if (text) {
        devInfo = `${devInfo}\nError text: ${text}`
      } else if (title && devInfo) {
        devInfo = `${devInfo}\nDecoded error: ${title}`
      }
    }

    try {
      await setStringAsync(devInfo)
      addToast(t('Copied to clipboard!'))
    } catch (e) {
      addToast(t('Error copying to clipboard'))
    }
  }, [addToast, signAccountOpState?.errors, t, tenderlyLink])

  const errorText = useMemo(() => {
    const { code, text } = signAccountOpState?.errors?.[0] || {}

    if (!code && !text && !tenderlyLink) return null

    return (
      <View style={[flexbox.alignCenter]}>
        <AlertVertical.Text
          type="warning"
          size="sm"
          style={[styles.alertText, spacings.mbTy, { maxWidth: '100%' }]}
        >
          {code ? getErrorCodeStringFromReason(code || '', false) : text}
        </AlertVertical.Text>
        <Button
          childrenPosition="left"
          type="secondary"
          text={t('Copy developer information')}
          onPress={copySignAccountOpError}
          hasBottomSpacing={false}
          size="small"
        >
          <CopyIcon
            strokeWidth={1.5}
            width={20}
            height={20}
            color={theme.secondaryText}
            style={spacings.mrTy}
          />
        </Button>
      </View>
    )
  }, [
    copySignAccountOpError,
    signAccountOpState?.errors,
    styles.alertText,
    theme.secondaryText,
    t,
    tenderlyLink
  ])

  if (!signAccountOpState) return null

  return (
    <AlertVertical
      type="warning"
      size="sm"
      title={signAccountOpState.errors[0]?.title}
      text={errorText}
    />
  )
}

export default ErrorInformation
