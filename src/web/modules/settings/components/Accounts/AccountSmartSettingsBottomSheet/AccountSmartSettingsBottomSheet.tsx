import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import { has7702 } from '@ambire-common/libs/7702/7702'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import Alert from '@common/components/Alert'
import Badge from '@common/components/Badge'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import Authorization7702 from '@common/modules/sign-message/components/Contents/authorization7702'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import { AMBIRE_SIGNER_APDUS } from '@web/modules/hardware-wallet/controllers/LedgerController/artifacts'
import { installLedgerApp } from '@web/modules/hardware-wallet/controllers/LedgerController/ledgerSideload'

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
  const { keys } = useController('KeystoreController').state
  const { networks } = useController('NetworksController').state
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const accountStateCheckedForRef = React.useRef<string | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installProgress, setInstallProgress] = useState(0)

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
      setIsInstalling(true)
      setInstallProgress(0)
      await LedgerController.grantDevicePermissionIfNeeded()
      await installLedgerApp(AMBIRE_SIGNER_APDUS, (sent, total) =>
        setInstallProgress(Math.round((sent / total) * 100))
      )
      addToast(
        t(
          'Ambire Signer installed. On your Ledger, open the app and approve, then enable EIP-7702.'
        )
      )
    } catch (error: any) {
      addToast(error?.message || t('Failed to install Ambire Signer on your Ledger.'), {
        type: 'error'
      })
    } finally {
      setIsInstalling(false)
    }
  }, [addToast, t])

  const delegate = (chainId: bigint) => {
    const network = networks.find((n) => n.chainId === chainId)
    if (!network || !account || !accountState || !accountState[chainId.toString()]) return

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
              <Text fontSize={14} style={[spacings.mbMd]} appearance="secondaryText">
                {t(
                  'While we support multiple networks, only those that have implemented EIP-7702 are listed here. As more networks adopt this upgrade, we will update the list to reflect broader availability.'
                )}
              </Text>

              {/* TODO: UI and wording are BOTH not polished yet */}
              {hasLedgerKey && (
                <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbMd]}>
                  <View style={[flexbox.flex1, spacings.mrTy]}>
                    <Text fontSize={14} weight="medium">
                      {t('Ledger EIP-7702 setup')}
                    </Text>
                    <Text fontSize={12} appearance="secondaryText">
                      {t(
                        'Install the Ambire Signer app on your Ledger to authorize EIP-7702 delegation. It is used once - keep using the official Ethereum app for everything else.'
                      )}
                    </Text>
                    <Text fontSize={12} appearance="warningText" style={spacings.mtMi}>
                      {t(
                        'Not available on the Ledger Nano X - use a Nano S Plus, Stax, Flex, or Nano Gen5.'
                      )}
                    </Text>
                  </View>
                  <Button
                    type="secondary"
                    size="small"
                    disabled={isInstalling}
                    style={spacings.mb0}
                    onPress={installAmbireSigner}
                    text={
                      isInstalling
                        ? t('Installing... {{progress}}%', { progress: installProgress })
                        : t('Install Ambire Signer')
                    }
                  />
                </View>
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
                      <View style={[flexbox.directionRow]}>
                        <Button
                          type={
                            !accountState?.[net.chainId.toString()]?.delegatedContract
                              ? 'secondary'
                              : 'danger'
                          }
                          size="tiny"
                          style={[spacings.mb0, { minWidth: 78, height: 32 }]}
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
