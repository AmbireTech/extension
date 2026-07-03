import React, { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import FatToggle from '@common/components/FatToggle'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const InternalLogsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    state: { namespaces },
    dispatch
  } = useController('DebugController')
  const { control, watch } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })
  const query = watch('search')

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return namespaces
    return namespaces.filter(({ name }) => name.toLowerCase().includes(normalizedQuery))
  }, [namespaces, query])

  const toggle = useCallback(
    (name: string, enabled: boolean) => {
      dispatch({
        type: 'method',
        params: { method: 'setNamespaceEnabled', args: [name, !enabled] }
      })
    },
    [dispatch]
  )

  return (
    <LayoutWrapper>
      <HeaderWithTitle />

      <View style={[spacings.ph, spacings.ptSm]}>
        <Text appearance="secondaryText" fontSize={12} style={spacings.mbSm}>
          {t(
            'Toggle per-controller debug logging at runtime. Output is written to the service-worker console (Inspect the background service worker in chrome://extensions), not shown here. Toggles persist across restarts.'
          )}
        </Text>

        <Search
          control={control}
          placeholder={t('Filter controllers...')}
          containerStyle={spacings.mbSm}
        />
      </View>

      <ScrollableWrapper
        contentContainerStyle={[spacings.ph, spacings.pbLg]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map(({ name, enabled }) => (
          <View
            key={name}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.ph,
              spacings.pvTy,
              spacings.mbMi,
              common.borderRadiusPrimary,
              { backgroundColor: theme.secondaryBackground }
            ]}
          >
            <Text fontSize={14} weight="medium">
              {name}
            </Text>
            <FatToggle isOn={enabled} onToggle={() => toggle(name, enabled)} disabled={false} />
          </View>
        ))}

        {!filtered.length && (
          <Text appearance="secondaryText" fontSize={14} style={spacings.ptSm}>
            {t('No controllers match "{{query}}".', { query })}
          </Text>
        )}
      </ScrollableWrapper>
    </LayoutWrapper>
  )
}

export default React.memo(InternalLogsScreen)
