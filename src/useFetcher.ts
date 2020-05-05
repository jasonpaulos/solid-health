import { useState, useEffect } from 'react';
import * as rdf from '@jasonpaulos/rdflib';
import { authenticatedFetch } from './auth';

export interface FetcherState {
  loading: boolean,
  error: Error | null,
  store: rdf.IndexedFormula,
}

export function useFetcher(uri: string | string[]) {
  const target = Array.isArray(uri) ? uri : [uri];

  const [state, setState] = useState<FetcherState>({
    loading: true,
    error: null,
    store: rdf.graph(),
  });

  useEffect(() => {
    const fetcher = new rdf.Fetcher(state.store, { fetch: authenticatedFetch });
    const tasks = target.map(t => fetcher.load(t));
    Promise
      .all(tasks)
      .then(response => {
        setState({
          loading: false,
          error: null,
          store: state.store,
        });
      })
      .catch(err => {
        console.warn('Error fetching', err);
        setState({
          loading: false,
          error: err,
          store: state.store,
        });
      });
  }, target);

  return state;
}
