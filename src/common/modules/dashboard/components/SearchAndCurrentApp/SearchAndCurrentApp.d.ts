import React from 'react'
import { Control } from 'react-hook-form'

export interface SearchAndCurrentAppProps {
  control: Control<{ search: string }, any>
  displayCurrentApp?: boolean
  isHidden: boolean
}

declare const SearchAndCurrentApp: React.FC<SearchAndCurrentAppProps>
export default SearchAndCurrentApp
