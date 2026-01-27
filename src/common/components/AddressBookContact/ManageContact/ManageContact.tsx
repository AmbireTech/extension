import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { TooltipRefProps } from 'react-tooltip'

import KebabMenuIcon from '@common/assets/svg/KebabMenuIcon'
import Dialog from '@common/components/Dialog'
import DialogButton from '@common/components/Dialog/DialogButton'
import DialogFooter from '@common/components/Dialog/DialogFooter'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

interface Props {
  tooltipRef: React.RefObject<TooltipRefProps>
  address: string
  name: string
}

const ManageContact: FC<Props> = ({ address, name, tooltipRef }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { dispatch } = useBackgroundService()
  const { ref: dialogRef, open: openDialog, close: closeDialog } = useModalize()
  const [bindRemoveBtnAnim, removeBtnAnimStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })

  const removeContact = () => {
    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_REMOVE_CONTACT',
      params: {
        address
      }
    })
    closeDialog()
    addToast(t(`Successfully deleted ${name} from your Address Book.`))
  }

  return (
    <>
      <Pressable
        style={[
          spacings.mlSm,
          flexbox.center,
          {
            width: 20,
            height: 20
          }
        ]}
        dataSet={{
          tooltipId: `${address}`
        }}
      >
        {({ hovered }: any) => (
          <KebabMenuIcon color={hovered ? theme.primaryText : theme.secondaryText} height={16} />
        )}
      </Pressable>
      <Tooltip
        tooltipRef={tooltipRef}
        id={address}
        style={{
          padding: 0,
          overflow: 'hidden'
        }}
        clickable
        openOnClick
        closeEvents={{ click: true, blur: true }}
        noArrow
        place="left"
        withPortal={false}
      >
        <AnimatedPressable
          style={[text.center, spacings.pvTy, spacings.ph, removeBtnAnimStyle]}
          onPress={() => openDialog()}
          {...bindRemoveBtnAnim}
        >
          <Text fontSize={12}>{t('Delete Contact')}</Text>
        </AnimatedPressable>
      </Tooltip>
      <Dialog
        dialogRef={dialogRef}
        id="delete-contact"
        title={t('Delete Contact')}
        text={t(`Are you sure you want to delete ${name} from your Address Book?`)}
        closeDialog={closeDialog}
      >
        <DialogFooter horizontalAlignment="justifyEnd">
          <DialogButton text={t('Close')} type="secondary" onPress={() => closeDialog()} />
          <DialogButton
            style={spacings.ml}
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
