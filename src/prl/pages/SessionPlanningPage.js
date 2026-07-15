import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, withTooltip, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_SESSION_PLANNING_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const STATUS_OPTIONS = [
  { value: "PLAN", label: "Planeado" },
  { value: "EXEC", label: "Executado" },
  { value: "CONC", label: "Concluído" },
  { value: "CANC", label: "Cancelado" },
];

function SessionPlanningPage(props) {
  const { classes, intl, rights, history } = props;

  const getCookie = (name) => {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const query = `query GetSessoesPep($first: Int, $distritoId: ID, $dataSessao_Gte: Date, $dataSessao_Lte: Date, $status: SessaoPEPStatus, $codigoSessao_Icontains: String, $moduloId: ID, $dataPlanejamento_Gte: Date, $orderBy: [String]) {
    sessoesPep(
      first: $first
      distritoId: $distritoId
      dataSessao_Gte: $dataSessao_Gte
      dataSessao_Lte: $dataSessao_Lte
      status: $status
      codigoSessao_Icontains: $codigoSessao_Icontains
      moduloId: $moduloId
      dataPlanejamento_Gte: $dataPlanejamento_Gte
      orderBy: $orderBy
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          codigoSessao
          dataPlanejamento
          modulo {
            id
            nome
          }
          dataSessao
          horaSessao
          distrito {
            name
          }
          grupoFamilia {
            nome
          }
          status
          tecnicosFormadores {
            lastName
          }
        }
      }
    }
  }`;

  const fetchSessions = async (params) => {
    // Se vier params.variables, use diretamente, filtrando apenas os campos preenchidos
    let variables = params.variables || {};
    // Remove campos nulos ou vazios
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    // Garante orderBy
    if (!variables.orderBy) variables.orderBy = ["-dataSessao"];


    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const sessions = result.data.sessoesPep.edges.map(edge => edge.node);

    const mappedData = sessions.map(session => ({
      id: session.id,
      sessionCode: session.codigoSessao,
      planningDate: session.dataPlanejamento,
      module: session.modulo?.nome || '',
      district: session.distrito?.name || '',
      plannedDate: session.dataSessao,
      trainer: (session.tecnicosFormadores || []).map(t => t.lastName).join(', ') || '',
      status: session.status === 'PLAN' ? 'Planeado' : session.status === 'EXEC' ? 'Executado' : session.status === 'CONC' ? 'Concluído' : session.status === 'CANC' ? 'Cancelado' : session.status,
    }));

    return mappedData;
  };

  const headers = [
    "prl.sessionPlanning.sessionCode",
    "prl.sessionPlanning.planningDate",
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
    history.push(`/${PRL_ROUTE_SESSION_PLANNING_FORM}`, { data: item, readOnly: true });
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_SESSION_PLANNING_FORM}`, { data: item, readOnly: false });
  };

  const deleteMutation = `mutation DeleteSessaoPep($id: ID!) {
    deleteSessaoPep(input: { id: $id }) {
      clientMutationId
    }
  }`;

  const handleDelete = async (item) => {
    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query: deleteMutation, variables: { id: item.id } }),
    });

    const result = await response.json();
    if (result.data) {
      // Refresh the list or show success message
      console.log('Session deleted successfully');
      // You might need to trigger a refetch here
    } else if (result.errors) {
      console.error('Error deleting session:', result.errors);
    }
  };

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.planningDate,
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
        <Tooltip title="Editar">
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleEdit(item)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleDelete(item)}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["sessionCode", true],
    ["planningDate", true],
    ["plannedDate", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "codigoSessao_Icontains", label: "prl.sessionPlanning.sessionCode", xs: 4 },
    { field: "dataPlanejamento_Gte", label: "prl.sessionPlanning.planningDate", xs: 4 },
    { field: "status", label: "prl.sessionPlanning.status", options: STATUS_OPTIONS, xs: 4 },
    { field: "dataSessao_Gte", label: "prl.sessionPlanning.plannedDate", xs: 4 },
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
        fetch={fetchSessions}
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
