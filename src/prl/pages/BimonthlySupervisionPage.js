
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
  { value: "Concluído", label: "Concluído" },
  { value: "Em Revisão", label: "Em Revisão" },
];

const MOCK_DATA = [
  { id: "1", period: "Jan-Fev 2024", supervisor: "Ana Maria", date: "2024-03-10", status: "Concluído" },
  { id: "2", period: "Mar-Abr 2024", supervisor: "Ana Maria", date: "2024-05-15", status: "Em Revisão" },
];

function BimonthlySupervisionPage(props) {
  const { classes, intl, rights } = props;

  const headers = [
    "prl.bimonthlySupervision.period",
    "prl.bimonthlySupervision.supervisor",
    "Data",
    "prl.bimonthlySupervision.status",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.period,
    (item) => item.supervisor,
    (item) => item.date,
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
    ["period", true],
    ["supervisor", true],
    ["date", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "supervisor", label: "prl.bimonthlySupervision.supervisor", xs: 6 },
    { field: "status", label: "prl.bimonthlySupervision.status", options: STATUS_OPTIONS, xs: 6 },
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
      <Helmet title={formatMessage(intl, "prl", "title.bimonthlySupervision")} />

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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(BimonthlySupervisionPage)))));
