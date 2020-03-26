import { useContext, useState, useEffect } from 'react';
import { Fetcher } from '@jasonpaulos/rdflib';
import { NamedNode, Term } from '@jasonpaulos/rdflib/lib/tf-types';
import { RDFContext } from './screens/RDFContext';

type ValueState = {
  loading: true,
  value: undefined,
  error: undefined,
} | {
  loading: false,
  value: Term,
  error: undefined,
} | {
  loading: false,
  value: undefined,
  error: Error,
};

export function useRDF(source: string, predicate: NamedNode): ValueState {
  const store = useContext(RDFContext);
  const [state, setState] = useState<ValueState>({
    loading: true,
    value: undefined,
    error: undefined,
  });

  useEffect(() => {
    new Fetcher(store)
      .load(source)
      .then(response => {
        const sourceNode = store.sym(source);

        const value = store.any(sourceNode, predicate);

        if (!value) {
          setState({
            loading: false,
            value: undefined,
            error: new Error('No value found'),
          });
        } else {
          setState({
            loading: false,
            value,
            error: undefined,
          });
        }
      }, err => {
        setState({
          loading: false,
          value: undefined,
          error: err,
        });
      });
  }, [source]);

  return state;
}
