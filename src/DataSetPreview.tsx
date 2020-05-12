import React, {
  FunctionComponent,
  useState,
  useEffect,
} from 'react';
import {
  Text,
  TouchableHighlight,
  StyleSheet,
} from 'react-native';
import { Color } from './Color';

export interface DataSetPreviewProps {
  label: string,
  labelColor?: string,
  getDisplayValue: () => Promise<string>,
  onPress?: () => any,
}

export const DataSetPreview: FunctionComponent<DataSetPreviewProps> = ({
  label,
  labelColor = Color.TextDark,
  getDisplayValue,
  onPress,
}) => {
  const [value, setValue] = useState<string>('Loading...');

  useEffect(() => {
    getDisplayValue()
      .then(setValue)
      .catch(err => {
        console.warn(err);
        setValue('Error');
      })
  }, []);

  return (
    <TouchableHighlight
      style={styles.container}
      underlayColor={Color.BackgroundSelected}
      onPress={onPress}
    >
      <>
        <Text style={[styles.value, { color: labelColor }]}>
          {value}
        </Text>
        <Text style={[styles.label, { color: labelColor }]}>
          {label}
        </Text>
      </>
    </TouchableHighlight>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 120,
    borderColor: Color.BackgroundSelected,
    borderBottomWidth: 2,
  },
  value: {
    width: '100%',
    height: '100%',
    fontSize: 40,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  label: {
    position: 'absolute',
    bottom: 5,
    left: 0,
    right: 0,
    fontSize: 18,
    textAlign: 'center',
    textAlignVertical: 'bottom',
  },
});
