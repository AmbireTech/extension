import { ReplacementBlocker } from '@ambire-common/libs/accountOp/replacement'

export const EXPLORER_LINKS_DISABLED_TOOLTIP =
  'Explorer links are on the right side of each transaction in transaction details'

/** Why a pending transaction can't be sped up or canceled, as shown to the user */
export const REPLACEMENT_BLOCKER_MESSAGES: Record<ReplacementBlocker, string> = {
  external: 'Incoming transactions cannot be sped up or canceled',
  otherAccount: 'Switch to this account to proceed',
  notReplaceable:
    "This transaction was sent through a service that handles it for you, so it can't be sped up or canceled",
  missingDetails:
    "This transaction can't be sped up or canceled, as some of its details are missing",
  partiallyMined:
    "Part of this transaction has already gone through, so it can't be sped up or canceled"
}
