import React, { FunctionComponent } from 'react';
import { Navigation } from 'react-native-navigation';
import moment from 'moment';
import { DataSetPreview } from './DataSetPreview';
import { DataSetScreenID } from './DataSetScreen';
import { getDailySteps, getDailyDistance, getHeartRate } from './SyncManager';

export interface PreviewProps {
  componentId: string,
}

export const DailyStepsPreview: FunctionComponent<PreviewProps> = ({
  componentId
}) => {
  return (
    <DataSetPreview
      label='Steps today'
      onPress={() => openDailyStepsScreen(componentId)}
      getDisplayValue={async () => {
        const end = moment.utc(moment().format('YYYY-MM-DD')).endOf('day');
        const start = end.clone().subtract(1, 'day');

        const steps = await getDailySteps(start, end);
        let sum = 0;
        for (const day of steps) {
          sum += day.value;
        }

        return Math.round(sum).toString();
      }}
    />
  );
}

function openDailyStepsScreen(componentId: string) {
  Navigation.push(componentId, {
    component: {
      name: DataSetScreenID,
      passProps: {
        aggregate: 'sum',
        getValuesForDays: getDailySteps,
      },
      options: {
        topBar: {
          title: {
            text: 'Steps'
          }
        }
      }
    }
  });
}

export const DailyDistancePreview: FunctionComponent<PreviewProps> = ({
  componentId
}) => {
  return (
    <DataSetPreview
      label='Distance walked today (meters)'
      onPress={() => openDailyDistanceScreen(componentId)}
      getDisplayValue={async () => {
        const end = moment.utc(moment().format('YYYY-MM-DD')).endOf('day');
        const start = end.clone().subtract(1, 'day');

        const distance = await getDailyDistance(start, end);
        let sum = 0;
        for (const day of distance) {
          sum += day.value;
        }

        return Math.round(sum).toString();
      }}
    />
  );
}

function openDailyDistanceScreen(componentId: string) {
  Navigation.push(componentId, {
    component: {
      name: DataSetScreenID,
      passProps: {
        aggregate: 'sum',
        getValuesForDays: getDailyDistance,
      },
      options: {
        topBar: {
          title: {
            text: 'Distance'
          }
        }
      }
    }
  });
}

export const HeartRatePreview: FunctionComponent<PreviewProps> = ({
  componentId
}) => {
  return (
    <DataSetPreview
      label='Heart rate today (bmp)'
      onPress={() => openHeartRateScreen(componentId)}
      getDisplayValue={async () => {
        const end = moment().endOf('day');
        const start = end.clone().subtract(1, 'day');

        const data = await getHeartRate(start, end);
        let min = 1000;
        let max = 0;
        for (const { value } of data) {
          if (value > max) {
            max = value;
          }
          if (value < min) {
            min = value;
          }
        }

        if (data.length !== 0) {
          return `${Math.round(min)} - ${Math.round(max)}`;
        }

        return '--';
      }}
    />
  );
}

function openHeartRateScreen(componentId: string) {
  Navigation.push(componentId, {
    component: {
      name: DataSetScreenID,
      passProps: {
        aggregate: 'avg',
        getValuesForDays: getHeartRate,
      },
      options: {
        topBar: {
          title: {
            text: 'Average Heart Rate'
          }
        }
      }
    }
  });
}
