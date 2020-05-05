import React, { FunctionComponent } from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet
} from 'react-native';
import { Color } from './Color';
import { Profile } from './Profile';

export const DataScreenID = 'com.solidhealth.DataScreen';

interface DataScreenProps {
  componentId: string,
  profile: Profile,
}

export const DataScreen: FunctionComponent<DataScreenProps> = ({ profile }) => {
  return (
    <View style={styles.content}>
      <Text style={styles.text}>Data Screen</Text>
    </View>
  );
}

(DataScreen as any).options = {
  topBar: {
    title: {
      text: 'Health Data',
    }
  }
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.Background,
  },
  text: {
    color: Color.TextDark,
  },
});
