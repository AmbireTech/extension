import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import EnsIcon from '@common/assets/svg/EnsIcon'
import Input, { InputProps } from '@common/components/Input'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import getStyles from './styles'

export interface AddressValidation {
  isError: boolean
  message: string
}

interface Props extends InputProps {
  ensAddress: string
  isRecipientDomainResolving: boolean
  validation: AddressValidation
  label?: string
}

const AddressInput: React.FC<Props> = ({
  onChangeText,
  ensAddress,
  isRecipientDomainResolving,
  label,
  validation,
  containerStyle = {},
  placeholder,
  childrenBeforeButtons,
  ...rest
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles } = useTheme(getStyles)
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  const { message, isError } = validation
  const isValidationInDomainResolvingState = message === 'Resolving domain...'

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

  return (
    <>
      {label && (
        <Text fontSize={14} appearance="secondaryText" weight="regular" style={styles.label}>
          {label}
        </Text>
      )}
      <Input
        onChangeText={onChangeText}
        // Purposefully spread props here, so that we don't override AddressInput's props
        testID="address-ens-field"
        {...rest}
        containerStyle={containerStyle}
        validLabel={!isError && !isValidationInDomainResolvingState ? message : ''}
        error={isError ? message : ''}
        isValid={!isError && !isValidationInDomainResolvingState}
        placeholder={placeholder || t('Address / ENS')}
        bottomLabelStyle={styles.bottomLabel}
        info={isValidationInDomainResolvingState ? t('Resolving domain...') : ''}
        childrenBeforeButtons={
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
                <CopyIcon
                  width={16}
                  height={16}
                  style={[
                    spacings.mlMi,
                    {
                      minWidth: 16
                    }
                  ]}
                />
              </AnimatedPressable>
            ) : null}
            <View style={[styles.domainIcons, rest.button ? spacings.pr0 : spacings.pr]}>
              {childrenBeforeButtons}
              <View style={styles.plTy}>
                <EnsIcon isActive={!!ensAddress} />
              </View>
            </View>
          </>
        }
      />
    </>
  )
}

export default React.memo(AddressInput)
