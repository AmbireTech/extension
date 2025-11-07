import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, View } from 'react-native'

import { validateAddress } from '@ambire-common/services/validations'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CloseIcon from '@common/assets/svg/CloseIcon'
import CopyIcon from '@common/assets/svg/CopyIcon'
import EnsIcon from '@common/assets/svg/EnsIcon'
import AddressBookContact from '@common/components/AddressBookContact'
import Button from '@common/components/Button'
import Input, { InputProps } from '@common/components/Input'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import getStyles from './styles'

export interface AddressValidation {
  isError: boolean
  message: string
}

interface Props extends InputProps {
  withDetails?: boolean
  ensAddress: string
  isRecipientDomainResolving: boolean
  validation: AddressValidation
  label?: string
  onClearButtonPress?: () => void
}

const AddressInput: React.FC<Props> = ({
  withDetails,
  onChangeText,
  ensAddress,
  isRecipientDomainResolving,
  label,
  validation,
  containerStyle = {},
  placeholder,
  childrenBeforeButtons,
  onClearButtonPress,
  value,
  ...rest
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)
  const { contacts } = useAddressBookControllerState()
  const { message, isError } = validation
  const isValidationInDomainResolvingState = message === 'Resolving domain...'
  const inputRef = useRef<TextInput | null>(null)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })
  const setInputRef = useCallback((ref: TextInput | null) => {
    if (ref) inputRef.current = ref
  }, [])

  const handleCopyResolvedAddress = useCallback(async () => {
    const address = ensAddress

    if (address) {
      try {
        await setStringAsync(address)
        addToast(t('Copied to clipboard!'), { timeout: 2500 })
      } catch {
        addToast(t('Failed to copy address to clipboard'), { type: 'error' })
      }
    }
  }, [addToast, ensAddress, t])

  const address = ensAddress || value || ''

  const isValidAddress = useMemo(() => !!validateAddress(address).success, [address])

  return (
    <>
      {label && (
        <Text fontSize={14} appearance="secondaryText" weight="regular" style={styles.label}>
          {label}
        </Text>
      )}
      <Input
        // Purposefully spread props here, so that we don't override AddressInput's props
        {...rest}
        value={value}
        setInputRef={setInputRef}
        onChangeText={onChangeText}
        testID="address-ens-field"
        containerStyle={containerStyle}
        validLabel={!isError && !isValidationInDomainResolvingState ? message : ''}
        error={isError ? message : ''}
        isValid={!isError && !isValidationInDomainResolvingState}
        placeholder={placeholder || t('Address / ENS')}
        bottomLabelStyle={styles.bottomLabel}
        info={isValidationInDomainResolvingState ? t('Resolving domain...') : ''}
        childrenBeforeButtons={
          childrenBeforeButtons ||
          (!withDetails && (
            <>
              {ensAddress && !isRecipientDomainResolving ? (
                <AnimatedPressable
                  style={[flexbox.alignCenter, flexbox.directionRow, animStyle]}
                  onPress={handleCopyResolvedAddress}
                  {...bindAnim}
                >
                  <Text style={flexbox.flex1} numberOfLines={1}>
                    <Text
                      style={{
                        flex: 1
                      }}
                      fontSize={12}
                      appearance="secondaryText"
                      numberOfLines={1}
                      ellipsizeMode="head"
                    >
                      ({shortenAddress(ensAddress, 18)})
                    </Text>
                  </Text>
                  <CopyIcon width={16} height={16} style={[spacings.mlMi, { minWidth: 16 }]} />
                </AnimatedPressable>
              ) : null}
              <View style={[styles.domainIcons, rest.button ? spacings.pr0 : spacings.pr]}>
                {childrenBeforeButtons}
                <View style={styles.plTy}>
                  <EnsIcon isActive={!!ensAddress} />
                </View>
              </View>
            </>
          ))
        }
        customInputContent={
          !!withDetails && !!isValidAddress ? (
            <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
              <AddressBookContact
                avatarSize={36}
                key={address}
                style={{
                  borderRadius: 0,
                  ...spacings.ph0,
                  ...spacings.pv0
                }}
                address={address}
                name={contacts.find((c) => c.address.toLowerCase() === address.toLowerCase())?.name}
              />
            </View>
          ) : null
        }
        button={
          rest.button ||
          (value && withDetails ? (
            <View style={[flexbox.alignCenter, flexbox.directionRow]}>
              <Button
                size="tiny"
                hasBottomSpacing={false}
                text={t('Clear')}
                type="gray"
                style={{ ...spacings.phTy, height: 28 }}
                accentColor={theme.secondaryText}
                onPress={() => {
                  !!onChangeText && onChangeText('')
                  inputRef?.current?.focus()
                  !!onClearButtonPress && onClearButtonPress()
                }}
              >
                <CloseIcon width={12} height={12} strokeWidth="1.75" style={spacings.mlMi} />
              </Button>
            </View>
          ) : null)
        }
      />
    </>
  )
}

export default React.memo(AddressInput)
