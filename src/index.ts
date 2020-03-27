import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { loadServices } from './data';
import { registerScreens } from './screens';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FitnessScreen from './screens/FitnessScreen';

export async function start() {
  registerScreens();

  const icons = Promise.all([
    Icon.getImageSource('md-home', 20, 'red'),
    Icon.getImageSource('md-medkit', 20, 'red'),
    Icon.getImageSource('md-contact', 20, 'red'),
  ]);

  const services = loadServices();

  Navigation.events().registerAppLaunchedListener(async () => {
    const [homeIcon, medIcon, profileIcon] = await icons;
    await services;

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
                  },
                  layout: {
                    orientation: ['portrait']
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
                  },
                  layout: {
                    orientation: ['portrait']
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
                  },
                  layout: {
                    orientation: ['portrait']
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
