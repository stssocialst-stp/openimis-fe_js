import { Grid, TextField, MenuItem } from '@material-ui/core';

function PrlFilter({ filters, onChangeFilters, filterConfig, formatMessage }) {
  const handleChange = (field) => (event) => {
    const value = event.target.value;
    const newFilters = { ...filters };

    if (value === '' || value === undefined) {
      delete newFilters[field];
    } else {
      newFilters[field] = {
        value: value,
        // This is the format Searcher expects for the backend query
        filter: `${field}: "${value}"`,
      };
    }

    onChangeFilters(newFilters);
  };

  return (
    <Grid container spacing={2}>
      {filterConfig.map((config) => (
        <Grid item xs={12} sm={config.xs || 4} key={config.field}>
          <TextField
            fullWidth
            select={!!config.options}
            label={formatMessage(config.label)}
            value={filters[config.field]?.value || ''}
            onChange={handleChange(config.field)}
            variant="outlined"
            size="small"
          >
            {config.options && config.options.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      ))}
    </Grid>
  );
}

export default PrlFilter;
