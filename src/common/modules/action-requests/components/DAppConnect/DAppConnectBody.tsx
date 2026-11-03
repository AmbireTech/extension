import React, { FC, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import { Impersonation } from '@ambire-common/libs/dapps/impersonation'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TrustAppButton from '@common/components/TrustAppButton'
import useTheme from '@common/hooks/useTheme'
import { isMobile } from '@common/config/env'
import spacings, { SPACING, SPACING_MI, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import DAppPermissions from './DAppPermissions'
import getStyles from './styles'

const DAppConnectBody: FC<{
  responsiveSizeMultiplier?: number
  securityCheck?: BlacklistedStatus
  isTrustedByUser?: boolean
  canBeTrustedByUser?: boolean
  onToggleTrust?: () => void
  onEnableScamChecker?: () => void
  isScamCheckerEnabled?: boolean
  /**
   * Whether the app is part of the default Ambire app catalog. Passing the security checks only
   * means the app isn't known to be malicious, so only catalog apps get the "Passed" badge.
   */
  isInAppCatalog?: boolean
  /** Set when the site pretends to be a well-known app it is not */
  impersonation?: Impersonation | null
}> = ({
  securityCheck,
  isTrustedByUser = false,
  canBeTrustedByUser = false,
  onToggleTrust,
  onEnableScamChecker,
  isScamCheckerEnabled = true,
  isInAppCatalog = false,
  impersonation = null,
  responsiveSizeMultiplier = 1
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  // When the checker is enabled, the user can vouch for this app so the warning about its hosting
  // is no longer shown - the rest of the security checks are untouched by that.
  const isSuspiciousHosting =
    isScamCheckerEnabled && securityCheck === 'SUSPICIOUS_HOSTING' && !isTrustedByUser
  const isScamCheckerDisabled = !isScamCheckerEnabled
  const isBlacklisted = isScamCheckerEnabled && securityCheck === 'BLACKLISTED'
  const hasFailedToGet = isScamCheckerEnabled && securityCheck === 'FAILED_TO_GET'
  const isImpersonating = !!impersonation
  // A site pretending to be another app passes the scam lists only because it is not on them yet
  const isVerified = isScamCheckerEnabled && securityCheck === 'VERIFIED' && !isImpersonating

  // The trust action takes the severity badge's slot; the warning text below and the box's own
  // border still carry the severity, so nothing is lost by swapping them. Not offered to a site
  // that pretends to be another app - trusting it would hide the warning about its hosting on
  // every later visit, while it is the copy that should be avoided.
  const shouldOfferTrust = isSuspiciousHosting && canBeTrustedByUser && !isImpersonating
  // A site trusted before it was found to pretend to be another app shows the warning badge instead
  const shouldShowTrustedBadge = isScamCheckerEnabled && isTrustedByUser && !isImpersonating
  // When the scam checker is off, the "Activate" button takes the badge's slot
  const shouldShowWarningBadge =
    !shouldOfferTrust &&
    !isScamCheckerDisabled &&
    (isSuspiciousHosting || hasFailedToGet || isImpersonating)
  const hasWarning = isSuspiciousHosting || hasFailedToGet || isImpersonating

  const impersonationWarning = useMemo(() => {
    if (!impersonation) return ''

    const { appName, appDomain, reason, isConnectedApp } = impersonation
    const params = { appName, appDomain }
    if (isConnectedApp) {
      if (reason === 'icon') {
        return t(
          "This site uses the logo of {{appName}}, but it isn't the {{appName}} website you connected to before ({{appDomain}}). Scam sites often copy apps people use - only connect if you are sure you are on the right website.",
          params
        )
      }
      if (reason === 'name') {
        return t(
          "This site calls itself {{appName}}, but it isn't the {{appName}} website you connected to before ({{appDomain}}). Scam sites often copy apps people use - only connect if you are sure you are on the right website.",
          params
        )
      }

      return t(
        "This site's address looks like the {{appName}} website you connected to before ({{appDomain}}), but it is a different website. Scam sites often copy apps people use - only connect if you are sure you are on the right website.",
        params
      )
    }
    if (reason === 'icon') {
      return t(
        "This site uses the logo of {{appName}}, but it isn't the official {{appName}} website ({{appDomain}}). Scam sites often copy well-known apps - only connect if you are sure you are on the right website.",
        params
      )
    }
    if (reason === 'name') {
      return t(
        "This site calls itself {{appName}}, but it isn't the official {{appName}} website ({{appDomain}}). Scam sites often copy well-known apps - only connect if you are sure you are on the right website.",
        params
      )
    }

    return t(
      "This site's address looks like the official {{appName}} website ({{appDomain}}), but it is a different website. Scam sites often copy well-known apps - only connect if you are sure you are on the right website.",
      params
    )
  }, [impersonation, t])

  const spacingsStyle = useMemo(() => {
    return {
      paddingHorizontal: (isMobile ? SPACING_SM : SPACING) * responsiveSizeMultiplier,
      paddingTop: SPACING * responsiveSizeMultiplier,
      paddingBottom: SPACING * responsiveSizeMultiplier
    }
  }, [responsiveSizeMultiplier])

  return (
    <View style={[styles.contentBody, spacingsStyle]}>
      <View
        style={[
          styles.securityChecksContainer,
          {
            marginBottom: SPACING * responsiveSizeMultiplier
          },
          isBlacklisted && { borderColor: theme.errorDecorative },
          hasWarning && {
            borderColor: theme.warningDecorative
          }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text
              fontSize={14}
              weight={isScamCheckerDisabled ? 'semiBold' : 'medium'}
              style={spacings.mr}
              appearance="secondaryText"
            >
              {isScamCheckerDisabled ? t('Scam checker deactivated') : t('Security checks')}
            </Text>
          </View>
          {isScamCheckerEnabled && securityCheck === 'LOADING' && (
            <Spinner style={{ width: 18, height: 18 }} />
          )}
          {isVerified && isInAppCatalog && (
            <Badge type="success" text={t('Passed')} testId="dapp-security-check-passed">
              <CheckIcon width={12} height={12} style={{ marginLeft: SPACING_MI }} />
            </Badge>
          )}
          {/* Not on a scam list, but not a known app either - shown as neutral, not as a success */}
          {isVerified && !isInAppCatalog && (
            <Badge
              type="default"
              text={t('No known issues')}
              tooltipText={t(
                "This site isn't on any list of known scams, but it isn't on our list of known apps either. Make sure the website address is the one you expect."
              )}
              testId="dapp-security-check-passed"
            />
          )}
          {isScamCheckerEnabled && securityCheck === 'BLACKLISTED' && (
            <Badge type="error" text={t('Danger')}>
              <ErrorIcon
                width={12}
                height={12}
                color={theme.errorDecorative}
                style={{ marginLeft: SPACING_MI }}
              />
            </Badge>
          )}
          {shouldShowTrustedBadge && (
            <Badge
              type="warning"
              text={t('Trusted by you')}
              tooltipText={t(
                'Hosted on a shared platform commonly used for phishing, but you marked it as trusted, so we no longer warn you.'
              )}
            />
          )}
          {shouldOfferTrust && (
            <TrustAppButton
              onPress={() => onToggleTrust?.()}
              fontSize={12 * responsiveSizeMultiplier}
            />
          )}
          {isScamCheckerDisabled && (
            <Button
              type="primary"
              size="tiny"
              text={t('Activate')}
              onPress={onEnableScamChecker}
              hasBottomSpacing={false}
              testID="activate-scam-checker-button"
            />
          )}
          {shouldShowWarningBadge && (
            <Badge type="warning" text={t('Warning')}>
              <WarningIcon
                width={12}
                height={12}
                color={theme.warningDecorative}
                style={{ marginLeft: SPACING_MI }}
              />
            </Badge>
          )}
        </View>
        {(isScamCheckerDisabled || isBlacklisted || hasWarning) && (
          <View style={spacings.ptTy}>
            {(!isScamCheckerDisabled || isImpersonating) && (
              <Text
                fontSize={18 * responsiveSizeMultiplier}
                weight="semiBold"
                color={
                  isBlacklisted
                    ? theme.errorDecorative
                    : isScamCheckerDisabled && !isImpersonating
                      ? theme.primaryText
                      : theme.warningDecorative
                }
                style={[{ lineHeight: 18 * responsiveSizeMultiplier }, spacings.mbTy]}
              >
                {isBlacklisted ? t('Potential danger!') : t('Warning!')}
              </Text>
            )}
            {isScamCheckerDisabled && (
              <Text
                fontSize={14 * responsiveSizeMultiplier}
                appearance="secondaryText"
                style={{ lineHeight: 18 * responsiveSizeMultiplier }}
              >
                {t('Activate the scam checker to check for scams.')}
              </Text>
            )}
            {isBlacklisted && (
              <Trans>
                <Text
                  fontSize={12 * responsiveSizeMultiplier}
                  color={theme.errorDecorative}
                  style={{ lineHeight: 18 * responsiveSizeMultiplier }}
                >
                  {
                    "This website didn't pass our safety checks. It might trick you into signing malicious transactions or asking you to reveal sensitive information. If you believe we have blocked it in error, please "
                  }
                  <Text
                    fontSize={12 * responsiveSizeMultiplier}
                    color={theme.errorDecorative}
                    style={{ lineHeight: 18 * responsiveSizeMultiplier }}
                    underline
                    onPress={() => openInTab({ url: 'https://help.ambire.com/en' })}
                  >
                    let us know.
                  </Text>
                </Text>
              </Trans>
            )}
            {isSuspiciousHosting && (
              <>
                <Text
                  fontSize={12 * responsiveSizeMultiplier}
                  color={theme.warningDecorative}
                  style={{ lineHeight: 18 * responsiveSizeMultiplier }}
                >
                  {t(
                    'This app is hosted on a shared platform commonly used for phishing. Be careful - do not connect unless you are certain you trust it.'
                  )}
                </Text>
                {!canBeTrustedByUser && (
                  <Text
                    fontSize={12 * responsiveSizeMultiplier}
                    appearance="secondaryText"
                    style={[spacings.ptTy, { lineHeight: 18 * responsiveSizeMultiplier }]}
                  >
                    {t(
                      'Anyone can publish an app at this address, so we cannot tell this app apart from the rest and you cannot mark it as trusted.'
                    )}
                  </Text>
                )}
              </>
            )}
            {hasFailedToGet && (
              <Text
                fontSize={14 * responsiveSizeMultiplier}
                color={theme.warningDecorative}
                style={{ lineHeight: 18 * responsiveSizeMultiplier }}
              >
                {t("We couldn't check this domain for malicious activity. Proceed with caution.")}
              </Text>
            )}
            {isImpersonating && (
              <Text
                fontSize={12 * responsiveSizeMultiplier}
                color={theme.warningDecorative}
                style={[
                  (hasFailedToGet || isSuspiciousHosting || isScamCheckerDisabled) && spacings.ptTy,
                  { lineHeight: 18 * responsiveSizeMultiplier }
                ]}
              >
                {impersonationWarning}
              </Text>
            )}
          </View>
        )}
      </View>
      <DAppPermissions responsiveSizeMultiplier={responsiveSizeMultiplier} />
      {!(isBlacklisted || hasWarning) && (
        <Text
          style={{
            opacity: 0.64,
            marginHorizontal: 'auto'
          }}
          fontSize={14 * responsiveSizeMultiplier}
          weight="medium"
          appearance="tertiaryText"
        >
          {t('Only connect with sites you trust')}
        </Text>
      )}
    </View>
  )
}

export default React.memo(DAppConnectBody)
