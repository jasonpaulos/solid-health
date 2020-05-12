import React, { FunctionComponent } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import ProgressBar from 'react-native-progress/Bar';
import { useSyncStatus } from './SyncManager';
import { Color } from './Color';

export const SyncComponent: FunctionComponent = () => {
  const width = useWindowDimensions().width;
  const status = useSyncStatus();

  let progress;
  if (status.maxValue == null) {
    progress = 0;
  } else if(status.maxValue === 0) {
    progress = 1;
  } else {
    progress = status.value / status.maxValue;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{status.description}</Text>
      <ProgressBar
        progress={progress}
        indeterminate={status.maxValue == null}
        width={width - 20}
        useNativeDriver
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 60,
    borderColor: Color.BackgroundSelected,
    borderBottomWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    paddingBottom: 10,
    textAlign: 'center',
    color: Color.TextDark,
  },
});
