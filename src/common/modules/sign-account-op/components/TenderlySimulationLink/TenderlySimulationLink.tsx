import React, { FC, useCallback } from 'react'
import { Linking, View, ViewStyle } from 'react-native'

import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'

type Props = {
  tenderlyLink?: string | null
  text: string
  renderIcon?: React.ReactNode
  style?: ViewStyle
}

const iconContainerStyle: ViewStyle = {}

const TenderlySimulationLink: FC<Props> = ({ tenderlyLink, text, renderIcon, style }) => {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const handleOpenTenderly = useCallback(() => {
    if (!tenderlyLink) return

    Linking.openURL(tenderlyLink).catch(() => addToast(t('Failed to open link')))
  }, [addToast, t, tenderlyLink])

  if (!tenderlyLink) return null

  return (
    <View style={style}>
      <Button
        type="outline"
        size="small"
        text={text}
        onPress={handleOpenTenderly}
        hasBottomSpacing={false}
        childrenPosition="right"
        childrenContainerStyle={iconContainerStyle}
      >
        {renderIcon}
      </Button>
    </View>
  )
}

export default React.memo(TenderlySimulationLink)
