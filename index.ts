import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import './spacing';
import App from './App';

import { SPACING } from './spacing';
global.SPACING = SPACING;

AppRegistry.registerComponent('main', () => App);
