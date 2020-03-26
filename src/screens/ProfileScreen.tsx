import React, { Component } from 'react';
import { Text } from 'react-native';
import ProfileComponent from './ProfileComponent';

interface Props {
  webId: string
};

export default class ProfileScreen extends Component<Props> {

  static getScreenName() {
    return "ProfileScreen";
  }

  render() {
    const webId = 'https://jas0n.solid.community/profile/card#me';
    
    return (
      <ProfileComponent webId={webId} />
    );
  }
}
