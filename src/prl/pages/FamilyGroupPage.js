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
import { PRL_ROUTE_FAMILY_GROUP_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const ACTIVE_OPTIONS = [
  { value: true, label: "Ativo" },
  { value: false, label: "Inativo" },
];

function FamilyGroupPage(props) {
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

  const query = `query GetGruposFamiliares($first: Int, $offset: Int, $codigo_Icontains: String, $nome_Icontains: String, $distritoId: String, $localidadeId: ID, $ativo: Boolean) {
    gruposFamiliares(
      first: $first
      offset: $offset
      codigo_Icontains: $codigo_Icontains
      nome_Icontains: $nome_Icontains
      distritoId: $distritoId
      localidadeId: $localidadeId
      ativo: $ativo
    ) {
      edges {
        node {
          id
          codigo
          nome
          distrito {
            id
            code
            name
          }
          localidade {
            id
            code
            name
          }
          numeroFamilias
          ativo
          validityFrom
        }
      }
      totalCount
    }
  }`;

  const fetchFamilyGroups = async (params) => {
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = params.pageSize || 10;
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;



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

    const groups = result.data.gruposFamiliares.edges.map(edge => edge.node);

    const mappedData = groups.map(group => ({
      id: group.id,
      code: group.codigo,
      name: group.nome,
      district: group.distrito?.name || '-',
      locality: group.localidade?.name || '-',
      families: group.numeroFamilias || 0,
      active: group.ativo ? 'Ativo' : 'Inativo',
      validFrom: group.validityFrom || '-',
    }));

    return mappedData;
  };

  const headers = [
    "prl.familyGroup.code",
    "prl.familyGroup.name",
    "prl.familyGroup.district",
    "prl.familyGroup.families",
    "prl.familyGroup.active",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_FAMILY_GROUP_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_FAMILY_GROUP_FORM}?id=${item.id}`);
  };

  const itemFormatters = [
    (item) => item.code,
    (item) => item.name,
    (item) => item.district,
    (item) => item.families,
    (item) => (
      <Typography variant="body2">
        {item.active}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={formatMessage(intl, "prl", "familyGroupDetail")}>
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
    ["district", true],
    ["active", true],
  ];

  const filterConfig = [
    { field: "codigo", label: "prl.familyGroup.code", xs: 4 },
    { field: "nome", label: "prl.familyGroup.name", xs: 4 },
    { field: "ativo", label: "prl.familyGroup.active", options: ACTIVE_OPTIONS, xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.familyGroup")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchFamilyGroups}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(FamilyGroupPage)))));
