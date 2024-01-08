import { Mnemonic } from 'ethers'
import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import InfoIcon from '@common/assets/svg/InfoIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TextArea from '@common/components/TextArea'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent,
  TabLayoutWrapperSideContent,
  TabLayoutWrapperSideContentItem
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import Stepper from '@web/modules/router/components/Stepper'

function isValidMnemonic(input: string) {
  const separators = /[\s,;\n]+/
  const words = input.trim().split(separators)

  return Mnemonic.isValidMnemonic(words.join(' '))
}

const ExternalSignerLoginScreen = () => {
  const { updateStepperState } = useStepper()
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      privKeyOrSeed: '',
      label: ''
    }
  })
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    updateStepperState(WEB_ROUTES.externalSigner, 'legacy')
  }, [updateStepperState])

  const handleFormSubmit = useCallback(() => {
    handleSubmit(({ privKeyOrSeed, label }) => {
      let formattedPrivKeyOrSeed = privKeyOrSeed.trim()

      if (isValidPrivateKey(privKeyOrSeed)) {
        formattedPrivKeyOrSeed =
          privKeyOrSeed.slice(0, 2) === '0x' ? privKeyOrSeed.slice(2) : privKeyOrSeed
      }

      navigate(WEB_ROUTES.accountAdder, {
        state: {
          keyType: 'internal',
          privKeyOrSeed: formattedPrivKeyOrSeed,
          label
        }
      })
    })()
  }, [handleSubmit, navigate])

  const handleValidation = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue.length) return ''

    const separators = /[\s,;\n]+/
    const words = trimmedValue.split(separators)

    const isValidMnemonicValue = isValidMnemonic(trimmedValue)

    const allowedSeedPhraseLengths = [12, 15, 18, 21, 24]

    if (allowedSeedPhraseLengths.includes(words.length) && !isValidMnemonicValue) {
      return 'Your seed phrase length is valid, but a word is misspelled.'
    }

    if (words.length > 1 && !isValidMnemonicValue) {
      return 'A seed phrase must be 12-24 words long.'
    }

    if (
      words.length === 1 &&
      /^(0x)?[0-9a-fA-F]/.test(trimmedValue) &&
      !isValidPrivateKey(trimmedValue)
    ) {
      return 'Invalid private key.'
    }

    if (!(isValidPrivateKey(trimmedValue) || isValidMnemonic(trimmedValue))) {
      return 'Please enter a valid seed phrase or private key.'
    }

    return undefined
  }

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      width="xl"
      header={
        <Header mode="custom-inner-content" withAmbireLogo>
          <Stepper />
        </Header>
      }
      footer={
        <>
          <BackButton />
          <Button
            text={t('Import Legacy Account')}
            hasBottomSpacing={false}
            onPress={handleFormSubmit}
            disabled={!isValid}
          >
            <View style={spacings.pl}>
              <RightArrowIcon color={colors.titan} />
            </View>
          </Button>
        </>
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel title={t('Import Legacy Account')}>
          <Controller
            control={control}
            rules={{ validate: (value) => handleValidation(value), required: true }}
            name="privKeyOrSeed"
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <TextArea
                  value={value}
                  editable
                  autoFocus
                  multiline
                  numberOfLines={7}
                  placeholder={t('Enter a seed phrase or private key')}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isValid={!handleValidation(value) && !!value.length}
                  error={errors?.privKeyOrSeed?.message || ' '}
                  placeholderTextColor={theme.secondaryText}
                  onSubmitEditing={handleFormSubmit}
                />
              )
            }}
          />

          <Text
            style={[spacings.plTy, spacings.mbTy]}
            shouldScale={false}
            fontSize={16}
            weight="medium"
          >
            {t('Key label')}
          </Text>
          <Controller
            control={control}
            rules={{ maxLength: 24, minLength: 6 }}
            name="label"
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <Input
                  value={value}
                  editable
                  numberOfLines={1}
                  placeholder={
                    isValidPrivateKey(watch('privKeyOrSeed')) ? t('Private Key') : t('Seed')
                  }
                  onChangeText={onChange}
                  onBlur={onBlur}
                  isValid={value.length >= 6 && value.length <= 24}
                  error={errors.label && t('Key labels must be 6-24 characters long.')}
                  placeholderTextColor={theme.secondaryText}
                  onSubmitEditing={handleFormSubmit}
                />
              )
            }}
          />
        </Panel>
      </TabLayoutWrapperMainContent>
      <TabLayoutWrapperSideContent>
        <TabLayoutWrapperSideContentItem>
          <TabLayoutWrapperSideContentItem.Group>
            <TabLayoutWrapperSideContentItem.Row
              Icon={InfoIcon}
              title="Importing legacy accounts"
            />
            <TabLayoutWrapperSideContentItem.Text>
              By inserting a private key or a seed phrase, you can import traditional legacy
              accounts (also known as EOAs - externally owned accounts). If you enter a seed phrase,
              you will be given a list of multiple legacy accounts to choose from. For each legacy
              account you import, you also have the option to import a smart account, powered by the
              same private key. This smart account will have a different address. Smart accounts
              have many benefits, including account recovery, transaction batching and much more.
            </TabLayoutWrapperSideContentItem.Text>
          </TabLayoutWrapperSideContentItem.Group>
          <TabLayoutWrapperSideContentItem.Group>
            <TabLayoutWrapperSideContentItem.Text>
              If you enter a seed phrase, you will be given a list of multiple legacy accounts to
              choose from.
            </TabLayoutWrapperSideContentItem.Text>
          </TabLayoutWrapperSideContentItem.Group>
          <TabLayoutWrapperSideContentItem.Group>
            <TabLayoutWrapperSideContentItem.Text>
              For each legacy account you import, you also have the option to import a smart
              account, powered by the same private key. This smart account will have a different
              address. Smart accounts have many benefits, including account recovery, transaction
              batching and much more.
            </TabLayoutWrapperSideContentItem.Text>
          </TabLayoutWrapperSideContentItem.Group>
          <TabLayoutWrapperSideContentItem.Group noMb>
            <TabLayoutWrapperSideContentItem.Title>Key Label</TabLayoutWrapperSideContentItem.Title>
            <TabLayoutWrapperSideContentItem.Text noMb>
              The key label is any arbitrary name you choose for this key, entirely up to you.
            </TabLayoutWrapperSideContentItem.Text>
          </TabLayoutWrapperSideContentItem.Group>
        </TabLayoutWrapperSideContentItem>
      </TabLayoutWrapperSideContent>
    </TabLayoutContainer>
  )
}

export default ExternalSignerLoginScreen
