import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
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
import useTheme from '@common/hooks/useTheme'
import { loadAmbireSignerApdus } from '@common/modules/hardware-wallet/libs/ledgerAppInstall/artifacts'
import Step from '@common/modules/settings/components/AccountSmartSettingsStep'
import useAccountSmartSettings from '@common/modules/settings/hooks/useAccountSmartSettings'
import useAmbireSignerInstall from '@common/modules/settings/hooks/useAmbireSignerInstall'
import Authorization7702 from '@common/modules/sign-message/components/Contents/authorization7702'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import { installLedgerApp } from '@web/modules/hardware-wallet/controllers/LedgerController/ledgerSideload'

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onClosed?: () => void
  account: Account | null
}

const AccountSmartSettingsBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onClosed,
  account
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const {
    is7702,
    canInstallAmbireSigner,
    isUnsupportedLedger,
    unsupportedLedgerModelName,
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

  // Sideloads the "Ambire Signer" app (a fork of the Ethereum app that whitelists
  // the Ambire EIP-7702 delegator) needed to authorize delegation with a Ledger.
  // It coexists with the official Ethereum app and is used only for this one-off.
  const installAmbireSignerOverWebHid = useCallback(
    () =>
      installAmbireSigner(async (onProgress) => {
        await LedgerController.grantDevicePermissionIfNeeded()
        await installLedgerApp(await loadAmbireSignerApdus(), onProgress)
      }),
    [installAmbireSigner]
  )

  const unsupportedLedgerTitle = useMemo(
    () =>
      unsupportedLedgerModelName
        ? t('Smart features are not available on {{modelName}}', {
            modelName: unsupportedLedgerModelName
          })
        : t('Smart features are not available on this Ledger model'),
    [t, unsupportedLedgerModelName]
  )

  return (
    <BottomSheet
      id="account-delegations-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={onClosed}
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
          {is7702 && networkRows.length ? (
            <>
              {canInstallAmbireSigner && isEip7702Enabled && (
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
                            'Needed before you can turn on any of the networks below. Unlock your Ledger and stay on its home screen. Already have Ambire Signer? Install it again to get the latest version - your Ledger will ask to remove the old one first.'
                          )
                        }
                      >
                        <Button
                          type="info"
                          size="small"
                          disabled={!!installStep}
                          style={spacings.mb0}
                          onPress={installAmbireSignerOverWebHid}
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

              {!isEip7702Enabled && !isUnsupportedLedger && (
                <View
                  style={[
                    {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.secondaryBorder
                    },
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    spacings.pbTy,
                    spacings.mbTy
                  ]}
                >
                  <View style={flexbox.flex1}>
                    <Text fontSize={14} weight="medium">
                      {t('EIP-7702 smart account features are disabled.')}
                    </Text>
                  </View>
                  <View style={[flexbox.flex1, flexbox.alignEnd]}>
                    <Button
                      type="primary"
                      size="tiny"
                      style={[spacings.mb0, { minWidth: 78, height: 32 }]}
                      onPress={enableEip7702}
                      text={t('Enable')}
                    />
                  </View>
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
              {networkRows.map(
                (
                  {
                    network: net,
                    isLoading,
                    delegatedContract,
                    delegatedContractName,
                    isEnableDisabled
                  },
                  i
                ) => (
                  <View
                    key={net.chainId.toString()}
                    style={[
                      {
                        borderBottomWidth: i !== networkRows.length - 1 ? 1 : 0,
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
                      {!isLoading ? (
                        <View style={[flexbox.directionRow]}>
                          {delegatedContractName ? (
                            <>
                              {delegatedContractName === 'AMBIRE' && (
                                <AmbireLogo width={20} height={20} />
                              )}
                              {delegatedContractName === 'METAMASK' && (
                                <MetamaskIcon width={20} height={20} />
                              )}
                              {delegatedContractName === 'UNKNOWN' && (
                                <Badge type="success" text={t('Unknown')} />
                              )}
                            </>
                          ) : (
                            <Badge type="default" text={t('Disabled')} />
                          )}
                        </View>
                      ) : (
                        <SkeletonLoader width={72} height={32} />
                      )}
                    </View>
                    <View style={[flexbox.flex1, flexbox.alignEnd]}>
                      {!isLoading ? (
                        <View
                          style={[flexbox.directionRow]}
                          dataSet={
                            // The warning above already explains an unsupported Ledger
                            isEnableDisabled && !isUnsupportedLedger
                              ? createGlobalTooltipDataSet({
                                  id: `enable-eip-7702-${net.chainId.toString()}`,
                                  content: t('Enable EIP-7702 first')
                                })
                              : {}
                          }
                        >
                          <Button
                            type={!delegatedContract ? 'success' : 'danger'}
                            size="tiny"
                            style={[
                              spacings.mb0,
                              { minWidth: 78, height: 32 },
                              // A light green Enable, to match the light red Revoke
                              !delegatedContract && {
                                backgroundColor: theme.successBackground,
                                borderWidth: 1,
                                borderColor: theme.successDecorative
                              }
                            ]}
                            textStyle={!delegatedContract && { color: theme.successText }}
                            // An unsupported Ledger can't sign either, as the warning above explains
                            disabled={isEnableDisabled || isUnsupportedLedger}
                            // Fainter than the default disabled look, so it clearly isn't an action
                            disabledStyle={{ opacity: 0.4 }}
                            onPress={() => delegate(net.chainId)}
                            text={!delegatedContract ? t('Enable') : t('Revoke')}
                          />
                        </View>
                      ) : (
                        <SkeletonLoader width={72} height={32} />
                      )}
                    </View>
                  </View>
                )
              )}
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
