import React, { createContext, useContext, useEffect, useState } from 'react'
import { useCameraPermission } from 'react-native-vision-camera'
import { AppState, AppStateStatus } from 'react-native'

interface CameraPermissionsContextProps {
  hasPermission: boolean
  requestPermission: () => Promise<boolean>
  checkPermission: () => Promise<boolean>
}

const CameraPermissionsContext = createContext<CameraPermissionsContextProps>({
  hasPermission: false,
  requestPermission: async () => false,
  checkPermission: async () => false
})

export const CameraPermissionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { hasPermission, requestPermission } = useCameraPermission()

  const checkPermission = async () => {
    return hasPermission
  }

  return (
    <CameraPermissionsContext.Provider
      value={{ hasPermission, requestPermission, checkPermission }}
    >
      {children}
    </CameraPermissionsContext.Provider>
  )
}

export const useCameraPermissions = () => useContext(CameraPermissionsContext)
