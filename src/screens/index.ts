import { Navigation } from 'react-native-navigation';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import FitnessScreen from './FitnessScreen';

export function registerScreens() {
  Navigation.registerComponent(HomeScreen.getScreenName(), () => HomeScreen);
  Navigation.registerComponent(ProfileScreen.getScreenName(), () => ProfileScreen);
  Navigation.registerComponent(FitnessScreen.getScreenName(), () => FitnessScreen);
}
