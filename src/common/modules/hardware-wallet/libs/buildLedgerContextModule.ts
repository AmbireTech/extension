import { Right } from 'purify-ts'

import { LEDGER_ORIGIN_TOKEN } from '@common/modules/hardware-wallet/constants/ledger'
import {
  ContextModuleBuilder,
  ContextModuleChainID,
  DEFAULT_CONFIG,
  HttpBlindSigningReporterDatasource
} from '@ledgerhq/context-module'
import type { LoggerPublisherService } from '@ledgerhq/device-management-kit'

/**
 * Builds the clear-signing context module passed to the Ledger Ethereum signer,
 * shared by the web (WebHID) and mobile (RN BLE/HID) signers.
 *
 * Ledger's signing kit reports every transaction and typed data signature to
 * Ledger (network, contract or recipient address, device model/firmware, app
 * versions and whether it was blind-signed). Ours forwards those reports to
 * Ledger's own reporter only while `isSigningReportAllowed()` returns true. It
 * is checked on every signature, so turning the setting off also applies to an
 * already open device session.
 */
export const buildLedgerContextModule = ({
  loggerFactory,
  isSigningReportAllowed
}: {
  loggerFactory: (tag: string) => LoggerPublisherService
  isSigningReportAllowed: () => boolean
}) => {
  const ledgerSigningReporter = new HttpBlindSigningReporterDatasource({
    ...DEFAULT_CONFIG,
    chain: ContextModuleChainID.Ethereum,
    originToken: LEDGER_ORIGIN_TOKEN,
    loggerFactory
  })

  return new ContextModuleBuilder({ originToken: LEDGER_ORIGIN_TOKEN, loggerFactory })
    .setChain(ContextModuleChainID.Ethereum)
    .setBlindSigningReporter({
      report: async (params) =>
        isSigningReportAllowed() ? ledgerSigningReporter.report(params) : Right(undefined)
    })
    .build()
}
