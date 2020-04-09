import React, { Component } from 'react';
import { Text, View, Alert, } from 'react-native';
import { Calendar } from 'react-native-calendars';
import moment from 'moment';
import { fitness } from '../data/fitness';

interface Props { };

interface State {
  authorized: boolean | null,
  selectedDay: string,
};

export default class FitnessScreen extends Component<Props, State> {

  static getScreenName() {
    return "FitnessScreen";
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      authorized: null,
      selectedDay: moment().format('YYYY-MM-DD'),
    };
  }

  componentDidMount() {
    fitness.authorize()
      .then((success) => {
        if (!success) {
          Alert.alert("AUTH_FAILED");
        }

        this.onMonthChanged(this.state.selectedDay);
      }, (err) => {
        Alert.alert('AUTH_ERROR');
      });
  }

  async onMonthChanged(dateString: string) {
    const month = fitness.getMonth(dateString);
    if (month == null) {
      await fitness.importMonth(dateString);
    }
    this.setState({
      selectedDay: moment(dateString).startOf('month').format('YYYY-MM-DD')
    });
  }

  onDaySelected(dateString: string) {
    this.setState({ selectedDay: dateString });
  }

  render() {
    let markedDates: { [key: string]: { selected?: boolean, dots: { key: string, color: string }[] } } = { };
    const stepDot = {
      key: 'steps',
      color: 'green',
    };

    const heartrateDot = {
      key: 'heartrate',
      color: 'red',
    };

    markedDates[this.state.selectedDay] = {
      dots: [],
      selected: true,
    };

    const month = fitness.getMonth(this.state.selectedDay);
    let loading = false;
    if (month != null) {
      for (const day of month) {
        if (!markedDates.hasOwnProperty(day.date)) {
          markedDates[day.date] = { dots: [] };
        }

        if (day.steps != null) {
          markedDates[day.date].dots.push(stepDot);
        }

        if (day.heartrate.length !== 0 && !markedDates[day.date].dots.find(dot => dot.key === heartrateDot.key)) {
          markedDates[day.date].dots.push(heartrateDot);
        }
      }
    } else {
      loading = true;
    }

    return (
      <View>
        <Calendar
          current={this.state.selectedDay}
          maxDate={new Date()}
          markedDates={markedDates}
          markingType={'multi-dot'}
          displayLoadingIndicator={true}
          onDayPress={(day) => this.onDaySelected(day.dateString)}
          onMonthChange={(month) => this.onMonthChanged(month.dateString)}
          disableArrowRight={new Date(this.state.selectedDay).getUTCMonth() === new Date().getUTCMonth()}
        />
        <View>
          <Text>
            Selected: {moment(this.state.selectedDay).format('MMMM Do YYYY')}
          </Text>
          { this.renderDay(this.state.selectedDay) }
        </View>
      </View>
    );
  }

  renderDay(dateString: string) {
    const month = fitness.getMonth(dateString);

    if (month == null)
      return null;
    
    const date = moment(dateString).startOf('day');
    const firstDayOfMonth = date.clone().startOf('month');
    const dayIndex = date.diff(firstDayOfMonth, 'days');

    const data = month[dayIndex];

    return (
      <>
        { data.steps != null && <Text> steps: {data.steps} </Text> }
        { data.heartrate.map(({ time, value }) => (
          <Text key={`${value}:${time}`}>
            {Math.round(value)} bmp at {moment(time).format('h:mm:ss a')}
          </Text>
        )) }
      </>
    );

    /*
    { this.state.data.hasOwnProperty(moment(this.state.selectedDay).startOf('month').format('YYYY-MM-DD')) &&
          this.state.data[moment(this.state.selectedDay).startOf('month').format('YYYY-MM-DD')].dailySteps
            .filter(entry => (
              moment(entry.date).format('YYYY-MM-DD') == this.state.selectedDay
            ))
            .map(entry => (
              <Text key={entry.value}>{entry.value} step(s)</Text>
            ))
        }
        {
          this.state.data.hasOwnProperty(moment(this.state.selectedDay).startOf('month').format('YYYY-MM-DD')) &&
          this.state.data[moment(this.state.selectedDay).startOf('month').format('YYYY-MM-DD')].heartrate
            .filter(entry => (
              moment(entry.startDate).format('YYYY-MM-DD') == this.state.selectedDay
            ))
            .map(entry => (
              <Text key={`${entry.value}:${entry.startDate}`}>{Math.round(entry.value)} bmp at {moment(entry.startDate).format('h:mm:ss a')}</Text>
            ))
        }
    
    */
  }
}
