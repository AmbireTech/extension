import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, Pressable, View } from 'react-native'

import type { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import type { HumanizerWarning } from '@ambire-common/libs/humanizer/interfaces'
import { stringify } from '@ambire-common/libs/richJson/richJson'
import CopyText from '@common/components/CopyText'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Label from '@common/components/Label'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { Erc7730Visualization } from '@common/modules/sign-message/utils/isErc7730Visualization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import getStyles from '@web/modules/sign-message/screens/SignMessageScreen/styles'

type ActiveTab = 'parsed' | 'raw'

type Props = {
  data: Erc7730Visualization[]
  chainId: bigint
  responsiveSizeMultiplier: number
  messageContent?: NonNullable<ISignMessageController['messageToSign']>['content']
  warnings?: HumanizerWarning[]
}

const Erc7730TypedMessageContent = ({
  data,
  chainId,
  responsiveSizeMultiplier,
  messageContent,
  warnings
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const [activeTab, setActiveTab] = useState<ActiveTab>('parsed')
  const title = useMemo(() => data.find((item) => !!item.title)?.title, [data])
  const rawMessageContent = useMemo(
    () => (messageContent ? stringify(messageContent, { pretty: true }) : ''),
    [messageContent]
  )
  const tabs = useMemo(
    () =>
      [
        ['parsed', t('Parsed')],
        ['raw', t('Raw')]
      ] as const,
    [t]
  )
  const handleTabPress = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
  }, [])
  const handlePressTab = useCallback(
    (event: GestureResponderEvent, tab: ActiveTab) => {
      event.stopPropagation()
      handleTabPress(tab)
    },
    [handleTabPress]
  )

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
      <View style={styles.erc7730TypedMessageTitleRow}>
        <Text
          fontSize={16 * responsiveSizeMultiplier}
          weight="medium"
          color={theme.secondaryAccent400}
          numberOfLines={1}
          style={styles.erc7730TypedMessageTitle}
        >
          {title || t('Message details')}
        </Text>
      </View>
      <View style={[styles.erc7730TypedMessageTabHeader, spacings.mtTy]}>
        {tabs.map(([tab, label]) => {
          const isActive = activeTab === tab

          return (
            <Pressable
              key={tab}
              onPress={(event) => handlePressTab(event, tab)}
              style={[
                styles.erc7730TypedMessageTabButton,
                {
                  borderBottomColor: isActive ? theme.secondaryAccent400 : 'transparent'
                }
              ]}
            >
              <Text
                fontSize={14 * responsiveSizeMultiplier}
                weight={isActive ? 'semiBold' : 'medium'}
                color={isActive ? theme.secondaryAccent400 : theme.secondaryText}
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
      {activeTab === 'parsed' ? (
        <HumanizedVisualization
          data={data}
          chainId={chainId}
          sizeMultiplierSize={responsiveSizeMultiplier}
          textSize={14}
          hasPadding={false}
          erc7730Mode="description"
        />
      ) : (
        <View style={styles.erc7730TypedMessageRawContainer}>
          <View style={styles.erc7730TypedMessageRawActions}>
            <CopyText
              text={rawMessageContent}
              iconColor={theme.secondaryText}
              iconSize={20 * responsiveSizeMultiplier}
              shouldStopPropagation
            />
          </View>
          <Text
            selectable
            weight="regular"
            fontSize={(maxWidthSize('xl') ? 14 : 12) * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={styles.erc7730TypedMessageRawText}
          >
            {rawMessageContent}
          </Text>
        </View>
      )}
    </View>
  )
}

export default memo(Erc7730TypedMessageContent)
