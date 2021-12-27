import { Alert, AlertActionLink, AlertVariant, Menu, MenuContent, MenuList, Spinner } from '@patternfly/react-core';
import { QueryObserverResult, useQuery } from 'react-query';
import React from 'react';

import { IIncident } from '../../utils/interfaces';
import { IPluginTimes } from '@kobsio/plugin-core';
import IncidentsItem from './IncidentsItem';
import { queryWithTime } from '../../utils/helpers';

interface IIncidentsProps {
  name: string;
  query: string;
  interval?: number;
  times: IPluginTimes;
  setDetails?: (details: React.ReactNode) => void;
}

const Incidents: React.FunctionComponent<IIncidentsProps> = ({
  name,
  query,
  interval,
  times,
  setDetails,
}: IIncidentsProps) => {
  const { isError, isLoading, error, data, refetch } = useQuery<IIncident[], Error>(
    ['opsgenie/incidents', name, query, interval, times],
    async () => {
      try {
        const response = await fetch(
          `/api/plugins/opsgenie/${name}/incidents?query=${queryWithTime(query, times, interval)}`,
          {
            method: 'get',
          },
        );
        const json = await response.json();

        if (response.status >= 200 && response.status < 300) {
          return json;
        } else {
          if (json.error) {
            throw new Error(json.error);
          } else {
            throw new Error('An unknown error occured');
          }
        }
      } catch (err) {
        throw err;
      }
    },
  );

  // refetchhWithDelay is used to call the refetch function to get the incidents, but with a delay of 3 seconds.
  const refetchhWithDelay = (): void => {
    setTimeout(() => {
      refetch();
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="pf-u-text-align-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert
        variant={AlertVariant.danger}
        title="Could not get incidents"
        actionLinks={
          <React.Fragment>
            <AlertActionLink onClick={(): Promise<QueryObserverResult<IIncident[], Error>> => refetch()}>
              Retry
            </AlertActionLink>
          </React.Fragment>
        }
      >
        <p>{error?.message}</p>
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Menu>
      <MenuContent>
        <MenuList>
          {data.map((incident, index) => (
            <IncidentsItem
              key={incident.id}
              name={name}
              incident={incident}
              refetch={refetchhWithDelay}
              setDetails={setDetails}
            />
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};

export default Incidents;
