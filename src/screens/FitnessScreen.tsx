import React, { Component } from 'react';
import { Text, Button, Alert, FlatList } from 'react-native';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import moment from 'moment';

interface DailySteps {
  date: string,
  value: number,
}

interface Heartrate {
  value: number,
  startDate: string,
  endDate: string,
  day: string,
}

interface Props { };

interface MonthState {
  dailySteps: DailySteps[],
  heartrate: Heartrate[],
};

interface State {
  authorized: boolean | null,
  selectedDay: string,
  data: {
    [month: string]: MonthState
  },
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
      data: {},
    };
  }

  componentDidMount() {
    GoogleFit.checkIsAuthorized()
      .then(() => {
        this.setState({
          authorized: GoogleFit.isAuthorized
        });
      });
  }

  loadDataForMonth(month: string, changeDay: boolean = true) {
    const m = moment(month).startOf('month');
    const monthString = m.format('YYYY-MM-DD');

    if (changeDay)
      this.setState({ selectedDay: monthString });

    if (this.state.data.hasOwnProperty(monthString))
      return;

    const options = {
      startDate: m.format(), // required ISO8601Timestamp
      endDate: m.endOf('month').format() // required ISO8601Timestamp
    };

    const samples = GoogleFit.getDailyStepCountSamples(options);

    if (!samples) {
      Alert.alert('Error getting data');
      return;
    }

    GoogleFit.getHeartRateSamples(options, (err, result) => {
      if (err) {
        console.warn(err);
        return;
      }

      this.setState(prevState => {
        let dataForMonth: MonthState = { dailySteps: [], heartrate: [] };
        if (prevState.data.hasOwnProperty(monthString))
          dataForMonth = prevState.data[monthString]
        
        return {
          data: {
            ...prevState.data,
            [monthString]: {
              ...dataForMonth,
              heartrate: result
            }
          }
        }
      });
    });

    samples
    .then((res: any[]) => {
      const steps = res.find(({ source }) => source === 'com.google.android.gms:merge_step_deltas');

      this.setState(prevState => {
        let dataForMonth: MonthState = { dailySteps: [], heartrate: [] };
        if (prevState.data.hasOwnProperty(monthString))
          dataForMonth = prevState.data[monthString]
        
        return {
          data: {
            ...prevState.data,
            [monthString]: {
              ...dataForMonth,
              dailySteps: steps ? steps.steps : []
            }
          }
        }
      });
    })
    .catch((err) => {console.warn(err)})
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

    for (const month of Object.keys(this.state.data)) {
      const { dailySteps, heartrate } = this.state.data[month];

      for (const entry of dailySteps) {
        const dateString = moment(entry.date).format('YYYY-MM-DD');
        if (!markedDates.hasOwnProperty(dateString))
          markedDates[dateString] = { dots: [] };
        markedDates[dateString].dots.push(stepDot);
      }
  
      for (const entry of heartrate) {
        const dateString = moment(entry.startDate).format('YYYY-MM-DD');
        if (!markedDates.hasOwnProperty(dateString))
          markedDates[dateString] = { dots: [] };
        if (!markedDates[dateString].dots.find(dot => dot.key === heartrateDot.key))
          markedDates[dateString].dots.push(heartrateDot);
      }
    }

    return (
      <>
        <Button
          title="Authorize"
          disabled={this.state.authorized !== false}
          onPress={async () => {
            const options = {
              scopes: [
                Scopes.FITNESS_ACTIVITY_READ_WRITE,
                Scopes.FITNESS_BODY_READ_WRITE,
              ],
            }
            GoogleFit.authorize(options)
              .then(authResult => {
                if (authResult.success) {
                  Alert.alert("AUTH_SUCCESS");
                  this.setState({
                    authorized: true
                  }, () => this.loadDataForMonth(moment().format()));
                } else {
                  Alert.alert("AUTH_DENIED", authResult.message);
                  this.setState({
                    authorized: false
                  });
                }
              })
              .catch(() => {
                Alert.alert("AUTH_ERROR");
              })
          }}
        />
        <Button
          title="Load fitness data"
          disabled={this.state.authorized !== true || Object.keys(this.state.data).length !== 0}
          onPress={() => this.loadDataForMonth(moment().format(), false)}
        />
        <Calendar
          current={this.state.selectedDay}
          maxDate={new Date()}
          markedDates={markedDates}
          markingType={'multi-dot'}
          onDayPress={(day) => this.onDaySelected(day.dateString)}
          onMonthChange={(month) => this.loadDataForMonth(month.dateString)}
          disableArrowRight={new Date(this.state.selectedDay).getUTCMonth() === new Date().getUTCMonth()}
        />
        <Text>
          Selected: {moment(this.state.selectedDay).format('MMMM Do YYYY')}
        </Text>
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
      </>
    );
  }
}
