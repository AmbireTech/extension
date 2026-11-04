import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import ExportIcon from '@common/assets/svg/ExportIcon'
import AccountKeyIcon from '@common/components/AccountKeyIcon'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ACCOUNT_AVATAR_SIZE } from '@common/modules/account-select/components/Account/styles'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  keyToRemove: { addr: Key['addr']; type: Key['type'] }
  onCancel: () => void
  onRemoved: () => void
  onExportPress: () => void
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys
const selectUnsupportedKeys = (state: AllControllersMappingType['KeystoreController']) =>
  state.unsupportedKeys
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds

const isSameKey = (a: Pick<Key, 'addr' | 'type'>, b: Pick<Key, 'addr' | 'type'>) =>
  a.addr === b.addr && a.type === b.type

type AffectedAccount = {
  account: Account
  /** Keys this device can sign with that the account keeps after the removal */
  keysLeft: number
  becomesViewOnly: boolean
}

/** Asks the user to confirm removing a key from every account it signs for. */
const RemoveKey: FC<Props> = ({ keyToRemove, onCancel, onRemoved, onExportPress }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: unsupportedKeys } = useController('KeystoreController', selectUnsupportedKeys)
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const [hasBackup, setHasBackup] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const storedKey = useMemo(
    () => [...keys, ...unsupportedKeys].find((key) => isSameKey(key, keyToRemove)),
    [keyToRemove, keys, unsupportedKeys]
  )

  const affectedAccounts: AffectedAccount[] = useMemo(
    () =>
      accounts
        .filter((account) => account.associatedKeys.includes(keyToRemove.addr))
        .map((account) => {
          const accountKeys = keys.filter((key) => account.associatedKeys.includes(key.addr))
          const keysLeft = accountKeys.filter((key) => !isSameKey(key, keyToRemove)).length

          return { account, keysLeft, becomesViewOnly: !!accountKeys.length && !keysLeft }
        }),
    [accounts, keyToRemove, keys]
  )

  const isPrivateKey = keyToRemove.type === 'internal'
  // A key derived from a recovery phrase saved in the app can be added again from it
  const isSavedAsRecoveryPhrase =
    isPrivateKey &&
    !!storedKey?.meta?.fromSeedId &&
    seeds.some((seed) => seed.id === storedKey.meta.fromSeedId)
  const isLostWithoutBackup = isPrivateKey && !isSavedAsRecoveryPhrase
  const deviceName =
    keyToRemove.type !== 'internal' ? HARDWARE_WALLET_DEVICE_NAMES[keyToRemove.type] : ''

  const joinNames = useCallback(
    (names: string[]) => {
      if (names.length <= 1) return names[0] || ''
      return t('{{names}} and {{lastName}}', {
        names: names.slice(0, -1).join(', '),
        lastName: names[names.length - 1]
      })
    },
    [t]
  )

  const viewOnlyNames = useMemo(
    () =>
      joinNames(
        affectedAccounts
          .filter(({ becomesViewOnly }) => becomesViewOnly)
          .map(({ account }) => account.preferences.label)
      ),
    [affectedAccounts, joinNames]
  )

  const handleRemove = useCallback(async () => {
    setIsRemoving(true)
    try {
      const isRemoved = await mainDispatchAndWait<'deleteKey', boolean>({
        type: 'method',
        params: { method: 'deleteKey', args: [keyToRemove.addr, keyToRemove.type] }
      })
      if (!isRemoved) return
      addToast(t('Key removed'), { type: 'success' })
      onRemoved()
    } catch (error) {
      // The keystore emits its own error. This only times out when the app doesn't reply
      console.error(error)
      addToast(t('The key could not be removed. Please try again.'), { type: 'error' })
    } finally {
      setIsRemoving(false)
    }
  }, [addToast, keyToRemove, mainDispatchAndWait, onRemoved, t])

  return (
    <View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
        {isWeb && <PanelBackButton onPress={onCancel} style={spacings.mrSm} />}
        <PanelTitle title={t('Remove this key?')} style={isWeb ? text.left : text.center} />
      </View>

      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phSm,
          spacings.pvSm,
          spacings.mbLg,
          common.borderRadiusPrimary,
          { backgroundColor: theme.secondaryBackground }
        ]}
      >
        <AccountKeyIcon type={keyToRemove.type} iconSize={24} color={theme.iconPrimary as string} />
        <View style={spacings.mlSm}>
          <Text fontSize={14} weight="medium">
            {isPrivateKey
              ? t('Private key')
              : [deviceName, storedKey?.meta?.deviceModel].filter(Boolean).join(' · ')}
          </Text>
          <Text fontSize={13} appearance="secondaryText">
            {shortenAddress(keyToRemove.addr, 13)}
          </Text>
        </View>
      </View>

      {!!affectedAccounts.length && (
        <View style={spacings.mbLg}>
          <Text fontSize={13} weight="medium" appearance="secondaryText" style={spacings.mbTy}>
            {affectedAccounts.length === 1
              ? t('Will be removed from 1 account')
              : t('Will be removed from {{count}} accounts', { count: affectedAccounts.length })}
          </Text>
          {/* Each account as a card, like on the account select screen */}
          {affectedAccounts.map(({ account, keysLeft, becomesViewOnly }) => (
            <View
              key={account.addr}
              style={[
                spacings.plSm,
                spacings.prTy,
                spacings.pvTy,
                spacings.mbTy,
                common.borderRadiusPrimary,
                { backgroundColor: theme.secondaryBackground }
              ]}
            >
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Avatar
                  pfp={account.preferences.pfp}
                  address={account.addr}
                  size={ACCOUNT_AVATAR_SIZE}
                  smartAccountType={
                    (account.creation && 'Ambire') || (account.safeCreation && 'Safe') || undefined
                  }
                  typeBadgeRingColor={theme.secondaryBackground}
                />
                <View style={flexbox.flex1}>
                  <Text fontSize={14} weight="medium" numberOfLines={1}>
                    {account.preferences.label}
                  </Text>
                  <Text fontSize={12} appearance="secondaryText">
                    {shortenAddress(account.addr, 10)}
                  </Text>
                </View>
              </View>
              {(becomesViewOnly || !!keysLeft) && (
                <>
                  {/* A view rather than a border, as per-side borders can leave stray lines on native */}
                  <View
                    style={[spacings.mvTy, { height: 1, backgroundColor: theme.secondaryBorder }]}
                  />
                  <View style={flexbox.directionRow}>
                    {becomesViewOnly ? (
                      <Badge type="warning" text={t('Will become view-only after removal')} />
                    ) : (
                      <Badge
                        type="default"
                        text={
                          keysLeft === 1
                            ? t('Will keep 1 key after removal')
                            : t('Will keep {{count}} keys after removal', { count: keysLeft })
                        }
                      />
                    )}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {isLostWithoutBackup ? (
        <Alert
          type="error"
          size="sm"
          style={spacings.mbLg}
          title={
            viewOnlyNames
              ? t("Without a backup, you'll lose access to {{names}}.", { names: viewOnlyNames })
              : t("Without a backup, you won't be able to add this key again.")
          }
        >
          <Button
            type="secondary"
            size="small"
            text={t('Export key')}
            onPress={onExportPress}
            hasBottomSpacing={false}
            style={[spacings.mtSm, { alignSelf: 'flex-start', height: 32 }]}
          >
            <ExportIcon style={spacings.mlTy} color={theme.primary} width={16} height={16} />
          </Button>
        </Alert>
      ) : (
        <>
          {!!viewOnlyNames && (
            <Alert
              type="warning"
              size="sm"
              style={spacings.mbSm}
              title={t('{{names}} will become view-only.', { names: viewOnlyNames })}
              text={t(
                "You'll still see the balance and activity, but you won't be able to send or sign until you import a key again."
              )}
            />
          )}
          <Alert
            type="info"
            size="sm"
            style={spacings.mbLg}
            title={
              <Text fontSize={13} weight="semiBold" appearance="primaryText">
                {isPrivateKey
                  ? t('You can import this key again from your saved recovery phrase.')
                  : t(
                      'The key stays on your {{device}} device. You can import it again at any time.',
                      { device: deviceName }
                    )}
              </Text>
            }
          />
        </>
      )}

      {isLostWithoutBackup && (
        <Checkbox
          value={hasBackup}
          onValueChange={setHasBackup}
          label={t('I have a backup of this private key')}
          style={spacings.mbLg}
          testID="remove-key-backup-checkbox"
        />
      )}

      <View style={[flexbox.directionRow, { columnGap: 12 }]}>
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={onCancel}
          style={flexbox.flex1}
          hasBottomSpacing={false}
        />
        <Button
          type="dangerFilled"
          text={isRemoving ? t('Removing...') : t('Remove')}
          onPress={handleRemove}
          disabled={isRemoving || (isLostWithoutBackup && !hasBackup)}
          style={flexbox.flex1}
          hasBottomSpacing={false}
          testID="remove-key-confirm-button"
        />
      </View>
    </View>
  )
}

export default React.memo(RemoveKey)
