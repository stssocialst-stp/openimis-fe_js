import { useState, useEffect } from 'react';
import {
  Searcher,
  useModulesManager,
  useTranslations,
} from '@openimis/fe-core';

function PrlSearcher({
  module = 'prl',
  FilterPane,
  headers,
  itemFormatters,
  sorts,
  mockData = [],
  tableTitle,
  rowIdentifier = (item) => item.id,
  onDoubleClick,
  rights = [],
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

  useEffect(() => {
    setItems(mockData);
    setPageInfo(prev => ({ ...prev, totalCount: mockData.length }));
    setFetched(true);
  }, [mockData]);

  const fetch = (params) => {
    console.log('Mock fetch with params:', params);
    setFetching(true);
    // Simulate API delay
    setTimeout(() => {
      setFetching(false);
      setFetched(true);

      // Basic mock filtering
      let filteredData = [...mockData];
      if (params.filters) {
        Object.keys(params.filters).forEach(key => {
          const filterVal = params.filters[key]?.value;
          if (filterVal) {
            filteredData = filteredData.filter(item =>
              String(item[key] || '').toLowerCase().includes(String(filterVal).toLowerCase())
            );
          }
        });
      }

      setItems(filteredData);
      setPageInfo(prev => ({
        ...prev,
        totalCount: filteredData.length,
        page: params.page || 1
      }));
    }, 500);
  };

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
