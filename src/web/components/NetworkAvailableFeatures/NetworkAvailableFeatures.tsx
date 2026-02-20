import { Interface } from 'ethers'
/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextStyle, View } from 'react-native'

import DeployHelper from '@ambire-common/../contracts/compiled/DeployHelper.json'
import { AMBIRE_ACCOUNT_FACTORY, SINGLETON } from '@ambire-common/consts/deploy'
import { NetworkFeature } from '@ambire-common/interfaces/network'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, {
  SPACING,
  SPACING_LG,
  SPACING_MD,
  SPACING_SM,
  SPACING_TY
} from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

type Props = {
  chainId?: bigint
  features: NetworkFeature[] | undefined
  withRetryButton?: boolean
  handleRetryWithDifferentRpcUrl?: () => void
  hideBackgroundAndBorders?: boolean
  titleSize?: number
  responsiveSizeMultiplier?: number
  withScroll?: boolean
  titleStyle?: TextStyle
}

const NetworkAvailableFeatures = ({
  chainId,
  features,
  withRetryButton,
  handleRetryWithDifferentRpcUrl,
  hideBackgroundAndBorders = false,
  titleSize,
  responsiveSizeMultiplier = 1,
  withScroll = false,
  titleStyle
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { pathname } = useRoute()
  const {
    state: { account }
  } = useController('SelectedAccountController')

  const {
    state: { networks }
  } = useController('NetworksController')

  const { dispatchAndWait } = useController('ProvidersController')
  const { dispatch } = useControllersMiddleware()
  const { addToast } = useToast()
  const [checkedDeployFor, setCheckedDeployFor] = useState<bigint | undefined>()
  const tooltipId = useId()

  const selectedNetwork = useMemo(
    () => networks.find((network) => network.chainId === chainId),
    [networks, chainId]
  )
  const prevSelectedNetwork: any = usePrevious(selectedNetwork)

  useEffect(() => {
    if (!selectedNetwork) return

    if (selectedNetwork.chainId !== checkedDeployFor) setCheckedDeployFor(undefined)
  }, [selectedNetwork, prevSelectedNetwork, checkedDeployFor])

  useEffect(() => {
    if (!selectedNetwork || selectedNetwork.areContractsDeployed || checkedDeployFor) return

    setCheckedDeployFor(selectedNetwork.chainId)

    dispatchAndWait({
      type: 'method',
      params: {
        method: 'callProviderAndSendResToUi',
        args: [
          { chainId: selectedNetwork.chainId, method: 'getCode', args: [AMBIRE_ACCOUNT_FACTORY] }
        ]
      }
    })
      .then((factoryCode) => {
        if (factoryCode !== '0x') {
          dispatch({
            type: 'MAIN_CONTROLLER_UPDATE_NETWORK',
            params: { network: { areContractsDeployed: true }, chainId: selectedNetwork.chainId }
          })
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error)
      })
  }, [dispatch, selectedNetwork, checkedDeployFor, dispatchAndWait])

  const handleDeploy = useCallback(async () => {
    if (!selectedNetwork) return // this should not happen...

    // we need a basic account
    if (isSmartAccount(account || undefined) || !account) {
      addToast(
        'Deploy cannot be made with a Smart Account. Please select an EOA account and try again',
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

    dispatch({
      type: 'REQUESTS_CONTROLLER_ADD_CALLS_USER_REQUEST',
      params: {
        userRequestParams: {
          calls: [
            {
              to: SINGLETON,
              value: 0n,
              data: singletonInterface.encodeFunctionData('deploy', [bytecode, salt])
            }
          ],
          meta: {
            chainId: selectedNetwork.chainId,
            accountAddr: account.addr as string
          }
        }
      }
    })
  }, [addToast, dispatch, account, selectedNetwork])

  const shouldRenderRetryButton = useMemo(
    () => !!features && !!features.find((f) => f.id === 'flagged') && withRetryButton,
    [features, withRetryButton]
  )

  const iconSize = 20 * responsiveSizeMultiplier

  const Wrapper = withScroll ? ScrollableWrapper : View

  return (
    <Wrapper style={!hideBackgroundAndBorders ? styles.container : undefined}>
      <Text
        fontSize={titleSize || 18 * responsiveSizeMultiplier}
        weight="medium"
        appearance="infoText"
        style={[spacings.mbMd, titleStyle]}
      >
        {t('Available features')}
      </Text>
      <View>
        {!!features &&
          features.map((feature, i) => {
            return (
              <View
                key={feature.id}
                style={[
                  flexbox.directionRow,
                  i !== features.length - 1 && {
                    marginBottom: SPACING * responsiveSizeMultiplier
                  }
                ]}
              >
                <View style={[spacings.mrTy, feature.level === 'danger' && { marginTop: 3 }]}>
                  {feature.level === 'initial' && (
                    <Text
                      fontSize={14 * responsiveSizeMultiplier}
                      weight="semiBold"
                      appearance="secondaryText"
                    >
                      ?
                    </Text>
                  )}
                  {feature.level === 'loading' && (
                    <Spinner style={{ width: iconSize, height: iconSize }} />
                  )}
                  {feature.level === 'success' && <CheckIcon width={iconSize} height={iconSize} />}
                  {feature.level === 'warning' && (
                    <WarningIcon color={theme.warning400} width={iconSize} height={iconSize} />
                  )}
                  {feature.level === 'danger' && (
                    <ErrorIcon color={theme.error300} width={iconSize} height={iconSize} />
                  )}
                </View>
                <View style={[flexbox.directionRow, flexbox.flex1, flexbox.alignCenter]}>
                  <Text
                    fontSize={14 * responsiveSizeMultiplier}
                    weight="medium"
                    appearance="secondaryText"
                    style={{
                      marginRight: SPACING_TY * responsiveSizeMultiplier,
                      overflow: 'visible'
                    }}
                    numberOfLines={3}
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
                            fontSize={14 * responsiveSizeMultiplier}
                            color={theme.primary}
                            onPress={handleDeploy}
                          >
                            {t('Deploy Contracts')}
                          </Text>
                        </>
                      )}
                    {!!feature.msg && (
                      <View
                        style={[
                          spacings.plMi,
                          {
                            // @ts-ignore web style
                            verticalAlign: 'middle',
                            paddingBottom: 3
                          }
                        ]}
                      >
                        <InfoIcon
                          width={16 * responsiveSizeMultiplier}
                          height={16 * responsiveSizeMultiplier}
                          dataSet={createGlobalTooltipDataSet({
                            id: `feature-message-tooltip-${feature.id}-${tooltipId}`,
                            content: feature.msg
                          })}
                        />
                      </View>
                    )}
                  </Text>
                </View>
              </View>
            )
          })}
        {!!shouldRenderRetryButton && (
          <View
            style={[
              flexbox.alignCenter,
              {
                paddingVertical: SPACING_MD * responsiveSizeMultiplier,
                paddingHorizontal: SPACING_LG * responsiveSizeMultiplier
              }
            ]}
          >
            <Text
              style={[
                text.center,
                {
                  marginBottom: SPACING_SM * responsiveSizeMultiplier
                }
              ]}
              fontSize={14}
            >
              {t(
                "You can retry retrieving the network's available features\nusing a different RPC URL."
              )}
            </Text>
            <Button
              size="small"
              text={t('Try next RPC URL')}
              style={{ maxHeight: 32 }}
              onPress={handleRetryWithDifferentRpcUrl}
            />
          </View>
        )}
      </View>
    </Wrapper>
  )
}

export default React.memo(NetworkAvailableFeatures)
