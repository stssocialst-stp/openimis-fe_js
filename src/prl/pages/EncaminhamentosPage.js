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
import { PRL_ROUTE_ENCAMINHAMENTOS_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

function EncaminhamentosPage(props) {
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

  const listQuery = `query GetEncaminhamentos($sessaoId: ID, $status: EncaminhamentoStatus, $first: Int) {
    encaminhamentosSessao(sessaoId: $sessaoId, status: $status, first: $first) {
      edges {
        node {
          id
          familiaId
          nomeFamilia
          codigoEncaminhamento
          descricao
          status
          dataEncaminhamento
          sessao { id codigoSessao }
          tecnicoResponsavel { id username lastName }
          tipoEncaminhamento { id codigo nome }
        }
      }
    }
  }`;

  const cancelMutation = `mutation UpdateEncaminhamento($input: UpdateEncaminhamentoMutationInput!) {
    updateEncaminhamento(input: $input) {
      clientMutationId
      errors { message }
    }
  }`;

  const fetchEncaminhamentos = async (params) => {
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = 100;

    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query: listQuery, variables }),
    });

    if (!response.ok) throw new Error('Network response was not ok');
    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);

    const items = result.data?.encaminhamentosSessao?.edges?.map(edge => edge.node) || [];

    return items.map(item => ({
      id: item.id,
      codigoEncaminhamento: item.codigoEncaminhamento,
      familiaId: item.familiaId,
      nomeFamilia: item.nomeFamilia,
      descricao: item.descricao,
      status: item.status === 'PENDENTE' ? 'Pendente' : item.status === 'CONCLUIDO' ? 'Concluído' : item.status === 'CANCELADO' ? 'Cancelado' : item.status,
      dataEncaminhamento: item.dataEncaminhamento,
      sessao: item.sessao?.codigoSessao || '',
      tecnico: item.tecnicoResponsavel?.lastName || item.tecnicoResponsavel?.username || '',
      tipoEncaminhamento: item.tipoEncaminhamento?.nome || '',
    }));
  };

  const headers = [
    "prl.encaminhamentos.codigo",
    "prl.encaminhamentos.familiaId",
    "prl.encaminhamentos.nomeFamilia",
    "prl.encaminhamentos.tipo",
    "prl.encaminhamentos.status",
    "prl.encaminhamentos.sessao",
    "prl.encaminhamentos.tecnico",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_ENCAMINHAMENTOS_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_ENCAMINHAMENTOS_FORM}`, { data: item, readOnly: true });
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_ENCAMINHAMENTOS_FORM}`, { data: item, readOnly: false });
  };

  const handleCancel = async (item) => {
    if (!window.confirm(formatMessage(intl, "prl", "encaminhamentos.confirmCancel"))) return;
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: cancelMutation, variables: { input: { id: item.id, status: "CANCELADO" } } }),
      });
      const result = await response.json();
      if (result.errors) {
        alert('Erro: ' + result.errors[0].message);
      }
    } catch (e) {
      console.error('Error canceling encaminhamento:', e);
      alert('Erro ao cancelar: ' + e.message);
    }
  };

  const itemFormatters = [
    (item) => item.codigoEncaminhamento,
    (item) => item.familiaId,
    (item) => item.nomeFamilia,
    (item) => item.tipoEncaminhamento,
    (item) => (
      <Typography variant="body2">{item.status}</Typography>
    ),
    (item) => item.sessao,
    (item) => item.tecnico,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalhes">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleView(item)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleEdit(item)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Cancelar">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleCancel(item)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["codigoEncaminhamento", true],
    ["familiaId", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "codigoEncaminhamento_Icontains", label: "prl.encaminhamentos.codigo", xs: 4 },
    { field: "status", label: "prl.encaminhamentos.status", options: STATUS_OPTIONS, xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.encaminhamentos")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchEncaminhamentos}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(EncaminhamentosPage)))));
