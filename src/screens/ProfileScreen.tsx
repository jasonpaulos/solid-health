import React, { Component } from 'react';
import auth from '@jasonpaulos/solid-auth-client';
import { graph } from '@jasonpaulos/rdflib';
import { RDFProvider, WebIdProvider } from '../contexts';
import { ProfileComponent } from './ProfileComponent';

interface Props {
  webId: string
};

export default class ProfileScreen extends Component<Props> {

  store = graph();

  static getScreenName() {
    return "ProfileScreen";
  }

  render() {
    return (
      <RDFProvider value={this.store}>
        <WebIdProvider auth={auth}>
          <ProfileComponent />
        </WebIdProvider>
      </RDFProvider>
    );
  }
}
