import React from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

const AddressBookSection = () => {
  const { styles } = useTheme(getStyles)
  return (
    <View>
      <Text style={styles.title} fontSize={16} weight="regular">
        Address Book
      </Text>
      <Text fontSize={14}>Your Address Book is empty.</Text>
      <Text fontSize={14} style={spacings.mbXl}>
        Wanna add some?
      </Text>
      <Button
        type="outline"
        style={styles.button}
        // @TODO: implement address book
        disabled
        textStyle={styles.buttonText}
        text="Add Address"
      />
    </View>
  )
}

export default AddressBookSection
