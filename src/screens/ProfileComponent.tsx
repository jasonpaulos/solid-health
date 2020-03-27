import React, { useState } from 'react';
import {
  Text,
  View,
  Image,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Namespace } from '@jasonpaulos/rdflib';
import { useRDF, useWebId } from '../hooks';
import { logIn, logOut } from '../data/session';

const FOAF = Namespace('http://xmlns.com/foaf/0.1/');
const VCARD = Namespace('http://www.w3.org/2006/vcard/ns#');

function ProfileLoggedIn(props: { webId: string }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const name = useRDF(props.webId, FOAF('name'));
  const img = useRDF(props.webId, FOAF('img'));

  let nameResult: string;
  if (name.loading) {
    nameResult = 'Loading...';
  } else if (name.error) {
    nameResult = 'Error: ' + JSON.stringify(name.error);
  } else if (name.value) {
    nameResult = name.value.value;
  } else {
    nameResult = '<null>';
  }

  let imgResult: string;
  let imgSrc: string | null = null;
  if (img.loading) {
    imgResult = 'Loading...';
  } else if (img.error) {
    imgResult = 'Error: ' + JSON.stringify(name.error);
  } else if (img.value) {
    imgResult = img.value.value;
    imgSrc = imgResult;
  } else {
    imgResult = '<null>';
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerBottom} />
        <View style={styles.imageContainer}>
        {imgResult == null ?
          <View style={styles.centered}>
            <Icon name="md-person" size={60} color="red" />
          </View>
        :
          <Image source={{ uri: imgResult }} style={styles.image} />
        }
        </View>
        <Text style={styles.name}>{nameResult}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.webId}>{props.webId}</Text>
        <View style={styles.logoutButton}>
          <Button
            title={loggingOut ? "Logging out..." : "Log out"}
            color="red"
            disabled={loggingOut}
            onPress={() => {
              setLoggingOut(true);
              logOut()
                .catch(err => {
                  setLoggingOut(false);
                  console.warn('Could not log out', err);
                  Alert.alert('Could not log out', err.message);
                });
            }}
          />
        </View>
      </View>
    </View>
  );
}

function ProfileLoggedOut() {
  const [loggingIn, setLoggingIn] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerBottom} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.webId}>Not logged in</Text>
        <View style={styles.logoutButton}>
          <Button
            title={loggingIn ? "Logging in..." : "Log in"}
            color="red"
            disabled={loggingIn}
            onPress={() => {
              setLoggingIn(true);
              logIn().catch(err => {
                setLoggingIn(false);
                console.warn('Could not log in', err);
                Alert.alert('Could not log in', err.message);
              });
            }}
          />
        </View>
      </View>
    </View>
  );
}

export function ProfileComponent() {
  const webId = useWebId();
  return webId == null ?
    <ProfileLoggedOut />
  :
    <ProfileLoggedIn webId={webId} />
}

const styles = StyleSheet.create({
  centered: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'gray',
    height: '100%',
  },
  headerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBottom: {
    bottom: 0,
    height: '50%',
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: 'lightgray',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'lightgray',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    bottom: 15,
    fontSize: 20,
    position: 'absolute',
  },
  contentContainer: {
    backgroundColor: 'white',
    height: '100%',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: 'lightgray',
    paddingLeft: 10,
    paddingRight: 10,
  },
  logoutButton: {
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: '33%',
    marginRight: '33%',
  },
  webId: {
    textAlign: 'center',
    fontSize: 15,
  },
});
