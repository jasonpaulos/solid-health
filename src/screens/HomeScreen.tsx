import React, { Component } from 'react';
import { Text } from 'react-native';

interface Props {
  title: string
};

export default class HomeScreen extends Component<Props> {

  static getScreenName() {
    return "HomeScreen";
  }

  render() {
    const title = this.props.title;
    return (
      <Text>{title}</Text>
    );
  }
}
