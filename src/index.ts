import { Navigation } from 'react-native-navigation';
import Icon from 'react-native-vector-icons/Ionicons';
import { registerScreens } from './screens';
import HomeScreen from './screens/HomeScreen';

export function start() {
  registerScreens();

  const icons = Promise.all([
    Icon.getImageSource('md-home', 20, 'red'),
    Icon.getImageSource('md-medkit', 20, 'red')
  ]);

  Navigation.events().registerAppLaunchedListener(async () => {
    const [homeIcon, medIcon] = await icons;

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
                    text: 'Tab 1',
                    icon: homeIcon,
                  }
                }
              },
            },
            {
              component: {
                name: HomeScreen.getScreenName(),
                passProps: {
                  title: 'Hello world!',
                },
                options: {
                  bottomTab: {
                    text: 'Tab 2',
                    icon: medIcon,
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
