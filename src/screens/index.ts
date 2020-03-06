import { Navigation } from 'react-native-navigation';
import HomeScreen from './HomeScreen';

export function registerScreens() {
  Navigation.registerComponent(HomeScreen.getScreenName(), () => HomeScreen);
}
