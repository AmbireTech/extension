import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleProp, View, ViewStyle } from 'react-native'

import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  signingRequest: HardwareWalletSigningRequest
  style?: StyleProp<ViewStyle>
  maxContentHeight?: number
}

const requestLabelByType: Record<HardwareWalletSigningRequest['type'], string> = {
  'raw-transaction': 'raw transaction',
  'eip-712': 'EIP-712 data',
  'eip-7702-authorization': 'EIP-7702 authorization',
  message: 'message'
}

const stringifySigningRequest = (data: unknown) => {
  try {
    return (
      JSON.stringify(
        data,
        (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      ) || String(data)
    )
  } catch {
    return String(data)
  }
}

const SigningRequestDetails = ({ signingRequest, style, maxContentHeight = 220 }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const signingRequestJson = useMemo(
    () => stringifySigningRequest(signingRequest.data),
    [signingRequest.data]
  )
  const signingRequestLabel = requestLabelByType[signingRequest.type]

  useEffect(() => {
    setIsExpanded(false)
  }, [signingRequest])

  return (
    <View
      style={[
        {
          width: '100%',
          borderWidth: 1,
          borderColor: theme.secondaryBorder,
          borderRadius: 8,
          backgroundColor: theme.secondaryBackground,
          overflow: 'hidden'
        },
        style
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Toggle signing request details')}
        onPress={() => setIsExpanded((prev) => !prev)}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.ph,
          spacings.pvSm
        ]}
      >
        <Text weight="medium" fontSize={14}>
          {isExpanded
            ? t('Hide {{label}}', { label: signingRequestLabel })
            : t('View {{label}}', { label: signingRequestLabel })}
        </Text>
        {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
      </Pressable>
      {isExpanded && (
        <ScrollView style={[spacings.ph, spacings.pb, { maxHeight: maxContentHeight }]}>
          <Text
            selectable
            weight="mono_regular"
            fontSize={12}
            appearance="secondaryText"
            style={{ lineHeight: 18 }}
          >
            {signingRequestJson}
          </Text>
        </ScrollView>
      )}
    </View>
  )
}

export default React.memo(SigningRequestDetails)
