import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SMART_ACCOUNT_SIGNER_KEY_DERIVATION_OFFSET } from '@ambire-common/consts/derivation'
import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Account } from '@ambire-common/interfaces/account'
import { ExternalKey, InternalKey } from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import spacings from '@common/styles/spacings'

import Row from './Row'
import useSafeOwnerRows from './useSafeOwnerRows'

interface Props {
  details: AccountKeyType
  /** The Safe the key is an owner of, to show the details of the owner too */
  safeAccount?: Account
}

const AccountKeyDetails: FC<Props> = ({ details, safeAccount }) => {
  const { t } = useTranslation()
  const { type, addr, dedicatedToOneSA, isImported } = details
  const safeOwnerRows = useSafeOwnerRows(details, safeAccount)

  // Ideally, the meta should be all in there for external keys,
  // but just in case, add fallbacks (that should never happen)
  const metaDetails = useMemo(() => {
    // Only an imported key has details in the keystore
    if (!isImported) return []

    if (type === 'internal') {
      const meta = details.meta as InternalKey['meta']
      const internalKeyDetails: {
        key: string
        value: string
        [key: string]: any
      }[] = []

      if (meta?.createdAt && new Date(meta.createdAt).toString() !== 'Invalid Date') {
        internalKeyDetails.push({
          key: t('Added on'),
          value: `${new Date(meta.createdAt).toLocaleDateString()} (${new Date(
            meta.createdAt
          ).toLocaleTimeString()})`
        })
      }
      return internalKeyDetails
    }

    const meta = details.meta as ExternalKey['meta']
    let externalKeyDetails: {
      key: string
      value: string
      [key: string]: any
    }[] = []

    externalKeyDetails = [
      ...externalKeyDetails,

      {
        key: t('Device'),
        value: type ? HARDWARE_WALLET_DEVICE_NAMES[type] || type : '-'
      },
      {
        key: t('Device Model'),
        value: meta?.deviceModel || '-'
      },
      {
        key: t('Device ID'),
        value: meta?.deviceId || '-'
      },
      {
        key: t('HD Path'),
        value: meta?.hdPathTemplate ? getHdPathFromTemplate(meta.hdPathTemplate, meta.index) : '-',
        tooltip: dedicatedToOneSA
          ? t(
              'Ambire derives a different key on your hardware wallet with an offset of {{offset}}, for security and privacy reasons. You may see {{addr}} when signing on your hardware device.',
              {
                addr: shortenAddress(addr, 13),
                offset: SMART_ACCOUNT_SIGNER_KEY_DERIVATION_OFFSET
              }
            )
          : undefined,
        suffix: dedicatedToOneSA
          ? `\n${t('(dedicated key with different derivation)\n{{addr}}', { addr })}`
          : ''
      }
    ]

    if (details.meta?.createdAt && new Date(details.meta.createdAt).toString() !== 'Invalid Date') {
      externalKeyDetails.push({
        key: t('Added on'),
        value: `${new Date(details.meta.createdAt).toLocaleDateString()} (${new Date(
          details.meta.createdAt
        ).toLocaleTimeString()})`
      })
    }

    return externalKeyDetails
  }, [isImported, type, details.meta, t, dedicatedToOneSA, addr])

  return (
    <View style={[spacings.phSm, spacings.pvSm, spacings.mtMi]}>
      {[...safeOwnerRows, ...metaDetails].map(({ key, value, tooltip, suffix }) => (
        <Row key={key} rowKey={key} value={value} tooltip={tooltip} suffix={suffix} />
      ))}
    </View>
  )
}

export default React.memo(AccountKeyDetails)
