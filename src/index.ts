import { Navigation } from 'react-native-navigation';
import { Color } from './Color';
import { init as initAuth } from './auth';
import { HomeScreen, HomeScreenID } from './HomeScreen';
import { DataScreen, DataScreenID } from './DataScreen';
import { DataSetScreen, DataSetScreenID } from './DataSetScreen';

initAuth();

Navigation.registerComponent(HomeScreenID, () => HomeScreen);
Navigation.registerComponent(DataScreenID, () => DataScreen);
Navigation.registerComponent(DataSetScreenID, () => DataSetScreen);

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
