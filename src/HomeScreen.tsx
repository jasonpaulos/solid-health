import React, { FunctionComponent } from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet
} from 'react-native';
import { Color } from './Color';
import { useWebId, logIn, logOut } from './auth';

export const HomeScreenID = 'com.solidhealth.HomeScreen';

export const HomeScreen: FunctionComponent = () => {
  const webId = useWebId();

  if (webId == null) {
    return <LoggedOut />;
  }

  return <LoggedIn webId={webId} />;
}

(HomeScreen as any).options = {
  topBar: {
    title: {
      text: 'Solid Health',
    }
  }
};

const LoggedOut: FunctionComponent = () => {
  return (
    <View style={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.userLabel} numberOfLines={1}>Logged in as [name]</Text>
        <Text style={styles.webId} numberOfLines={1}>[webId]</Text>
      </View>
      <TouchableHighlight style={styles.button} underlayColor={Color.HighlightSelected} onPress={logIn}>
        <Text style={styles.label}>Sign in</Text>
      </TouchableHighlight>
    </View>
  );
};

const LoggedIn: FunctionComponent<{ webId: string }> = ({ webId }) => {
  return (
    <View style={styles.content}>
      <View style={styles.greeting}>
        <Text style={styles.userLabel} numberOfLines={1}>Logged in as [name]</Text>
        <Text style={styles.webId} numberOfLines={1}>{webId}</Text>
      </View>
      <TouchableHighlight style={styles.button} underlayColor={Color.HighlightSelected}>
        <Text style={styles.label}>View Data</Text>
      </TouchableHighlight>
      <TouchableHighlight style={styles.button} underlayColor={Color.HighlightSelected} onPress={logOut}>
        <Text style={styles.label}>Sign out</Text>
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Color.Background,
  },
  greeting: {
    marginBottom: 15,
  },
  userLabel: {
    fontSize: 20,
    marginLeft: 10,
    marginRight: 10,
    textAlign: 'center',
    color: Color.TextDark,
  },
  webId: {
    fontSize: 12,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
    textAlign: 'center',
    color: Color.TextDark,
  },
  button: {
    width: 250,
    height: 60,
    borderRadius: 5,
    margin: 15,
    backgroundColor: Color.Highlight,
  },
  label: {
    height: '100%',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 24,
    color: Color.TextLight,
  },
});
