import { useState, useEffect, useCallback } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_ATTENDANCE } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  paper: { ...theme.paper.paper, margin: theme.spacing(2), padding: theme.spacing(2) },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: "bold",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1, 2, 1),
  },
  headerTitle: {
    marginLeft: theme.spacing(1),
    fontWeight: 500,
  },
});

const ESTADO_OPTIONS = [
  { value: "PRES", label: "Presente" },
  { value: "AUSE", label: "Ausente" },
  { value: "JUST", label: "Justificado" },
];

function AttendanceEditPage(props) {
  const { classes, intl, history, location } = props;

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

  const [formData, setFormData] = useState({
    sessaoId: "",
    familiaId: "",
    nomeFamilia: "",
    grupoId: "",
    estado: "PRES",
    codigoEncaminhamento: "",
    observacoes: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);

  const fetchQuery = `query GetPresencaSessao($id: ID!) {
    presencaSessao(id: $id) {
      id
      sessao {
        id
        codigoSessao
      }
      familiaId
      nomeFamilia
      grupoId
      estado
      codigoEncaminhamento
      observacoes
    }
  }`;

  const sessionsQuery = `query GetSessoesPep($first: Int) {
    sessoesPep(first: $first) {
      edges {
        node {
          id
          codigoSessao
          dataSessao
          distrito {
            id
            name
          }
          grupoFamilia {
            id
            codigo
            nome
          }
        }
      }
    }
  }`;

  const createMutation = `mutation CreatePresencaSessao($input: CreatePresencaSessaoMutationInput!) {
    createPresencaSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdatePresencaSessao($input: UpdatePresencaSessaoMutationInput!) {
    updatePresencaSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  // Check if editing existing record
  const urlParams = new URLSearchParams(location.search);
  const attendanceId = urlParams.get("id");

  const fetchAttendance = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: fetchQuery, variables: { id } }),
      });

      const result = await response.json();
      if (result.data?.presencaSessao) {
        const attendance = result.data.presencaSessao;
        setFormData({
          sessaoId: attendance.sessao?.id || "",
          familiaId: attendance.familiaId || "",
          nomeFamilia: attendance.nomeFamilia || "",
          grupoId: attendance.grupoId || "",
          estado: attendance.estado || "PRES",
          codigoEncaminhamento: attendance.codigoEncaminhamento || "",
          observacoes: attendance.observacoes || "",
        });
      } else if (result.errors) {
        console.error('Error fetching attendance:', result.errors);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchQuery]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: sessionsQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.sessoesPep?.edges) {
        const sessionList = result.data.sessoesPep.edges.map(edge => ({
          id: edge.node.id,
          codigo: edge.node.codigoSessao,
          data: edge.node.dataSessao,
          distrito: edge.node.distrito?.name || '-',
          grupoFamilia: edge.node.grupoFamilia,
          label: `${edge.node.codigoSessao} - ${edge.node.dataSessao} - ${edge.node.distrito?.name || '-'}`,
        }));
        setSessions(sessionList);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    if (attendanceId) {
      fetchAttendance(attendanceId);
    }
    // Load sessions on mount
    fetchSessions();
  }, [attendanceId, fetchAttendance]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (event) => {
    const sessionId = event.target.value;
    const selectedSession = sessions.find(s => s.id === sessionId);

    if (selectedSession) {
      setFormData((prev) => ({
        ...prev,
        sessaoId: selectedSession.id,
        grupoId: selectedSession.grupoFamilia?.id || "",
        familiaId: selectedSession.grupoFamilia?.codigo || "",
        nomeFamilia: selectedSession.grupoFamilia?.nome || "",
      }));
    }
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_ATTENDANCE}`);
  };

  const handleSave = async () => {
    try {
      // Validar campos obrigatórios
      if (!formData.sessaoId) {
        alert('Por favor, selecione uma sessão.');
        return;
      }

      const input = {
        sessaoId: formData.sessaoId, // Relay ID, mantém como string
        familiaId: formData.familiaId,
        nomeFamilia: formData.nomeFamilia,
        grupoId: formData.grupoId || null,
        estado: formData.estado,
        observacoes: formData.observacoes || null,
      };

      let mutation = createMutation;
      let variables = { input };

      if (attendanceId) {
        mutation = updateMutation;
        variables.input.id = attendanceId;
      }

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();
      if (result.data?.createPresencaSessao || result.data?.updatePresencaSessao) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving attendance:', result.errors);
        alert('Erro ao salvar presença: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.attendance")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {attendanceId
              ? formatMessage(intl, "prl", "title.editAttendance")
              : formatMessage(intl, "prl", "title.createAttendance")}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.sessionCode")}
              value={formData.sessaoId}
              onChange={handleSessionChange}
              variant="outlined"
              size="small"
              required
            >
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  {session.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.familyId")}
              value={formData.familiaId}
              onChange={handleChange("familiaId")}
              variant="outlined"
              size="small"
              disabled
              helperText="Preenchido automaticamente pela sessão"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.familyName")}
              value={formData.nomeFamilia}
              onChange={handleChange("nomeFamilia")}
              variant="outlined"
              size="small"
              disabled
              helperText="Preenchido automaticamente pela sessão"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.groupId")}
              value={formData.grupoId}
              onChange={handleChange("grupoId")}
              variant="outlined"
              size="small"
              disabled
              helperText="Preenchido automaticamente pela sessão"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.estado")}
              value={formData.estado}
              onChange={handleChange("estado")}
              variant="outlined"
              size="small"
            >
              {ESTADO_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.referralCode")}
              value={formData.codigoEncaminhamento}
              onChange={handleChange("codigoEncaminhamento")}
              variant="outlined"
              size="small"
              helperText="Opcional"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.observations")}
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              multiline
              rows={4}
              size="small"
            />
          </Grid>
        </Grid>

        <Box className={classes.buttonContainer}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
          >
            {formatMessage(intl, "prl", "button.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || !formData.sessaoId}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(AttendanceEditPage))));
