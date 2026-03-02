import { useState, useEffect, useCallback } from 'react';
import {
  Searcher,
  useModulesManager,
  useTranslations,
} from '@stssocialst-stp/fe-core';

function PrlSearcher({
  module = 'prl',
  FilterPane,
  headers,
  itemFormatters,
  sorts,
  tableTitle,
  rowIdentifier = (item) => item.id,
  onDoubleClick,
  rights = [],
  fetch: fetchProp,
}) {
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(module, modulesManager);

  // Local state to simulate Redux state
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(null);
  const [pageInfo, setPageInfo] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
  });

  const fetch = useCallback(async (params) => {
    console.log('Fetch with params:', params);
    setFetching(true);
    setError(null);
    try {
      if (!fetchProp) {
        throw new Error('No fetch function provided to PrlSearcher');
      }

      const data = await fetchProp(params);
      setItems(data);
      setPageInfo(prev => ({
        ...prev,
        totalCount: data.length,
        page: params.page || 1
      }));
      setFetched(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err);
      setFetched(true);
    } finally {
      setFetching(false);
    }
  }, [fetchProp]);

  // Load initial data via fetchProp
  useEffect(() => {
    if (fetchProp) {
      fetch({ filters: {}, page: 1, pageSize: 10 });
    }
  }, [fetchProp, fetch]);

  return (
    <Searcher
      module={module}
      FilterPane={FilterPane}
      fetch={fetch}
      items={items}
      itemsPageInfo={pageInfo}
      fetchingItems={fetching}
      fetchedItems={fetched}
      errorItems={error}
      tableTitle={tableTitle || formatMessageWithValues('searcher.resultsTitle', { count: items.length || 0 })}
      headers={typeof headers === 'function' ? headers : () => headers}
      itemFormatters={typeof itemFormatters === 'function' ? itemFormatters : () => itemFormatters}
      sorts={typeof sorts === 'function' ? sorts : (sorts ? () => sorts : undefined)}
      rowsPerPageOptions={[5, 10, 25]}
      defaultPageSize={10}
      rowIdentifier={rowIdentifier}
      onDoubleClick={onDoubleClick}
      rights={rights}
    />
  );
}

export default PrlSearcher;
