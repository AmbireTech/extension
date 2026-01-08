import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import { TooltipRefProps } from 'react-tooltip'

import { isSmartAccount } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import Avatar from '@common/components/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Editable from '@common/components/Editable'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import ManageContact from './ManageContact'
import getStyles from './styles'

interface Props {
  address: string
  name?: string
  isManageable?: boolean
  isEditable?: boolean
  onPress?: () => void
  style?: ViewStyle
  testID?: string
  avatarSize?: number
  fontSize?: number
  height?: number
}

const AddressBookContact: FC<Props> = ({
  address,
  name,
  isManageable,
  isEditable,
  onPress,
  testID,
  style = {},
  avatarSize,
  fontSize = 14,
  height = 20
}) => {
  const ContainerElement = onPress ? AnimatedPressable : View

  const { t } = useTranslation()
  const { theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { dispatch } = useBackgroundService()
  const { accounts } = useAccountsControllerState()
  const { account: selectedAccount } = useSelectedAccountControllerState()
  const { ens, isLoading } = useReverseLookup({ address })
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: theme.secondaryBackground
    }
  })
  const tooltipRef = useRef<TooltipRefProps>(null)
  const containerRef = useRef(null)

  const account = useMemo(() => {
    return accounts.find((acc) => acc.addr.toLowerCase() === address.toLowerCase())
  }, [accounts, address])

  const onSave = (newName: string) => {
    dispatch({
      type: 'ADDRESS_BOOK_CONTROLLER_RENAME_CONTACT',
      params: { address, newName }
    })
    addToast(t('Successfully renamed contact'))
  }

  const closeTooltip = useCallback(() => {
    tooltipRef?.current?.close()
  }, [])

  useEffect(() => {
    if (!isWeb) return

    if (!containerRef.current) return

    const container = containerRef.current as HTMLElement

    container.addEventListener('mouseleave', closeTooltip, { passive: true })

    return () => {
      container.removeEventListener('mouseleave', () => closeTooltip)
    }
  }, [closeTooltip])

  const isSmart = useMemo(() => {
    return account ? isSmartAccount(account) : false
  }, [account])

  const displayTypeBadge = useMemo(() => {
    return !!account
  }, [account])

  return (
    <ContainerElement
      ref={containerRef}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        spacings.phTy,
        spacings.pvTy,
        common.borderRadiusPrimary,
        style,
        onPress && animStyle
      ]}
      onPress={onPress}
      {...(onPress ? bindAnim : {})}
      testID={testID}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Avatar
          {...(avatarSize && { size: avatarSize })}
          pfp={address}
          address={address}
          isSmart={isSmart}
          displayTypeBadge={displayTypeBadge}
        />
        <View>
          {isEditable ? (
            <Editable
              fontSize={fontSize}
              textProps={{
                weight: 'medium'
              }}
              height={height}
              minWidth={80}
              maxLength={32}
              initialValue={name}
              onSave={onSave}
            />
          ) : (
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text fontSize={fontSize} weight="medium" style={!name && spacings.mrTy}>
                {name || account?.addr === selectedAccount?.addr
                  ? account?.preferences.label
                  : 'New address'}
              </Text>
            </View>
          )}
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <DomainBadge ens={ens} />
            <AccountAddress isLoading={isLoading} ens={ens} address={address} />
          </View>
        </View>
      </View>
      {isManageable && name ? (
        <ManageContact tooltipRef={tooltipRef} address={address} name={name} />
      ) : null}
    </ContainerElement>
  )
}

export default React.memo(AddressBookContact)
