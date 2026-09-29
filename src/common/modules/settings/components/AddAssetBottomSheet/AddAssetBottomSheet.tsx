import React, { FC, ReactNode, useCallback, useMemo } from 'react'
import { Control, Controller } from 'react-hook-form'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconIdType } from '@common/components/NetworkIcon/NetworkIcon'
import Select from '@common/components/Select'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const NETWORK_ICON_SIZE = isMobile ? 28 : 32
// Keeps the bottom sheet from resizing while the asset is being checked
const FEEDBACK_MIN_HEIGHT = 50

type Props = {
  id: string
  sheetRef: React.RefObject<any>
  handleClose: () => void
  title: string
  headerTestID: string
  /** Of the address field, e.g. 'Token address' */
  addressLabel: string
  addressFieldTestID: string
  addressError?: string
  network?: Network
  onNetworkChange: (network: Network) => void
  submitText: string
  submitTestID: string
  isSubmitDisabled: boolean
  onSubmit: () => void
  control: Control<any>
  /** Rendered under the address, e.g. the id of a collectible */
  extraFields?: ReactNode
  /** Validation result of the entered address - a preview, an alert or a spinner */
  children: ReactNode
}

/**
 * The chrome of the flows that add a custom asset. The validation and its
 * feedback live in the callers.
 */
const AddAssetBottomSheet: FC<Props> = ({
  id,
  sheetRef,
  handleClose,
  title,
  headerTestID,
  addressLabel,
  addressFieldTestID,
  addressError,
  network,
  onNetworkChange,
  submitText,
  submitTestID,
  isSubmitDisabled,
  onSubmit,
  control,
  extraFields,
  children
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks, isInitialized } = useController('NetworksController').state

  const networksOptions = useMemo(
    () =>
      networks.map((n) => ({
        value: n.name,
        label: <Text weight="medium">{t(n.name)}</Text>,
        icon: (
          <NetworkIcon
            key={n.chainId.toString()}
            id={n.chainId.toString()}
            name={n.name as NetworkIconIdType}
            size={NETWORK_ICON_SIZE}
          />
        )
      })),
    [networks, t]
  )

  const handleSetNetworkValue = useCallback(
    ({ value }: { value: string }) => {
      const selectedNetwork = networks.find((net) => net.name === value)

      if (!selectedNetwork) return

      onNetworkChange(selectedNetwork)
    },
    [networks, onNetworkChange]
  )

  return (
    <BottomSheet id={id} sheetRef={sheetRef} closeBottomSheet={handleClose}>
      <ModalHeader title={title} handleClose={handleClose} headerTestID={headerTestID} />
      {isInitialized && network ? (
        <View>
          <Select
            setValue={handleSetNetworkValue as any}
            options={networksOptions}
            value={networksOptions.filter((opt) => opt.value === network.name)[0]}
            label={t('Choose network')}
            containerStyle={spacings.mbMd}
            selectStyle={{ backgroundColor: theme.secondaryBackground }}
          />
          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                testID={addressFieldTestID}
                onBlur={onBlur}
                onChangeText={onChange}
                label={addressLabel}
                placeholder={t('0x...')}
                value={value}
                containerStyle={spacings.mbSm}
                error={addressError}
                backgroundColor={theme.secondaryBackground}
              />
            )}
          />
          {extraFields}
          <View
            style={[
              isMobile && spacings.mbLg,
              isWeb && spacings.mbXl,
              { minHeight: FEEDBACK_MIN_HEIGHT }
            ]}
          >
            {children}
          </View>
          <Button
            testID={submitTestID}
            disabled={isSubmitDisabled}
            text={submitText}
            hasBottomSpacing={false}
            onPress={onSubmit}
          />
        </View>
      ) : (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, spacings.pv]}>
          <Text fontSize={16} weight="medium">
            {t('Preparing networks. Please wait...')}
          </Text>
          <Text fontSize={16} style={spacings.mbMd} weight="medium">
            {t('If this takes too long, please try again later.')}
          </Text>
          <Spinner style={{ width: 24, height: 24 }} />
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(AddAssetBottomSheet)
