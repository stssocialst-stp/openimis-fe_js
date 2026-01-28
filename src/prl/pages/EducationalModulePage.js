import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab,
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

  const query = `query GetModulosEducacionais($first: Int, $offset: Int, $nome_Icontains: String, $classe_Icontains: String, $escola_Icontains: String, $idDaCrianca_Icontains: String, $escolaActual_Icontains: String) {
    modulosEducacionais(
      first: $first
      offset: $offset
      nome_Icontains: $nome_Icontains
      classe_Icontains: $classe_Icontains
      escola_Icontains: $escola_Icontains
      idDaCrianca_Icontains: $idDaCrianca_Icontains
      escolaActual_Icontains: $escolaActual_Icontains
    ) {
      edges {
        node {
          id
          nome
          classeQueFrequenta
          escola
          idDaCrianca
          escolaActual
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
      nome_Icontains: filters.nome?.value || null,
      classe_Icontains: filters.classe?.value || null,
      escola_Icontains: filters.escola?.value || null,
      idDaCrianca_Icontains: filters.idDaCrianca?.value || null,
      escolaActual_Icontains: filters.escolaActual?.value || null,
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
    // Map only the available fields
    const mappedData = modules.map(module => ({
      id: module.id,
      name: module.nome,
      class: module.classeQueFrequenta,
      school: module.escola,
      idDaCrianca: module.idDaCrianca,
      escolaActual: module.escolaActual,
    }));
    return mappedData;
  };

  const headers = [
    "prl.educationalModule.name",
    "prl.educationalModule.class",
    "prl.educationalModule.school",
    "prl.educationalModule.idDaCrianca",
    "prl.educationalModule.escolaActual",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}?id=${item.id}`);
  };

  // Deletar módulo educacional
  const handleDelete = async (item) => {
    const mutation = `mutation deleteModuloEducacional($input: DeleteModuloEducacionalMutationInput!) {\n  deleteModuloEducacional(input: $input) {\n    internalId\n    clientMutationId\n  }\n}`;
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input: { id: item.id } } }),
      });
      const result = await response.json();
      fetchModules();
    } catch (e) {
      console.error('Erro ao deletar.', e);
    }
  };

  const itemFormatters = [
    (item) => item.name,
    (item) => item.class,
    (item) => item.school,
    (item) => item.idDaCrianca,
    (item) => item.escolaActual,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span>
          <Tooltip title={formatMessage(intl, "prl", "educationalModuleDetail")}>
            <IconButton
              size="small"
              className={classes.actionIcon}
              onClick={() => handleView(item)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </span>
        <span>
          <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
            <IconButton size="small" className={classes.actionIcon} onClick={() => handleDelete(item)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </span>
      </div>
    ),
  ];

  const sorts = [
    ["name", true],
    ["class", true],
    ["school", true],
    ["idDaCrianca", true],
    ["escolaActual", true],
  ];

  const filterConfig = [
    { field: "nome", label: "prl.educationalModule.name", xs: 4 },
    { field: "classe", label: "prl.educationalModule.class", xs: 4 },
    { field: "escola", label: "prl.educationalModule.school", xs: 4 },
    { field: "idDaCrianca", label: "prl.educationalModule.idDaCrianca", xs: 4 },
    { field: "escolaActual", label: "prl.educationalModule.escolaActual", xs: 4 },
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
