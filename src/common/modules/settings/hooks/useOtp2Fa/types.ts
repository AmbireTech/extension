import { Account } from 'ambire-common/src/hooks/useAccounts'

export interface UseOtp2FaProps {
  email: Account['email']
  accountId: Account['id']
}

export interface UseOtp2FaReturnType {
  sendEmail: () => Promise<void>
  verifyOTP: ({
    emailConfirmCode,
    otpCode
  }: {
    emailConfirmCode: string
    otpCode: string
  }) => Promise<any>
  disableOTP: ({ otpCode }: { otpCode: string }) => Promise<any>
  isSendingEmail: boolean
  otpAuth: string
  secret: string
}
