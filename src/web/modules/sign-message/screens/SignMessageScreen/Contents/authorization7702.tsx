import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import BasicToSmart from '@common/assets/svg/BasicToSmart'
import BatchIcon from '@common/assets/svg/BatchIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import Card from '@web/modules/auth/components/Card'

interface Props {
  onDoNotAskMeAgainChange?: () => void
  doNotAskMeAgain?: boolean
  displayFullInformation?: boolean
  children?: React.ReactNode
}

const Authorization7702 = ({
  onDoNotAskMeAgainChange,
  doNotAskMeAgain,
  displayFullInformation,
  children
}: Props) => {
  const { t } = useTranslation()

  const options = [
    {
      id: 1,
      text: 'Pay gas fees in ERC-20 tokens, stablecoins, and native tokens.',
      image: GasTankIcon
    },
    {
      id: 2,
      text: 'Bundle multiple actions, i.e., transaction approvals and the transactions themselves.',
      image: BatchIcon
    },
    {
      id: 3,
      text: 'Preview the outcome of your transactions, including the future account balance, before signing.',
      image: VisibilityIcon,
      styles: [spacings.mr0]
    }
  ]

  return (
    <TabLayoutWrapperMainContent contentContainerStyle={spacings.pvMd} showsVerticalScrollIndicator>
      {!!displayFullInformation && (
        <>
          <View style={[flexbox.directionRow]}>
            <Text weight="medium" fontSize={20}>
              {t('Make your account smarter')}
            </Text>
          </View>
          <View style={[flexbox.directionRow, flexbox.center, spacings.pvMd]}>
            <BasicToSmart />
          </View>
        </>
      )}
      <View style={[flexbox.directionRow]}>
        <Text weight="medium" fontSize={14} appearance="secondaryText">
          {t(
            "You can do more with your EOA! Thanks to the recent upgrade to Ethereum's protocol,\nyour account gains "
          )}
          <Text weight="medium" fontSize={14}>
            {t('additional smart features:')}
          </Text>
        </Text>
      </View>

      <View style={[flexbox.directionRow, spacings.pvMd]}>
        {options.map((option, index) => (
          <Card
            style={[
              options.length === index + 1
                ? spacings.mr0
                : displayFullInformation
                  ? spacings.mrMd
                  : spacings.mrLg,
              flexbox.flex1,
              flexbox.center,
              spacings.phXl,
              spacings.pvSm,
              { minHeight: 'auto' },
              // @ts-ignore
              { textAlign: 'center' },
              // @ts-ignore
              { cursor: 'default' },
              // @ts-ignore
              { hover: 'b' }
            ]}
            key={option.id}
            text={option.text}
            textProps={{ fontSize: 12, weight: 'medium' }}
            icon={option.image}
            iconProps={{ width: 48, height: 48 }}
            isDisabled
          />
        ))}
      </View>

      <Trans>
        <Text fontSize={14} style={spacings.mb} appearance="secondaryText">
          Once enabled in Ambire Wallet,{' '}
          <Text weight="medium" fontSize={14}>
            these features won’t change your account
          </Text>
          . You keep the{' '}
          <Text weight="medium" fontSize={14}>
            same address across all networks
          </Text>
          , and your{' '}
          <Text weight="medium" fontSize={14}>
            portfolio and DeFi positions (if any) won’t be affected.
          </Text>
        </Text>
      </Trans>

      {!!displayFullInformation && !!onDoNotAskMeAgainChange && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, { minHeight: 47 }]}>
          <Checkbox
            value={!!doNotAskMeAgain}
            style={spacings.mb0}
            onValueChange={onDoNotAskMeAgainChange}
            label={t('Do not ask me again')}
            labelProps={{ fontSize: 14 }}
          />

          {!!doNotAskMeAgain && (
            <Alert
              type="info"
              style={spacings.ml}
              size="sm"
              title={t('You can always change this from account settings')}
              titleWeight="regular"
            />
          )}
        </View>
      )}
      {children}
    </TabLayoutWrapperMainContent>
  )
}

export default React.memo(Authorization7702)
