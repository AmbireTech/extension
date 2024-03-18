import React, { useMemo } from 'react'
import { View } from 'react-native'

import { ExternalKey } from '@ambire-common/interfaces/keystore'
import AmbireDevice from '@common/assets/svg/AmbireDevice'
import CloseIcon from '@common/assets/svg/CloseIcon'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LatticeMiniIcon from '@common/assets/svg/LatticeMiniIcon'
import LedgerMiniIcon from '@common/assets/svg/LedgerMiniIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import TrezorMiniIcon from '@common/assets/svg/TrezorMiniIcon/TrezorMiniIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { HARDWARE_WALLET_DEVICE_NAMES } from '../../constants/names'

type Props = {
  modalRef: any
  keyType: ExternalKey['type']
  onReject: () => void
}

const iconByKeyType = {
  trezor: TrezorMiniIcon,
  ledger: LedgerMiniIcon,
  lattice: LatticeMiniIcon
}

const HardwareWalletSigningModal = ({ modalRef, keyType, onReject }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const titleSuffix = useMemo(() => {
    const Icon = keyType && iconByKeyType[keyType as keyof typeof iconByKeyType]
    if (!Icon) return undefined

    return <Icon />
  }, [keyType])

  return (
    <BottomSheet
      id="hardware-wallet-signing-modal"
      backgroundColor="primaryBackground"
      autoWidth
      sheetRef={modalRef}
    >
      <ModalHeader
        title={t('Sign with your {{deviceName}} device', {
          deviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
        })}
        titleSuffix={titleSuffix}
      />
      <View
        style={[flexbox.directionRow, flexbox.alignSelfCenter, flexbox.alignCenter, spacings.mv3Xl]}
      >
        <DriveIcon style={spacings.mrLg} />
        <View style={spacings.mrLg}>
          <LeftPointerArrowIcon color={colors.greenHaze} />
          <LeftPointerArrowIcon
            color={colors.greenHaze}
            style={[spacings.mtMi, { transform: [{ rotate: '180deg' }] }]}
          />
        </View>
        <AmbireDevice />
      </View>
      <View style={[flexbox.alignSelfCenter, spacings.mb3Xl]}>
        <Text weight="regular" style={spacings.mbTy} fontSize={20}>
          {t('Sending signing request...')}
        </Text>
      </View>
      <Button
        type="danger"
        text={t('Reject')}
        onPress={onReject}
        hasBottomSpacing={false}
        style={spacings.phLg}
      >
        <View style={spacings.plSm}>
          <CloseIcon color={theme.errorDecorative} />
        </View>
      </Button>
    </BottomSheet>
  )
}

export default React.memo(HardwareWalletSigningModal)
