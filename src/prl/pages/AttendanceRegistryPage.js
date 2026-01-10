
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
import { formatMessage, withModulesManager, Helmet, withTooltip, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import PrlFilter from "../components/PrlFilter";
import { PRL_ROUTE_ATTENDANCE_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

const ESTADO_OPTIONS = [
  { value: "PRES", label: "Presente" },
  { value: "FALT", label: "Faltou" },
  { value: "ENCA", label: "Encaminhado" },
];

function AttendanceRegistryPage(props) {
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

  const query = `query GetPresencasSessao($first: Int, $sessaoId: ID, $familiaId: String, $nomeFamilia_Icontains: String, $grupoId: String, $estado: PresencaSessaoEstado, $codigoEncaminhamento_Icontains: String) {
    presencasSessao(
      first: $first
      sessaoId: $sessaoId
      familiaId: $familiaId
      nomeFamilia_Icontains: $nomeFamilia_Icontains
      grupoId: $grupoId
      estado: $estado
      codigoEncaminhamento_Icontains: $codigoEncaminhamento_Icontains
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          sessao {
            id
            codigoSessao
            dataSessao
          }
          familiaId
          nomeFamilia
          grupoId
          estado
          codigoEncaminhamento
          nomeInstituicao
          observacoes
        }
      }
    }
  }`;

  const fetchAttendances = async (params) => {
    const filters = params.filters || {};
    const variables = {
      first: params.pageSize || 10,
      sessaoId: filters.sessaoId?.value || null,
      familiaId: filters.familiaId?.value || null,
      nomeFamilia_Icontains: filters.nomeFamilia?.value || null,
      grupoId: filters.grupoId?.value || null,
      estado: filters.estado?.value || null,
      codigoEncaminhamento_Icontains: filters.codigoEncaminhamento?.value || null,
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

    const attendances = result.data.presencasSessao.edges.map(edge => edge.node);

    const mappedData = attendances.map(attendance => ({
      id: attendance.id,
      sessionCode: attendance.sessao?.codigoSessao || '',
      sessionDate: attendance.sessao?.dataSessao || '',
      familyName: attendance.nomeFamilia,
      familyId: attendance.familiaId,
      groupId: attendance.grupoId,
      state: attendance.estado,
      referralCode: attendance.codigoEncaminhamento,
      institutionName: attendance.nomeInstituicao,
      observations: attendance.observacoes,
    }));

    return mappedData;
  };

  const getStateLabel = (state) => {
    const option = ESTADO_OPTIONS.find(opt => opt.value === state);
    return option ? option.label : state;
  };

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_ATTENDANCE_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_ATTENDANCE_FORM}`, { data: item, readOnly: true });
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_ATTENDANCE_FORM}`, { data: item, readOnly: false });
  };

  const deleteMutation = `mutation DeletePresencaSessao($id: ID!) {
    deletePresencaSessao(input: { id: $id }) {
      clientMutationId
    }
  }`;

  const handleDelete = async (item) => {
    if (!window.confirm('Tem certeza que deseja eliminar este registo de presença?')) {
      return;
    }

    try {
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
        console.log('Attendance record deleted successfully');
        // You might need to trigger a refetch here
        window.location.reload();
      } else if (result.errors) {
        console.error('Error deleting attendance:', result.errors);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const headers = [
    "prl.attendance.sessionCode",
    "prl.attendance.sessionDate",
    "prl.attendance.estado",
    "emptyLabel",
  ];

  const itemFormatters = [
    (item) => item.sessionCode,
    (item) => item.sessionDate,
    (item) => (
      <Typography variant="body2">
        {getStateLabel(item.state)}
      </Typography>
    ),
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
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
        <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
          <IconButton
            size="small"
            className={classes.actionIcon}
            onClick={() => handleDelete(item)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["sessionCode", true],
    ["sessionDate", true],
    ["familyName", true],
    ["state", true],
    ["referralCode", true],
    ["institutionName", true],
  ];

  const filterConfig = [
    { field: "sessaoId", label: "prl.attendance.sessionCode", xs: 6 },
    { field: "nomeFamilia_Icontains", label: "prl.attendance.familyName", xs: 6 },
    { field: "estado", label: "prl.attendance.estado", options: ESTADO_OPTIONS, xs: 6 },
    { field: "codigoEncaminhamento_Icontains", label: "prl.attendance.referralCode", xs: 6 },
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
      <Helmet title={formatMessage(intl, "prl", "title.attendance")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchAttendances}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(AttendanceRegistryPage)))));
