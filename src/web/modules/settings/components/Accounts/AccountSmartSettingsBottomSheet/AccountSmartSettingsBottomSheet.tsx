import React, { FC, useEffect, useMemo, useState } from 'react'
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
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import Authorization7702 from '@web/modules/sign-message/screens/SignMessageScreen/Contents/authorization7702'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  account: Account | null
}

const AccountSmartSettingsBottomSheet: FC<Props> = ({ sheetRef, closeBottomSheet, account }) => {
  const { accountStates } = useAccountsControllerState()
  const { keys } = useKeystoreControllerState()
  const { networks } = useNetworksControllerState()
  const { theme, themeType } = useTheme()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const [checkedAccountState, setCheckedAccountState] = useState<boolean>(false)

  const accountState = useMemo(() => {
    if (!account) return null

    return accountStates[account.addr] || null
  }, [account, accountStates])

  const delegationNetworks = useMemo(() => networks.filter((n) => has7702(n)), [networks])

  useEffect(() => {
    if (checkedAccountState || !account || !accountState || delegationNetworks.length === 0) return
    setCheckedAccountState(true)

    const missingAccountStateNetworks: bigint[] = []
    delegationNetworks.forEach((net) => {
      if (!accountState[net.chainId.toString()]) missingAccountStateNetworks.push(net.chainId)
    })
    if (missingAccountStateNetworks.length === 0) return

    dispatch({
      type: 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_STATE',
      params: {
        addr: account.addr,
        chainIds: missingAccountStateNetworks
      }
    })
  }, [checkedAccountState, accountState, delegationNetworks, account, dispatch])

  const is7702 = useMemo(() => {
    if (!account) return false

    return canBecomeSmarter(
      account,
      keys.filter((k) => account.associatedKeys.includes(k.addr))
    )
  }, [account, keys])

  const delegate = (chainId: bigint) => {
    const network = networks.find((n) => n.chainId === chainId)
    if (!network || !account || !accountState || !accountState[chainId.toString()]) return

    dispatch({
      type: 'REQUESTS_CONTROLLER_ADD_CALLS_USER_REQUEST',
      params: {
        userRequestParams: {
          calls: [{ to: ZERO_ADDRESS, data: '0x', value: BigInt(0) }],
          meta: {
            isSignAction: true,
            chainId: network.chainId,
            accountAddr: account.addr,
            setDelegation: !accountState[chainId.toString()].delegatedContract
          }
        },
        allowAccountSwitch: true
      }
    })
  }

  return (
    <BottomSheet
      id="account-delegations-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
      scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
      isScrollEnabled={false}
      containerInnerWrapperStyles={{ flex: 1 }}
      style={{ maxWidth: TAB_CONTENT_WIDTH * 0.85, ...spacings.pvMd }}
    >
      {!!account && !!accountState && (
        <>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <PanelBackButton onPress={closeBottomSheet} style={spacings.mrTy} />
            <PanelTitle title={`${account.preferences.label} smart settings`} style={text.left} />
          </View>
          <Authorization7702>
            {account && is7702 && delegationNetworks?.length ? (
              <>
                <Text fontSize={14} style={[spacings.mbMd]} appearance="secondaryText">
                  {t(
                    'While we support multiple networks, only those that have implemented EIP-7702 are listed here. As more networks adopt this upgrade, we will update the list to reflect broader availability.'
                  )}
                </Text>
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
                        borderBottomColor:
                          themeType === THEME_TYPES.DARK
                            ? theme.primaryBorder
                            : theme.tertiaryBackground
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
                      {accountState[net.chainId.toString()] ? (
                        <View style={[flexbox.directionRow]}>
                          {accountState[net.chainId.toString()].delegatedContractName ? (
                            <>
                              {accountState[net.chainId.toString()].delegatedContractName ===
                                'AMBIRE' && <AmbireLogo width={20} height={20} />}
                              {accountState[net.chainId.toString()].delegatedContractName ===
                                'METAMASK' && <MetamaskIcon width={20} height={20} />}
                              {accountState[net.chainId.toString()].delegatedContractName ===
                                'UNKNOWN' && <Badge type="success" text={t('unknown')} />}
                            </>
                          ) : (
                            <Badge type="default" text={t('disabled')} />
                          )}
                        </View>
                      ) : (
                        <View style={[flexbox.alignCenter, flexbox.justifyCenter, flexbox.flex1]}>
                          <Spinner style={{ width: '15px', height: '15px' }} />
                        </View>
                      )}
                    </View>
                    <View style={[flexbox.flex1, flexbox.alignEnd]}>
                      {accountState[net.chainId.toString()] ? (
                        <View style={[flexbox.directionRow]}>
                          <Button
                            type={
                              !accountState[net.chainId.toString()].delegatedContract
                                ? 'secondary'
                                : 'danger'
                            }
                            size="tiny"
                            style={[spacings.mb0, { minWidth: 78, height: 32 }]}
                            onPress={() => delegate(net.chainId)}
                            text={
                              !accountState[net.chainId.toString()].delegatedContract
                                ? t('Enable')
                                : t('Revoke')
                            }
                          />
                        </View>
                      ) : (
                        <View style={[flexbox.alignCenter, flexbox.justifyCenter, flexbox.flex1]}>
                          -
                        </View>
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
      )}
      {(!account || !accountState) && (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, flexbox.flex1]}>
          <Spinner />
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(AccountSmartSettingsBottomSheet)
