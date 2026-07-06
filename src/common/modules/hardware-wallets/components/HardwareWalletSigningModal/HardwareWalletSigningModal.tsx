import React, { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { ExternalKey } from '@ambire-common/interfaces/keystore'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import AmbireDevice from '@common/assets/svg/AmbireDevice'
import DriveIcon from '@common/assets/svg/DriveIcon'
import GridPlusIcon from '@common/assets/svg/GridPlusIcon'
import LedgerBadgeIcon from '@common/assets/svg/LedgerBadgeIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import SigningRequestDetails from '@common/modules/hardware-wallets/components/SigningRequestDetails'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

type Props = {
  keyType: ExternalKey['type']
  isVisible: boolean
  children?: React.ReactNode
  cancelReq?: () => void
  signingRequest?: HardwareWalletSigningRequest | null
}

const iconByKeyType = {
  trezor: TrezorBadgeIcon,
  ledger: LedgerBadgeIcon,
  lattice: GridPlusIcon
}

const { isTab } = getUiType()

const HardwareWalletSigningModal = ({
  keyType,
  isVisible,
  children,
  cancelReq,
  signingRequest
}: Props) => {
  const { t } = useTranslation()
  const { ref, open, close } = useModalize()
  const { theme } = useTheme()

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const title = useMemo(() => {
    const Icon = keyType && iconByKeyType[keyType as keyof typeof iconByKeyType]
    const icon = Icon ? <Icon style={spacings.mlTy} width={32} height={32} /> : null
    const text = t('Sign with your {{deviceName}} device', {
      deviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
    })

    // On native a <Text> is not a flexbox container, so an icon nested directly
    // in it is baseline-aligned and ends up vertically misaligned with the
    // title. Wrapping the title in a <View> row makes flexbox centering apply.
    if (isMobile)
      return (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text fontSize={18} weight="medium">
            {text}
          </Text>
          {icon}
        </View>
      )

    return (
      <>
        {text}
        {icon}
      </>
    )
  }, [keyType, t])

  const isTrezor = useMemo(() => {
    return HARDWARE_WALLET_DEVICE_NAMES[keyType] === 'Trezor'
  }, [keyType])

  return (
    <BottomSheet
      id="hardware-wallet-signing-modal"
      // The modal is displayed in tab in swap and bridge
      type={!isTab ? 'bottom-sheet' : 'modal'}
      autoWidth
      sheetRef={ref}
      shouldBeClosableOnDrag={false}
      autoOpen={isVisible}
      withBackdropBlur={false}
      containerInnerWrapperStyles={isTab ? { ...spacings.pv2Xl, ...spacings.ph2Xl } : {}}
    >
      <ModalHeader title={title} style={flexbox.justifyCenter} />
      <View
        style={[flexbox.directionRow, flexbox.alignSelfCenter, flexbox.alignCenter, spacings.mvXl]}
      >
        <DriveIcon style={spacings.mrLg} />
        <View style={spacings.mrLg}>
          <LeftPointerArrowIcon color={theme.successDecorative} />
          <LeftPointerArrowIcon
            color={theme.successDecorative}
            style={[spacings.mtMi, { transform: [{ rotate: '180deg' }] }]}
          />
        </View>
        <AmbireDevice />
      </View>
      <View
        style={[
          flexbox.alignSelfCenter,
          spacings.mbLg,
          flexbox.alignCenter,
          { width: '100%', maxWidth: 420 }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
          <Text weight="regular" fontSize={20}>
            {t('Sending signing request...')}
          </Text>
        </View>
        {children}
        {!!signingRequest && (
          <SigningRequestDetails signingRequest={signingRequest} style={spacings.mtLg} />
        )}
      </View>
      {isTrezor && !!cancelReq && (
        <Button
          type="dangerFilled"
          text={t('Cancel request')}
          onPress={cancelReq}
          hasBottomSpacing={false}
          style={[flexbox.alignSelfCenter, { width: '100%', maxWidth: 420 }]}
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(HardwareWalletSigningModal)
