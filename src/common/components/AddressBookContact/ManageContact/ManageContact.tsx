import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import Dialog from '@common/components/Dialog'
import DialogButton from '@common/components/Dialog/DialogButton'
import DialogFooter from '@common/components/Dialog/DialogFooter'
import Dropdown from '@common/components/Dropdown'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  address: string
  name: string
}

const ManageContact: FC<Props> = ({ address, name }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { dispatch: addressBookDispatch } = useController('AddressBookController')
  const { ref: dialogRef, open: openDialog, close: closeDialog } = useModalize()

  const menu = useMemo(
    () => [
      { label: t('Delete Contact'), value: 'delete', style: { color: theme.errorDecorative } }
    ],
    [t, theme.errorDecorative]
  )

  const onSelect = (item: { label: string; value: string }) => {
    if (item.value === 'delete') openDialog()
  }

  const removeContact = () => {
    addressBookDispatch({
      type: 'method',
      params: {
        method: 'removeManuallyAddedContact',
        args: [address]
      }
    })
    closeDialog()
    addToast(t(`Successfully deleted ${name} from your Address Book.`))
  }

  return (
    <>
      <Dropdown data={menu} onSelect={onSelect} kebabIconProps={{ width: 28, height: 28 }} />
      <Dialog
        dialogRef={dialogRef}
        id="delete-contact"
        title={t('Delete Contact')}
        text={t(`Are you sure you want to delete ${name} from your Address Book?`)}
        closeDialog={closeDialog}
      >
        <DialogFooter horizontalAlignment="justifyEnd">
          {isWeb && (
            <DialogButton text={t('Close')} type="secondary" onPress={() => closeDialog()} />
          )}
          <DialogButton
            style={isWeb ? spacings.ml : flexbox.flex1}
            text={t('Delete')}
            type="danger"
            onPress={removeContact}
          />
        </DialogFooter>
      </Dialog>
    </>
  )
}

export default ManageContact
