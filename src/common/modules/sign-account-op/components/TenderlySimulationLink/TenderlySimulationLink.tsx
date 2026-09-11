import React, { FC, useCallback } from 'react'
import { Linking, View, ViewStyle } from 'react-native'

import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  tenderlyLink?: string | null
  text: string
  renderIcon?: React.ReactNode
  style?: ViewStyle
}

const iconContainerStyle: ViewStyle = {}
const buttonStyle: ViewStyle = {
  width: 21,
  height: 21,
  ...spacings.ph0,
  ...spacings.pv0
}
const innerContainerStyle = (): ViewStyle => ({
  width: 21,
  height: 21,
  ...spacings.ph0,
  ...spacings.pv0,
  ...flexbox.justifyCenter
})

const TenderlySimulationLink: FC<Props> = ({ tenderlyLink, text, renderIcon, style }) => {
  const { addToast } = useToast()
  const { t } = useTranslation()

  const handleOpenTenderly = useCallback(() => {
    if (!tenderlyLink) return

    Linking.openURL(tenderlyLink).catch(() => addToast(t('Failed to open link')))
  }, [addToast, t, tenderlyLink])

  if (!tenderlyLink) return null

  return (
    <View
      style={style}
      dataSet={createGlobalTooltipDataSet({
        id: 'tenderly-simulation-tooltip',
        content: text
      })}
    >
      <Button
        type="ghost"
        size="small"
        onPress={handleOpenTenderly}
        hasBottomSpacing={false}
        accessibilityLabel={text}
        style={buttonStyle}
        innerContainerStyle={innerContainerStyle}
        childrenContainerStyle={iconContainerStyle}
      >
        {renderIcon}
      </Button>
    </View>
  )
}

export default React.memo(TenderlySimulationLink)
