/* eslint-disable jsx-a11y/anchor-is-valid */
import { Interface } from 'ethers'
/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import DeployHelper from '@ambire-common/../contracts/compiled/DeployHelper.json'
import { AMBIRE_ACCOUNT_FACTORY, SINGLETON } from '@ambire-common/consts/deploy'
import { NetworkDescriptor, NetworkFeature } from '@ambire-common/interfaces/networkDescriptor'
import { SignUserRequest } from '@ambire-common/interfaces/userRequest'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { getRpcProvider } from '@ambire-common/services/provider'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorFilledIcon from '@common/assets/svg/ErrorFilledIcon'
import InformationIcon from '@common/assets/svg/InformationIcon'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

import getStyles from './styles'

type Props = {
  networkId?: NetworkDescriptor['id']
  features: NetworkFeature[] | undefined
  withRetryButton?: boolean
  handleRetry?: () => void
}

const NetworkAvailableFeatures = ({ networkId, features, withRetryButton, handleRetry }: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { pathname } = useRoute()
  const { selectedAccount, accounts } = useMainControllerState()
  const { networks, providers } = useSettingsControllerState()
  const { dispatch } = useBackgroundService()
  const { addToast } = useToast()
  const [checkedDeploy, setCheckedDeploy] = useState<boolean>(false)

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.id === networkId),
    [networks, networkId]
  )

  useEffect(() => {
    if (!selectedNetwork || selectedNetwork.areContractsDeployed || checkedDeploy) return

    setCheckedDeploy(true)
    const provider = getRpcProvider(selectedNetwork.rpcUrls, selectedNetwork.chainId)
    provider
      .getCode(AMBIRE_ACCOUNT_FACTORY)
      .then((factoryCode: string) => {
        if (factoryCode !== '0x') {
          dispatch({
            type: 'MAIN_CONTROLLER_UPDATE_NETWORK_PREFERENCES',
            params: {
              networkPreferences: {
                areContractsDeployed: true
              },
              networkId: selectedNetwork.id
            }
          })
        }
        provider.destroy()
      })
      .catch(() => {
        provider.destroy()
      })

    return () => {
      provider.destroy()
    }
  }, [dispatch, selectedNetwork, providers, checkedDeploy])

  const handleDeploy = useCallback(async () => {
    if (!selectedNetwork) return // this should not happen...

    const account = accounts.filter((acc) => acc.addr === selectedAccount)[0]
    // we need a basic account
    if (isSmartAccount(account) || !account) {
      addToast(
        'Deploy cannot be made with a smart account. Please select a basic account and try again',
        { type: 'error' }
      )
      return
    }

    const bytecode = DeployHelper.bin
    const salt = '0x0000000000000000000000000000000000000000000000000000000000000000'
    const singletonABI = [
      {
        inputs: [
          { internalType: 'bytes', name: '_initCode', type: 'bytes' },
          { internalType: 'bytes32', name: '_salt', type: 'bytes32' }
        ],
        name: 'deploy',
        outputs: [{ internalType: 'address payable', name: 'createdContract', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ]
    const singletonInterface = new Interface(singletonABI)
    const txn = {
      kind: 'call' as const,
      txns: [
        {
          to: SINGLETON,
          value: 0n,
          data: singletonInterface.encodeFunctionData('deploy', [bytecode, salt])
        }
      ]
    }

    const userRequest: SignUserRequest = {
      id: new Date().getTime(),
      meta: {
        isSignAction: true,
        networkId: selectedNetwork.id,
        accountAddr: selectedAccount as string
      },
      action: txn
    }

    dispatch({ type: 'MAIN_CONTROLLER_ADD_USER_REQUEST', params: userRequest })
  }, [accounts, addToast, dispatch, selectedAccount, selectedNetwork])

  const shouldRenderRetryButton = useMemo(
    () => !!features && !!features.find((f) => f.id === 'flagged') && withRetryButton,
    [features, withRetryButton]
  )

  return (
    <View style={styles.container}>
      <Text fontSize={18} weight="medium" style={spacings.mbMd}>
        {t('Available features')}
      </Text>
      <View>
        {!!features &&
          features.map((feature, i) => {
            return (
              <View
                key={feature.id}
                style={[flexbox.directionRow, i !== features.length - 1 && spacings.mb]}
              >
                <View style={[spacings.mrTy, feature.level !== 'initial' && { marginTop: 3 }]}>
                  {feature.level === 'initial' && (
                    <Text fontSize={14} weight="semiBold" appearance="secondaryText">
                      ?
                    </Text>
                  )}
                  {feature.level === 'loading' && <Spinner style={{ width: 14, height: 14 }} />}
                  {feature.level === 'success' && <CheckIcon width={14} height={14} />}
                  {feature.level === 'warning' && <WarningFilledIcon width={14} height={14} />}
                  {feature.level === 'danger' && <ErrorFilledIcon width={14} height={14} />}
                </View>
                <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
                  <Text
                    fontSize={14}
                    weight="medium"
                    appearance="secondaryText"
                    style={{ ...spacings.mrTy, overflow: 'visible' }}
                    numberOfLines={2}
                  >
                    {feature.title}
                    {pathname?.includes(ROUTES.networksSettings) &&
                      !!selectedNetwork &&
                      feature.id === 'saSupport' &&
                      feature.level === 'warning' && (
                        <>
                          {'  '}
                          <Text
                            weight="medium"
                            underline
                            fontSize={14}
                            color={theme.primary}
                            onPress={handleDeploy}
                          >
                            {t('Deploy Contracts')}
                          </Text>
                        </>
                      )}
                    {!!feature.msg && (
                      <View style={{ width: 1 }}>
                        <View style={{ position: 'absolute', top: -11.5, left: 6 }}>
                          <InformationIcon
                            width={14}
                            height={14}
                            dataSet={{
                              tooltipId: 'feature-message-tooltip',
                              tooltipContent: feature.msg
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </Text>
                </View>
              </View>
            )
          })}
        {!!shouldRenderRetryButton && (
          <View style={[spacings.pvMd, spacings.phLg, flexbox.alignCenter]}>
            <Text style={[text.center, spacings.mbSm]} fontSize={14}>
              {t(
                "You can retry retrieving the network's available features\nusing a different RPC URL."
              )}
            </Text>
            <Button
              size="small"
              text={t('Retry')}
              style={{ maxHeight: 32 }}
              onPress={() => {
                !!handleRetry && handleRetry()
              }}
            />
          </View>
        )}
        <Tooltip id="feature-message-tooltip" />
      </View>
    </View>
  )
}

export default React.memo(NetworkAvailableFeatures)
