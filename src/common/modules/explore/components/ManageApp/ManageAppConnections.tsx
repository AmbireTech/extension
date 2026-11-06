import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getSessionConnectionSource } from '@ambire-common/classes/session'
import { Dapp } from '@ambire-common/interfaces/dapp'
import GlobeIcon from '@common/assets/svg/GlobeIcon'
import WalletConnectIcon from '@common/assets/svg/WalletConnectIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const selectDappSessions = (state: AllControllersMappingType['DappsController']) =>
  state.dappSessions

// Handshake sessions carry a placeholder topic until the app approves the connection
const isLiveWcTopic = (wcTopic?: string): wcTopic is string =>
  !!wcTopic && !wcTopic.startsWith('temp_')

interface ConnectionRowProps {
  title: string
  subtitle: string
  /** Set for a WalletConnect session, unset for the in-app browser's injected provider */
  wcTopic?: string
  onDisconnect: (wcTopic?: string) => void
}

const ConnectionRow = React.memo(
  ({ title, subtitle, wcTopic, onDisconnect }: ConnectionRowProps) => {
    const { theme } = useTheme()
    const { t } = useTranslation()
    const handleDisconnect = useCallback(() => onDisconnect(wcTopic), [onDisconnect, wcTopic])

    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          common.borderRadiusPrimary,
          spacings.ph,
          spacings.pvTy,
          { backgroundColor: theme.secondaryBackground, minHeight: 50 }
        ]}
      >
        {wcTopic ? (
          <WalletConnectIcon width={22} height={22} />
        ) : (
          <GlobeIcon width={20} height={20} />
        )}
        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text fontSize={14} weight="medium" numberOfLines={1}>
            {title}
          </Text>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <Button
          type="danger"
          size="small"
          text={t('Disconnect')}
          onPress={handleDisconnect}
          hasBottomSpacing={false}
        />
      </View>
    )
  }
)

interface Props {
  dapp: Dapp
  onDisconnectInjected: () => void
  onDisconnectWcSession: (wcTopic: string) => void
}

/**
 * The app's live connections, each disconnected on its own: the in-app browser's injected
 * provider and every WalletConnect session, read from the sessions the wallet holds.
 */
const ManageAppConnections = ({ dapp, onDisconnectInjected, onDisconnectWcSession }: Props) => {
  const { t } = useTranslation()
  const { state: dappSessions } = useController('DappsController', selectDappSessions)

  const wcSessions = useMemo(
    () => Object.values(dappSessions).filter((s) => s.id === dapp.id && isLiveWcTopic(s.wcTopic)),
    [dappSessions, dapp.id]
  )
  const isConnectedViaInjected = !!dapp.connectedSources?.includes('injected')

  const handleDisconnect = useCallback(
    (wcTopic?: string) => (wcTopic ? onDisconnectWcSession(wcTopic) : onDisconnectInjected()),
    [onDisconnectInjected, onDisconnectWcSession]
  )

  const connectionsCount = wcSessions.length + (isConnectedViaInjected ? 1 : 0)
  if (!connectionsCount) return null

  return (
    <View style={spacings.mbSm}>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
        {t(connectionsCount > 1 ? 'Connections' : 'Connection')}
      </Text>
      <View style={{ rowGap: SPACING_SM }}>
        {isConnectedViaInjected && (
          <ConnectionRow
            title={t('In-app browser')}
            subtitle={t('Direct connection')}
            onDisconnect={handleDisconnect}
          />
        )}
        {wcSessions.map((session) => (
          <ConnectionRow
            key={session.sessionId}
            title={t('WalletConnect')}
            subtitle={
              getSessionConnectionSource(session) === 'wc-in-app'
                ? t('In-app browser')
                : t('External')
            }
            wcTopic={session.wcTopic}
            onDisconnect={handleDisconnect}
          />
        ))}
      </View>
    </View>
  )
}

export default React.memo(ManageAppConnections)
