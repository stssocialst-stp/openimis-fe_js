import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, withTooltip, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_SUPERVISION_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

function SessionSupervisionPage(props) {
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

  const query = `query GetSupervisoesSessao($first: Int, $offset: Int, $sessaoId: ID, $supervisorId: ID, $formadorId: ID, $dataSupervisao: Date, $identificadorGrupo: String) {
    supervisoesSessao(
      first: $first
      offset: $offset
      sessaoId: $sessaoId
      supervisorId: $supervisorId
      formadorId: $formadorId
      dataSupervisao: $dataSupervisao
      identificadorGrupo: $identificadorGrupo
    ) {
      edges {
        node {
          id
          sessao {
            codigoSessao
            dataSessao
            modulo {
              id
              nome
            }
          }
          supervisor {
            id
            username
          }
          formador {
            id
            username
          }
          dataSupervisao
          dataModuloAnterior
          identificadorGrupo
          numeroParticipantes
          praticasPositivasEstrategias
          desafiosTransmissao
          necessitaEncaminhamento
          autoAvaliacaoPontosFortes
          autoAvaliacaoPontosAtencao
        }
      }
      totalCount
    }
  }`;

  const fetchSupervisions = async (params) => {
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = params.pageSize || 10;
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;

    const variables = {
      first: pageSize,
      offset,
      sessaoId: filters.sessao_id?.value || null,
      supervisorId: filters.supervisor_id?.value || null,
      formadorId: filters.formador_id?.value || null,
      dataSupervisao: filters.dataSupervisao?.value || null,
      identificadorGrupo: filters.identificadorGrupo?.value || null,
    };

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

    const supervisions = result.data.supervisoesSessao.edges.map(edge => edge.node);

    const mappedData = supervisions.map(supervision => ({
      id: supervision.id,
      sessionCode: supervision.sessao?.codigoSessao || '-',
      sessionDate: supervision.sessao?.dataSessao || '-',
      supervisor: supervision.supervisor?.username || '-',
      formador: supervision.formador?.username || '-',
      supervisionDate: supervision.dataSupervisao || '-',
      previousModuleDate: supervision.dataModuloAnterior || '-',
      groupId: supervision.identificadorGrupo || '-',
      evaluationQuestions: supervision.perguntasAvaliacao || {},
      positivePoints: supervision.pontosPositivos || '',
      improvementPoints: supervision.pontosMelhorar || '',
      observations: supervision.observacoes || '',
      status: 'Pendente',
    }));

    return mappedData;
  };

  const headers = [
    "prl.supervision.sessionCode",
    "prl.supervision.sessionDate",
    "prl.supervision.supervisor",
    "prl.supervision.supervisionDate",
    "prl.supervision.formador",
    "prl.supervision.status",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_SUPERVISION_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/prl/supervision/form/${item.id}`);
  };

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.sessionDate,
    (item) => item.supervisor,
    (item) => item.supervisionDate,
    (item) => item.formador,
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
    ["sessionDate", true],
    ["supervisor", true],
    ["supervisionDate", true],
    ["formador", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "sessao_id", label: "prl.supervision.sessionCode", xs: 6 },
    { field: "identificadorGrupo", label: "prl.supervision.groupId", xs: 6 },
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
        fetch={fetchSupervisions}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(SessionSupervisionPage)))));
