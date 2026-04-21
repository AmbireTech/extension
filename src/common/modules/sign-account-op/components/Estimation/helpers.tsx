import { ZeroAddress } from 'ethers'

import { Contacts } from '@ambire-common/controllers/addressBook/addressBook'
import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { FeeSpeed } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import {
  canFeeOptionCoverAmount,
  isTransferredTokenFeeOption
} from '@ambire-common/libs/account/feeOptions'
import { FeePaymentOption } from '@ambire-common/libs/estimate/interfaces'
import { ZERO_ADDRESS } from '@ambire-common/services/socket/constants'

import PayOption from './components/PayOption'

const sortBasedOnUSDValue = (a: FeePaymentOption, b: FeePaymentOption) => {
  if (!a || !b) return 0

  const aPrice = a.token?.priceIn?.[0]?.price
  const bPrice = b.token?.priceIn?.[0]?.price
  if (aPrice && !bPrice) return -1
  if (!aPrice && bPrice) return 1
  return 0
}

/**
 * Sorts fee options by the following criteria:
 * - Gas tank options first
 * - USD value
 */
const sortFeeOptions = (
  a: FeePaymentOption,
  b: FeePaymentOption,
  signAccountOpState: ISignAccountOpController
) => {
  const aId = getFeeSpeedIdentifier(a, signAccountOpState.accountOp.accountAddr)
  const aSlow = signAccountOpState.feeSpeeds[aId]?.find((speed) => speed.type === 'slow')
  if (!aSlow) return 1
  const aCanCoverFee = canFeeOptionCoverAmount(a, signAccountOpState.accountOp, aSlow.amount)

  const bId = getFeeSpeedIdentifier(b, signAccountOpState.accountOp.accountAddr)
  const bSlow = signAccountOpState.feeSpeeds[bId]?.find((speed) => speed.type === 'slow')
  if (!bSlow) return -1
  const bCanCoverFee = canFeeOptionCoverAmount(b, signAccountOpState.accountOp, bSlow.amount)

  if (aCanCoverFee && !bCanCoverFee) return -1
  if (!aCanCoverFee && bCanCoverFee) return 1
  if (!signAccountOpState) sortBasedOnUSDValue(a, b)

  // gas tank first
  if (a.token.flags.onGasTank && !b.token.flags.onGasTank) return -1
  if (!a.token.flags.onGasTank && b.token.flags.onGasTank) return 1

  // native second
  if (a.token.address === ZERO_ADDRESS && b.token.address !== ZERO_ADDRESS) return -1
  if (a.token.address !== ZERO_ADDRESS && b.token.address === ZERO_ADDRESS) return 1

  // based on value after
  return sortBasedOnUSDValue(a, b)
}

const mapFeeOptions = (
  feeOption: FeePaymentOption,
  signAccountOpState: ISignAccountOpController,
  addressBookContacts: Contacts
) => {
  let disabledReason: string | undefined
  let disabledTextAppearance: 'errorText' | 'infoText' | undefined

  const gasTankKey = feeOption.token.flags.onGasTank ? 'gasTank' : ''
  const speedCoverage: FeeSpeed[] = []
  const id = getFeeSpeedIdentifier(feeOption, signAccountOpState.accountOp.accountAddr)
  const isTransferredTokenOption = isTransferredTokenFeeOption(
    feeOption,
    signAccountOpState.accountOp
  )

  signAccountOpState.feeSpeeds[id]?.forEach((speed) => {
    if (feeOption.availableAmount >= speed.amount || isTransferredTokenOption)
      speedCoverage.push(speed.type)
  })

  const feeSpeed = signAccountOpState.feeSpeeds[id]?.find(
    (speed) => speed.type === signAccountOpState.selectedFeeSpeed
  )
  const feeSpeedAmount = feeSpeed?.amount || 0n
  const feeSpeedUsd = feeSpeed?.amountUsd || '0'

  if (!speedCoverage.includes(FeeSpeed.Slow)) {
    if (!feeOption.token.priceIn.length) {
      disabledReason = 'No price data'
    } else if (
      feeOption.paidBy === signAccountOpState.account.addr &&
      signAccountOpState.account.safeCreation
    ) {
      disabledReason = 'Coming soon'
    } else {
      disabledReason = 'Insufficient amount'
    }
  }

  // TODO: TBD, should we refactor and move `disabledReason` logic together with `speedCoverage` into controller.
  // Note: `accountKeyStoreKeys` can simultaneously store hardware keys and hot wallet keys.
  // In this case, the `isExternal` check will still resolve to `true`, and we will disable ERC-20 fee options.
  // We decided to leave it as is, since it's rare to import both a hardware wallet and its seed phrase as a hot wallet.
  // Additionally, we expect hardware wallets to support EIP-7702 soon, so we prefer not to complicate the UX.
  const isExternal = signAccountOpState.accountKeyStoreKeys.find(
    (keyStoreKey) => keyStoreKey.addr === feeOption.paidBy && keyStoreKey.isExternallyStored
  )
  const canNotBecomeSmarter = !canBecomeSmarter(
    signAccountOpState.account,
    signAccountOpState.accountKeyStoreKeys
  )

  if (isExternal && canNotBecomeSmarter && feeOption.token.address !== ZERO_ADDRESS) {
    disabledReason = 'Coming soon for more hardware wallets'
    disabledTextAppearance = 'infoText'
  }

  const paidByAccountLabel = feeOption.paidBy
    ? addressBookContacts.find(
        (contact) => contact.address.toLowerCase() === feeOption.paidBy.toLowerCase()
      )?.name
    : undefined

  if (signAccountOpState.hasCustomGasPrices && feeOption.token.address !== ZeroAddress) {
    disabledReason = 'Option not available for advanced gas prices'
    disabledTextAppearance = 'errorText'
  }

  return {
    value:
      feeOption.paidBy +
      feeOption.token.address +
      feeOption.token.symbol.toLowerCase() +
      gasTankKey,
    label: (
      <PayOption
        amount={feeSpeedAmount}
        amountUsd={feeSpeedUsd}
        feeOption={feeOption}
        disabledReason={disabledReason}
        disabledTextAppearance={disabledTextAppearance}
        paidByAccountLabel={paidByAccountLabel}
      />
    ),
    extraSearchProps: {
      paidByAccountLabel
    },
    paidByAccountLabel,
    paidBy: feeOption.paidBy,
    token: feeOption.token,
    disabled: !!disabledReason,
    speedCoverage
  }
}

export { mapFeeOptions, sortFeeOptions }
