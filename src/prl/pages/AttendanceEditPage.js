import { useState, useEffect, useCallback } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box, IconButton, Tooltip,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_ATTENDANCE, PRL_ROUTE_ATTENDANCE_FORM } from "../constants";
import AddIcon from "@material-ui/icons/Add";

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
  { value: "PRES", labelKey: "attendance.estado.presente" },
  { value: "FALT", labelKey: "attendance.estado.faltou" },
  { value: "ENCA", labelKey: "attendance.estado.encaminhado" },
  { value: "MIGR", labelKey: "attendance.estado.migrou" },
];

function AttendanceEditPage(props) {
  const { classes, intl, history, location } = props;
  const readOnly = location?.state?.readOnly || false;
  const initialData = location?.state?.data || null;

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
    localidade: "",
    formador: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [formadores, setFormadores] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [presencas, setPresencas] = useState([]);
  const [tiposEncaminhamento, setTiposEncaminhamento] = useState([]);

  const fetchQuery = `query GetPresencaSessao($id: ID!) {
    presencaSessao(id: $id) {
      id
      sessao {
        id
        codigoSessao
        dataPlanejamento
        modulo {
          id
          codigo
          nome
        }
        dataSessao
        horaSessao
        tecnicoSocial {
          id
          lastName
          otherNames
        }
        coordenadorDistrital {
          id
          lastName
          otherNames
        }
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
      familiaId
      nomeFamilia
      grupoId
      estado
      codigoEncaminhamento
      tipoEncaminhamento {
        id
        codigo
        nome
      }
      observacoes
    }
  }`;

  const sessionsQuery = `query GetSessoesPep($first: Int) {
    sessoesPep(first: $first) {
      edges {
        node {
          id
          codigoSessao
          dataPlanejamento
          modulo {
            id
            codigo
            nome
          }
          dataSessao
          horaSessao
          tecnicoSocial {
            id
            lastName
            otherNames
          }
          coordenadorDistrital {
            id
            lastName
            otherNames
          }
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

  const districtQuery = `query GetDistritos($first: Int) {
    locations(first: $first, type: "D") {
      edges {
        node {
          id
          code
          name
        }
      }
    }
  }`;

  const formadoresQuery = `query GetFormadores {
    users(first: 100) {
      edges {
        node {
          id
          username
          lastName
          otherNames
        }
      }
    }
  }`;

  const familiasQuery = `query GetFamilias($first: Int) {
    families(first: $first) {
      edges {
        node {
          uuid
          headInsuree {
            uuid
            lastName
            otherNames
            chfId
          }
          location {
            uuid
            name
          }
        }
      }
    }
  }`;

  const tiposEncaminhamentoQuery = `query GetTiposEncaminhamento {
    tiposEncaminhamento(ativo: true) {
      edges {
        node {
          id
          codigo
          nome
        }
      }
    }
  }`;

  const registrarPresencasBatchMutation = `mutation RegistrarPresencasBatch($input: RegistrarPresencasBatchMutationInput!) {
    registrarPresencasBatch(input: $input) {
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
          localidade: attendance.localidade || "",
          formador: attendance.formador || "",
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
          codigoSessao: edge.node.codigoSessao,
          dataPlanejamento: edge.node.dataPlanejamento,
          modulo: edge.node.modulo,
          dataSessao: edge.node.dataSessao,
          horaSessao: edge.node.horaSessao,
          tecnicoSocial: edge.node.tecnicoSocial,
          coordenadorDistrital: edge.node.coordenadorDistrital,
          distrito: edge.node.distrito,
          grupoFamilia: edge.node.grupoFamilia,
          label: `${edge.node.codigoSessao} - ${edge.node.dataSessao} - ${edge.node.distrito?.name || '-'}`,
        }));
        setSessions(sessionList);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: districtQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.locations?.edges) {
        const districtList = result.data.locations.edges.map(edge => ({
          id: edge.node.id,
          code: edge.node.code,
          name: edge.node.name,
        }));
        setDistricts(districtList);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchFormadores = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: formadoresQuery }),
      });

      const result = await response.json();
      if (result.data?.users?.edges) {
        const formadorList = result.data.users.edges.map(edge => ({
          id: edge.node.id,
          username: edge.node.username,
          lastName: edge.node.lastName,
          otherNames: edge.node.otherNames,
        }));
        setFormadores(formadorList);
      }
    } catch (error) {
      console.error('Error fetching formadores:', error);
    }
  };

  const fetchFamilias = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: familiasQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.families?.edges) {
        const familiasList = result.data.families.edges.map(edge => ({
          id: edge.node.uuid,
          codigo: edge.node.headInsuree?.chfId || edge.node.uuid,
          nome: `${edge.node.headInsuree?.lastName || ''} ${edge.node.headInsuree?.otherNames || ''}`.trim(),
          localidade: edge.node.location?.name || '',
          grupoFamiliar: {
            id: edge.node.uuid,
            codigo: edge.node.headInsuree?.chfId || edge.node.uuid,
            nome: `${edge.node.headInsuree?.lastName || ''} ${edge.node.headInsuree?.otherNames || ''}`.trim(),
          },
        }));
        setFamilias(familiasList);
      }
    } catch (error) {
      console.error('Error fetching familias:', error);
    }
  };

  useEffect(() => {
    if (initialData?.id) {
      fetchAttendanceById(initialData.id);
    } else if (attendanceId) {
      fetchAttendance(attendanceId);
    }
    // Load sessions on mount
    fetchSessions();
    fetchDistricts();
    fetchFormadores();
    fetchFamilias();
    fetchTiposEncaminhamento();
  }, [attendanceId, initialData, fetchAttendance]);

  // Fetch attendance by ID (for viewing/editing from list)
  const fetchAttendanceById = async (id) => {
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
        const sessao = attendance.sessao;

        setFormData({
          sessaoId: sessao?.id || "",
          familiaId: attendance.familiaId || "",
          nomeFamilia: attendance.nomeFamilia || "",
          grupoId: attendance.grupoId || "",
          estado: attendance.estado || "PRES",
          codigoEncaminhamento: attendance.codigoEncaminhamento || "",
          observacoes: attendance.observacoes || "",
          localidade: "",
          formador: "",
        });

        // Set session details directly from the response
        if (sessao) {
          setSelectedSession({
            id: sessao.id,
            codigoSessao: sessao.codigoSessao,
            dataPlanejamento: sessao.dataPlanejamento,
            modulo: sessao.modulo,
            dataSessao: sessao.dataSessao,
            horaSessao: sessao.horaSessao,
            tecnicoSocial: sessao.tecnicoSocial,
            coordenadorDistrital: sessao.coordenadorDistrital,
            distrito: sessao.distrito,
            grupoFamilia: sessao.grupoFamilia,
            label: `${sessao.codigoSessao} - ${sessao.dataSessao} - ${sessao.distrito?.name || '-'}`,
          });
        }

        // Create presencas array from the loaded attendance
        setPresencas([{
          id: attendance.id,
          familiaId: attendance.familiaId || "",
          familiaCode: "",
          familiaName: attendance.nomeFamilia || "",
          grupoId: attendance.grupoId || "",
          grupoCode: "",
          grupoName: "",
          sequencia: 1,
          estado: attendance.estado || "PRES",
          codigoEncaminhamento: attendance.codigoEncaminhamento || "",
          tipoEncaminhamentoId: attendance.tipoEncaminhamento?.id || "",
          localidade: "",
        }]);
      } else if (result.errors) {
        console.error('Error fetching attendance:', result.errors);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposEncaminhamento = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: tiposEncaminhamentoQuery }),
      });
      const result = await response.json();
      if (result.data?.tiposEncaminhamento?.edges) {
        setTiposEncaminhamento(result.data.tiposEncaminhamento.edges.map(edge => ({
          id: edge.node.id,
          codigo: edge.node.codigo,
          nome: edge.node.nome,
        })));
      }
    } catch (error) {
      console.error('Error fetching tipos encaminhamento:', error);
    }
  };

  const handleChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (event) => {
    if (readOnly) return;
    const sessionId = event.target.value;
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
      setSelectedSession(session);
      setFormData((prev) => ({
        ...prev,
        sessaoId: session.id,
        grupoId: session.grupoFamilia?.id || "",
        familiaId: session.grupoFamilia?.codigo || "",
        nomeFamilia: session.grupoFamilia?.nome || "",
      }));
    }
  };

  const handleAddPresenca = () => {
    if (readOnly) return;
    const newPresenca = {
      id: Date.now().toString(),
      familiaId: "",
      familiaCode: "",
      familiaName: "",
      grupoId: "",
      grupoCode: "",
      grupoName: "",
      sequencia: presencas.length + 1,
      estado: "PRES",
      codigoEncaminhamento: "",
      tipoEncaminhamentoId: "",
      localidade: "",
    };
    setPresencas((prev) => [...prev, newPresenca]);
  };

  const handlePresencaFamiliaChange = (index, familiaId) => {
    if (readOnly) return;
    const familia = familias.find(f => f.id === familiaId);
    if (familia) {
      setPresencas((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
              ...p,
              familiaId: familia.id,
              familiaCode: familia.codigo,
              familiaName: familia.nome,
              grupoId: familia.grupoFamiliar?.id || "",
              grupoCode: familia.grupoFamiliar?.codigo || "",
              grupoName: familia.grupoFamiliar?.nome || "",
            }
            : p
        )
      );
    }
  };

  const handlePresencaChange = (index, field, value) => {
    if (readOnly) return;
    setPresencas((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleRemovePresenca = (index) => {
    if (readOnly) return;
    setPresencas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_ATTENDANCE}`);
  };

  const handleSave = async () => {
    try {
      // Validar campos obrigatórios
      if (!formData.sessaoId) {
        alert(formatMessage(intl, "prl", "attendance.selectSessionMessage"));
        return;
      }

      if (presencas.length === 0) {
        alert(formatMessage(intl, "prl", "attendance.noFamiliesMessage"));
        return;
      }

      if (!formData.formador) {
        alert(formatMessage(intl, "prl", "attendance.selectFormadorMessage"));
        return;
      }

      // Validar presenças com estado ENCA
      for (let presenca of presencas) {
        if (presenca.estado === 'ENCA') {
          if (!presenca.codigoEncaminhamento) {
            alert(formatMessage(intl, "prl", "attendance.codigoEncaminhamentoRequired"));
            return;
          }
          if (!presenca.tipoEncaminhamentoId) {
            alert(formatMessage(intl, "prl", "attendance.institutionNameRequired"));
            return;
          }
        }
      }

      // Helper to extract plain numeric ID from Relay Global ID (base64)
      const extractNumericId = (relayId) => {
        if (!relayId) return null;
        if (!isNaN(relayId) && parseInt(relayId) < 2147483647) return parseInt(relayId);
        try {
          const decoded = atob(relayId);
          const match = decoded.match(/:([0-9]+)$/);
          return match ? parseInt(match[1]) : null;
        } catch {
          return null;
        }
      };

      // Preparar input para mutation batch
      const input = {
        sessaoId: formData.sessaoId,
        dataSessao: new Date().toISOString().split('T')[0], // Data de hoje
        distritoId: selectedSession?.distrito?.id || "",
        formadorId: formData.formador,
        localidadeId: formData.localidade || null,
        moduloId: extractNumericId(selectedSession?.modulo?.id),
        codigoSessao: selectedSession?.codigoSessao || "",
        grupoFamiliaId: extractNumericId(selectedSession?.grupoFamilia?.id),
        presencas: presencas.map(p => ({
          familiaId: p.familiaId,
          estado: p.estado,
          codigoEncaminhamento: p.codigoEncaminhamento || null,
          tipoEncaminhamentoId: p.tipoEncaminhamentoId || null,
        })),
      };

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: registrarPresencasBatchMutation, variables: { input } }),
      });

      const result = await response.json();
      if (result.data?.registrarPresencasBatch) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving attendance:', result.errors);
        alert(formatMessage(intl, "prl", "attendance.saveError") + ': ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert(formatMessage(intl, "prl", "attendance.error") + ': ' + error.message);
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
            {formatMessage(intl, "prl", "tool")} 02 - {' '}
            {readOnly
              ? formatMessage(intl, "prl", "title.viewAttendance")
              : initialData?.id
                ? formatMessage(intl, "prl", "title.editAttendance")
                : formatMessage(intl, "prl", "title.createAttendance")}
          </Typography>
        </Button>

        <Grid item xs={12}>
          <Divider style={{ margin: "16px 0" }} />
          <Typography variant="h6" className={classes.sectionTitle}>
            {formatMessage(intl, "prl", "attendance.sessionDetails")}
          </Typography>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.selectSession")}
              value={formData.sessaoId}
              onChange={handleSessionChange}
              variant="outlined"
              size="small"
              disabled={readOnly}
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
              label={formatMessage(intl, "prl", "attendance.sessionCode")}
              value={selectedSession?.codigoSessao || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.planningDate")}
              value={selectedSession?.dataPlanejamento || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.moduleName")}
              value={selectedSession?.modulo ? `${selectedSession.modulo.codigo} - ${selectedSession.modulo.nome}` : ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.sessionDate")}
              value={selectedSession?.dataSessao || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.sessionTime")}
              value={selectedSession?.horaSessao || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.socialTechnician")}
              value={`${selectedSession?.tecnicoSocial?.lastName || ''} ${selectedSession?.tecnicoSocial?.otherNames || ''}`.trim() || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.districtCoordinator")}
              value={`${selectedSession?.coordenadorDistrital?.lastName || ''} ${selectedSession?.coordenadorDistrital?.otherNames || ''}`.trim() || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.district")}
              value={selectedSession?.distrito?.name || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "attendance.familyGroup")}
              value={selectedSession?.grupoFamilia?.nome || ""}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.locality")}
              value={formData.localidade}
              onChange={handleChange("localidade")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            >
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.formadorName")}
              value={formData.formador}
              onChange={handleChange("formador")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            >
              {formadores.map((formador) => (
                <MenuItem key={formador.id} value={formador.id}>
                  {formador.lastName} {formador.otherNames}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <div>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "attendance.familyAttendanceTitle")}
            </Typography>
            <Typography variant="body2">
              {formatMessage(intl, "prl", "attendance.familyAttendanceDesc")}
            </Typography>
          </div>
          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddPresenca}
              size="small"
            >
              {formatMessage(intl, "prl", "button.addFamily")}
            </Button>
          )}
        </Box>

        {presencas.length > 0 && (
          <Box style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={2}>
                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#2e7d32" }}>{formatMessage(intl, "prl", "attendance.familyName")}</Typography>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#2e7d32" }}>{formatMessage(intl, "prl", "attendance.estado")}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#2e7d32" }}>{formatMessage(intl, "prl", "attendance.code")}</Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" style={{ fontWeight: "bold", color: "#2e7d32" }}>{formatMessage(intl, "prl", "attendance.others")}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {presencas.length > 0 ? (
          presencas.map((presenca, index) => (
            <Box
              key={presenca.id}
              style={{
                marginBottom: "16px",
                padding: "16px",
                border: "1px solid #c8e6c9",
                borderRadius: "8px",
                backgroundColor: "#f1f8f6",
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={presenca.familiaId}
                    onChange={(e) => handlePresencaFamiliaChange(index, e.target.value)}
                    displayEmpty
                    disabled={readOnly}
                  >
                    <MenuItem value="">{formatMessage(intl, "prl", "attendance.selectFamily")}</MenuItem>
                    {familias.map((familia) => (
                      <MenuItem key={familia.id} value={familia.id}>
                        {familia.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="outlined"
                    value={presenca.estado}
                    onChange={(e) => handlePresencaChange(index, "estado", e.target.value)}
                    disabled={readOnly}
                  >
                    {ESTADO_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {formatMessage(intl, "prl", option.labelKey)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder={formatMessage(intl, "prl", "attendance.code")}
                    value={presenca.codigoEncaminhamento}
                    onChange={(e) => handlePresencaChange(index, "codigoEncaminhamento", e.target.value)}
                    disabled={readOnly || presenca.estado !== 'ENCA'}
                  />
                </Grid>

                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="outlined"
                    label={formatMessage(intl, "prl", "attendance.institutionName")}
                    value={presenca.tipoEncaminhamentoId}
                    onChange={(e) => handlePresencaChange(index, "tipoEncaminhamentoId", e.target.value)}
                    disabled={readOnly || presenca.estado !== 'ENCA'}
                  >
                    <MenuItem value="">{formatMessage(intl, "prl", "attendance.selectTipoEncaminhamento")}</MenuItem>
                    {tiposEncaminhamento.map((tipo) => (
                      <MenuItem key={tipo.id} value={tipo.id}>
                        {tipo.codigo} - {tipo.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {!readOnly && (
                  <Grid item xs={12} sm="auto">
                    <Tooltip title={formatMessage(intl, "prl", "button.remove")}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemovePresenca(index)}
                        style={{ color: "#d32f2f" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                )}
              </Grid>
            </Box>
          ))
        ) : (
          <Typography variant="body2" style={{ padding: "16px", textAlign: "center", color: "#999" }}>
            {formatMessage(intl, "prl", "attendance.noFamiliesMessage")}
          </Typography>
        )}

      </Paper>
      <Box className={classes.buttonContainer}>
        {readOnly && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => history.push(`/${PRL_ROUTE_ATTENDANCE_FORM}`, { data: initialData, readOnly: false })}
          >
            {formatMessage(intl, "prl", "button.edit")}
          </Button>
        )}
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBack}
        >
          {readOnly ? formatMessage(intl, "prl", "button.back") : formatMessage(intl, "prl", "button.cancel")}
        </Button>
        {!readOnly && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || !formData.sessaoId}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(AttendanceEditPage))));
