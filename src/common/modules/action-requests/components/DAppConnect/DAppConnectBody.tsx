import React, { FC, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TrustAppButton from '@common/components/TrustAppButton'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_LG, SPACING_MI } from '@common/styles/spacings'
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
}> = ({
  securityCheck,
  isTrustedByUser = false,
  canBeTrustedByUser = false,
  onToggleTrust,
  onEnableScamChecker,
  isScamCheckerEnabled = true,
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

  // The trust action takes the severity badge's slot; the warning text below and the box's own
  // border still carry the severity, so nothing is lost by swapping them.
  const shouldOfferTrust = isSuspiciousHosting && canBeTrustedByUser
  const shouldShowWarningBadge = !shouldOfferTrust && (isSuspiciousHosting || hasFailedToGet)

  const spacingsStyle = useMemo(() => {
    return {
      paddingHorizontal: SPACING_LG * responsiveSizeMultiplier,
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
          (isSuspiciousHosting || hasFailedToGet) && {
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
          {isScamCheckerEnabled && securityCheck === 'VERIFIED' && (
            <Badge type="success" text={t('Passed')} testId="dapp-security-check-passed">
              <CheckIcon width={12} height={12} style={{ marginLeft: SPACING_MI }} />
            </Badge>
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
          {isScamCheckerEnabled && isTrustedByUser && (
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
        {(isScamCheckerDisabled || isBlacklisted || isSuspiciousHosting || hasFailedToGet) && (
          <View style={spacings.ptTy}>
            {!isScamCheckerDisabled && (
              <Text
                fontSize={18 * responsiveSizeMultiplier}
                weight="semiBold"
                color={
                  isBlacklisted
                    ? theme.errorDecorative
                    : isScamCheckerDisabled
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
          </View>
        )}
      </View>
      <DAppPermissions responsiveSizeMultiplier={responsiveSizeMultiplier} />
      {!(isBlacklisted || isSuspiciousHosting || hasFailedToGet) && (
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
