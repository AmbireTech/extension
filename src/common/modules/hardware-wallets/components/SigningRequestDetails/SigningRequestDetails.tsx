import React, { useMemo } from 'react'
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import CheckIcon from '@common/assets/svg/CheckIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import CopyText from '@common/components/CopyText'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import {
  getSigningRequestVerification,
  SafeTransactionCheck,
  SigningRequestVerification,
  VerificationHash
} from '@common/modules/hardware-wallets/utils/getSigningRequestVerification'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  signingRequest: HardwareWalletSigningRequest
  /** Shown in the request title, e.g. "Typed data sent to your Ledger" */
  deviceName?: string
  /** The transaction is signed together with an account upgrade (type 4) */
  isAccountUpgradeTransaction?: boolean
  style?: StyleProp<ViewStyle>
}

// @ts-ignore web-only style, so long hex values wrap instead of overflowing
const wrapAnywhereStyle: TextStyle = { wordBreak: 'break-all' }

const MonoText = ({ children, style }: { children: string; style?: StyleProp<TextStyle> }) => (
  <Text
    selectable
    fontSize={12}
    weight="mono_regular"
    style={[{ lineHeight: 18 }, wrapAnywhereStyle, style]}
  >
    {children}
  </Text>
)

const MonoBox = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvTy,
        { borderRadius: 8, backgroundColor: theme.secondaryBackground }
      ]}
    >
      {children}
    </View>
  )
}

const SectionHeader = ({ title, copyText }: { title: string; copyText?: string }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.mtLg,
        spacings.mbTy
      ]}
    >
      <Text fontSize={14} weight="semiBold" style={[flexbox.flex1, spacings.mrSm]}>
        {title}
      </Text>
      {!!copyText && <CopyText text={copyText} iconSize={16} iconColor={theme.secondaryText} />}
    </View>
  )
}

const HashBlock = ({ hash }: { hash: VerificationHash }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={spacings.mbTy}>
      <MonoBox>
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
          <Text fontSize={12} weight="medium" appearance="secondaryText">
            {t(hash.label)}
          </Text>
          <CopyText text={hash.value} iconSize={16} iconColor={theme.secondaryText} />
        </View>
        <MonoText style={spacings.mtMi}>{hash.value}</MonoText>
        {!!hash.note && (
          <Text fontSize={12} appearance="secondaryText" style={spacings.mtMi}>
            {t(hash.note)}
          </Text>
        )}
      </MonoBox>
    </View>
  )
}

const SafeHashFormula = ({
  formula
}: {
  formula: NonNullable<SigningRequestVerification['safeHashFormula']>
}) => {
  const { t } = useTranslation()

  return (
    <View style={spacings.mtMi}>
      <MonoText style={{ fontSize: 11 }}>
        {t('Safe hash = keccak256(0x1901 ‖ Domain hash ‖ Message hash)')}
      </MonoText>
      <Text
        fontSize={12}
        weight="medium"
        appearance={formula.isMatch ? 'successText' : 'errorText'}
        style={spacings.mtMi}
      >
        {formula.isMatch
          ? t('Ambire checked that these hashes add up.')
          : t("These hashes don't add up. Don't approve on your device.")}
      </Text>
    </View>
  )
}

const CheckRow = ({ check }: { check: SafeTransactionCheck }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
      {check.isPassing ? (
        <CheckIcon width={16} height={16} color={theme.successDecorative} />
      ) : (
        <WarningIcon width={16} height={16} color={theme.warningDecorative} />
      )}
      <Text fontSize={13} style={[flexbox.flex1, spacings.mlTy]}>
        {t(check.label)}
      </Text>
    </View>
  )
}

/**
 * Everything a user needs to verify a hardware wallet signing request on
 * their own: the hashes to compare with the device, the request exactly as
 * sent (ready to paste into a hashing tool), and, for Safe transactions,
 * the checks that can be confirmed by reading the request.
 */
const SigningRequestDetails = ({
  signingRequest,
  deviceName,
  isAccountUpgradeTransaction,
  style
}: Props) => {
  const { t } = useTranslation()

  const {
    requestKind,
    hashes,
    missingHashReason,
    safeHashFormula,
    safeTransactionChecks,
    requestJson,
    unsignedTransaction
  } = useMemo(
    () => getSigningRequestVerification(signingRequest, { isAccountUpgradeTransaction }),
    [signingRequest, isAccountUpgradeTransaction]
  )

  const requestTitle = useMemo(() => {
    const device = deviceName || t('device')

    if (requestKind === 'typed-data') return t('Typed data sent to your {{device}}', { device })
    if (requestKind === 'transaction') return t('Transaction sent to your {{device}}', { device })

    return t('Request sent to your {{device}}', { device })
  }, [deviceName, requestKind, t])

  const hashesSection = (!!hashes.length || !!missingHashReason) && (
    <>
      <SectionHeader title={t('Hashes')} />
      {hashes.map((hash) => (
        <HashBlock key={hash.id} hash={hash} />
      ))}
      {!!missingHashReason && (
        <Text fontSize={12} appearance="secondaryText">
          {t(missingHashReason)}
        </Text>
      )}
      {!!safeHashFormula && <SafeHashFormula formula={safeHashFormula} />}
    </>
  )

  const requestSection = (
    <>
      <SectionHeader title={requestTitle} copyText={requestJson} />
      <MonoBox>
        <MonoText>{requestJson}</MonoText>
      </MonoBox>
    </>
  )

  const unsignedTransactionSection = !!unsignedTransaction && (
    <>
      <SectionHeader title={t('Unsigned transaction')} copyText={unsignedTransaction} />
      <MonoBox>
        <MonoText>{unsignedTransaction}</MonoText>
      </MonoBox>
    </>
  )

  // A transaction reads in the order its hash is built: the fields, the
  // unsigned transaction serialized from them, then the hash of that
  if (requestKind === 'transaction') {
    return (
      <View style={[{ width: '100%' }, style]}>
        {requestSection}
        {unsignedTransactionSection}
        {hashesSection}
      </View>
    )
  }

  return (
    <View style={[{ width: '100%' }, style]}>
      {hashesSection}
      {!!safeTransactionChecks.length && (
        <>
          <SectionHeader title={t('Checks')} />
          {safeTransactionChecks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
        </>
      )}
      {requestSection}
    </View>
  )
}

export default React.memo(SigningRequestDetails)
