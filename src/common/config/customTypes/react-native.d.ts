import 'react-native'

declare module 'react-native' {
  export interface ViewProps {
    dataSet?: Record<string, any>
  }

  export interface PressableProps {
    dataSet?: Record<string, any>
  }
}
