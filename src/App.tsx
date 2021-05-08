import React, { useEffect, useState } from 'react';
import ReactFrappeChart from 'react-frappe-charts';
import './App.css';

const API_SUBSCRIPTION_KEY: string = process.env.REACT_APP_API_KEY || '';
const API_HEADERS = {
  'Accept-Encoding': 'application/json',
  'Ocp-Apim-Subscription-Key': API_SUBSCRIPTION_KEY,
};

interface Summary {
  meanData: DeviceTelemetry;
}

interface DeviceTelemetry {
  timestamp: number;
  temperature: number;
  humidity: number;
}

interface Data {
  timestamp: string[];
  temperature: number[];
  humidity: number[];
}

enum Interval {
  Hourly = 'HOURLY',
  Daily = 'DAILY',
  Weekly = 'WEEKLY',
}
type IntervalKey = keyof typeof Interval;

function mapData(apiData: Summary[]): Data {
  const timestamp: string[] = [];
  const temperature: number[] = [];
  const humidity: number[] = [];
  apiData.forEach((dataPt) => {
    timestamp.push(new Date(dataPt.meanData.timestamp * 1000).toString().slice(0, -37));
    temperature.push(Math.round(dataPt.meanData.temperature * 100) / 100);
    humidity.push(Math.round(dataPt.meanData.humidity * 100) / 100);
  });
  return { timestamp, temperature, humidity };
}

function App() {
  const [startDate, setStartDate] = useState<Date>(new Date(2021, 5, 1));
  const [intervalKey, setIntervalKey] = useState<IntervalKey>('Hourly');
  const [data, setData] = useState<Data>({
    timestamp: [],
    temperature: [],
    humidity: [],
  });

  const config = {
    height: 300,
    lineOptions: {
      regionFill: 1 as 1,
      hideDots: 1 as 1,
    },
    axisOptions: {
      xIsSeries: 1 as 1,
    },
  };

  useEffect(() => {
    const url =
      '/api/GetSummary?' +
      new URLSearchParams({
        customerID: 'WA',
        deviceID: 'FeatherHuzzah1',
        startTimestamp: Math.round(startDate.getTime() / 1000).toString(),
        endTimestamp: Math.round(Date.now() / 1000).toString(),
        timespan: Interval[intervalKey],
      }).toString();
    fetch(url, { method: 'GET', headers: API_HEADERS })
      .then((res) => res.json())
      .then((apiData: Summary[]) => {
        setData(mapData(apiData));
      });
  }, [startDate, intervalKey]);

  return (
    <div className="App">
      <DateInput defaultValue={new Date(2021, 4, 1)} onChange={async (date) => setStartDate(date)} />
      <IntervalInput defaultValue={intervalKey} onChange={async (key) => setIntervalKey(key)}></IntervalInput>
      <ReactFrappeChart
        type="line"
        data={{
          labels: data.timestamp,
          datasets: [{ name: 'Temperature', values: data.temperature }],
        }}
        colors={['#ff0000']}
        {...config}
      />
      <ReactFrappeChart
        type="line"
        data={{
          labels: data.timestamp,
          datasets: [{ name: 'Humidity', values: data.humidity }],
        }}
        colors={['#0000ff']}
        {...config}
      />
    </div>
  );
}

interface InputProps<T> {
  defaultValue: T;
  onChange: (value: T) => {};
}

function DateInput(props: InputProps<Date>) {
  const [date, setDate] = useState(props.defaultValue.toISOString().slice(0, 10));

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setDate(event.target.value);
    if (event.target.valueAsDate != null) {
      props.onChange(event.target.valueAsDate);
    }
  }

  return (
    <label>
      Enter date:
      <input type="date" value={date} onChange={(event) => handleChange(event)} />
    </label>
  );
}

function IntervalInput(props: InputProps<IntervalKey>) {
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    props.onChange(event.target.value as IntervalKey);
  }

  function IntervalOption(props: { value: IntervalKey }) {
    return (
      <option value={props.value} key={props.value}>
        {props.value}
      </option>
    );
  }

  return (
    <label>
      Select a summary interval:
      <select value={props.defaultValue} onChange={(event) => handleChange(event)}>
        {Object.keys(Interval).map((v: string) => IntervalOption({ value: v as IntervalKey }))}
      </select>
    </label>
  );
}

export default App;
