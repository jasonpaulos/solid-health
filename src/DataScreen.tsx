import React, {
  FunctionComponent,
  useState,
  useEffect,
} from 'react';
import {
  ScrollView,
  StyleSheet
} from 'react-native';
import { Color } from './Color';
import { SyncComponent } from './SyncComponent';
import {
  DailyStepsPreview,
  DailyDistancePreview,
  HeartRatePreview,
} from './DataSets';

export const DataScreenID = 'com.solidhealth.DataScreen';

interface DataScreenProps {
  componentId: string,
}

export const DataScreen: FunctionComponent<DataScreenProps> = ({
  componentId,
}) => {
  return (
    <ScrollView style={styles.content}>
      <SyncComponent />
      <DailyStepsPreview componentId={componentId} />
      <DailyDistancePreview componentId={componentId} />
      <HeartRatePreview componentId={componentId} />
    </ScrollView>
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
    backgroundColor: Color.Background,
  },
});
