import React, { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import { GEIST_MONO_FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import type { CustomNetworkFieldErrors } from '@web/extension-services/background/controllers/anon-rpc'
import { parseCustomNetwork } from '@web/extension-services/background/controllers/anon-rpc/customNetwork'
import { SPECIFIER_CHAINS } from '@web/extension-services/background/controllers/anon-rpc/specifierChains'

// Addresses and JSON read better in monospace, as in the preset details
const MONO_INPUT_STYLE = { fontFamily: GEIST_MONO_FONT_FAMILIES.REGULAR, fontSize: 13 }

const CHAIN_OPTIONS = SPECIFIER_CHAINS.map((chain) => ({ value: chain.chainId, label: chain.name }))

type Props = {
  initialSpecifier: string
  initialConfigText: string
  /** The chain the specifier contract lives on */
  initialChainId: number
  /** Whether the saved custom network is the one currently in use */
  isInUse: boolean
  /** The label of the network in use while this form is not saved yet */
  inUseLabel: string | null
  onSave: (specifier: string, configText: string, chainId: number) => void
}

/**
 * Edits the user's own privacy network. Holds its draft locally and only saves
 * valid input; the parent remounts it (via `key`) to load different starting values.
 */
const CustomNetworkForm = ({
  initialSpecifier,
  initialConfigText,
  initialChainId,
  isInUse,
  inUseLabel,
  onSave
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [specifier, setSpecifier] = useState(initialSpecifier)
  const [configText, setConfigText] = useState(initialConfigText)
  const [chainId, setChainId] = useState(initialChainId)
  const [errors, setErrors] = useState<CustomNetworkFieldErrors>({})

  const handleSpecifierChange = useCallback((value: string) => {
    setSpecifier(value)
    setErrors((prev) => ({ ...prev, specifier: undefined }))
  }, [])

  const selectedChainOption = useMemo(
    () => CHAIN_OPTIONS.find((option) => option.value === chainId) || null,
    [chainId]
  )

  const handleChainChange = useCallback((option: { value: string | number }) => {
    setChainId(Number(option.value))
    setErrors((prev) => ({ ...prev, chainId: undefined }))
  }, [])

  const handleConfigChange = useCallback((value: string) => {
    setConfigText(value)
    setErrors((prev) => ({ ...prev, config: undefined }))
  }, [])

  const handleSave = useCallback(() => {
    const { errors: validationErrors } = parseCustomNetwork(specifier, configText, chainId)
    if (validationErrors) {
      setErrors(validationErrors)
      return
    }
    onSave(specifier, configText, chainId)
  }, [chainId, configText, onSave, specifier])

  return (
    <View style={spacings.mtSm}>
      <Text fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Blockchain the contract is on')}
      </Text>
      <Select
        setValue={handleChainChange}
        withSearch={false}
        options={CHAIN_OPTIONS}
        value={selectedChainOption}
        containerStyle={{ width: 220, ...spacings.mbSm }}
        size="sm"
      />
      {!!errors.chainId && (
        <Text fontSize={12} appearance="errorText" style={spacings.mbSm}>
          {t(errors.chainId)}
        </Text>
      )}
      <Text fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Contract address')}
      </Text>
      <Input
        placeholder="0x…"
        value={specifier}
        onChangeText={handleSpecifierChange}
        error={errors.specifier ? t(errors.specifier) : undefined}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        backgroundColor={theme.secondaryBackground}
        nativeInputStyle={MONO_INPUT_STYLE}
      />
      <Text fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Configuration (JSON5, optional)')}
      </Text>
      <TextArea
        placeholder="{ key: 'value' } // comments allowed"
        value={configText}
        onChangeText={handleConfigChange}
        error={errors.config ? t(errors.config) : undefined}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        multiline
        inputWrapperStyle={{ height: 160, alignItems: 'baseline' }}
        nativeInputStyle={MONO_INPUT_STYLE}
      />
      <Text fontSize={12} appearance="secondaryText" style={spacings.mbSm}>
        {t(
          'Only use a network you trust. Its code runs separated from your wallet and can’t access your keys, but while this option is on it handles all of the wallet’s requests.'
        )}
      </Text>
      {!isInUse && !!inUseLabel && (
        <Text fontSize={12} style={[spacings.mbSm, { color: theme.warningText }]}>
          {t('Not in use yet: the wallet keeps using {{network}} until you save.', {
            network: inUseLabel
          })}
        </Text>
      )}
      <Button
        type="primary"
        size="small"
        text={isInUse ? t('Save changes') : t('Save and use')}
        onPress={handleSave}
        hasBottomSpacing={false}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  )
}

export default React.memo(CustomNetworkForm)
