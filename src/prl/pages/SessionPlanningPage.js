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
import { PRL_ROUTE_SESSION_PLANNING_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const STATUS_OPTIONS = [
  { value: "Planeado", label: "Planeado" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "Cancelado", label: "Cancelado" },
];

const MOCK_DATA = [
  { id: "1", sessionCode: "SESS-2024-001", module: "Módulo 1 - Comunicação", district: "Maputo", plannedDate: "2024-12-15", trainer: "João Silva", status: "Planeado" },
  { id: "2", sessionCode: "SESS-2024-002", module: "Módulo 2 - Disciplina Positiva", district: "Gaza", plannedDate: "2024-12-20", trainer: "Maria Santos", status: "Confirmado" },
  { id: "3", sessionCode: "SESS-2024-003", module: "Módulo 3 - Desenvolvimento Infantil", district: "Inhambane", plannedDate: "2024-12-22", trainer: "Pedro Macamo", status: "Planeado" },
  { id: "4", sessionCode: "SESS-2024-004", module: "Módulo 4 - Saúde e Nutrição", district: "Sofala", plannedDate: "2024-12-28", trainer: "Ana Cossa", status: "Confirmado" },
];

function SessionPlanningPage(props) {
  const { classes, intl, rights, history } = props;

  const headers = [
    "prl.sessionPlanning.sessionCode",
    "prl.sessionPlanning.module",
    "prl.sessionPlanning.district",
    "prl.sessionPlanning.plannedDate",
    "prl.sessionPlanning.trainer",
    "prl.sessionPlanning.status",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_SESSION_PLANNING_FORM}`);
  };

  const handleView = (item) => {
    history.push({
      pathname: `/${PRL_ROUTE_SESSION_PLANNING_FORM}`,
      state: { readOnly: true, data: item }
    });
  };

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.module,
    (item) => item.district,
    (item) => item.plannedDate,
    (item) => item.trainer,
    (item) => (
      <Typography variant="body2">
        {item.status}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalhes">
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleView(item)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" className={classes.actionIcon}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["sessionCode", true],
    ["plannedDate", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "sessionCode", label: "prl.sessionPlanning.sessionCode", xs: 4 },
    { field: "status", label: "prl.sessionPlanning.status", options: STATUS_OPTIONS, xs: 4 },
    { field: "plannedDate", label: "prl.sessionPlanning.plannedDate", xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.sessionPlanning")} />

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
          <Fab color="primary" onClick={handleAdd}>
            <AddIcon />
          </Fab>
        </div>,
        formatMessage(intl, "prl", "button.add")
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(SessionPlanningPage)))));
