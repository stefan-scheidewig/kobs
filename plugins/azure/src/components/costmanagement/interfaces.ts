import { IPluginTimes } from '@kobsio/plugin-core';

// IOptions is the interface for all options for the applications page.
export interface IOptions {
  scope: string;
  times: IPluginTimes;
}

// IQueryResult is the interface for the data returned by the Azure api for the actual costs.
export interface IQueryResult {
  properties: IQueryProperties;
}

export interface IQueryProperties {
  columns: IQueryColumn[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[][];
}

export interface IQueryColumn {
  name: string;
  type: string;
}

export interface IPieDatum {
  id: string;
  label: string;
  value: number;
}
