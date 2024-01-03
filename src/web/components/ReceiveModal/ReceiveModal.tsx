import * as Clipboard from 'expo-clipboard'
import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import CopyIcon from '@common/assets/svg/CopyIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Button from '@common/components/Button'
import Modal from '@common/components/Modal'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import useMainControllerState from '@web/hooks/useMainControllerState'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

interface Props {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

const { isPopup } = getUiType()

const ReceiveModal: FC<Props> = ({ isOpen, setIsOpen }) => {
  const {
    selectedAccount,
    accounts,
    settings: { networks }
  } = useMainControllerState()
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const selectedAccountData = accounts.find(({ addr }) => addr === selectedAccount)
  const isViewOnly = selectedAccountData?.associatedKeys?.length === 0
  const qrCodeRef: any = useRef(null)
  const { addToast } = useToast()
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)

  const handleCopyAddress = () => {
    if (!selectedAccount) return

    Clipboard.setStringAsync(selectedAccount)
    addToast(t('Address copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <Modal
      withBackButton={isPopup}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      modalStyle={styles.modal}
      title="Receive Assets"
    >
      <View style={styles.content}>
        {isViewOnly ? (
          <Text
            style={[spacings.mb, { marginHorizontal: 'auto' }]}
            appearance="errorText"
            fontSize={16}
            weight="medium"
          >
            {t('Warning: Selected account is view only.')}
          </Text>
        ) : null}
        <View style={styles.qrCodeContainer}>
          {!!selectedAccount && !qrCodeError && (
            <View style={styles.qrCode}>
              <QRCode
                value={selectedAccount}
                size={160}
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
        <Text
          numberOfLines={1}
          fontSize={14}
          ellipsizeMode="middle"
          weight="medium"
          style={styles.accountAddress}
        >
          {selectedAccount}
        </Text>
        <Button
          style={styles.copyButton}
          textStyle={spacings.mrTy}
          text="Copy address"
          size="small"
          type="secondary"
          onPress={handleCopyAddress}
        >
          <CopyIcon color={theme.primary} />
        </Button>
        <View style={styles.supportedNetworksContainer}>
          <Text weight="regular" fontSize={14} style={styles.supportedNetworksTitle}>
            {t('Following networks supported on this address:')}
          </Text>
          <View style={styles.supportedNetworks}>
            {networks.map(({ id, name }: any) => (
              <View key={id} style={styles.supportedNetwork}>
                <View style={spacings.mbMi}>
                  <NetworkIcon name={id} type="monochrome" />
                </View>
                <Text
                  style={spacings.plMi}
                  fontSize={10}
                  numberOfLines={1}
                  appearance="secondaryText"
                  weight="regular"
                >
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <AmbireLogoHorizontal />
    </Modal>
  )
}

export default ReceiveModal
