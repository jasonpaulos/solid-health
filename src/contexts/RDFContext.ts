import React from 'react';
import { graph } from '@jasonpaulos/rdflib';

export const RDFContext = React.createContext(graph());
export const RDFProvider = RDFContext.Provider;
