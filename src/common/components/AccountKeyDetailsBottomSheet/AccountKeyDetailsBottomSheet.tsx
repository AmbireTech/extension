import React, { FC, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import { KeyPreferences } from '@ambire-common/interfaces/settings'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { HARDWARE_WALLET_DEVICE_NAMES } from '@web/modules/hardware-wallet/constants/names'

interface Props {
  sheetRef: any
  type?: KeyPreferences[number]['type']
  meta?: Key['meta']
  closeBottomSheet: () => void
  children: ReactNode | ReactNode[]
}

const AccountKeyDetailsBottomSheet: FC<Props> = ({
  sheetRef,
  type,
  meta,
  closeBottomSheet,
  children
}) => {
  const { t } = useTranslation()

  // TODO: Implement internal key details
  if (type === 'internal') return null

  // Ideally, the meta should be all in there, but just in case, add fallbacks
  const metaDetails = useMemo(
    () => [
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
        key: t('Derivation'),
        value: meta?.hdPathTemplate ? getHdPathFromTemplate(meta?.hdPathTemplate, meta?.index) : '-'
      }
    ],
    [t, type, meta?.deviceId, meta?.deviceModel, meta?.hdPathTemplate, meta?.index]
  )

  return (
    <BottomSheet
      adjustToContentHeight={false}
      id="account-key-details"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <Text fontSize={18} weight="medium" style={spacings.mbSm}>
        {t('Key Details')}
      </Text>
      <View
        style={[
          {
            // TODO: Move to styles.
            backgroundColor: colors.white,
            borderRadius: BORDER_RADIUS_PRIMARY,
            borderWidth: 1,
            borderColor: '#CACDE6'
          }
        ]}
      >
        {children}
        <View style={[spacings.phSm, spacings.pvSm, spacings.mtMi]}>
          {metaDetails.map(({ key, value }) => (
            <View
              key={key}
              style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.mbMi]}
            >
              <Text fontSize={14}>{key}: </Text>
              <Text fontSize={14} weight="semiBold">
                {value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </BottomSheet>
  )
}

export default AccountKeyDetailsBottomSheet
