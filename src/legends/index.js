import './instrument'
import './styles/global.scss'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import LegendsInit from './LegendsInit'

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// Fixes ReactDOM.render error
// https://github.com/expo/expo/issues/18485
const rootTag = createRoot(document.getElementById('root') ?? document.getElementById('main'))
rootTag.render(createElement(LegendsInit))
