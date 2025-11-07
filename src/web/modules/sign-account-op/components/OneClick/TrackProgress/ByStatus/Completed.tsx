import React, { FC, useCallback } from 'react'
import { Pressable } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'

type CompletedProps = {
  title: string
  titleSecondary: string
  openExplorerText: string
  explorerLink?: string
}

const Completed: FC<CompletedProps> = ({
  title,
  titleSecondary,
  openExplorerText,
  explorerLink
}) => {
  const { addToast } = useToast()
  const { theme } = useTheme()

  const handleOpenExplorer = useCallback(async () => {
    if (!explorerLink) return
    try {
      await openInTab({ url: explorerLink })
    } catch {
      addToast('Error opening explorer', { type: 'error' })
    }
  }, [addToast, explorerLink])

  return (
    <SuccessAnimation width={600}>
      <Text fontSize={20} weight="medium" style={spacings.mbTy} testID="txn-status">
        {title}
      </Text>
      <Text weight="medium" appearance="secondaryText" style={spacings.mbXl}>
        {titleSecondary}
      </Text>
      {!!explorerLink && (
        <Pressable
          onPress={handleOpenExplorer}
          style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter]}
        >
          <OpenIcon color={theme.primary} width={16} height={16} style={spacings.mrTy} />
          <Text
            weight="medium"
            style={{
              textDecorationLine: 'underline',
              textDecorationColor: theme.primary,
              textDecorationStyle: 'solid'
            }}
            appearance="primary"
          >
            {openExplorerText}
          </Text>
        </Pressable>
      )}
    </SuccessAnimation>
  )
}

export default Completed
