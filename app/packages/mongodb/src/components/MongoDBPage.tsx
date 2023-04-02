import { addStateHistoryItem, getStateHistory, IPluginPageProps, ITimes, Page, useQueryState } from '@kobsio/core';
import { ManageSearch, Search } from '@mui/icons-material';
import { Button, Grid, IconButton, InputAdornment, Menu, MenuItem, Select, TextField, Typography } from '@mui/material';
import { FunctionComponent, MouseEvent, useMemo, useState } from 'react';
import { Route, Routes, useParams } from 'react-router-dom';

import { Collections } from './Collections';
import { DBStats } from './DBStats';
import Editor from './Editor';
import { OperationCount } from './OperationCount';
import { OperationFind } from './OperationFind';
import { OperationFindOne } from './OperationFindOne';

import { description } from '../utils/utils';

interface IQueryPageOptions {
  filter: string;
  limit: number;
  operation: string;
  sort: string;
}

interface IQueryPageParams extends Record<string, string | undefined> {
  collectionName?: string;
}

interface IDocumentPageParams extends Record<string, string | undefined> {
  collectionName?: string;
}

const QueryPageToolbarHistory: FunctionComponent<{
  identifier: string;
  setValue: (value: string) => void;
  value: string;
}> = ({ identifier, value, setValue }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const values = useMemo(() => {
    return getStateHistory(identifier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, identifier]);

  const handleOpen = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value: string) => {
    handleClose();
    setValue(value);
  };

  if (values.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton size="small" onClick={handleOpen}>
        <ManageSearch />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {values.map((v, index) => (
          <MenuItem key={index} onClick={() => handleSelect(v)}>
            <Typography noWrap={true}>{v}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const QueryPageToolbar: FunctionComponent<{
  options: IQueryPageOptions;
  setOptions: (options: IQueryPageOptions) => void;
}> = ({ options, setOptions }) => {
  const [internalOptions, setInternalOptions] = useState<IQueryPageOptions>(options);

  const query = () => {
    addStateHistoryItem('kobs-mongodb-filterhistory', internalOptions.filter);
    addStateHistoryItem('kobs-mongodb-sorthistory', internalOptions.sort);
    setOptions(internalOptions);
  };

  return (
    <Grid container={true} spacing={2}>
      <Grid item={true} xs={12} md={2}>
        Operation
      </Grid>
      <Grid item={true} xs={12} md={10}>
        <Select
          size="small"
          fullWidth={true}
          value={internalOptions.operation}
          onChange={(e) => setInternalOptions((prevOptions) => ({ ...prevOptions, operation: e.target.value }))}
        >
          <MenuItem value="find">find</MenuItem>
          <MenuItem value="count">count</MenuItem>
          <MenuItem value="findOne">findOne</MenuItem>
        </Select>
      </Grid>

      <Grid item={true} xs={12} md={2}>
        Filter
      </Grid>
      <Grid item={true} xs={12} md={10}>
        <TextField
          value={internalOptions.filter}
          onChange={(e) => setInternalOptions((prevOptions) => ({ ...prevOptions, filter: e.target.value }))}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <QueryPageToolbarHistory
                  identifier="kobs-mongodb-filterhistory"
                  value={options.filter}
                  setValue={(value) => setInternalOptions((prevOptions) => ({ ...prevOptions, filter: value }))}
                />
              </InputAdornment>
            ),
            inputComponent: Editor,
          }}
          fullWidth={true}
        />
      </Grid>

      {internalOptions.operation === 'find' && (
        <>
          <Grid item={true} xs={12} md={2}>
            Sort
          </Grid>
          <Grid item={true} xs={12} md={10}>
            <TextField
              value={internalOptions.sort}
              onChange={(e) => setInternalOptions((prevOptions) => ({ ...prevOptions, sort: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <QueryPageToolbarHistory
                      identifier="kobs-mongodb-sorthistory"
                      value={options.sort}
                      setValue={(value) => setInternalOptions((prevOptions) => ({ ...prevOptions, sort: value }))}
                    />
                  </InputAdornment>
                ),
                inputComponent: Editor,
              }}
              fullWidth={true}
            />
          </Grid>
        </>
      )}

      {internalOptions.operation === 'find' && (
        <>
          <Grid item={true} xs={12} md={2}>
            Limit
          </Grid>
          <Grid item={true} xs={12} md={10}>
            <TextField
              size="small"
              value={internalOptions.limit}
              onChange={(e) =>
                setInternalOptions((prevOptions) => ({ ...prevOptions, limit: parseInt(e.target.value) }))
              }
              type="number"
              fullWidth={true}
            />
          </Grid>
        </>
      )}

      <Grid item={true} xs={12} md={2}></Grid>
      <Grid item={true} xs={12} md={10}>
        <Button variant="contained" color="primary" startIcon={<Search />} onClick={query}>
          Query
        </Button>
      </Grid>
    </Grid>
  );
};

const QueryPage: FunctionComponent<IPluginPageProps> = ({ instance }) => {
  const params = useParams<IQueryPageParams>();
  const [options, setOptions] = useQueryState<IQueryPageOptions>({
    filter: '{}',
    limit: 50,
    operation: 'find',
    sort: '{"_id" : -1}',
  });

  const times: ITimes = {
    time: 'last15Minutes',
    timeEnd: Math.floor(Date.now() / 1000),
    timeStart: Math.floor(Date.now() / 1000) - 900,
  };

  return (
    <Page
      title={`${instance.name}: ${params.collectionName || 'Unknown Collection'}`}
      subtitle={`(${instance.cluster} / ${instance.type})`}
      description={instance.description || description}
      toolbar={<QueryPageToolbar options={options} setOptions={setOptions} />}
    >
      {options.operation === 'count' ? (
        <OperationCount
          instance={instance}
          title="Result"
          collectionName={params.collectionName ?? ''}
          filter={options.filter}
          times={times}
        />
      ) : options.operation === 'find' ? (
        <OperationFind
          instance={instance}
          title="Result"
          collectionName={params.collectionName ?? ''}
          filter={options.filter}
          sort={options.sort}
          limit={options.limit}
          times={times}
        />
      ) : options.operation === 'findOne' ? (
        <OperationFindOne
          instance={instance}
          title="Result"
          collectionName={params.collectionName ?? ''}
          filter={options.filter}
          times={times}
        />
      ) : null}
    </Page>
  );
};

const DocumentPage: FunctionComponent<IPluginPageProps> = ({ instance }) => {
  const params = useParams<IDocumentPageParams>();
  const [options] = useQueryState<{ filter: string }>({
    filter: '',
  });

  const times: ITimes = {
    time: 'last15Minutes',
    timeEnd: Math.floor(Date.now() / 1000),
    timeStart: Math.floor(Date.now() / 1000) - 900,
  };

  return (
    <Page
      title={`${instance.name}: ${params.collectionName || 'Unknown Collection'}`}
      subtitle={`(${instance.cluster} / ${instance.type})`}
      description={instance.description || description}
    >
      <OperationFindOne
        instance={instance}
        title="Result"
        collectionName={params.collectionName ?? ''}
        filter={options.filter}
        times={times}
      />
    </Page>
  );
};

const OverviewPage: FunctionComponent<IPluginPageProps> = ({ instance }) => {
  return (
    <Page
      title={instance.name}
      subtitle={`(${instance.cluster} / ${instance.type})`}
      description={instance.description || description}
    >
      <Grid container={true} spacing={4}>
        <Grid item={true} xs={12} lg={7} xl={9}>
          <Collections instance={instance} title="Collections" />
        </Grid>
        <Grid item={true} xs={12} lg={5} xl={3}>
          <DBStats instance={instance} title="Database Statistics" />
        </Grid>
      </Grid>
    </Page>
  );
};

const MongoDBPage: FunctionComponent<IPluginPageProps> = ({ instance }) => {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage instance={instance} />} />
      <Route path="/:collectionName/query" element={<QueryPage instance={instance} />} />
      <Route path="/:collectionName/document" element={<DocumentPage instance={instance} />} />
    </Routes>
  );
};

export default MongoDBPage;
