import networks from 'ambire-common/src/constants/networks'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import {
  getName,
  isKnown,
  setKnownAddressNames
} from 'ambire-common/src/services/humanReadableTransactions'
import { getTransactionSummary } from 'ambire-common/src/services/humanReadableTransactions/transactionSummary'
import { formatUnits } from 'ethers/lib/utils'
// TODO: add types
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, Linking, TouchableOpacity, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import useConstants from '@common/hooks/useConstants'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

function getNetworkSymbol(networkId: any) {
  const network = networks.find((x) => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}

function parseExtendedSummaryItem(item: any, i: any, networkDetails: any, t: any) {
  if (item === '') return null

  if (item.length === 1) return <Text fontSize={12}>{`${item} `}</Text>

  if (i === 0)
    return (
      <Text fontSize={12} style={[styles.action, styles[item.toLowerCase()]]}>{`${item} `}</Text>
    )

  if (!item.type) return <Text fontSize={12}>{`${item} `}</Text>

  if (item.type === 'token')
    return (
      <>
        {item.amount > 0 ? (
          <Text fontSize={12}>{`${formatFloatTokenAmount(
            item.amount,
            true,
            item.decimals
          )} `}</Text>
        ) : null}
        {/* eslint-disable-next-line no-nested-ternary */}
        {item.decimals !== null && item.symbol ? (
          <>
            {item.address ? (
              <TokenIcon
                width={20}
                height={20}
                networkId={networkDetails.id}
                address={item.address}
              />
            ) : null}
            <Text fontSize={12}> </Text>
            <Text fontSize={12}>{`${item.symbol || ''} `}</Text>
          </>
        ) : item.amount > 0 ? (
          <Text fontSize={12}>{t('units of unknown token ')}</Text>
        ) : null}
      </>
    )

  if (item.type === 'address')
    return (
      <Text fontSize={12}>
        {`${item.name ? item.name : item.address} `}
        {!!item.address && (
          <TouchableOpacity
            onPress={() => Linking.openURL(`${networkDetails.explorerUrl}/address/${item.address}`)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.openIconWrapper}
          >
            <OpenIcon width={16} height={16} />
          </TouchableOpacity>
        )}
      </Text>
    )

  if (item.type === 'network')
    return (
      <Text fontSize={12}>
        {item.icon ? <Image source={{ uri: item.icon }} style={{ width: 20, height: 20 }} /> : null}
        {` ${item.name} `}
      </Text>
    )

  if (item.type === 'erc721') {
    return <Text>{` ${item.name} `}</Text>
  }

  if (item.type === 'link') {
    return (
      <Text fontSize={12}>
        <Text>{`${item.text} `}</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(item.link)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.openIconWrapper}
        >
          <OpenIcon width={16} height={16} />
        </TouchableOpacity>
      </Text>
    )
  }

  return null
}

const TxnPreview = ({
  txn,
  onDismiss,
  network,
  account,
  isFirstFailing,
  mined,
  disableExpand,
  hasBottomSpacing = true,
  addressLabel = null,
  meta = null
}: any) => {
  const { constants } = useConstants()
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(constants!.humanizerInfo, txn[0], network)
  const { t } = useTranslation()

  useEffect(() => {
    !!addressLabel && setKnownAddressNames(addressLabel)
  }, [addressLabel])

  const networkDetails = networks.find(({ id }) => id === network)

  const extendedSummary = getTransactionSummary(constants!.humanizerInfo, txn, network, account, {
    mined,
    extended: true,
    meta
  })

  const summary = extendedSummary.map((entry: any, idx: number) => {
    if (Array.isArray(entry)) {
      return <View style={[flexboxStyles.directionRow, flexboxStyles.wrap, flexboxStyles.alignCenter]} key={entry}>
       {entry.map((item, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={`item-${i}`}>
          {parseExtendedSummaryItem(item, i, networkDetails, t)}
        </React.Fragment>
        ))}
      </View>
    }
    if (typeof entry === 'object') {
      return (
        // eslint-disable-next-line react/no-array-index-key
        <React.Fragment key={`item-${idx}`}>
          {parseExtendedSummaryItem(entry, idx, networkDetails, t)}
        </React.Fragment>
      )
    }
    return (
      <Text fontSize={12} key={entry}>
        {entry}
      </Text>
    )
  })

  return (
    <View style={[styles.container, hasBottomSpacing && spacings.mbTy]}>
      <TouchableOpacity
        onPress={() => !disableExpand && setExpanded((e) => !e)}
        style={styles.listItem}
        activeOpacity={disableExpand ? 1 : 0.75}
      >
        {!disableExpand && (
          <NavIconWrapper disabled style={spacings.mrTy} onPress={() => null}>
            {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
          </NavIconWrapper>
        )}
        <View style={[flexboxStyles.flex1, spacings.mrTy]}>
          <View
            style={[
              flexboxStyles.directionRow,
              flexboxStyles.wrap,
              flexboxStyles.alignCenter,
              // Workaround for react-native-web issue, happening with long
              // continuous strings. Otherwise, those strings go beyond the
              // layout and break the UI.
              // {@link https://github.com/necolas/react-native-web/issues/760#issuecomment-816941918}
              // @ts-ignore-next-line
              isWeb && { wordBreak: 'break-word' }
            ]}
          >
            {summary}
          </View>
          {!!isFirstFailing && (
            <Text appearance="danger" fontSize={10}>
              {t('This is the first failing transaction.')}
            </Text>
          )}
          {!isFirstFailing && !mined && !isKnown(constants!.humanizerInfo, txn, account) && (
            <Text appearance="danger" fontSize={10}>
              {t('Warning: interacting with an unknown contract or address.')}
            </Text>
          )}
        </View>
        {!!onDismiss && (
          <NavIconWrapper onPress={onDismiss}>
            <CloseIcon />
          </NavIconWrapper>
        )}
      </TouchableOpacity>
      {isExpanded ? (
        <View style={styles.expandedContainer}>
          <View style={spacings.mbMi}>
            <Text fontSize={10}>{t('Interacting with (to): ')}</Text>
            <Text fontSize={10}>
              {txn[0]}
              <Text fontSize={10}>{contractName ? ` (${contractName})` : ''}</Text>
            </Text>
          </View>
          <View style={spacings.mbMi}>
            <Text>
              <Text>
                <Text fontSize={10}>{`${getNetworkSymbol(network)} `}</Text>
                <Text fontSize={10}>{t('to be sent value ')}</Text>
              </Text>
              <Text fontSize={10}>{formatUnits(txn[1] || '0x0', 18)}</Text>
            </Text>
          </View>
          <View>
            <Text fontSize={10}>{t('Data: ')}</Text>
            <Text fontSize={10}>{txn[2]}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default TxnPreview
