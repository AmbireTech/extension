import React, { useEffect, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { ExternalKey } from '@ambire-common/interfaces/keystore'
import AmbireDevice from '@common/assets/svg/AmbireDevice'
import CloseIcon from '@common/assets/svg/CloseIcon'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

type Props = {
  keyType: ExternalKey['type']
  isVisible: boolean
  children?: React.ReactNode
  cancelReq?: () => void
}

const iconByKeyType = {
  trezor: TrezorLockIcon,
  ledger: LedgerLetterIcon,
  lattice: LatticeIcon
}

const { isTab } = getUiType()

const HardwareWalletSigningModal = ({ keyType, isVisible, children, cancelReq }: Props) => {
  const { t } = useTranslation()
  const { ref, open, close } = useModalize()
  const { theme } = useTheme()
  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  const titleSuffix = useMemo(() => {
    const Icon = keyType && iconByKeyType[keyType as keyof typeof iconByKeyType]
    if (!Icon) return undefined

    return <Icon style={spacings.mlTy} width={32} height={32} />
  }, [keyType])

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
      <ModalHeader
        title={
          <>
            {t('Sign with your {{deviceName}} device', {
              deviceName: HARDWARE_WALLET_DEVICE_NAMES[keyType]
            })}
            {titleSuffix}
          </>
        }
        style={flexbox.justifyCenter}
      />
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
      <View style={[flexbox.alignSelfCenter, spacings.mbLg, flexbox.alignCenter]}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
          <Text weight="regular" fontSize={20}>
            {t('Sending signing request...')}
          </Text>
          {isTrezor && !!cancelReq && (
            <View>
              <Pressable
                onPress={cancelReq}
                style={spacings.ml}
                dataSet={{ tooltipId: 'trezor-cancel-sign-tooltip' }}
              >
                <CloseIcon />
              </Pressable>
              <Tooltip id="trezor-cancel-sign-tooltip">
                <Text fontSize={14} appearance="secondaryText">
                  {t('Cancel request')}
                </Text>
              </Tooltip>
            </View>
          )}
        </View>
        {children}
      </View>
    </BottomSheet>
  )
}

export default React.memo(HardwareWalletSigningModal)
