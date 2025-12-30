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

  useEffect(() => {
    if (attendanceId) {
      fetchAttendance(attendanceId);
    }
  }, [attendanceId, fetchAttendance]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_ATTENDANCE}`);
  };

  const handleSave = async () => {
    try {
      const input = {
        sessaoId: parseInt(formData.sessaoId),
        familiaId: formData.familiaId,
        nomeFamilia: formData.nomeFamilia,
        grupoId: formData.grupoId || null,
        estado: formData.estado,
        codigoEncaminhamento: formData.codigoEncaminhamento || null,
        observacoes: formData.observacoes || null,
      };

      let mutation = createMutation;
      let variables = { input };

      if (attendanceId) {
        mutation = updateMutation;
        variables.input.id = attendanceId;
      }

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
      if (result.data) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving attendance:', result.errors);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
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
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.sessionCode")}
              value={formData.sessaoId}
              onChange={handleChange("sessaoId")}
              type="number"
              variant="outlined"
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.familyId")}
              value={formData.familiaId}
              onChange={handleChange("familiaId")}
              variant="outlined"
              size="small"
              required
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
              required
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
            disabled={loading || !formData.familiaId || !formData.nomeFamilia}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(AttendanceEditPage))));
