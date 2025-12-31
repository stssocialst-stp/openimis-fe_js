
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

function SupervisionReportPage(props) {
  const { classes, intl, history, rights } = props;

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

  const reportsQuery = `
    query GetRelatoriosSupervisao(
      $first: Int
      $periodo: RelatorioSupervisaoBimestralPeriodo
      $ano: Int
      $nomeSupervisores_Icontains: String
      $orderBy: [String]
    ) {
      relatoriosSupervisaoBimestral(
        first: $first
        periodo: $periodo
        ano: $ano
        nomeSupervisores_Icontains: $nomeSupervisores_Icontains
        orderBy: $orderBy
      ) {
        totalCount
        edges {
          node {
            id
            uuid
            nomeSupervisores
            numSessoesSupervisionadas
            numTecnicosSupervisionados
            periodo
            ano
            distrito {
              id
              name
            }
          }
        }
      }
    }
  `;

  const fetchReports = async (params) => {
    const filters = params.filters || {};
    let periodoValue = filters.periodo?.value || null;
    // Convert numeric period to enum format if present
    if (periodoValue) {
      periodoValue = `PERIOD_${periodoValue}`;
    }

    const variables = {
      first: params.pageSize || 10,
      periodo: periodoValue,
      ano: filters.ano?.value || null,
      nomeSupervisores_Icontains: filters.nomeSupervisores_Icontains?.value || null,
      orderBy: params.orderBy || ["-ano", "-periodo"],
    };

    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query: reportsQuery, variables }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const reports = result.data.relatoriosSupervisaoBimestral.edges.map((edge) => edge.node);

    const mappedData = reports.map((report) => ({
      id: report.id,
      uuid: report.uuid,
      ano: report.ano,
      periodo: report.periodo,
      nomeSupervisores: report.nomeSupervisores,
      numSessoesSupervisionadas: report.numSessoesSupervisionadas,
      numTecnicosSupervisionados: report.numTecnicosSupervisionados,
      distritoNome: report.distrito?.name || "-",
    }));

    return mappedData;
  };

  const handleView = (rowData) => {
    history.push({
      pathname: `/prl/supervisionReport/${rowData.id}`,
      state: { isView: true, data: rowData },
    });
  };

  const handleEdit = (rowData) => {
    history.push({
      pathname: `/prl/supervisionReport/${rowData.id}`,
      state: { isView: false, data: rowData },
    });
  };

  const handleAddReport = () => {
    history.push({
      pathname: "/prl/supervisionReport/form/new",
      state: { isView: false },
    });
  };

  const headers = [
    formatMessage(intl, "prl", "supervisionReport.year"),
    formatMessage(intl, "prl", "supervisionReport.period"),
    formatMessage(intl, "prl", "supervisionReport.supervisor"),
    formatMessage(intl, "prl", "supervisionReport.sessions"),
    formatMessage(intl, "prl", "supervisionReport.actions"),
  ];

  const itemFormatters = [
    (data) => data.ano,
    (data) => data.periodo,
    (data) => data.nomeSupervisores,
    (data) => data.numSessoesSupervisionadas,
    (data) => (
      <div key={data.id}>
        <Tooltip title={formatMessage(intl, "prl", "button.view")}>
          <IconButton size="small" onClick={() => handleView(data)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage(intl, "prl", "button.edit")}>
          <IconButton size="small" onClick={() => handleEdit(data)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["ano", true],
    ["periodo", true],
    ["nomeSupervisores", true],
  ];

  const filterConfig = [
    { field: "nomeSupervisores_Icontains", label: "prl.supervisionReport.supervisor", xs: 4 },
    { field: "periodo", label: "prl.supervisionReport.period", xs: 4 },
    { field: "ano", label: "prl.supervisionReport.year", xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.supervisionReport")} />

      <PrlSearcher
        fetch={fetchReports}
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        rights={rights}
      />

      {withTooltip(
        <div className={classes.fab}>
          <Fab color="primary" onClick={handleAddReport}>
            <AddIcon />
          </Fab>
        </div>,
        formatMessage(intl, "prl", "button.add")
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(SupervisionReportPage)))));
