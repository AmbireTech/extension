import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import { has7702 } from '@ambire-common/libs/7702/7702'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import Alert from '@common/components/Alert'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import Authorization7702 from '@common/modules/sign-message/components/Contents/authorization7702'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import {
  AMBIRE_SIGNER_APDUS,
  AMBIRE_SIGNER_APP_NAME
} from '@web/modules/hardware-wallet/controllers/LedgerController/artifacts'
import {
  installLedgerApp,
  LedgerAppInstallStep
} from '@web/modules/hardware-wallet/controllers/LedgerController/ledgerSideload'

import Step from './components/Step'
import { getIsDelegationEnableDisabled } from './helpers'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
}

const AccountSmartSettingsBottomSheet: FC<Props> = ({ sheetRef, closeBottomSheet, account }) => {
  const {
    state: { accountStates },
    dispatch: accountsDispatch
  } = useController('AccountsController')
  const { state: keys } = useController('KeystoreController', 'keys')
  const { state: networks } = useController('NetworksController', 'networks')
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const {
    dispatch: featureFlagsDispatch,
    state: { flags }
  } = useController('FeatureFlagsController')
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const accountStateCheckedForRef = React.useRef<string | null>(null)
  const [installStep, setInstallStep] = useState<LedgerAppInstallStep | null>(null)
  const [installProgress, setInstallProgress] = useState(0)
  // Deliberately not persisted - the only source of truth is the device itself,
  // which `installLedgerApp` checks before installing anything.
  const [isAmbireSignerInstalled, setIsAmbireSignerInstalled] = useState(false)

  const accountState = useMemo(() => {
    if (!account) return null

    return accountStates[account.addr] || null
  }, [account, accountStates])

  const delegationNetworks = useMemo(() => networks.filter((n) => has7702(n)), [networks])

  useEffect(() => {
    const checkedForThisAcc = accountStateCheckedForRef.current === account?.addr

    if (checkedForThisAcc || !account || !!accountState || delegationNetworks.length === 0) return

    accountStateCheckedForRef.current = account.addr

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [account.addr, 'latest', delegationNetworks.map((n) => n.chainId)]
      }
    })
  }, [accountState, delegationNetworks, account, accountsDispatch])

  const is7702 = useMemo(() => {
    if (!account) return false

    return canBecomeSmarter(
      account,
      keys.filter((k) => account.associatedKeys.includes(k.addr))
    )
  }, [account, keys])

  const hasLedgerKey = useMemo(
    () =>
      !!account && keys.some((k) => account.associatedKeys.includes(k.addr) && k.type === 'ledger'),
    [account, keys]
  )

  // Sideloads the "Ambire Signer" app (a fork of the Ethereum app that whitelists
  // the Ambire EIP-7702 delegator) needed to authorize delegation with a Ledger.
  // It coexists with the official Ethereum app and is used only for this one-off.
  const installAmbireSigner = useCallback(async () => {
    try {
      setInstallStep('connecting')
      setInstallProgress(0)
      await LedgerController.grantDevicePermissionIfNeeded()
      const wasAlreadyInstalled = await installLedgerApp(
        AMBIRE_SIGNER_APP_NAME,
        AMBIRE_SIGNER_APDUS,
        (step, percent) => {
          setInstallStep(step)
          setInstallProgress(percent)
        }
      )
      setIsAmbireSignerInstalled(true)
      addToast(
        wasAlreadyInstalled
          ? t('Ambire Signer is already on your Ledger. You can now turn on the networks below.')
          : t('Ambire Signer installed. You can now turn on the networks below.')
      )
    } catch (error: any) {
      addToast(error?.message || t('Failed to install Ambire Signer on your Ledger.'), {
        type: 'error'
      })
    } finally {
      setInstallStep(null)
    }
  }, [addToast, t])

  // The device asks for two separate approvals and names neither of them after
  // Ambire, so spell out what is being asked instead of showing a bare spinner.
  const installStepText = useMemo(() => {
    if (installStep === 'connecting') return t('Unlock your Ledger and keep it on its home screen.')
    if (installStep === 'confirmingAppList')
      return t('On your Ledger: allow Ambire to check which apps you already have.')
    if (installStep === 'confirmingInstall')
      return t('On your Ledger: approve the install request.')
    if (installStep === 'loading') return t('Installing. Keep your Ledger connected.')

    return null
  }, [installStep, t])
  const isEip7702Enabled = flags.eip7702

  const enableEip7702 = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: {
        method: 'setFeatureFlag',
        args: ['eip7702', true]
      }
    })
  }, [featureFlagsDispatch])

  const delegate = (chainId: bigint) => {
    const network = networks.find((n) => n.chainId === chainId)
    if (!network || !account || !accountState || !accountState[chainId.toString()]) return

    const delegatedContract = accountState[chainId.toString()]?.delegatedContract
    if (getIsDelegationEnableDisabled(isEip7702Enabled, delegatedContract)) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              userRequestParams: {
                calls: [{ to: ZERO_ADDRESS, data: '0x', value: BigInt(0) }],
                meta: {
                  chainId: network.chainId,
                  accountAddr: account.addr,
                  setDelegation: !accountState?.[chainId.toString()]?.delegatedContract
                }
              }
            }
          }
        ]
      }
    })
  }

  return (
    <BottomSheet
      id="account-delegations-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{ maxWidth: TAB_CONTENT_WIDTH * 0.85, ...spacings.pvMd }}
    >
      <>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <PanelBackButton onPress={closeBottomSheet} style={spacings.mrTy} />
          {account ? (
            <PanelTitle title={`${account.preferences.label} smart settings`} style={text.left} />
          ) : (
            <SkeletonLoader width={200} height={24} />
          )}
        </View>
        <Authorization7702>
          {is7702 && delegationNetworks?.length ? (
            <>
              {/* This sheet is rendered by the mobile AccountsSettingsScreen too, where
                  there is no WebHID and no bundled app builds, so the install can only
                  ever fail there. */}
              {isWeb && hasLedgerKey && (
                <Alert
                  type="info"
                  size="md"
                  style={spacings.mbMd}
                  customIcon={LedgerLetterIcon}
                  title={
                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <Text fontSize={14} weight="semiBold">
                        {t('Extra step for Ledger devices')}
                      </Text>
                      <Badge type="warning" text={t('Experimental')} style={spacings.mlTy} />
                    </View>
                  }
                  text={t(
                    'Ledger’s official Ethereum app blocks every other wallet’s upgrade, Ambire included. Ambire Signer is a custom companion app for your Ledger that unlocks the Ambire upgrade.\nInstall it once and use it only to approve the upgrade - everything else is still signed with the official Ethereum app.'
                  )}
                >
                  <View style={spacings.mtSm}>
                    {isAmbireSignerInstalled ? (
                      <Step
                        number={1}
                        isCompleted
                        title={t('Ambire Signer is installed on your Ledger')}
                      />
                    ) : (
                      <Step
                        number={1}
                        title={t('Install Ambire Signer on your Ledger')}
                        description={
                          installStepText ??
                          t(
                            'Needed before you can turn on any of the networks below. Unlock your Ledger and stay on its home screen.'
                          )
                        }
                      >
                        <Button
                          type="info"
                          size="small"
                          disabled={!!installStep}
                          style={spacings.mb0}
                          onPress={installAmbireSigner}
                          text={
                            installStep === 'loading'
                              ? t('Installing... {{progress}}%', { progress: installProgress })
                              : installStep
                                ? t('Check your Ledger')
                                : t('Install')
                          }
                        />
                      </Step>
                    )}
                    <Step number={2} title={t('Turn on the networks you want, below')} />
                    <Text fontSize={14} appearance="secondaryText">
                      {t(
                        'Ambire Signer is not available in Ledger Wallet. Install and manage it only from these smart settings. Requires a Ledger device that supports custom apps: Nano S Plus, Stax, Flex or Nano Gen5.'
                      )}
                    </Text>
                  </View>
                </Alert>
              )}

              <Text fontSize={14} style={[spacings.mbMd]} appearance="secondaryText">
                {t(
                  'While we support multiple networks, only those that have implemented EIP-7702 are listed here. As more networks adopt this upgrade, we will update the list to reflect broader availability.'
                )}
              </Text>

              {!isEip7702Enabled && (
                <Alert
                  type="warning"
                  size="sm"
                  style={spacings.mbMd}
                  title={t('This is an experimental feature')}
                  text={t(
                    'Smart features for your existing account are new and still being tested. Turn them on only if you are comfortable trying them out - you can turn them off at any time.'
                  )}
                  buttonProps={{ text: t('Turn on'), onPress: enableEip7702 }}
                  isButtonTopRight
                />
              )}

              <View
                style={[
                  {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.secondaryBorder
                  },
                  flexbox.directionRow,
                  spacings.pbMi
                ]}
              >
                <View style={[flexbox.flex1]}>
                  <Text fontSize={14} weight="medium">
                    {t('Network')}
                  </Text>
                </View>
                <View style={[flexbox.flex1, flexbox.alignCenter]}>
                  <Text fontSize={14} weight="medium">
                    {t('Delegation')}
                  </Text>
                </View>
                <View style={[flexbox.flex1, flexbox.alignEnd]}>
                  <Text fontSize={14} weight="medium">
                    {t('Action')}
                  </Text>
                </View>
              </View>
              {delegationNetworks.map((net, i) => (
                <View
                  key={net.chainId.toString()}
                  style={[
                    {
                      borderBottomWidth: i !== delegationNetworks.length - 1 ? 1 : 0,
                      borderBottomColor: theme.secondaryBorder
                    },
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    spacings.pvTy
                  ]}
                >
                  <View style={[flexbox.flex1]}>
                    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                      <NetworkIcon id={net.chainId.toString()} />
                      <Text style={spacings.mlTy} fontSize={14}>
                        {net.name}
                      </Text>
                    </View>
                  </View>
                  <View style={[flexbox.flex1, flexbox.alignCenter]}>
                    {accountState && accountState[net.chainId.toString()] ? (
                      <View style={[flexbox.directionRow]}>
                        {accountState?.[net.chainId.toString()]?.delegatedContractName ? (
                          <>
                            {accountState?.[net.chainId.toString()]?.delegatedContractName ===
                              'AMBIRE' && <AmbireLogo width={20} height={20} />}
                            {accountState?.[net.chainId.toString()]?.delegatedContractName ===
                              'METAMASK' && <MetamaskIcon width={20} height={20} />}
                            {accountState?.[net.chainId.toString()]?.delegatedContractName ===
                              'UNKNOWN' && <Badge type="success" text={t('unknown')} />}
                          </>
                        ) : (
                          <Badge type="default" text={t('disabled')} />
                        )}
                      </View>
                    ) : (
                      <SkeletonLoader width={72} height={32} />
                    )}
                  </View>
                  <View style={[flexbox.flex1, flexbox.alignEnd]}>
                    {accountState && accountState[net.chainId.toString()] ? (
                      <View
                        style={[flexbox.directionRow]}
                        dataSet={
                          getIsDelegationEnableDisabled(
                            isEip7702Enabled,
                            accountState[net.chainId.toString()]?.delegatedContract
                          )
                            ? createGlobalTooltipDataSet({
                                id: `enable-eip-7702-${net.chainId.toString()}`,
                                content: t('Enable EIP-7702 first')
                              })
                            : {}
                        }
                      >
                        <Button
                          type={
                            !accountState?.[net.chainId.toString()]?.delegatedContract
                              ? 'secondary'
                              : 'danger'
                          }
                          size="tiny"
                          style={[spacings.mb0, { minWidth: 78, height: 32 }]}
                          disabled={getIsDelegationEnableDisabled(
                            isEip7702Enabled,
                            accountState[net.chainId.toString()]?.delegatedContract
                          )}
                          onPress={() => delegate(net.chainId)}
                          text={
                            !accountState?.[net.chainId.toString()]?.delegatedContract
                              ? t('Enable')
                              : t('Revoke')
                          }
                        />
                      </View>
                    ) : (
                      <SkeletonLoader width={72} height={32} />
                    )}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View>
              <Alert type="info" size="md">
                <Text fontSize={16} appearance="infoText">
                  {t(
                    'Turning EOAs into Smart is only available for hot wallets (a wallet whose key is directly imported into the extension)'
                  )}
                </Text>
              </Alert>
            </View>
          )}
        </Authorization7702>
      </>
    </BottomSheet>
  )
}

export default React.memo(AccountSmartSettingsBottomSheet)
