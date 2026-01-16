
import { useState, useCallback } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { formatMessage, withModulesManager, Helmet, withTooltip, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_EXECUTION_FORM } from "../constants";
import PrlSearcher from "../components/PrlSearcher";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
})

function SessionExecutionPage(props) {
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

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const execucaoQuery = `query GetExecucoesSessao($first: Int, $sessaoId: ID, $necessitaEncaminhamento: Boolean, $dataExecucao: DateTime) {
    execucoesSessao(first: $first, sessaoId: $sessaoId, necessitaEncaminhamento: $necessitaEncaminhamento, dataExecucao: $dataExecucao) {
      edges {
        node {
          id
          sessao {
            id
            codigoSessao
            dataSessao
          }
          formador {
            id
            username
          }
          supervisor {
            id
            username
          }
          localidade {
            id
            name
          }
          numeroCuidadores
          praticasPositivas
          outrasPraticasPositivas
          desafiosTransmissao
          outrosDesafios
          necessitaEncaminhamento
          autoAvaliacaoPontosFortes
          autoAvaliacaoPontosAtencao
          avaliacaoMetodologia
          observacoes
          dataExecucao
        }
      }
    }
  }`;

  const fetchExecutions = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const filters = params.filters || {};
      const variables = {
        first: params.pageSize || 100,
      };

      if (filters.sessionCode?.value) {
        variables.sessaoId = filters.sessionCode.value;
      }
      if (filters.necessitaEncaminhamento !== undefined) {
        variables.necessitaEncaminhamento = filters.necessitaEncaminhamento;
      }
      if (filters.dataExecucao?.value) {
        variables.dataExecucao = filters.dataExecucao.value;
      }

      console.log('Fetching executions with variables:', variables);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: execucaoQuery, variables }),
      });

      const result = await response.json();
      console.log('GraphQL response:', result);
      if (result.data?.execucoesSessao?.edges) {
        const executions = result.data.execucoesSessao.edges.map(edge => ({
          id: edge.node.id,
          sessionCode: edge.node.sessao?.codigoSessao || '',
          sessionDate: edge.node.sessao?.dataSessao || '',
          formador: edge.node.formador?.username || '',
          supervisor: edge.node.supervisor?.username || '',
          localidade: edge.node.localidade?.name || '',
          participants: edge.node.numeroCuidadores || '',
          positivas: edge.node.praticasPositivas || [],
          outrasPraticasPositivas: edge.node.outrasPraticasPositivas || '',
          desafios: edge.node.desafiosTransmissao || [],
          outrosDesafios: edge.node.outrosDesafios || '',
          necessitaEncaminhamento: edge.node.necessitaEncaminhamento || false,
          pontosFortes: edge.node.autoAvaliacaoPontosFortes || [],
          pontosAtencao: edge.node.autoAvaliacaoPontosAtencao || [],
          avaliacaoMetodologia: edge.node.avaliacaoMetodologia || {},
          observacoes: edge.node.observacoes || '',
          dataExecucao: edge.node.dataExecucao || '',
          fullNode: edge.node,
        }));
        setData(executions);
        return executions;
      } else if (result.errors) {
        console.error('Error fetching executions:', result.errors);
        return [];
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading]);

  const handleFetch = useCallback(async (params) => {
    return fetchExecutions(params);
  }, [fetchExecutions]);

  const handleView = (item) => {
    // Navigate to form page with item data in view mode
    history.push(`/${PRL_ROUTE_EXECUTION_FORM}`, { data: item.fullNode });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatParticipants = (value) => {
    switch (value) {
      case 'A_0': return '0';
      case 'A_15_': return '15+';
      case 'A_1_5': return '1-5';
      case 'A_6_10': return '6-10';
      default: return value;
    }
  };

  const headers = [
    "prl.execution.sessionCode",
    "prl.execution.executionDate",
    "prl.execution.formador",
    "prl.execution.participants",
    "prl.execution.necessitaEncaminhamento",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => formatDate(item.dataExecucao),
    (item) => item.formador,
    (item) => formatParticipants(item.participants),
    (item) => (
      <Typography variant="body2">
        {item.necessitaEncaminhamento ? 'Sim' : 'Não'}
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
      </div>
    ),
  ];

  const sorts = [
    ["sessionCode", true],
    ["dataExecucao", true],
    ["formador", true],
    ["supervisor", true],
    ["participants", true],
  ];

  const filterConfig = [
    { field: "sessionCode", label: "prl.execution.sessionCode", xs: 6 },
    { field: "dataExecucao", label: "prl.execution.executionDate", type: "date", xs: 6 },
  ];

  const FilterPane = (filterProps) => (
    <PrlFilter
      {...filterProps}
      filterConfig={filterConfig}
      formatMessage={(key) => formatMessage(intl, "prl", key)}
    />
  );

  const handleAddExecution = () => {
    history.push(`/${PRL_ROUTE_EXECUTION_FORM}`);
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.sessionExecution")} />

      <PrlSearcher
        fetch={handleFetch}
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rights={rights}
      />

      {withTooltip(
        <div className={classes.fab}>
          <Fab color="primary" onClick={handleAddExecution}>
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
