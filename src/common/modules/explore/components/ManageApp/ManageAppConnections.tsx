import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getSessionConnectionSource, Session } from '@ambire-common/classes/session'
import { ConnectionSource, Dapp } from '@ambire-common/interfaces/dapp'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import WalletConnectIcon from '@common/assets/svg/WalletConnectIcon'
import Button from '@common/components/Button'
import Text, { TextAppearance } from '@common/components/Text'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWcSessionsDetails from '@common/modules/explore/hooks/useWcSessionsDetails'
import type {
  WcSessionDetails,
  WcSessionStatus
} from '@common/modules/explore/hooks/useWcSessionsDetails/types'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import formatDateTime from '@common/utils/formatDateTime'
import formatTime from '@common/utils/formatTime'

const selectDappSessions = (state: AllControllersMappingType['DappsController']) =>
  state.dappSessions

// Handshake sessions carry a placeholder topic until the app approves the connection
const isLiveWcTopic = (wcTopic?: string): wcTopic is string =>
  !!wcTopic && !wcTopic.startsWith('temp_')

type WcSession = Session & { wcTopic: string }

const STATUS_APPEARANCE: Record<WcSessionStatus, TextAppearance> = {
  checking: 'secondaryText',
  active: 'successText',
  inactive: 'warningText'
}

interface DetailLineProps {
  label: string
  value: string
  valueAppearance?: TextAppearance
}

const DetailLine = ({ label, value, valueAppearance = 'primaryText' }: DetailLineProps) => (
  <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.mtMi]}>
    <Text fontSize={12} appearance="secondaryText">
      {label}
    </Text>
    <Text fontSize={12} weight="medium" appearance={valueAppearance}>
      {value}
    </Text>
  </View>
)

interface ConnectionCardProps {
  title: string
  /** False for the in-app browser's injected provider */
  isWalletConnect: boolean
  onDisconnect: () => void
  children: React.ReactNode
}

const ConnectionCard = ({
  title,
  isWalletConnect,
  onDisconnect,
  children
}: ConnectionCardProps) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <View
      style={[
        common.borderRadiusPrimary,
        spacings.ph,
        spacings.pvTy,
        { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {isWalletConnect ? (
          <WalletConnectIcon width={22} height={22} />
        ) : (
          // Square like its other uses: the artwork overflows its viewBox and a tight box clips it
          <AmbireLogo width={22} height={22} />
        )}
        <Text
          fontSize={14}
          weight="medium"
          numberOfLines={1}
          style={[flexbox.flex1, spacings.mlTy]}
        >
          {title}
        </Text>
        <Button
          type="danger"
          size="small"
          text={t('Disconnect')}
          onPress={onDisconnect}
          hasBottomSpacing={false}
        />
      </View>
      {children}
    </View>
  )
}

const WcConnectedFromLine = ({ source }: { source: ConnectionSource }) => {
  const { t } = useTranslation()

  return (
    <DetailLine
      label={t('Connected from')}
      value={source === 'wc-in-app' ? t('In-app browser') : t('External browser')}
    />
  )
}

interface WcSessionCardProps {
  session: WcSession
  details?: WcSessionDetails
  onDisconnect: (wcTopic: string) => void
}

const WcSessionCard = React.memo(({ session, details, onDisconnect }: WcSessionCardProps) => {
  const { t } = useTranslation()
  const { connectedAt, expiresInSeconds, status = 'checking' } = details ?? {}
  const handleDisconnect = useCallback(
    () => onDisconnect(session.wcTopic),
    [onDisconnect, session.wcTopic]
  )

  const statusLabels: Record<WcSessionStatus, string> = {
    checking: t('Checking…'),
    active: t('Online'),
    inactive: t('Offline')
  }

  return (
    <ConnectionCard title={t('WalletConnect')} isWalletConnect onDisconnect={handleDisconnect}>
      <WcConnectedFromLine source={getSessionConnectionSource(session)} />
      <DetailLine
        label={t('Connected at')}
        value={connectedAt ? formatDateTime(connectedAt) : t('Unknown')}
      />
      {expiresInSeconds !== undefined && (
        <DetailLine
          label={t('Expires')}
          value={t('in {{time}}', { time: formatTime(expiresInSeconds) })}
        />
      )}
      <DetailLine
        label={t('Status')}
        value={statusLabels[status]}
        valueAppearance={STATUS_APPEARANCE[status]}
      />
    </ConnectionCard>
  )
})

interface WcSourceWithoutSessionCardProps {
  source: ConnectionSource
  onDisconnectSource: (source: ConnectionSource) => void
}

/** A WalletConnect connection the wallet holds no live session for, so it can still be removed */
const WcSourceWithoutSessionCard = ({
  source,
  onDisconnectSource
}: WcSourceWithoutSessionCardProps) => {
  const { t } = useTranslation()
  const handleDisconnect = useCallback(
    () => onDisconnectSource(source),
    [onDisconnectSource, source]
  )

  return (
    <ConnectionCard title={t('WalletConnect')} isWalletConnect onDisconnect={handleDisconnect}>
      <WcConnectedFromLine source={source} />
      <DetailLine
        label={t('Status')}
        value={t('Offline')}
        valueAppearance={STATUS_APPEARANCE.inactive}
      />
    </ConnectionCard>
  )
}

interface Props {
  dapp: Dapp
  onDisconnectSource: (source: ConnectionSource) => void
  onDisconnectWcSession: (wcTopic: string) => void
}

/**
 * The app's live connections, each disconnected on its own: the in-app browser's injected
 * provider, every WalletConnect session the wallet holds, and any WalletConnect source left
 * without one.
 */
const ManageAppConnections = ({ dapp, onDisconnectSource, onDisconnectWcSession }: Props) => {
  const { t } = useTranslation()
  const { state: dappSessions } = useController('DappsController', selectDappSessions)

  const dappWcSessions = useMemo(
    () =>
      Object.values(dappSessions).filter(
        (s): s is WcSession => s.id === dapp.id && isLiveWcTopic(s.wcTopic)
      ),
    [dappSessions, dapp.id]
  )
  const detailsByTopic = useWcSessionsDetails(dappWcSessions.map((s) => s.wcTopic))
  // Most recently connected first; sessions without a recorded time go last
  const wcSessions = useMemo(
    () =>
      [...dappWcSessions].sort(
        (a, b) =>
          (detailsByTopic[b.wcTopic]?.connectedAt ?? 0) -
          (detailsByTopic[a.wcTopic]?.connectedAt ?? 0)
      ),
    [dappWcSessions, detailsByTopic]
  )
  // Sources still listed after their sessions are gone (e.g. a failed setup) - without a card
  // for them, the app would show as connected with nothing to disconnect it
  const wcSourcesWithoutSession = useMemo(
    () =>
      (dapp.connectedSources ?? []).filter(
        (source) =>
          source !== 'injected' &&
          !dappWcSessions.some((s) => getSessionConnectionSource(s) === source)
      ),
    [dapp.connectedSources, dappWcSessions]
  )
  const isConnectedViaInjected = !!dapp.connectedSources?.includes('injected')
  // Active while the wallet holds a session of the page in the in-app browser
  const injectedStatus: WcSessionStatus = Object.values(dappSessions).some(
    (s) => s.id === dapp.id && !s.wcTopic
  )
    ? 'active'
    : 'inactive'

  const handleDisconnectInjected = useCallback(
    () => onDisconnectSource('injected'),
    [onDisconnectSource]
  )

  const connectionsCount =
    wcSessions.length + wcSourcesWithoutSession.length + (isConnectedViaInjected ? 1 : 0)
  if (!connectionsCount) return null

  return (
    <View style={spacings.mbSm}>
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
        {t(connectionsCount > 1 ? 'Connections' : 'Connection')}
      </Text>
      <View style={{ rowGap: SPACING_SM }}>
        {isConnectedViaInjected && (
          <ConnectionCard
            title={t('Ambire')}
            isWalletConnect={false}
            onDisconnect={handleDisconnectInjected}
          >
            <DetailLine label={t('Connected from')} value={t('In-app browser')} />
            <DetailLine label={t('Expires')} value={t('Never')} />
            <DetailLine
              label={t('Status')}
              value={injectedStatus === 'active' ? t('Online') : t('Offline')}
              valueAppearance={STATUS_APPEARANCE[injectedStatus]}
            />
          </ConnectionCard>
        )}
        {wcSessions.map((session) => (
          <WcSessionCard
            key={session.sessionId}
            session={session}
            details={detailsByTopic[session.wcTopic]}
            onDisconnect={onDisconnectWcSession}
          />
        ))}
        {wcSourcesWithoutSession.map((source) => (
          <WcSourceWithoutSessionCard
            key={source}
            source={source}
            onDisconnectSource={onDisconnectSource}
          />
        ))}
      </View>
    </View>
  )
}

export default React.memo(ManageAppConnections)
