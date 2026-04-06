
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Typography, Fab,
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_BIMONTHLY_REPORT_FORM } from "../constants";
import { withRouter } from "react-router-dom";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const PERIODO_OPTIONS = [
  { value: "BIM1", label: "1º Bimestre (Jan-Fev)" },
  { value: "BIM2", label: "2º Bimestre (Mar-Abr)" },
  { value: "BIM3", label: "3º Bimestre (Mai-Jun)" },
  { value: "BIM4", label: "4º Bimestre (Jul-Ago)" },
  { value: "BIM5", label: "5º Bimestre (Set-Out)" },
  { value: "BIM6", label: "6º Bimestre (Nov-Dez)" },
];

function BimonthlyReportPage(props) {
  const { classes, intl, rights, history } = props;

  const handleNew = () => {
    history.push(`/${PRL_ROUTE_BIMONTHLY_REPORT_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_BIMONTHLY_REPORT_FORM}`, { data: item, readOnly: true });
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_BIMONTHLY_REPORT_FORM}`, { data: item, readOnly: false });
  };

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

  const query = `query GetRelatoriosDistritais($first: Int, $offset: Int, $distritoId: ID, $ano: Int, $periodo: RelatorioDistritalBimestralPeriodo) {
    relatoriosDistritais(
      first: $first
      offset: $offset
      distritoId: $distritoId
      ano: $ano
      periodo: $periodo
    ) {
      edges {
        node {
          id
          distrito {
            code
            name
          }
          coordenadorDistrital {
            username
          }
          tecnicoAdministrativo {
            username
          }
          periodo
          ano
          periodoInicio
          periodoFim
          numeroLocalidadesAtendidas
          numeroFamiliasAtendidas
          numeroTecnicosFormadores
          numeroSessoesConduzidas
          numeroSessoesEsperadas
          numeroFamiliasPresentes
          numeroFamiliasEsperadas
          percentualSessoes
          percentualFamilias
          numeroFamiliasMigraram
          numeroSessoesPerdidas
          mediaFamiliaPresente
          mediaFamiliaEsperada
          observacoes
        }
      }
      totalCount
    }
  }`;

  const fetchReports = async (params) => {
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = params.pageSize || 10;
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;

    const variables = {
      first: pageSize,
      offset,
      distritoId: filters.distrito_id?.value || null,
      ano: filters.ano?.value ? parseInt(filters.ano.value) : null,
      periodo: filters.periodo?.value || null,
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

    const reports = result.data.relatoriosDistritais.edges.map(edge => edge.node);

    const mappedData = reports.map(report => ({
      id: report.id,
      period: `${report.periodo} - ${report.ano}`,
      district: report.distrito?.name || '-',
      coordinator: report.coordenadorDistrital?.username || '-',
      technician: report.tecnicoAdministrativo?.username || '-',
      date: report.periodoFim || '-',
      sessionsPercent: report.percentualSessoes || '0%',
      familiesPercent: report.percentualFamilias || '0%',
      status: 'Submetido',
    }));

    return mappedData;
  };

  const headers = [
    "prl.bimonthlyReport.period",
    "prl.sessionPlanning.district",
    "prl.bimonthlyReport.completionRate",
    "prl.bimonthlyReport.status",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.period,
    (item) => item.district,
    (item) => `${item.sessionsPercent} (Sessões) / ${item.familiesPercent} (Famílias)`,
    (item) => (
      <Typography variant="body2">
        {item.status}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalhes">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleView(item)}><VisibilityIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleEdit(item)}><EditIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title="Eliminar">
          <IconButton size="small" className={classes.actionIcon}><DeleteIcon fontSize="small" /></IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["period", true],
    ["district", true],
    ["status", true],
  ];

  const filterConfig = [
    { field: "distrito_id", label: "prl.sessionPlanning.district", xs: 4 },
    { field: "periodo", label: "prl.bimonthlyReport.period", options: PERIODO_OPTIONS, xs: 4 },
    { field: "ano", label: "prl.bimonthlyReport.year", xs: 4 },
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
      <Helmet title={formatMessage(intl, "prl", "title.bimonthlyReport")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchReports}
        rights={rights}
      />

      <Tooltip title={formatMessage(intl, "prl", "bimonthlyReport.addNew")}>
        <Fab
          color="primary"
          className={classes.fab}
          onClick={handleNew}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(withRouter(connect(mapStateToProps)(BimonthlyReportPage))))));
