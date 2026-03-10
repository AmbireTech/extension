import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddressBookContact from '@common/components/AddressBookContact'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'

interface Props {
  sheetRef: any
  closeBottomSheet: () => void
  address: string
}

const AddContactBottomSheet: FC<Props> = ({ sheetRef, closeBottomSheet, address }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const [name, setName] = useState('')

  const handleAddContact = () => {
    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_ADD_CONTACT',
      params: {
        address,
        name
      }
    })
    closeBottomSheet()
    setName('')
    addToast(t('Contact added to Address Book'))
  }

  const buttonsContent = (
    <>
      <Button
        hasBottomSpacing={false}
        type="secondary"
        text={t('Cancel')}
        onPress={closeBottomSheet}
        style={isWeb && { minWidth: 96, ...spacings.mrLg }}
        size={isWeb ? 'smaller' : 'regular'}
      />
      <Button
        testID="form-add-to-contacts-button"
        style={isWeb && { minWidth: 160 }}
        disabled={!address || name.length === 0 || name.length > 32}
        hasBottomSpacing={isMobile}
        text={!name.length ? t('Name your contact') : t('Add to contacts')}
        onPress={handleAddContact}
        size={isWeb ? 'smaller' : 'regular'}
      />
    </>
  )

  return (
    <BottomSheet id="transfer-add-contact" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
      <ModalHeader title={t('Add contact')} handleClose={closeBottomSheet} />
      <Input
        testID="form-contact-name-field"
        label={t('Name')}
        placeholder={t('Contact name')}
        onChangeText={setName}
        defaultValue={name}
        maxLength={32}
        backgroundColor={theme.secondaryBackground}
        onSubmitEditing={handleAddContact}
      />
      <Text fontSize={14} appearance="secondaryText">
        {t('Preview')}
      </Text>
      <AddressBookContact
        avatarSize={32}
        name={name || t('Give your contact a name')}
        address={address}
        isEditable={false}
        style={spacings.mb2Xl}
      />
      {isWeb ? (
        <FooterGlassView size="sm" absolute={false}>
          {buttonsContent}
        </FooterGlassView>
      ) : (
        <View style={{ flexDirection: 'column-reverse' }}>{buttonsContent}</View>
      )}
    </BottomSheet>
  )
}

export default React.memo(AddContactBottomSheet)
