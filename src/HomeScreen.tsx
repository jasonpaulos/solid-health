import React, {
  FunctionComponent,
  useMemo
} from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  Image,
  StyleSheet
} from 'react-native';
import { Color } from './Color';
import { useWebId, logIn, logOut } from './auth';
import { useFetcher } from './useFetcher';
import { buildProfile } from './Profile';


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
  const response = useFetcher(webId);
  const profile = useMemo(() => buildProfile(webId, response), [webId, response]);
  
  let message;
  if (response.loading) {
    message = 'Loading...';
  } else if (response.error) {
    message = 'Error: ' + response.error.toString();
  } else if (profile.name) {
    message = profile.name;
  } else {
    message = 'Welcome';
  }

  return (
    <View style={styles.content}>
      <View style={styles.greeting}>
        <View style={styles.imageContainer}>
          {profile.image == null ?
            <View style={styles.centered}>
              <Text style={styles.text}>No image</Text>
            </View>
          :
            <Image source={{ uri: profile.image }} style={styles.image} />
          }
        </View>
        <Text style={styles.userLabel} numberOfLines={1}>{message}</Text>
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
  centered: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Color.TextLight,
  },
  greeting: {
    marginBottom: 15,
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: Color.TextDark,
    backgroundColor: Color.Highlight,
    overflow: 'hidden',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
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
