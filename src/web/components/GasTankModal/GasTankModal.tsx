import { formatUnits } from 'ethers'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { TokenResult } from '@ambire-common/libs/portfolio'
import DepositIcon from '@common/assets/svg/DepositIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import BackButton from '@common/components/BackButton'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import formatDecimals from '@common/utils/formatDecimals'
import { createTab } from '@web/extension-services/background/webapi/tab'
import { useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

type Props = {
  modalRef: any
  handleClose: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

type BulletContent = {
  icon: ReactNode
  iconBgColor: string
  text: string
}

const calculateTokenBalance = (token: TokenResult, type: keyof TokenResult) => {
  const amount = token[type]
  const { decimals, priceIn } = token
  const balance = parseFloat(formatUnits(amount, decimals))
  const price =
    priceIn.find(({ baseCurrency }: { baseCurrency: string }) => baseCurrency === 'usd')?.price || 0

  return balance * price
}

const BULLETS_CONTENT: BulletContent[] = [
  {
    icon: <TopUpIcon width={20} height={20} color="white" />,
    iconBgColor: 'blue',
    text: 'Top up on any chain and use gas tank to pay network fees on any other.'
  },
  {
    icon: <ReceiveIcon width={20} height={20} color="white" />,
    iconBgColor: 'purple',
    text: 'Receive cashback from your transactions in your Gas tank.'
  },
  {
    icon: <DepositIcon width={20} height={20} color="white" />,
    iconBgColor: 'green',
    text: 'Save on network fees by prepaying with Gas tank..'
  }
]

const GasTankModal = ({ modalRef, handleClose, portfolio, account }: Props) => {
  const { isPopup } = getUiType()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const [bindAnim, , isHovered] = useCustomHover({
    property: 'borderColor',
    values: {
      from: 'transparent',
      to: theme.primary
    },
    forceHoveredStyle: true
  })

  const isSA = useMemo(() => isSmartAccount(account), [account])

  const gasTankResult = useMemo(
    () => portfolio?.latestStateByNetworks?.gasTank?.result,
    [portfolio?.latestStateByNetworks?.gasTank?.result]
  )

  const calculateBalance = useCallback(
    (key: 'usd' | 'cashback' | 'saved') => {
      if (!account?.addr || !gasTankResult || gasTankResult.tokens.length === 0 || !isSA) return 0
      const token = gasTankResult.tokens[0]

      return key === 'usd'
        ? Number(gasTankResult.total?.[key]) || 0
        : calculateTokenBalance(token, key)
    },
    [account?.addr, gasTankResult, isSA]
  )

  const savedInUsd = useMemo(() => calculateBalance('saved'), [calculateBalance])
  const cashbackInUsd = useMemo(() => calculateBalance('cashback'), [calculateBalance])
  const gasTankTotalBalanceInUsd = useMemo(() => calculateBalance('usd'), [calculateBalance])

  return (
    <BottomSheet
      id="gas-tank-modal"
      type={isPopup ? 'bottom-sheet' : 'modal'}
      sheetRef={modalRef}
      backgroundColor="secondaryBackground"
      containerInnerWrapperStyles={styles.containerInnerWrapper}
      closeBottomSheet={handleClose}
      style={{ maxWidth: 600 }}
    >
      {isSA ? (
        <View style={styles.content}>
          {/* <ModalHeader handleClose={handleClose} withBackButton={false} title="Gas Tank" /> */}
          <Text fontSize={20} weight="medium">
            Gas Tank
          </Text>
          <View>
            <View style={styles.balancesWrapper}>
              <View style={{ ...flexbox.alignStart }}>
                <Text fontSize={12} appearance="secondaryText" style={{ ...spacings.pbTy }}>
                  {t('Gas Tank Balance')}
                </Text>
                <View style={{ ...flexbox.directionRow, ...flexbox.alignCenter }}>
                  <GasTankIcon height={40} width={40} />
                  <Text fontSize={32} weight="number_bold" appearance="primaryText">
                    {formatDecimals(gasTankTotalBalanceInUsd, 'price')}
                  </Text>
                </View>
              </View>
              <View style={styles.rightPartWrapper}>
                <View style={styles.rightPartInnerWrapper}>
                  <Text fontSize={12} appearance="successText">
                    {t('Total Saved')}:
                  </Text>
                  <Text fontSize={14} appearance="successText">
                    {formatDecimals(savedInUsd, 'price')}
                  </Text>
                </View>
                <View style={styles.rightPartInnerWrapper}>
                  <Text fontSize={12} appearance="primary">
                    {t('Total Cashback')}:
                  </Text>
                  <Text fontSize={14} appearance="primary">
                    {formatDecimals(cashbackInUsd, 'price')}
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <Pressable
                onPress={async () => {
                  try {
                    await createTab(
                      'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                    )
                  } catch {
                    addToast("Couldn't open link", { type: 'error' })
                  }
                }}
                style={[
                  styles.descriptionTextWrapper,
                  {
                    borderColor: isHovered ? theme.primary : 'transparent'
                  }
                ]}
                {...bindAnim}
              >
                <View style={[flexbox.directionRow]}>
                  <InfoIcon width={20} />
                  <Text style={spacings.mlMd} weight="medium" fontSize={16}>
                    {t('Learn more about Gas Tank')}
                  </Text>
                </View>
                <RightArrowIcon />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth]}>
            <Text fontSize={20} weight="medium">
              Gas Tank
            </Text>
          </View>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth, spacings.mtLg]}>
            <Text fontSize={16} weight="semiBold" appearance="secondaryText">
              {t('Experience the benefits of the gas tank:')}
            </Text>
          </View>
          <View style={[flexbox.justifyCenter, flexbox.alignCenter]}>
            {BULLETS_CONTENT.map((bullet, index) => (
              <LinearGradient
                key={index}
                colors={[theme.tertiaryBackground as string, theme.primaryBackground as string]}
                style={styles.bulletWrapper}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={[styles.iconWrapper, { backgroundColor: bullet.iconBgColor }]}>
                  {bullet.icon}
                </View>
                <Text
                  appearance="secondaryText"
                  weight="medium"
                  style={[spacings.mlSm, { lineHeight: 24 }]}
                >
                  {t(bullet.text)}
                </Text>
              </LinearGradient>
            ))}
          </View>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth, spacings.pvMd]}>
            <Text fontSize={16} weight="semiBold" appearance="secondaryText">
              {t('To use the gas tank, you need a Smart Account')}
            </Text>
          </View>
        </View>
      )}
      <View style={styles.buttonWrapper}>
        <BackButton onPress={handleClose} />
        <Button
          type="primary"
          text={isSA ? t('Top Up Gas Tank') : t('Ok, create a Smart Account')}
          size="large"
          hasBottomSpacing={false}
          textStyle={{ ...spacings.prSm }}
          onPress={() =>
            isSA ? navigate('transfer?isTopUp') : navigate('account-select?addAccount=true')
          }
        >
          {isSA && <TopUpIcon color="white" strokeWidth={1} width={20} height={20} />}
        </Button>
      </View>
    </BottomSheet>
  )
}
// TODO: Add React.memo to all the new components
export default GasTankModal
