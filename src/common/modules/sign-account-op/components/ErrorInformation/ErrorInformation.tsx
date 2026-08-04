import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { getErrorCodeStringFromReason } from '@ambire-common/libs/errorDecoder/helpers'
import CopyIcon from '@common/assets/svg/CopyIcon'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import AlertVertical from '@common/components/AlertVertical'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { getTenderlySimulationLink } from '@common/modules/sign-account-op/helpers/tenderlySimulation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const ErrorInformation = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { state: signAccountOpState, dispatch: signAccountOpDispatch } =
    useController('SignAccountOpController')
  const { state: accountsState } = useController('AccountsController')
  const { accountStates } = accountsState

  const state = useMemo(() => {
    if (!signAccountOpState) return undefined
    return accountStates[signAccountOpState.accountOp.accountAddr]?.[
      signAccountOpState.accountOp.chainId.toString()
    ]
  }, [signAccountOpState, accountStates])

  const tenderlyLink = useMemo(() => {
    return getTenderlySimulationLink({
      signAccountOpState,
      state
    })
  }, [signAccountOpState, state])

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
    } catch {
      addToast(t('Error copying to clipboard'))
    }
  }, [addToast, signAccountOpState, t, tenderlyLink])

  const refetchAccountState = useCallback(() => {
    if (!signAccountOpState) return

    signAccountOpDispatch({
      type: 'method',
      params: {
        method: 'refetchAccountState',
        args: []
      }
    })
  }, [signAccountOpDispatch, signAccountOpState])

  const errorText = useMemo(() => {
    const { action, code, text } = signAccountOpState?.errors?.[0] || {}
    const hasDeveloperInformation = !!code || !!text || !!tenderlyLink
    const canRefetchAccountState = action === 'refetch-account-state'

    if (!hasDeveloperInformation && !canRefetchAccountState) return null

    return (
      <View style={[flexbox.alignCenter]}>
        {hasDeveloperInformation && !canRefetchAccountState && (
          <>
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
          </>
        )}
        {canRefetchAccountState && (
          <ButtonWithLoader
            childrenPosition="left"
            type="secondary"
            text={t('Refresh state')}
            onPress={refetchAccountState}
            isLoading={signAccountOpState?.isRefetchingAccountState}
            disabled={signAccountOpState?.isRefetchingAccountState}
            size="small"
            style={[spacings.prSm, hasDeveloperInformation ? spacings.mtTy : undefined]}
            childrenContainerStyle={{ width: 32, ...flexbox.alignCenter }}
            icon={<RefreshIcon width={18} height={18} />}
          />
        )}
      </View>
    )
  }, [
    copySignAccountOpError,
    refetchAccountState,
    signAccountOpState,
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
      style={spacings.mbLg}
    />
  )
}

export default ErrorInformation
