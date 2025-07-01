import { test as testBase } from '@playwright/test'

import { DashboardPage } from 'pages/dashboardPage'
import { GasTankPage } from 'pages/gasTankPage'
import { SettingsPage } from 'pages/settingsPage'
import { TransferPage } from 'pages/transferPage'
import { AuthPage } from 'pages/authPage'
import { SwapAndBridgePage } from 'pages/swapAndBridgePage'
import { SignMessagePage } from 'pages/signMessagePage'

type PageObjects = {
  authPage: AuthPage
  swapAndBridgePage: SwapAndBridgePage
  dashboardPage: DashboardPage
  transferPage: TransferPage
  gasTankPage: GasTankPage
  settingsPage: SettingsPage
  signMessagePage: SignMessagePage
}

export const test = testBase.extend<PageObjects>({
  authPage: async ({}, use) => {
    await use(new AuthPage())
  },
  swapAndBridgePage: async ({}, use) => {
    await use(new SwapAndBridgePage())
  },
  dashboardPage: async ({}, use) => {
    await use(new DashboardPage())
  },
  transferPage: async ({}, use) => {
    await use(new TransferPage())
  },
  gasTankPage: async ({}, use) => {
    await use(new GasTankPage())
  },
  signMessagePage: async ({}, use) => {
    await use(new SignMessagePage())
  },
  settingsPage: async ({}, use) => {
    await use(new SettingsPage())
  }
})
