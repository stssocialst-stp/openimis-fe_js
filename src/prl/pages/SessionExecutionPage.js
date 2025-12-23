
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, withTooltip } from "@openimis/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const STATUS_OPTIONS = [
  { value: "Executado", label: "Executado" },
  { value: "Em Curso", label: "Em Curso" },
];

const MOCK_DATA = [
  { id: "1", sessionCode: "SESS-2024-001", module: "Módulo 1", date: "2024-12-15", duration: "2h", status: "Executado" },
  { id: "2", sessionCode: "SESS-2024-002", module: "Módulo 2", date: "2024-12-20", duration: "1.5h", status: "Em Curso" },
];

function SessionExecutionPage(props) {
  const { classes, intl, rights } = props;

  const headers = [
    "prl.execution.sessionCode",
    "prl.execution.module",
    "prl.execution.executionDate",
    "prl.execution.duration",
    "prl.execution.status",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.module,
    (item) => item.date,
    (item) => item.duration,
    (item) => (
      <Typography variant="body2">
        {item.status}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalhes">
          <IconButton size="small" className={classes.actionIcon}><VisibilityIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" className={classes.actionIcon}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["sessionCode", true],
    ["module", true],
    ["date", true],
    ["duration", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "sessionCode", label: "prl.execution.sessionCode", xs: 6 },
    { field: "status", label: "prl.execution.status", options: STATUS_OPTIONS, xs: 6 },
  ];

  const FilterPane = (filterProps) => (
    <PrlFilter
      {...filterProps}
      filterConfig={filterConfig}
      formatMessage={(key) => formatMessage(intl, "prl", key)}
    />
  );

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.sessionExecution")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        mockData={MOCK_DATA}
        rights={rights}
      />

      {withTooltip(
        <div className={classes.fab}>
          <Fab color="primary">
            <AddIcon />
          </Fab>
        </div>,
        formatMessage(intl, "prl", "button.add")
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(SessionExecutionPage)))));
