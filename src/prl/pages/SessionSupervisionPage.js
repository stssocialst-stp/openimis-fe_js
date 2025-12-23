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
  { value: "Aprovado", label: "Aprovado" },
  { value: "Pendente", label: "Pendente" },
];

const MOCK_DATA = [
  { id: "1", sessionCode: "SESS-2024-001", supervisor: "Carlos Alberto", date: "2024-12-16", score: "85%", status: "Aprovado" },
  { id: "2", sessionCode: "SESS-2024-002", supervisor: "Carlos Alberto", date: "2024-12-21", score: "70%", status: "Pendente" },
];

function SessionSupervisionPage(props) {
  const { classes, intl, rights } = props;

  const headers = [
    "prl.supervision.sessionCode",
    "prl.supervision.supervisor",
    "prl.supervision.supervisionDate",
    "prl.supervision.score",
    "prl.supervision.status",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.supervisor,
    (item) => item.date,
    (item) => item.score,
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
    ["supervisor", true],
    ["date", true],
    ["score", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "sessionCode", label: "prl.supervision.sessionCode", xs: 6 },
    { field: "status", label: "prl.supervision.status", options: STATUS_OPTIONS, xs: 6 },
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
      <Helmet title={formatMessage(intl, "prl", "title.sessionSupervision")} />

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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(SessionSupervisionPage)))));
