import 'react-native'

declare module 'react-native' {
  export interface ViewProps {
    dataSet?: Record<string, any>
    onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void
    onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void
  }

  export interface PressableProps {
    dataSet?: Record<string, any>
  }
}
