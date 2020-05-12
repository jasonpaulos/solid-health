import React, {
  FunctionComponent,
  useState,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  useWindowDimensions,
  Alert,
  FlatList,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import moment from 'moment';
import { Color } from './Color';
import { PodDataPoint } from './SyncManager';

export const DataSetScreenID = 'com.solidhealth.DataSetScreen';

interface DataSetScreenProps {
  componentId: string,
  aggregate: 'sum' | 'avg',
  getValuesForDays: (start: Date, end: Date) => Promise<PodDataPoint[]>,
}

export const DataSetScreen: FunctionComponent<DataSetScreenProps> = ({
  getValuesForDays,
  aggregate,
}) => {
  const width = useWindowDimensions().width;
  const [unit, setUnit] = useState<'week' | 'month' | 'year'>('week');
  const [data, setData] = useState<{ labels: string[], values: number[] }>({ labels: [''], values: [0] });

  useEffect(() => {
    const end = moment.utc();
    const start = end.clone().subtract(1, unit);
    getValuesForDays(start.toDate(), end.toDate())
      .then(values => {
        const subUnits = getSubUnits(unit, end);
        const buckets = subUnits.map(({ start, end }) => {
          const thisBucket = values.filter(({ parsedDate }) => {
            return start <= parsedDate && parsedDate <= end;
          });

          let sum = 0;
          for (const point of thisBucket) {
            sum += point.value;
          }

          if (aggregate === 'sum') {
            return sum;
          }

          return thisBucket.length === 0 ? 0 : sum/thisBucket.length;
        });

        setData({
          labels: subUnits.map(({ label }) => label),
          values: buckets,
        });
      })
      .catch(err => {
        console.warn(err);
        Alert.alert('Could not retrieve data', err.toString());
      });
  }, [unit]);

  return (
    <>
      <View style={styles.header}>
        <TouchableHighlight
          style={[styles.headerButton, unit === 'week' ? styles.headerSelected : {}]}
          underlayColor={Color.HighlightSelected}
          disabled={unit === 'week'}
          onPress={() => setUnit('week')}
        >
          <Text style={styles.headerButtonLabel}>Week</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={[styles.headerButton, unit === 'month' ? styles.headerSelected : {}]}
          underlayColor={Color.HighlightSelected}
          disabled={unit === 'month'}
          onPress={() => setUnit('month')}
        >
          <Text style={styles.headerButtonLabel}>Month</Text>
        </TouchableHighlight>
        <TouchableHighlight
          style={[styles.headerButton, unit === 'year' ? styles.headerSelected : {}]}
          underlayColor={Color.HighlightSelected}
          disabled={unit === 'year'}
          onPress={() => setUnit('year')}
        >
          <Text style={styles.headerButtonLabel}>Year</Text>
        </TouchableHighlight>
      </View>
      <View style={styles.content}>
        <BarChart
          data={{
            labels: data.labels,
            datasets: [
              {
                data: data.values
              }
            ]
          }}
          width={width - 20}
          height={250}
          fromZero
          chartConfig={{
            barPercentage: 0.5,
            backgroundGradientFrom: Color.Background,
            // backgroundGradientFromOpacity: 0,
            backgroundGradientTo: Color.Background,
            // backgroundGradientToOpacity: 1,
            decimalPlaces: 0, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          style={{
            marginTop: 20,
            borderColor: Color.BackgroundSelected,
            borderBottomWidth: 2,
          }}
        />
        <FlatList
          data={data.values.map((value, index) => ({ label: data.labels[index], value }))}
          renderItem={({item}) => (
            <Text style={styles.dataItem}>{item.label}: {Math.round(item.value)}</Text>
          )}
          keyExtractor={item => `${item.label}:${item.value}`}
          ListHeaderComponent={
            <Text style={styles.dataHeader}>Values:</Text>
          }
        />
      </View>
    </>
  );
}

function getSubUnits(unit: 'week' | 'month' | 'year', endingDate: moment.Moment) {
  const subunits: { label: string, start: Date, end: Date }[] = [];

  if (unit === 'week') {
    let end = endingDate.clone().endOf('week');
    for (let i = 0; i < 7; i++) {
      const start = end.clone().startOf('day');
      const label = start.format('ddd');
      subunits.push({ label, start: start.toDate(), end: end.toDate() });
      end = end.subtract(1, 'day');
    }
  } else if (unit === 'month') {
    const monthEnd = endingDate.clone().endOf('month');
    const month = monthEnd.format('MM');
    let weekEnd = monthEnd.clone().endOf('week');

    do {
      const weekStart = weekEnd.clone().startOf('week');
      const label = `${weekStart.format('Do')}-${weekEnd.format('Do')}`;

      subunits.push({ label, start: weekStart.toDate(), end: weekEnd.toDate() });
      
      weekEnd = weekEnd.subtract(1, 'week');
    } while (weekEnd.format('MM') === month);
  } else if (unit === 'year') {
    let end = endingDate.clone().endOf('year');
    for (let i = 0; i < 12; i++) {
      const start = end.clone().startOf('month');
      const label = start.format('MMM');
      subunits.push({ label, start: start.toDate(), end: end.toDate() });
      end = end.subtract(1, 'month');
    }
  }

  subunits.reverse();
  return  subunits;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 40,
  },
  headerButton: {
    flex: 1,
    backgroundColor: Color.Highlight,
  },
  headerSelected: {
    backgroundColor: Color.HighlightSelected,
  },
  headerButtonLabel: {
    width: '100%',
    height: '100%',
    fontSize: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: Color.TextLight,
  },
  content: {
    height: '100%',
    backgroundColor: Color.Background,
  },
  dataHeader: {
    fontSize: 24,
    padding: 10,
    color: Color.TextDark,
  },
  dataItem: {
    fontSize: 20,
    padding: 10,
    color: Color.TextDark,
  },
});
