import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { HumanizerWarning } from '@ambire-common/libs/humanizer/interfaces'
import HumanizerAddress from '@common/components/HumanizerAddress'
import HumanizedVisualization, {
  Erc7730StructuredVisualization,
  getNestedErc7730Visualizations
} from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { Erc7730Visualization } from '@common/modules/sign-message/utils/isErc7730Visualization'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import getStyles from '@web/modules/sign-message/screens/SignMessageScreen/styles'

type Props = {
  data: Erc7730Visualization[]
  chainId: bigint
  responsiveSizeMultiplier: number
  warnings?: HumanizerWarning[]
}

const Erc7730TypedMessageContent = ({
  data,
  chainId,
  responsiveSizeMultiplier,
  warnings
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const title = useMemo(() => data.find((item) => !!item.title)?.title, [data])
  const nestedVisualizations = useMemo(
    () => data.flatMap((item) => getNestedErc7730Visualizations(item)),
    [data]
  )
  const hasNestedVisualizations = nestedVisualizations.length > 0

  return (
    <View style={{ width: '100%' }}>
      {!!warnings?.length && (
        <View style={[spacings.mbLg, flexbox.alignCenter, isMobile && flexbox.justifyCenter]}>
          {warnings.map((warning) => (
            <Label
              size="md"
              key={`${warning.content}-${warning.address || ''}`}
              text={warning.content}
              type="warning"
              hasBottomSpacing={false}
              hasRightSpacing={!isMobile}
              isCentered={isMobile}
              style={isMobile ? { maxWidth: '100%' } : undefined}
            >
              {!!warning.address && (
                <View style={spacings.mlMi}>
                  <HumanizerAddress
                    address={warning.address}
                    chainId={chainId}
                    fontSize={14}
                    actionsMode="inline"
                    shouldWrapInlineActions={false}
                    hideLogo
                  />
                </View>
              )}
            </Label>
          ))}
        </View>
      )}
      {hasNestedVisualizations ? (
        nestedVisualizations.map((nestedVisualization, nestedIndex) => (
          <View
            key={nestedVisualization.id}
            style={[
              nestedIndex > 0 && { marginTop: SPACING_TY * responsiveSizeMultiplier },
              spacings.pbMi
            ]}
          >
            <Erc7730StructuredVisualization
              item={nestedVisualization}
              chainId={chainId}
              sizeMultiplierSize={responsiveSizeMultiplier}
              textSize={14}
              mode="summary"
            />
          </View>
        ))
      ) : (
        <Text
          fontSize={16 * responsiveSizeMultiplier}
          weight="semiBold"
          color={theme.secondaryAccent400}
          style={styles.erc7730TypedMessageTitle}
        >
          {title || t('Message details')}
        </Text>
      )}
      <View
        style={[
          styles.erc7730TypedMessageDivider,
          {
            marginTop: SPACING_TY * responsiveSizeMultiplier,
            marginBottom: SPACING_TY * responsiveSizeMultiplier
          }
        ]}
      />
      <HumanizedVisualization
        data={data}
        chainId={chainId}
        sizeMultiplierSize={responsiveSizeMultiplier}
        textSize={14}
        hasPadding={false}
        erc7730Mode="description"
        hideNestedErc7730Rows={hasNestedVisualizations}
      />
    </View>
  )
}

export default memo(Erc7730TypedMessageContent)
