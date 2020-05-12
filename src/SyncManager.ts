import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as rdf from '@jasonpaulos/rdflib';
import { EventEmitter } from 'events';
import { URL } from 'whatwg-url';
import moment from 'moment';
import { onWebIdChange, authenticatedFetch } from './auth';
import {
  DataPoint,
  getDailySteps as getGoogleFitSteps,
  getDailyDistance as getGoogleFitDistance,
  getHeartRate as getGoogleFitHeartRate,
} from './googlefit';
import { FOAF, RDF, SOLID, FHIR } from './ns';

export interface Profile {
  webId: string,
  name?: string,
  image?: string,
  friends: string[],
  privateTypeIndex?: string,
}

export interface SyncStatus {
  value: number,
  maxValue: number | null,
  description: string,
}

export type PodDataPoint = DataPoint & { uri: string, parsedDate: Date };


const syncEvents = new EventEmitter();
const syncStatus: SyncStatus = {
  value: 0,
  maxValue: null,
  description: 'Setting up...',
};
let profile: Profile | null = null;
let observationLocation: string | null = null;
const fitnessData: {
  loading: boolean,
  heartRate: PodDataPoint[],
  steps: PodDataPoint[],
  distance: PodDataPoint[],
} = {
  loading: true,
  heartRate: [],
  steps: [],
  distance: [],
};

function setSyncStatus(desc: string, value?: number, maxValue?: number) {
  syncStatus.description = desc;
  syncStatus.value = value == null || maxValue == null ? 0 : value;
  syncStatus.maxValue = value == null || maxValue == null ? null : maxValue;
  console.log(`${desc} ${value == null || maxValue == null ? '...' : `${value}/${maxValue}`}`)
  syncEvents.emit('status', { ...syncStatus });
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(syncStatus);

  useEffect(() => {
    syncEvents.on('status', setStatus);

    return () => {
      syncEvents.removeListener('status', setStatus);
    };
  }, []);

  return status;
}

export function useProfile(): Profile | null {
  const [p, setProfile] = useState<Profile | null>(profile);

  useEffect(() => {
    syncEvents.on('profile', setProfile);

    return () => {
      syncEvents.removeListener('profile', setProfile)
    };
  }, []);

  return p;
}

onWebIdChange(async (webId) => {
  profile = null;
  observationLocation = null;
  fitnessData.loading = true;
  fitnessData.heartRate = [];
  fitnessData.steps = [];
  fitnessData.distance = [];
  syncEvents.emit('fitnessData', fitnessData.loading);

  if (webId == null) {
    fitnessData.loading = false;
    syncEvents.emit('profile', profile);
    return;
  }

  let success = false;

  try {
    const store = rdf.graph();
    const fetcher = new rdf.Fetcher(store, { fetch: authenticatedFetch });

    setSyncStatus('Loading profile');

    profile = await fetchProfile(store, fetcher, webId);
    syncEvents.emit('profile', profile);

    if (!profile.privateTypeIndex) {
      throw new Error('No private type index');
    }

    setSyncStatus('Loading private type index');

    observationLocation = await fetchTypeIndex(store, fetcher, webId, profile.privateTypeIndex);
    
    setSyncStatus('Loading data from pod');

    await fetchObservations(store, fetcher, webId, observationLocation);

    success = true;
    setSyncStatus('Done', 1, 1);

  } catch (err) {
    console.warn(err);
    setSyncStatus('Could not load profile', 0, 1);
    Alert.alert('Could not load profile', err.toString());
  }

  fitnessData.loading = false;
  syncEvents.emit('fitnessData', fitnessData.loading);

  if (success) {
    const end = moment.utc().endOf('month');
    const start = end.clone().startOf('month');
    syncData(start, end);
  }
});

async function fetchProfile(store: rdf.IndexedFormula, fetcher: rdf.Fetcher, webId: string): Promise<Profile> {
  await fetcher.load(webId);

  const profile: Profile = { webId, friends: [] };

  const user = store.sym(webId);
  const name = store.any(user, FOAF('name'));
  if (name && name.value) {
    profile.name = name.value;
  }

  const image = store.any(user, FOAF('img'));
  if (image && image.value) {
    profile.image = image.value;
  }

  const friends = store.each(user, FOAF('knows'));
  profile.friends = friends.map(friend => friend.value);

  const privateTypeIndex = store.any(user, SOLID('privateTypeIndex'));
  if (privateTypeIndex && privateTypeIndex.value) {
    profile.privateTypeIndex = privateTypeIndex.value;
  }

  return profile;
}

async function fetchTypeIndex(store: rdf.IndexedFormula, fetcher: rdf.Fetcher, webId: string, typeIndex: string): Promise<string> {
  await fetcher.load(typeIndex);

  let observationLocation: string | null = null;

  const observationTypeRegistration = store.any(null, SOLID('forClass'), FHIR('Observation'));
  if (observationTypeRegistration && observationTypeRegistration.value) {
    const observationTypeFile = store.any(observationTypeRegistration as rdf.NamedNode, SOLID('instance'));
    const observationTypeDirectory = store.any(observationTypeRegistration as rdf.NamedNode, SOLID('instanceContainer'));

    if (observationTypeFile && observationTypeFile.value) {
      observationLocation = observationTypeFile.value;
    } else if (observationTypeDirectory && observationTypeDirectory.value) {
      observationLocation = new URL('./fitness.ttl', observationTypeDirectory.value).href;
    }
  }

  if (observationLocation == null) {
    console.log('Observation location not found, creating');

    const defaultLocation = '/private/health/';
    const query = `INSERT DATA {
      <#FHIRObservation> a <http://www.w3.org/ns/solid/terms#TypeRegistration> ;
        <http://www.w3.org/ns/solid/terms#forClass> <http://hl7.org/fhir/Observation> ;
        <http://www.w3.org/ns/solid/terms#instanceContainer> <${defaultLocation}> .
        <> <http://purl.org/dc/terms/references> <#FHIRObservation> .
      }`;
    const ret = await authenticatedFetch(typeIndex, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/sparql-update' },
      body: query,
      credentials: 'include',
    });
    if (!ret.ok) {
      throw new Error('Type registration insert unsuccessful: response ' + ret.status);
    }

    console.log('Added triple to private type index');

    const privateFolder = new URL('/private', typeIndex).href;
    await authenticatedFetch(privateFolder, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/turtle',
        'Link': '<http://www.w3.org/ns/ldp#BasicContainer>; rel="type"',
        'Slug': 'health',
      },
      body: '<> <http://purl.org/dc/terms/title> "FHIR Health Observations" .',
      credentials: 'include',
    });

    console.log('Created /private/health');

    observationLocation = new URL(defaultLocation + 'fitness.ttl', typeIndex).href;
  }

  return observationLocation;
}

async function fetchObservations(store: rdf.IndexedFormula, fetcher: rdf.Fetcher, webId: string, observationLocation: string) {
  try {
    await fetcher.load(observationLocation);
  } catch (err) {
    await authenticatedFetch(observationLocation, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/sparql-update' },
      body: `INSERT DATA {
        <${webId}> a <http://hl7.org/fhir/Patient> .
        <> a <http://www.w3.org/2002/07/owl#Ontology>;
          <http://www.w3.org/2002/07/owl#imports> <http://hl7.org/fhir/fhir.ttl>.
      }`,
      credentials: 'include',
    });

    console.log('Populated ' + observationLocation);
  }

  function getSubject(observation: rdf.NamedNode): string | null {
    const subject = store.any(observation, FHIR('Observation.subject'));
    if (!subject) return null;

    const patient = store.any(subject as rdf.BlankNode, FHIR('link'));
    return patient ? patient.value : null;
  }

  function getEffectiveDateTime(observation: rdf.NamedNode): string | null {
    const effectiveDateTime = store.any(observation, FHIR('Observation.effectiveDateTime'));
    if (!effectiveDateTime) return null;

    const effectiveDateTimeValue = store.any(effectiveDateTime as rdf.BlankNode, FHIR('value'));
    if (!effectiveDateTimeValue || effectiveDateTimeValue.termType !== 'Literal') return null;

    const dateTimeLiteral = effectiveDateTimeValue as rdf.Literal;
    if (dateTimeLiteral.datatype.value !== 'http://www.w3.org/2001/XMLSchema#date') return null;

    return dateTimeLiteral.value;
  }

  function getValue(observation: rdf.NamedNode): number | null {
    const valueQuantity = store.any(observation, FHIR('Observation.valueQuantity'));
    if (!valueQuantity) return null;

    const quantityValue = store.any(valueQuantity as rdf.BlankNode, FHIR('Quantity.value'));
    if (!quantityValue) return null

    const quantityValueValue = store.any(quantityValue as rdf.BlankNode, FHIR('value'));
    if (!quantityValueValue || quantityValueValue.termType !== 'Literal') return null;

    const quantityValueValueLiteral = quantityValueValue as rdf.Literal;
    if (quantityValueValueLiteral.datatype.value !== 'http://www.w3.org/2001/XMLSchema#decimal' && quantityValueValueLiteral.datatype.value !== 'http://www.w3.org/2001/XMLSchema#integer') return null;

    const value = parseFloat(quantityValueValueLiteral.value);

    return isNaN(value) ? null : value;
  }

  function getType(observation: rdf.NamedNode): 'heartrate' | 'steps' | 'distance' | null {
    const code = store.any(observation, FHIR('Observation.code'));
    if (!code) return null;

    const coding = store.any(code as rdf.BlankNode, FHIR('CodeableConcept.coding'));
    if (!coding) return null;

    const codingSystem = store.any(coding as rdf.BlankNode, FHIR('Coding.system'));
    const codingCode = store.any(coding as rdf.BlankNode, FHIR('Coding.code'));
    if (!codingSystem || !codingCode) return null;

    const codingSytemValue = store.any(codingSystem as rdf.BlankNode, FHIR('value'));
    const codingCodeValue = store.any(codingCode as rdf.BlankNode, FHIR('value'));
    if (!codingSytemValue || !codingCodeValue) return null;

    if (codingSytemValue.value === 'http://loinc.org' && codingCodeValue.value === '8867-4') {
      return 'heartrate';
    }

    if (codingSytemValue.value === 'http://loinc.org' && codingCodeValue.value === '55423-8') {
      return 'steps';
    }

    if (codingSytemValue.value === 'http://loinc.org' && codingCodeValue.value === '41953-1') {
      return 'distance';
    }

    return null;
  }

  for (const observation of store.each(null, RDF('type'), FHIR('Observation'))) {
    const subject = getSubject(observation as rdf.NamedNode);
    const effectiveDateTime = getEffectiveDateTime(observation as rdf.NamedNode);
    const value = getValue(observation as rdf.NamedNode);
    const type = getType(observation as rdf.NamedNode);

    if (subject !== webId || effectiveDateTime == null || value == null) continue;

    const dataPoint: PodDataPoint = {
      uri: observation.value,
      parsedDate: new Date(effectiveDateTime),
      date: effectiveDateTime,
      value
    };

    switch (type) {
      case 'heartrate':
        fitnessData.heartRate.push(dataPoint);
        break;
      case 'steps':
        fitnessData.steps.push(dataPoint);
        break;
      case 'distance':
        fitnessData.distance.push(dataPoint);
        break;
    }
  }
}

function waitForFitnessData(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fitnessData.loading)
      return resolve();
    
    const fitnessListener = () => {
      if (!fitnessData.loading) {
        resolve();
        syncEvents.removeListener('fitnessData', fitnessListener);
      }
    }
    
    syncEvents.on('fitnessData', fitnessListener);
  });
}

export async function getHeartRate(startDate: string | Date | moment.Moment, endDate: string | Date | moment.Moment): Promise<PodDataPoint[]> {
  if (typeof startDate === 'string') {
    startDate = new Date(startDate);
  } else if (!(startDate instanceof Date)) {
    startDate = startDate.toDate();
  }
  
  if (typeof endDate === 'string') {
    endDate = new Date(endDate);
  } else if (!(endDate instanceof Date)) {
    endDate = endDate.toDate();
  }

  await waitForFitnessData();

  return fitnessData.heartRate
    .filter(point => (startDate <= point.parsedDate && point.parsedDate <= endDate));
}

export async function getDailySteps(startDate: string | Date | moment.Moment, endDate: string | Date | moment.Moment): Promise<PodDataPoint[]> {
  if (typeof startDate === 'string') {
    startDate = new Date(startDate);
  } else if (!(startDate instanceof Date)) {
    startDate = startDate.toDate();
  }
  
  if (typeof endDate === 'string') {
    endDate = new Date(endDate);
  } else if (!(endDate instanceof Date)) {
    endDate = endDate.toDate();
  }

  await waitForFitnessData();

  return fitnessData.steps
    .filter(point => (startDate <= point.parsedDate && point.parsedDate <= endDate));
}

export async function getDailyDistance(startDate: string | Date | moment.Moment, endDate: string | Date | moment.Moment): Promise<PodDataPoint[]> {
  if (typeof startDate === 'string') {
    startDate = new Date(startDate);
  } else if (!(startDate instanceof Date)) {
    startDate = startDate.toDate();
  }
  
  if (typeof endDate === 'string') {
    endDate = new Date(endDate);
  } else if (!(endDate instanceof Date)) {
    endDate = endDate.toDate();
  }

  await waitForFitnessData();

  return fitnessData.distance
    .filter(point => (startDate <= point.parsedDate && point.parsedDate <= endDate));
}

async function syncData(start: moment.Moment, end: moment.Moment) {
  const month = end.format('MMMM YYYY');

  try {
    const [
      podSteps,
      podDistance,
      podHeartRate,
      googleSteps,
      googleDistance,
      googleHeartRate,
    ] = await Promise.all<PodDataPoint[], PodDataPoint[], PodDataPoint[], DataPoint[], DataPoint[], DataPoint[]>([
      getDailySteps(start, end),
      getDailyDistance(start, end),
      getHeartRate(start, end),
      getGoogleFitSteps(start.format(), end.format()),
      getGoogleFitDistance(start.format(), end.format()),
      getGoogleFitHeartRate(start.format(), end.format()),
    ]);

    const stepsToUpload: DataPoint[] = [];
    const distanceToUpload: DataPoint[] = [];
    const heartRateToUpload: DataPoint[] = [];
    const pointsToModify: [PodDataPoint, number][] = [];

    for (const googlePoint of googleSteps) {
      const googleTime = new Date(googlePoint.date).getTime();
      let found = false;
      for (const podPoint of podSteps) {
        const podTime = podPoint.parsedDate.getTime();
        if (googleTime === podTime) {
          if (Math.abs(googlePoint.value - podPoint.value) > 0.01) {
            pointsToModify.push([podPoint, googlePoint.value]);
          }
          found = true;
          break;
        }
      }
      if (!found) {
        stepsToUpload.push(googlePoint);
      }
    }

    for (const googlePoint of googleDistance) {
      const googleTime = new Date(googlePoint.date).getTime();
      let found = false;
      for (const podPoint of podDistance) {
        const podTime = podPoint.parsedDate.getTime();
        if (googleTime === podTime) {
          if (Math.abs(googlePoint.value - podPoint.value) > 0.01) {
            pointsToModify.push([podPoint, googlePoint.value]);
          }
          found = true;
          break;
        }
      }
      if (!found) {
        distanceToUpload.push(googlePoint);
      }
    }

    for (let i = 0; i < googleHeartRate.length; i++) {
      const googlePoint = googleHeartRate[i];
      const googleTime = new Date(googlePoint.date).getTime();

      if (i > 0) {
        const lastPoint = googleHeartRate[i - 1];
        if (Math.abs(googlePoint.value - lastPoint.value) <= 1
          && Math.abs(googleTime - new Date(lastPoint.date).getTime()) <= 60000
        ) {
          // for some reason Google Fit APIs tend to return multiple heart rate
          // readings with the similar values very close together. This ignores
          // readings within 1 minute of each other with similar values.
          continue;
        }
      }

      let found = false;
      for (const podPoint of podHeartRate) {
        const podTime = podPoint.parsedDate.getTime();
        if (googleTime === podTime) {
          found = true;
          break;
        }
      }
      if (!found) {
        heartRateToUpload.push(googlePoint);
      }
    }

    console.log(`Points to modify: ${pointsToModify.length}`);
    console.log(`Steps to upload: ${stepsToUpload.length}`);
    console.log(`Distance to upload: ${distanceToUpload.length}`);
    console.log(`Heart rate to upload: ${heartRateToUpload.length}`);

    if (pointsToModify.length !== 0) {
      setSyncStatus('Updating pod data for ' + month, 0, pointsToModify.length);
    }

    for (let i = 0; i < pointsToModify.length; i++) {
      const [point, newValue] = pointsToModify[i];
      const type = Math.floor(newValue) === newValue ? 'integer' : 'decimal';

      const query = `DELETE {
        ?s <http://hl7.org/fhir/value> ?o
      } INSERT {
        ?s <http://hl7.org/fhir/value> "${newValue}"^^<http://www.w3.org/2001/XMLSchema#${type}>
      } WHERE {
        <${point.uri}> <http://hl7.org/fhir/Observation.valueQuantity> [
          <http://hl7.org/fhir/Quantity.value> ?s
        ] .
        ?s <http://hl7.org/fhir/value> ?o
      }`;

      console.log(query);

      const ret = await authenticatedFetch(observationLocation, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/sparql-update' },
        body: query,
        credentials: 'include',
      });
      if (!ret.ok) {
        let txt = '';
        try {
          txt = await ret.text();
        } catch (_) { }
        throw new Error(`Invalid status: ${ret.status} ${txt}`);
      }

      setSyncStatus('Updating pod data for ' + month, i+1, pointsToModify.length);
    }

    let observationsToUpload: string[] = [];

    for (const point of stepsToUpload) {
      const { observation, uri } = stepsToObservation(point);
      observationsToUpload.push(observation);
      fitnessData.steps.push({
        date: point.date,
        value: point.value,
        parsedDate: new Date(point.date),
        uri,
      });
    }

    for (const point of distanceToUpload) {
      const { observation, uri } = distanceToObservation(point);
      observationsToUpload.push(observation);
      fitnessData.distance.push({
        date: point.date,
        value: point.value,
        parsedDate: new Date(point.date),
        uri,
      });
    }

    for (const point of heartRateToUpload) {
      const { observation, uri } = heartRateToObservation(point);
      observationsToUpload.push(observation);
      fitnessData.heartRate.push({
        date: point.date,
        value: point.value,
        parsedDate: new Date(point.date),
        uri,
      });
    }

    syncEvents.emit('fitness', fitnessData.loading);

    const needToUpload = observationsToUpload.length;
    let totalUploaded = 0;
    setSyncStatus('Syncing data to pod for ' + month, totalUploaded, needToUpload);

    while (observationsToUpload.length !== 0) {
      let batch;
      if (observationsToUpload.length > 50) {
        batch = observationsToUpload.slice(0, 50);
        observationsToUpload = observationsToUpload.slice(50);
      } else {
        batch = observationsToUpload;
        observationsToUpload = [];
      }
      const query = 'INSERT DATA {\n' + batch.join('\n') + '\n}';

      const ret = await authenticatedFetch(observationLocation, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/sparql-update' },
        body: query,
        credentials: 'include',
      });
      if (!ret.ok) {
        let txt = '';
        try {
          txt = await ret.text();
        } catch (_) { }
        throw new Error(`Invalid status: ${ret.status} ${txt}`);
      }

      totalUploaded += batch.length;
      setSyncStatus('Syncing data to pod for ' + month, totalUploaded, needToUpload);
    }

    if (needToUpload !== 0) {
      syncData(start.clone().subtract(1, 'month'), end.clone().subtract(1, 'month'));
    } else {
      setSyncStatus('Everything up to date', 1, 1);
    }
  } catch (err) {
    console.warn(err);
    setSyncStatus('Could not sync data', 0, 1);
    Alert.alert('Could not sync data', err.toString());
  }
}

function stepsToObservation({ date, value }: DataPoint): { uri: string, observation: string } {
  const webId = profile?.webId;
  const id = '#steps_' + moment(date).format('YYYYMMDD');
  const observation = `<${id}> a <http://hl7.org/fhir/Observation>;
<http://hl7.org/fhir/nodeRole> <http://hl7.org/fhir/treeRoot>;
<http://hl7.org/fhir/Observation.status> [ <http://hl7.org/fhir/value> "final"];
<http://hl7.org/fhir/Observation.code> [
  <http://hl7.org/fhir/CodeableConcept.coding> [
    <http://hl7.org/fhir/index> 0;
    a <http://loinc.org/rdf#55423-8>;
    <http://hl7.org/fhir/Coding.system> [ <http://hl7.org/fhir/value> "http://loinc.org" ];
    <http://hl7.org/fhir/Coding.code> [ <http://hl7.org/fhir/value> "55423-8" ];
    <http://hl7.org/fhir/Coding.display> [ <http://hl7.org/fhir/value> "Step count" ]
  ];
  <http://hl7.org/fhir/CodeableConcept.text> [ <http://hl7.org/fhir/value> "Step count" ]
];
<http://hl7.org/fhir/Observation.subject> [
  <http://hl7.org/fhir/link> <${webId}>;
];
<http://hl7.org/fhir/Observation.effectiveDateTime> [ <http://hl7.org/fhir/value> "${date}"^^<http://www.w3.org/2001/XMLSchema#date> ];
<http://hl7.org/fhir/Observation.valueQuantity> [
  <http://hl7.org/fhir/Quantity.value> [ <http://hl7.org/fhir/value> "${value}"^^<http://www.w3.org/2001/XMLSchema#integer> ];
  <http://hl7.org/fhir/Quantity.unit> [ <http://hl7.org/fhir/value> "/d" ];
  <http://hl7.org/fhir/Quantity.system> [ <http://hl7.org/fhir/value> "http://unitsofmeasure.org" ];
  <http://hl7.org/fhir/Quantity.code> [ <http://hl7.org/fhir/value> "/d" ]
] .
<> <http://purl.org/dc/terms/references> <${id}> .`;
  return { uri: id, observation };
}

function distanceToObservation({ date, value }: DataPoint): { uri: string, observation: string } {
  const webId = profile?.webId;
  const id = '#distance_' + moment(date).format('YYYYMMDD');
  const observation = `<${id}> a <http://hl7.org/fhir/Observation>;
<http://hl7.org/fhir/nodeRole> <http://hl7.org/fhir/treeRoot>;
<http://hl7.org/fhir/Observation.status> [ <http://hl7.org/fhir/value> "final"];
<http://hl7.org/fhir/Observation.code> [
  <http://hl7.org/fhir/CodeableConcept.coding> [
    <http://hl7.org/fhir/index> 0;
    a <http://loinc.org/rdf#41953-1>;
    <http://hl7.org/fhir/Coding.system> [ <http://hl7.org/fhir/value> "http://loinc.org" ];
    <http://hl7.org/fhir/Coding.code> [ <http://hl7.org/fhir/value> "41953-1" ];
    <http://hl7.org/fhir/Coding.display> [ <http://hl7.org/fhir/value> "Distanced walked" ]
  ];
  <http://hl7.org/fhir/CodeableConcept.text> [ <http://hl7.org/fhir/value> "Distanced walked" ]
];
<http://hl7.org/fhir/Observation.subject> [
  <http://hl7.org/fhir/link> <${webId}>;
];
<http://hl7.org/fhir/Observation.effectiveDateTime> [ <http://hl7.org/fhir/value> "${date}"^^<http://www.w3.org/2001/XMLSchema#date> ];
<http://hl7.org/fhir/Observation.valueQuantity> [
  <http://hl7.org/fhir/Quantity.value> [ <http://hl7.org/fhir/value> "${value}"^^<http://www.w3.org/2001/XMLSchema#decimal> ];
  <http://hl7.org/fhir/Quantity.unit> [ <http://hl7.org/fhir/value> "m/d" ];
  <http://hl7.org/fhir/Quantity.system> [ <http://hl7.org/fhir/value> "http://unitsofmeasure.org" ];
  <http://hl7.org/fhir/Quantity.code> [ <http://hl7.org/fhir/value> "/d" ]
] .
<> <http://purl.org/dc/terms/references> <${id}> .`;
  return { uri: id, observation };
}

function heartRateToObservation({ date, value }: DataPoint): { uri: string, observation: string } {
  const webId = profile?.webId;
  const id = '#heartrate_' + moment(date).format('x');
  const observation = `<${id}> a <http://hl7.org/fhir/Observation>;
<http://hl7.org/fhir/nodeRole> <http://hl7.org/fhir/treeRoot>;
<http://hl7.org/fhir/Observation.status> [ <http://hl7.org/fhir/value> "final"];
<http://hl7.org/fhir/Observation.code> [
  <http://hl7.org/fhir/CodeableConcept.coding> [
    <http://hl7.org/fhir/index> 0;
    a <http://loinc.org/rdf#8867-4>;
    <http://hl7.org/fhir/Coding.system> [ <http://hl7.org/fhir/value> "http://loinc.org" ];
    <http://hl7.org/fhir/Coding.code> [ <http://hl7.org/fhir/value> "8867-4" ];
    <http://hl7.org/fhir/Coding.display> [ <http://hl7.org/fhir/value> "Heart rate" ]
  ];
  <http://hl7.org/fhir/CodeableConcept.text> [ <http://hl7.org/fhir/value> "Heart rate" ]
];
<http://hl7.org/fhir/Observation.subject> [
  <http://hl7.org/fhir/link> <${webId}>;
];
<http://hl7.org/fhir/Observation.effectiveDateTime> [ <http://hl7.org/fhir/value> "${date}"^^<http://www.w3.org/2001/XMLSchema#date> ];
<http://hl7.org/fhir/Observation.valueQuantity> [
  <http://hl7.org/fhir/Quantity.value> [ <http://hl7.org/fhir/value> "${value}"^^<http://www.w3.org/2001/XMLSchema#decimal> ];
  <http://hl7.org/fhir/Quantity.unit> [ <http://hl7.org/fhir/value> "beats/min" ];
  <http://hl7.org/fhir/Quantity.system> [ <http://hl7.org/fhir/value> "http://unitsofmeasure.org" ];
  <http://hl7.org/fhir/Quantity.code> [ <http://hl7.org/fhir/value> "/min" ]
] .
<> <http://purl.org/dc/terms/references> <${id}> .`;
  return { uri: id, observation };
}
