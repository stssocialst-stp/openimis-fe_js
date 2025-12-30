import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_EDUCATIONAL_MODULE_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const ACTIVE_OPTIONS = [
  { value: true, label: "Ativo" },
  { value: false, label: "Inativo" },
];

function EducationalModulePage(props) {
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

  const query = `query GetModulosEducacionais($first: Int, $offset: Int, $codigo_Icontains: String, $nome_Icontains: String, $ativo: Boolean, $orderBy: [String]) {
    modulosEducacionais(
      first: $first
      offset: $offset
      codigo_Icontains: $codigo_Icontains
      nome_Icontains: $nome_Icontains
      ativo: $ativo
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          codigo
          nome
          descricao
          ordem
          duracaoSemanas
          ativo
          validityFrom
        }
      }
      totalCount
    }
  }`;

  const fetchModules = async (params) => {
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;

    const variables = {
      first: pageSize,
      offset,
      codigo_Icontains: filters.codigo?.value || null,
      nome_Icontains: filters.nome?.value || null,
      ativo: filters.ativo?.value !== undefined ? filters.ativo.value === 'true' : null,
      orderBy: ["ordem"],
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

    const modules = result.data.modulosEducacionais.edges.map(edge => edge.node);

    const mappedData = modules.map(module => ({
      id: module.id,
      code: module.codigo,
      name: module.nome,
      description: module.descricao || '-',
      order: module.ordem,
      duration: module.duracaoSemanas,
      active: module.ativo ? 'Ativo' : 'Inativo',
      validFrom: module.validityFrom || '-',
    }));

    return mappedData;
  };

  const headers = [
    "prl.educationalModule.code",
    "prl.educationalModule.name",
    "prl.educationalModule.order",
    "prl.educationalModule.duration",
    "prl.educationalModule.active",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}?id=${item.id}`);
  };

  const itemFormatters = [
    (item) => item.code,
    (item) => item.name,
    (item) => item.order,
    (item) => item.duration,
    (item) => (
      <Typography variant="body2">
        {item.active}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={formatMessage(intl, "prl", "educationalModuleDetail")}>
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleView(item)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
          <IconButton size="small" className={classes.actionIcon}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["code", true],
    ["name", true],
    ["order", true],
    ["duration", true],
    ["active", true],
  ];

  const filterConfig = [
    { field: "codigo", label: "prl.educationalModule.code", xs: 4 },
    { field: "nome", label: "prl.educationalModule.name", xs: 4 },
    { field: "ativo", label: "prl.educationalModule.active", options: ACTIVE_OPTIONS, xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.educationalModule")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchModules}
        rights={rights}
      />

      <Tooltip title={formatMessage(intl, "prl", "button.add")}>
        <Fab color="primary" className={classes.fab} onClick={handleAdd}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(EducationalModulePage)))));
