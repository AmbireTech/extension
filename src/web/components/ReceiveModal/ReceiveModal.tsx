import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import AccountAddress from '@common/components/AccountAddress'
import Alert from '@common/components/Alert'
import Avatar from '@common/components/Avatar/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader/ModalHeader'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

interface Props {
  modalRef: any
  handleClose: () => void
}

const { isPopup } = getUiType()

const ReceiveModal: FC<Props> = ({ modalRef, handleClose }) => {
  const { account } = useSelectedAccountControllerState()
  const { isLoading: isDomainResolving, ens } = useReverseLookup({ address: account?.addr || '' })
  const { networks } = useNetworksControllerState()
  const { keys } = useKeystoreControllerState()
  const { t } = useTranslation()
  const { styles, themeType } = useTheme(getStyles)
  const qrCodeRef: any = useRef(null)
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)
  const isViewOnly = getIsViewOnly(keys, account?.associatedKeys || [])

  const { label, pfp } = account?.preferences || { label: '', pfp: '' }

  const MAX_VISIBLE_NETWORKS = isPopup ? 10 : 20
  const [showAllNetworks, setShowAllNetworks] = useState(false)

  const hasMoreNetworks = networks.length > MAX_VISIBLE_NETWORKS

  const alwaysVisible = networks.slice(0, MAX_VISIBLE_NETWORKS)
  const extraNetworks = networks.slice(MAX_VISIBLE_NETWORKS)

  return (
    <BottomSheet
      id="receive-assets-modal"
      type="modal"
      sheetRef={modalRef}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'primaryBackground' : 'secondaryBackground'}
      containerInnerWrapperStyles={flexbox.alignCenter}
      closeBottomSheet={handleClose}
    >
      <ModalHeader
        handleClose={handleClose}
        withBackButton={isPopup}
        hasAmbireLogo
        title="Receive Assets"
      />
      <View style={styles.content}>
        <View style={[spacings.mtMd, flexbox.alignCenter]}>
          <Avatar size={40} pfp={pfp} address={account?.addr || ''} isSmart={!!account?.creation} />
          <Text weight="semiBold" fontSize={14} style={spacings.mtMi}>
            {label}
          </Text>
        </View>
        <View style={styles.qrCodeContainer}>
          {!!account && !qrCodeError && (
            <View style={styles.qrCode}>
              <QRCode
                value={account.addr}
                size={156}
                quietZone={10}
                getRef={qrCodeRef}
                onError={() => setQrCodeError(t('Failed to load QR code!') as string)}
              />
            </View>
          )}
          {!!qrCodeError && (
            <Text appearance="errorText" weight="medium">
              {t('Failed to display QR code.')}
            </Text>
          )}
        </View>
        <View style={[styles.accountAddressWrapper]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <DomainBadge ens={ens} />
            <AccountAddress
              isLoading={isDomainResolving}
              ens={ens}
              address={account?.addr || ''}
              plainAddressMaxLength={42}
              fontSize={16}
            />
          </View>
        </View>
        {isViewOnly ? (
          <View
            style={[
              spacings.mbSm,
              {
                maxWidth: 400,
                marginHorizontal: 'auto'
              }
            ]}
          >
            <Alert type="warning" title={t('Selected account is view only.')} />
          </View>
        ) : (
          <View style={spacings.mb3Xl} />
        )}

        <View style={styles.supportedNetworksContainer}>
          <Text
            weight="regular"
            appearance="tertiaryText"
            fontSize={14}
            style={styles.supportedNetworksTitle}
          >
            {t('Supported networks:')}
          </Text>
          <View style={styles.supportedNetworks}>
            {alwaysVisible.map(({ chainId, name }: any) => (
              <View key={chainId.toString()} style={styles.supportedNetwork}>
                <NetworkIcon
                  id={chainId.toString()}
                  size={31}
                  scale={1}
                  dataSet={createGlobalTooltipDataSet({
                    id: `network-icon-${chainId.toString()}`,
                    content: name
                  })}
                />
              </View>
            ))}

            {extraNetworks.map(({ chainId, name }: any) => (
              <View
                key={chainId.toString()}
                style={[
                  styles.supportedNetwork,
                  styles.extraNetwork,
                  showAllNetworks && styles.extraNetworkVisible
                ]}
              >
                <NetworkIcon
                  id={chainId.toString()}
                  size={31}
                  scale={1}
                  dataSet={createGlobalTooltipDataSet({
                    id: `network-icon-${chainId.toString()}`,
                    content: name
                  })}
                />
              </View>
            ))}
          </View>

          {hasMoreNetworks && (
            <View style={styles.seeMoreWrapper}>
              <Text appearance="linkText" onPress={() => setShowAllNetworks((prev) => !prev)}>
                {showAllNetworks ? t('View less') : t('View more')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </BottomSheet>
  )
}

export default React.memo(ReceiveModal)
