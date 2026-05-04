import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { ExternalKey } from '@ambire-common/interfaces/keystore'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import AmbireDevice from '@common/assets/svg/AmbireDevice'
import CloseIcon from '@common/assets/svg/CloseIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import DriveIcon from '@common/assets/svg/DriveIcon'
import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import LeftPointerArrowIcon from '@common/assets/svg/LeftPointerArrowIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
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
  signingRequest?: HardwareWalletSigningRequest | null
}

const iconByKeyType = {
  trezor: TrezorLockIcon,
  ledger: LedgerLetterIcon,
  lattice: LatticeIcon
}

const { isTab } = getUiType()

const requestLabelByType: Record<HardwareWalletSigningRequest['type'], string> = {
  'raw-transaction': 'raw transaction',
  'eip-712': 'EIP-712 data',
  'eip-7702-authorization': 'EIP-7702 authorization',
  message: 'message'
}

const stringifySigningRequest = (data: unknown) => {
  try {
    return (
      JSON.stringify(
        data,
        (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      ) || String(data)
    )
  } catch {
    return String(data)
  }
}

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
  const [isSigningRequestExpanded, setIsSigningRequestExpanded] = useState(false)

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [open, close, isVisible])

  useEffect(() => {
    setIsSigningRequestExpanded(false)
  }, [isVisible, signingRequest])

  const titleSuffix = useMemo(() => {
    const Icon = keyType && iconByKeyType[keyType as keyof typeof iconByKeyType]
    if (!Icon) return undefined

    return <Icon style={spacings.mlTy} width={32} height={32} />
  }, [keyType])

  const isTrezor = useMemo(() => {
    return HARDWARE_WALLET_DEVICE_NAMES[keyType] === 'Trezor'
  }, [keyType])

  const signingRequestJson = useMemo(
    () => stringifySigningRequest(signingRequest?.data),
    [signingRequest?.data]
  )
  const signingRequestLabel = signingRequest ? requestLabelByType[signingRequest.type] : ''

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
      >
        {isTrezor && !!cancelReq && (
          <>
            <Pressable
              onPress={cancelReq}
              style={spacings.mr}
              dataSet={{ tooltipId: 'trezor-cancel-sign-tooltip' }}
            >
              <CloseIcon />
            </Pressable>
            <Tooltip id="trezor-cancel-sign-tooltip">
              <Text fontSize={14} appearance="secondaryText">
                {t('Cancel request')}
              </Text>
            </Tooltip>
          </>
        )}
      </ModalHeader>
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
          <View
            style={[
              spacings.mtLg,
              {
                width: '100%',
                borderWidth: 1,
                borderColor: theme.secondaryBorder,
                borderRadius: 8,
                backgroundColor: theme.secondaryBackground,
                overflow: 'hidden'
              }
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('Toggle signing request details')}
              onPress={() => setIsSigningRequestExpanded((prev) => !prev)}
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                spacings.ph,
                spacings.pvSm
              ]}
            >
              <Text weight="medium" fontSize={14}>
                {isSigningRequestExpanded
                  ? t('Hide {{label}}', { label: signingRequestLabel })
                  : t('View {{label}}', { label: signingRequestLabel })}
              </Text>
              {isSigningRequestExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
            </Pressable>
            {isSigningRequestExpanded && (
              <ScrollView style={[spacings.ph, spacings.pb, { maxHeight: 220 }]}>
                <Text
                  selectable
                  weight="mono_regular"
                  fontSize={12}
                  appearance="secondaryText"
                  style={{ lineHeight: 18 }}
                >
                  {signingRequestJson}
                </Text>
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </BottomSheet>
  )
}

export default React.memo(HardwareWalletSigningModal)
