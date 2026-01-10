import { useState, useCallback } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import EditIcon from "@material-ui/icons/Edit";
import { formatMessage, withModulesManager, Helmet, withTooltip, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

function BimonthlySupervisionPage(props) {
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
  const [isLoading, setIsLoading] = useState(false);

  const supervisionQuery = `query GetRoteirosReuniao($first: Int, $dataReuniao_Gte: Date, $dataReuniao_Lte: Date, $coordenadorNacional_Username_Icontains: String) {
    roteirosReuniaoBimestral(first: $first, dataReuniao_Gte: $dataReuniao_Gte, dataReuniao_Lte: $dataReuniao_Lte, coordenadorNacional_Username_Icontains: $coordenadorNacional_Username_Icontains, orderBy: ["-dataReuniao"]) {
      totalCount
      edges {
        node {
          id
          uuid
          dataReuniao
          horario
          coordenadorNacional {
            id
            lastName
            otherNames
          }
          participantes
          proximaReuniao
          dataProximaReuniao
          validityFrom
          validityTo
        }
      }
    }
  }`;

  const fetchSupervisions = useCallback(async (params = {}) => {
    setIsLoading(true);
    try {
      const filters = params.filters || {};
      const variables = {
        first: params.pageSize || 100,
      };

      if (filters.dataReuniao?.from) {
        variables.dataReuniao_Gte = filters.dataReuniao.from;
      }
      if (filters.dataReuniao?.to) {
        variables.dataReuniao_Lte = filters.dataReuniao.to;
      }
      if (filters.coordenadorNacional?.value) {
        variables.coordenadorNacional_Username_Icontains = filters.coordenadorNacional.value;
      }

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: supervisionQuery, variables }),
      });

      const result = await response.json();
      if (result.data?.roteirosReuniaoBimestral?.edges) {
        const supervisions = result.data.roteirosReuniaoBimestral.edges.map(edge => ({
          id: edge.node.id,
          uuid: edge.node.uuid,
          dataReuniao: new Date(edge.node.dataReuniao).toLocaleDateString('pt-PT'),
          horario: edge.node.horario,
          coordenadorNacional: edge.node.coordenadorNacional,
          participantes: edge.node.participantes,
          resumoAgenda: edge.node.resumoAgenda,
          dataProximaReuniao: edge.node.dataProximaReuniao ? new Date(edge.node.dataProximaReuniao).toLocaleDateString('pt-PT') : '',
          validityFrom: edge.node.validityFrom,
          validityTo: edge.node.validityTo,
          fullNode: edge.node,
        }));
        setData(supervisions);
        return supervisions;
      } else if (result.errors) {
        console.error('Error fetching supervisions:', result.errors);
        return [];
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFetch = useCallback(async (params) => {
    return fetchSupervisions(params);
  }, [fetchSupervisions]);

  const handleView = (item) => {
    history.push(`/prl/bimonthlySupervision/${item.id}`, { data: item.fullNode, isView: true });
  };

  const handleEdit = (item) => {
    history.push(`/prl/bimonthlySupervision/${item.id}`, { data: item.fullNode, isView: false });
  };

  const headers = [
    "prl.bimonthlySupervision.date",
    "prl.bimonthlySupervision.coordinator",
    "prl.bimonthlySupervision.nextDate",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.dataReuniao,
    (item) => item.coordenadorNacional.lastName + " " + item.coordenadorNacional?.otherNames,
    (item) => item.dataProximaReuniao,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        <Tooltip title={formatMessage(intl, "prl", "button.view")}>
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleView(item)}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage(intl, "prl", "button.edit")}>
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleEdit(item)}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["dataReuniao", true],
    ["coordenadorNacional", true],
    ["dataProximaReuniao", true],
  ];

  const filterConfig = [
    { field: "dataReuniao", label: "prl.bimonthlySupervision.date", type: "dateRange", xs: 6 },
    { field: "coordenadorNacional", label: "prl.bimonthlySupervision.coordinator", xs: 6 },
  ];

  const FilterPane = (filterProps) => (
    <PrlFilter
      {...filterProps}
      filterConfig={filterConfig}
      formatMessage={(key) => formatMessage(intl, "prl", key)}
    />
  );

  const handleAddSupervision = () => {
    history.push('/prl/bimonthlySupervision/new', { isView: false });
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.bimonthlySupervision")} />

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
          <Fab color="primary" onClick={handleAddSupervision}>
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
