import React, { FC, useMemo } from 'react'
import { View } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import DownArrowLongIcon from '@common/assets/svg/DownArrowLongIcon'
import Alert from '@common/components/Alert'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/action-requests/components/DAppConnect/styles'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import Account from './Account'

const ACCOUNT_STYLE = { width: '100%' as const }

type Props = {
  account: AccountType | null
  /** The address the app asked for, shown when it isn't one of the user's accounts */
  nextAccount?: string
  nextAccountData: AccountType | null
  nextRequestKind?: string
  isRequestBroken: boolean
  responsiveSizeMultiplier?: number
}

/** The body of the switch account request, styled like the app connection request's body */
const SwitchAccountBody: FC<Props> = ({
  account,
  nextAccount,
  nextAccountData,
  nextRequestKind,
  isRequestBroken,
  responsiveSizeMultiplier = 1
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const spacingsStyle = useMemo(
    () => ({
      paddingHorizontal: (isMobile ? SPACING_SM : SPACING) * responsiveSizeMultiplier,
      paddingVertical: SPACING * responsiveSizeMultiplier
    }),
    [responsiveSizeMultiplier]
  )

  const reasonText = useMemo(() => {
    if (!nextRequestKind) return t('Switch to this account to continue.')
    if (nextRequestKind === 'calls') return t('Switch to this account to sign the transaction.')

    // Every other request that waits for a switch is a message to sign - plain, typed, sign-in
    // or an authorization
    return t('Switch to this account to sign the message.')
  }, [nextRequestKind, t])

  return (
    <View style={[styles.contentBody, spacingsStyle]}>
      <View
        style={[
          styles.securityChecksContainer,
          flexbox.alignCenter,
          spacings.pvSm,
          { marginBottom: SPACING * responsiveSizeMultiplier }
        ]}
      >
        {!!account && <Account {...account} style={ACCOUNT_STYLE} />}
        <View
          style={[
            flexbox.center,
            spacings.mvTy,
            {
              width: 32 * responsiveSizeMultiplier,
              height: 32 * responsiveSizeMultiplier,
              borderRadius: 16,
              backgroundColor: theme.secondaryBackground
            }
          ]}
        >
          <DownArrowLongIcon color={theme.iconPrimary} width={12} height={12} />
        </View>
        {nextAccountData ? (
          <Account {...nextAccountData} style={ACCOUNT_STYLE} />
        ) : (
          <Text appearance="errorText" fontSize={14} style={text.center}>
            {nextAccount || t('Invalid account data')}
          </Text>
        )}
      </View>
      {isRequestBroken ? (
        <Alert
          type="error"
          title={t('Unable to switch account')}
          text={t(
            'The requested account is not available. Add the account or reconnect the app to continue. If the issue persists, please contact support.'
          )}
        />
      ) : (
        <Text
          fontSize={14 * responsiveSizeMultiplier}
          weight="medium"
          appearance="secondaryText"
          style={text.center}
        >
          {reasonText}
        </Text>
      )}
    </View>
  )
}

export default React.memo(SwitchAccountBody)
