import React, { FC, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { getIsViewOnly } from '@ambire-common/utils/accounts'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader/ModalHeader'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
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
  const { networks } = useNetworksControllerState()
  const { keys } = useKeystoreControllerState()
  const { t } = useTranslation()
  const { styles, themeType } = useTheme(getStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const qrCodeRef: any = useRef(null)
  const { addToast } = useToast()
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)
  const isViewOnly = getIsViewOnly(keys, account?.associatedKeys || [])

  const handleCopyAddress = () => {
    if (!account) return

    setStringAsync(account.addr)
    addToast(t('Address copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <BottomSheet
      id="receive-assets-modal"
      type="modal"
      sheetRef={modalRef}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
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
        <View style={styles.qrCodeContainer}>
          {!!account && !qrCodeError && (
            <View style={styles.qrCode}>
              <QRCode
                value={account.addr}
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
        <View style={isPopup ? spacings.mb : spacings.mbXl}>
          <AnimatedPressable
            style={[styles.accountAddress, isViewOnly ? spacings.mbSm : spacings.mb0, animStyle]}
            onPress={handleCopyAddress}
            {...bindAnim}
          >
            <Text selectable numberOfLines={1} fontSize={14} ellipsizeMode="middle" weight="medium">
              {account?.addr}
            </Text>
            <CopyIcon style={spacings.mlTy} />
          </AnimatedPressable>
          {isViewOnly ? (
            <Alert
              style={{
                maxWidth: 400,
                marginHorizontal: 'auto'
              }}
              type="warning"
              title={t('Selected account is view only.')}
            />
          ) : null}
        </View>

        <View style={styles.supportedNetworksContainer}>
          <Text weight="regular" fontSize={14} style={styles.supportedNetworksTitle}>
            {t('Following networks supported on this address:')}
          </Text>
          <View style={styles.supportedNetworks}>
            {networks.map(({ chainId, name }: any) => (
              <View key={chainId.toString()} style={styles.supportedNetwork}>
                <View style={spacings.mbMi}>
                  <NetworkIcon id={chainId.toString()} size={22} scale={0.6} />
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
    </BottomSheet>
  )
}

export default React.memo(ReceiveModal)
