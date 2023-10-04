import React from 'react'

import Header from '@common/modules/header/components/Header'

export const headerAlpha = (props: any) => (
  <Header withHamburger withHeaderRight {...props} name="a" />
)
export const headerBeta = (props: any) => <Header mode="title" {...props} name="b" />
export const headerGamma = (props: any) => <Header {...props} withHeaderRight name="c" />
