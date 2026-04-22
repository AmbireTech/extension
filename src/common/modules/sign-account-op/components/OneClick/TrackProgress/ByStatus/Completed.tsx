import React, { FC, useCallback } from 'react'
import { Pressable, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import CopyText from '@common/components/CopyText'

type CompletedProps = {
  isLoading?: boolean
  title: string
  titleSecondary: string
  openExplorerText: string
  explorerLink?: string
  beforeLinkOpenHandler?: Function
}

const Completed: FC<CompletedProps> = ({
  isLoading,
  title,
  titleSecondary,
  openExplorerText,
  explorerLink,
  beforeLinkOpenHandler
}) => {
  const { addToast } = useToast()
  const { theme } = useTheme()

  const handleOpenExplorer = useCallback(async () => {
    if (!explorerLink) return

    if (beforeLinkOpenHandler) await beforeLinkOpenHandler()

    try {
      await openInTab({ url: explorerLink })
    } catch {
      addToast('Error opening explorer', { type: 'error' })
    }
  }, [addToast, explorerLink, beforeLinkOpenHandler])

  return (
    <View style={flexbox.alignCenter}>
      <SuccessAnimation style={spacings.mbSm} isLoading={isLoading} />
      <Text fontSize={20} weight="medium" style={spacings.mbTy} testID="txn-status">
        {title}
      </Text>
      <Text weight="medium" appearance="secondaryText" style={spacings.mbXl}>
        {titleSecondary}
      </Text>
      {(!!explorerLink || isLoading) && (
        <Pressable
          onPress={handleOpenExplorer}
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifyCenter,
            spacings.plSm,
            spacings.prTy,
            spacings.pvTy,
            isLoading && { opacity: 0 }
          ]}
          disabled={isLoading}
        >
          <Text
            weight="medium"
            fontSize={12}
            style={{
              textDecorationLine: 'underline',
              textDecorationColor: theme.primaryAccent,
              textDecorationStyle: 'solid'
            }}
            appearance="primary"
          >
            {openExplorerText}
          </Text>
          {explorerLink && <CopyText text={explorerLink} style={spacings.mlMi} />}
        </Pressable>
      )}
    </View>
  )
}

export default React.memo(Completed)
