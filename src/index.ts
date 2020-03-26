import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { registerScreens } from './screens';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FitnessScreen from './screens/FitnessScreen';

export function start() {
  registerScreens();

  const icons = Promise.all([
    Icon.getImageSource('md-home', 20, 'red'),
    Icon.getImageSource('md-medkit', 20, 'red'),
    Icon.getImageSource('md-contact', 20, 'red'),
  ]);

  Navigation.events().registerAppLaunchedListener(async () => {
    const [homeIcon, medIcon, profileIcon] = await icons;

    Navigation.setRoot({
      root: {
        bottomTabs: {
          children: [
            {
              component: {
                name: HomeScreen.getScreenName(),
                passProps: {
                  title: 'Home!',
                },
                options: {
                  bottomTab: {
                    text: 'Home',
                    icon: homeIcon,
                  }
                }
              },
            },
            {
              component: {
                name: FitnessScreen.getScreenName(),
                options: {
                  bottomTab: {
                    text: 'Fitness',
                    icon: medIcon,
                  }
                }
              },
            },
            {
              component: {
                name: ProfileScreen.getScreenName(),
                options: {
                  bottomTab: {
                    text: 'Profile',
                    icon: profileIcon,
                  }
                }
              },
            },
          ]
        }
      }
    });
  });
}
