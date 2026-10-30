import React, { useCallback, useMemo, useState } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import CheckIcon from '@common/assets/svg/CheckIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import CopyText from '@common/components/CopyText'
import HoverablePressable from '@common/components/HoverablePressable'
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

import DecodedRequest from './DecodedRequest'
import { MonoBox, MonoText, SectionHeader } from './DetailsPrimitives'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
type Props = {
  signingRequest: HardwareWalletSigningRequest
  /** Shown in the request title, e.g. "Typed data sent to your Ledger" */
  deviceName?: string
  /** The transaction is signed together with an account upgrade (type 4) */
  isAccountUpgradeTransaction?: boolean
  /** The calls as Ambire humanized them on the sign screen */
  humanization?: IrCall[]
  style?: StyleProp<ViewStyle>
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
  humanization,
  style
}: Props) => {
  const { t } = useTranslation()

  const {
    requestKind,
    hashes,
    missingHashReason,
    safeHashFormula,
    safeTransactionChecks,
    requestJson
  } = useMemo(
    () => getSigningRequestVerification(signingRequest, { isAccountUpgradeTransaction }),
    [signingRequest, isAccountUpgradeTransaction]
  )
  const failingChecks = useMemo(
    () => safeTransactionChecks.filter(({ isPassing }) => !isPassing),
    [safeTransactionChecks]
  )
  // Hidden by default on every screen, as the details are for users who verify on their own
  const [isExpanded, setIsExpanded] = useState(false)
  const toggleIsExpanded = useCallback(() => setIsExpanded((prev) => !prev), [])

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

  const checksSection = !!safeTransactionChecks.length && (
    <>
      <SectionHeader title={t('Checks')} />
      {safeTransactionChecks.map((check) => (
        <CheckRow key={check.id} check={check} />
      ))}
    </>
  )

  // A transaction reads in the order its hash is built: the fields, then
  // the hash of the unsigned transaction serialized from them
  const details =
    requestKind === 'transaction' ? (
      <>
        {requestSection}
        {hashesSection}
        <DecodedRequest signingRequest={signingRequest} humanization={humanization} />
      </>
    ) : (
      <>
        {hashesSection}
        {checksSection}
        {requestSection}
        <DecodedRequest signingRequest={signingRequest} humanization={humanization} />
      </>
    )

  return (
    <View style={[{ width: '100%' }, style]}>
      {/* Warnings stay visible while the details are hidden, so they're never missed */}
      {!isExpanded && (
        <>
          {failingChecks.map((check) => (
            <CheckRow key={check.id} check={check} />
          ))}
          {!!safeHashFormula && !safeHashFormula.isMatch && (
            <SafeHashFormula formula={safeHashFormula} />
          )}
        </>
      )}
      <HoverablePressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        onPress={toggleIsExpanded}
      >
        {/* The layout is on an inner view, as a style on the pressable replaces its hover style */}
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter, spacings.pvTy]}
        >
          <Text fontSize={13} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
            {isExpanded ? t('Hide verification details') : t('Show verification details')}
          </Text>
          {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
        </View>
      </HoverablePressable>
      {isExpanded && details}
    </View>
  )
}

export default React.memo(SigningRequestDetails)
