import { Navigation } from 'react-native-navigation';
import { Color } from './Color';
import { init as initAuth } from './auth';
import { HomeScreen, HomeScreenID } from './HomeScreen';

initAuth();

Navigation.registerComponent(HomeScreenID, () => HomeScreen);

Navigation.setDefaultOptions({
  statusBar: {
    backgroundColor: Color.Highlight
  },
  topBar: {
    title: {
      color: Color.TextLight
    },
    backButton: {
      color: Color.TextLight
    },
    background: {
      color: Color.Highlight
    }
  }
});

Navigation.events().registerAppLaunchedListener(() => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: HomeScreenID
            }
          }
        ]
      }
    }
  });
});
