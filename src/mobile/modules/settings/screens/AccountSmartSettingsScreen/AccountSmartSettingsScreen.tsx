import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import BatchIcon from '@common/assets/svg/BatchIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import MetamaskIcon from '@common/assets/svg/Metamask/MetamaskIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import LedgerConnectModal from '@common/modules/hardware-wallets/components/LedgerConnectModal'
import { AMBIRE_SIGNER_APDUS } from '@common/modules/hardware-wallet/libs/ledgerAppInstall/artifacts'
import Step from '@common/modules/settings/components/AccountSmartSettingsStep'
import useAccountSmartSettings, {
  SmartSettingsNetworkRow
} from '@common/modules/settings/hooks/useAccountSmartSettings'
import useAmbireSignerInstall from '@common/modules/settings/hooks/useAmbireSignerInstall'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import ledgerTransportService from '@mobile/services/ledger/ledgerTransportService'
import { DeviceModelId } from '@ledgerhq/device-management-kit'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The search param that names the account whose smart settings are shown */
export const SMART_SETTINGS_ACCOUNT_PARAM = 'accountAddr'

// The Ledger models that can't install Ambire Signer, by DMK model id
const UNSUPPORTED_LEDGER_MODEL_NAMES: Record<string, string> = {
  [DeviceModelId.NANO_S]: 'Ledger Nano S',
  [DeviceModelId.NANO_X]: 'Ledger Nano X'
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const Separator = ({ inset = 0 }: { inset?: number }) => {
  const { theme } = useTheme()

  // A 1px view, as per-side borders can leak onto the next screen on native
  return <View style={{ height: 1, marginLeft: inset, backgroundColor: theme.secondaryBorder }} />
}

const NetworkStatus = ({ row }: { row: SmartSettingsNetworkRow }) => {
  const { t } = useTranslation()

  if (row.isLoading) return <SkeletonLoader width={96} height={14} />

  if (!row.delegatedContractName) {
    return (
      <Text fontSize={13} appearance="secondaryText">
        {t('Not delegated')}
      </Text>
    )
  }

  return (
    // Wraps the logo and name onto a second line together when they don't fit
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
      <Text fontSize={13} appearance="secondaryText" style={spacings.mrMi}>
        {t('Delegated to')}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {row.delegatedContractName === 'AMBIRE' && (
          <AmbireLogo width={14} height={14} style={spacings.mrMi} />
        )}
        {row.delegatedContractName === 'METAMASK' && (
          <MetamaskIcon width={14} height={14} style={spacings.mrMi} />
        )}
        <Text fontSize={13} appearance="successText">
          {row.delegatedContractName === 'AMBIRE' && 'Ambire'}
          {row.delegatedContractName === 'METAMASK' && 'MetaMask'}
          {row.delegatedContractName === 'UNKNOWN' && t('an unknown contract')}
        </Text>
      </View>
    </View>
  )
}

const AccountSmartSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { search } = useRoute()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const [isLedgerInstallModalVisible, setIsLedgerInstallModalVisible] = useState(false)
  // The connect sheet starts Bluetooth when it mounts, which makes iOS ask for the
  // permission, so it is mounted only once a Ledger install is requested
  const [isLedgerInstallRequested, setIsLedgerInstallRequested] = useState(false)

  const account: Account | null = useMemo(() => {
    const accountAddr = new URLSearchParams(search).get(SMART_SETTINGS_ACCOUNT_PARAM)

    return accounts.find((acc) => acc.addr === accountAddr) || null
  }, [accounts, search])

  const {
    is7702,
    canInstallAmbireSigner,
    isUnsupportedLedger,
    unsupportedLedgerModel,
    isEip7702Enabled,
    networkRows,
    enableEip7702,
    delegate
  } = useAccountSmartSettings(account)
  const {
    installStep,
    installProgress,
    installStepText,
    isAmbireSignerInstalled,
    installAmbireSigner
  } = useAmbireSignerInstall()

  const openLedgerInstallModal = useCallback(() => {
    setIsLedgerInstallRequested(true)
    setIsLedgerInstallModalVisible(true)
  }, [])
  const closeLedgerInstallModal = useCallback(() => setIsLedgerInstallModalVisible(false), [])

  // Sideloads the "Ambire Signer" app, which the Ledger needs to approve the
  // upgrade, on the device picked in the connect sheet
  const installAmbireSignerOnDevice = useCallback(
    (device: { id: string }) => {
      setIsLedgerInstallModalVisible(false)
      // Reports its own errors with a toast
      void installAmbireSigner((onProgress) =>
        ledgerTransportService.installApp(device, AMBIRE_SIGNER_APDUS, onProgress)
      )
    },
    [installAmbireSigner]
  )

  const installButtonText = useMemo(() => {
    if (installStep === 'loading')
      return t('Installing... {{progress}}%', { progress: installProgress })
    if (installStep) return t('Check your Ledger')

    return t('Install')
  }, [installProgress, installStep, t])

  const features = useMemo(
    () => [
      {
        id: 'fees',
        Icon: GasTankIcon,
        text: t('Pay network fees with tokens you already hold, like stablecoins.')
      },
      {
        id: 'batch',
        Icon: BatchIcon,
        text: t('Do several actions in one step, like approving and swapping a token.')
      },
      {
        id: 'preview',
        Icon: VisibilityIcon,
        text: t('See how a transaction changes your balance before you confirm it.')
      }
    ],
    [t]
  )

  const unsupportedLedgerTitle = useMemo(() => {
    const modelName =
      unsupportedLedgerModel && UNSUPPORTED_LEDGER_MODEL_NAMES[unsupportedLedgerModel]

    return modelName
      ? t('Smart features are not available on {{modelName}}', { modelName })
      : t('Smart features are not available on this Ledger model')
  }, [t, unsupportedLedgerModel])

  const canUpgrade = is7702 && networkRows.length > 0

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent withBackButton withScroll title={t('Smart settings')}>
        {!!account && (
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm,
              spacings.pvTy,
              spacings.mbLg,
              { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_SECONDARY }
            ]}
          >
            <Avatar pfp={account.preferences.pfp} address={account.addr} size={36} />
            <View style={[flexbox.flex1, spacings.mlTy]}>
              <Text fontSize={15} weight="medium" numberOfLines={1}>
                {account.preferences.label}
              </Text>
              <Text fontSize={13} appearance="secondaryText">
                {shortenAddress(account.addr, 13)}
              </Text>
            </View>
          </View>
        )}

        <Text fontSize={14} appearance="secondaryText" style={spacings.mbMd}>
          {t(
            'Smart features let your account do more. Your address, balances and DeFi positions stay exactly the same.'
          )}
        </Text>

        <View
          style={[
            spacings.phSm,
            spacings.mbLg,
            { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_SECONDARY }
          ]}
        >
          {features.map(({ id, Icon, text }, index) => (
            <View key={id}>
              {index > 0 && <Separator inset={52} />}
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvSm]}>
                <View
                  style={[
                    flexbox.center,
                    {
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.primaryBackground
                    }
                  ]}
                >
                  <Icon width={22} height={22} color={theme.iconPrimary} />
                </View>
                <Text
                  fontSize={13}
                  appearance="secondaryText"
                  style={[flexbox.flex1, spacings.mlSm]}
                >
                  {text}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!canUpgrade ? (
          <Alert
            type="info"
            size="md"
            title={t('Smart features are not available for this account')}
            text={t('They work only for accounts whose key is in this app or on a Ledger.')}
          />
        ) : (
          <>
            <Text fontSize={16} weight="semiBold" style={spacings.mbTy}>
              {t('Networks')}
            </Text>
            <Text fontSize={13} appearance="secondaryText" style={spacings.mbMd}>
              {t(
                'Only networks that support this upgrade are listed. More will be added as they support it.'
              )}
            </Text>

            {!isEip7702Enabled && !isUnsupportedLedger && (
              <Alert
                type="info"
                size="md"
                style={spacings.mbMd}
                title={t('Smart features are turned off')}
                text={t('Turn them on to upgrade your account on the networks below.')}
                buttonProps={{ text: t('Turn on smart features'), onPress: enableEip7702 }}
              />
            )}

            {isUnsupportedLedger && (
              <Alert
                type="warning"
                size="md"
                style={spacings.mbMd}
                title={unsupportedLedgerTitle}
                text={t(
                  'Enabling or revoking them needs a small companion app that this Ledger does not allow. Managing delegation works on newer devices like Ledger Nano S Plus, Stax, Flex and Nano Gen5.'
                )}
              />
            )}

            {canInstallAmbireSigner && isEip7702Enabled && (
              <Alert
                type="info"
                size="md"
                style={spacings.mbMd}
                customIcon={LedgerLetterIcon}
                title={
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Text fontSize={14} weight="semiBold">
                      {t('One more step for Ledger')}
                    </Text>
                    <Badge type="warning" text={t('Experimental')} style={spacings.mlTy} />
                  </View>
                }
                text={t(
                  'The Ethereum app on your Ledger does not allow this upgrade. Install Ambire Signer, a small companion app, once. It is used only to approve the upgrade, everything else is still signed with the Ethereum app.'
                )}
              >
                <View style={spacings.mtSm}>
                  {isAmbireSignerInstalled ? (
                    <Step number={1} isCompleted title={t('Ambire Signer is on your Ledger')} />
                  ) : (
                    <Step
                      number={1}
                      title={t('Install Ambire Signer on your Ledger')}
                      description={
                        installStepText ??
                        t(
                          'Unlock your Ledger and stay on its home screen. Already have it? Install it again to update it. Your Ledger will ask to remove the old one first.'
                        )
                      }
                    >
                      <Button
                        type="info"
                        size="small"
                        disabled={!!installStep}
                        style={spacings.mb0}
                        onPress={openLedgerInstallModal}
                        text={installButtonText}
                      />
                    </Step>
                  )}
                  <Step number={2} title={t('Enable the networks you want below')} />
                  <Text fontSize={13} appearance="secondaryText">
                    {t(
                      'Works with Ledger Nano S Plus, Stax, Flex and Nano Gen5. Ambire Signer is not in Ledger Wallet, you can install it only from here.'
                    )}
                  </Text>
                </View>
              </Alert>
            )}

            <View
              style={[
                spacings.phSm,
                {
                  backgroundColor: theme.secondaryBackground,
                  borderRadius: BORDER_RADIUS_SECONDARY
                }
              ]}
            >
              {networkRows.map((row, index) => (
                <View key={row.network.chainId.toString()}>
                  {index > 0 && <Separator inset={44} />}
                  <View
                    style={[
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      spacings.pvSm,
                      { minHeight: 66 }
                    ]}
                  >
                    <NetworkIcon id={row.network.chainId.toString()} size={32} />
                    <View style={[flexbox.flex1, spacings.mhSm]}>
                      <Text fontSize={15} weight="medium" style={spacings.mbMi}>
                        {row.network.name}
                      </Text>
                      <NetworkStatus row={row} />
                    </View>
                    {/* The warning above explains why an unsupported Ledger has no buttons */}
                    {row.isLoading && !isUnsupportedLedger && (
                      <SkeletonLoader width={84} height={40} />
                    )}
                    {!row.isLoading && !isUnsupportedLedger && (
                      <Button
                        type={row.delegatedContract ? 'danger' : 'success'}
                        size="small"
                        hasBottomSpacing={false}
                        style={[
                          { minWidth: 84, height: 40 },
                          // A light green Enable, to match the light red Revoke
                          !row.delegatedContract && {
                            backgroundColor: theme.successBackground,
                            borderWidth: 1,
                            borderColor: theme.successDecorative
                          }
                        ]}
                        textStyle={!row.delegatedContract && { color: theme.successText }}
                        disabled={row.isEnableDisabled}
                        onPress={() => delegate(row.network.chainId)}
                        text={row.delegatedContract ? t('Revoke') : t('Enable')}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </MobileLayoutWrapperMainContent>
      {isLedgerInstallRequested && (
        <LedgerConnectModal
          isVisible={isLedgerInstallModalVisible}
          handleClose={closeLedgerInstallModal}
          onSelectDeviceForAppInstall={installAmbireSignerOnDevice}
        />
      )}
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountSmartSettingsScreen)
