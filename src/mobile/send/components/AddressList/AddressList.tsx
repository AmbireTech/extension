import { Address } from 'ambire-common/src/hooks/useAddressBook'
import React, { useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import BinIcon from '@assets/svg/BinIcon'
import Blockies from '@common/components/Blockies'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { useTranslation } from '@common/config/localization'
import useAccounts from '@common/hooks/useAccounts'
import useAddressBook from '@common/hooks/useAddressBook'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

type Props = {
  onSelectAddress?: (item: { name: string; address: string }) => void
  onOpenBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  onCloseBottomSheet?: (dest?: 'alwaysOpen' | 'default' | undefined) => void
}

const AddressList = ({ onSelectAddress, onOpenBottomSheet, onCloseBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { addresses, removeAddress } = useAddressBook()
  const { selectedAcc } = useAccounts()

  const items = useMemo(
    () => addresses.filter((x) => x.address !== selectedAcc),
    [addresses, selectedAcc]
  )

  const renderItem: any = (item: Address, i: number) => {
    const isLast = items.length - 1 === i
    const onRemoveAddress = () => removeAddress(item.name, item.address, item.type)

    const onPressAddress = () => {
      !!onSelectAddress && onSelectAddress(item)
      !!onCloseBottomSheet && onCloseBottomSheet()
    }

    return (
      <TouchableOpacity
        key={item.address + item.name}
        style={[styles.addressItem, spacings.mbTy, isLast && spacings.mb]}
        activeOpacity={0.8}
        onPress={onPressAddress}
      >
        <Blockies seed={item.address} />
        <View style={[flexboxStyles.flex1, spacings.phTy]}>
          <Text style={spacings.mbMi} fontSize={12} numberOfLines={1} ellipsizeMode="middle">
            {item.address}
          </Text>
          <Text fontSize={10} numberOfLines={1} color={colors.titan_50}>
            {item.name}
          </Text>
        </View>
        <TouchableOpacity onPress={onRemoveAddress}>
          <BinIcon />
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  return (
    <>
      <Title style={textStyles.center}>{t('Address Book')}</Title>
      {!!items.length && items.map(renderItem)}
      {!items.length && (
        <Text style={[textStyles.center, spacings.mb]}>{t('Your address book is empty.')}</Text>
      )}
      <Button
        onPress={() => {
          !!onOpenBottomSheet && onOpenBottomSheet()
          !!onCloseBottomSheet && onCloseBottomSheet()
        }}
        type="outline"
        text={t('Add Address')}
      />
    </>
  )
}

export default AddressList
