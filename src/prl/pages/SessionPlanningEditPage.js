import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Box,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton, Tooltip } from "@material-ui/core";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_SESSION_PLANNING, PRL_ROUTE_SESSION_PLANNING_FORM } from "../constants";

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
  formControl: {
    marginTop: theme.spacing(1),
  },
  sessionHeader: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    display: "inline-block",
    marginBottom: theme.spacing(2),
  }
});

const DAYS_OF_WEEK = [
  { value: "SEG", label: "Segunda-feira" },
  { value: "TER", label: "Terça-feira" },
  { value: "QUA", label: "Quarta-feira" },
  { value: "QUI", label: "Quinta-feira" },
  { value: "SEX", label: "Sexta-feira" },
  { value: "SAB", label: "Sábado" },
  { value: "DOM", label: "Domingo" },
];

const MONTHS = [
  { value: "Janeiro", label: "Janeiro" },
  { value: "Fevereiro", label: "Fevereiro" },
  { value: "Março", label: "Março" },
  { value: "Abril", label: "Abril" },
  { value: "Maio", label: "Maio" },
  { value: "Junho", label: "Junho" },
  { value: "Julho", label: "Julho" },
  { value: "Agosto", label: "Agosto" },
  { value: "Setembro", label: "Setembro" },
  { value: "Outubro", label: "Outubro" },
  { value: "Novembro", label: "Novembro" },
  { value: "Dezembro", label: "Dezembro" },
];

function SessionPlanningEditPage(props) {
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

  const fetchQuery = `query GetSessaoPep($id: ID!) {
    sessaoPep(id: $id) {
      id
      codigoSessao
      dataPlanejamento
      nomeModulo
      coordenadorDistrital {
        id
        username
      }
      tecnicoSocial {
        id
        username
      }
      distrito {
        id
        code
        name
      }
      mesModuloAnterior
      diaSemana
      dataSessao
      horaSessao
      zona
      numeroFamilias
      grupoFamilia {
        id
        codigo
        nome
      }
      tempoDeslocamento
      feedbackDocumentacao
      temSupervisao
      observacoes
      status
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

  const coordinatorQuery = `query GetCoordinators {
    users(first: 100) {
      edges {
        node {
          id
          username
          lastName
        }
      }
    }
  }`;

  const socialTechnicianQuery = `query GetSocialTechnicians {
    users(first: 100) {
      edges {
        node {
          id
          username
          lastName
        }
      }
    }
  }`;

  // const modulesQuery = `query GetModulosEducacionais($first: Int) {
  //   modulosEducacionais(first: $first, orderBy: ["ordem"]) {
  //     edges {
  //       node {
  //         id
  //         codigo
  //         nome
  //         ordem
  //       }
  //     }
  //   }
  // }`;

  const familyGroupsQuery = `query GetGruposFamiliares($first: Int) {
    gruposFamiliares(first: $first) {
      edges {
        node {
          id
          codigo
          nome
        }
      }
    }
  }`;

  const createMultipleMutation = `mutation CreateMultipleSessoesPEP($input: CreateMultipleSessoesPEPMutationInput!) {
    createMultipleSessoesPep(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  // Note: updateMutation is kept for future edit functionality
  // eslint-disable-next-line no-unused-vars
  const updateMutation = `mutation UpdateSessaoPEP($input: UpdateSessaoPEPMutationInput!) {
    updateSessaoPep(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const [formData, setFormData] = useState({
    codigoSessao: "",
    dataPlanejamento: "",
    coordenadorDistrital: null,
    tecnicoSocial: null,
    distrito: null,
    nomeModulo: "",
    mesModuloAnterior: "",
    observacoes: "",
    status: "PLAN",
  });

  const [sessionData, setSessionData] = useState({
    diaSemana: "",
    dataSessao: "",
    zona: "",
    numeroFamilias: 0,
    grupoFamilia: null,
    horaSessao: "",
    tempoDeslocamento: 0,
    feedbackDocumentacao: "",
    temSupervisao: false,
  });

  const [sessions, setSessions] = useState([]);

  const [districts, setDistricts] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [socialTechnicians, setSocialTechnicians] = useState([]);
  // const [modules, setModules] = useState([]); // Commented out as nomeModulo is now a text field
  const [familyGroups, setFamilyGroups] = useState([]);

  useEffect(() => {
    if (initialData?.id) {
      fetchSession(initialData.id);
    }
    // Load dynamic data on mount
    fetchDistricts();
    fetchCoordinators();
    fetchSocialTechnicians();
    // fetchModules(); // Commented out as nomeModulo is now a text field
    fetchFamilyGroups();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSession = async (id) => {
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
    if (result.data?.sessaoPep) {
      setFormData(result.data.sessaoPep);
      // Populate sessions array for display
      setSessions([{
        id: result.data.sessaoPep.id,
        diaSemana: result.data.sessaoPep.diaSemana,
        dataSessao: result.data.sessaoPep.dataSessao,
        zona: result.data.sessaoPep.zona,
        numeroFamilias: result.data.sessaoPep.numeroFamilias,
        grupoFamilia: result.data.sessaoPep.grupoFamilia,
        horaSessao: result.data.sessaoPep.horaSessao,
        tempoDeslocamento: result.data.sessaoPep.tempoDeslocamento,
        feedbackDocumentacao: result.data.sessaoPep.feedbackDocumentacao,
        temSupervisao: result.data.sessaoPep.temSupervisao,
      }]);
    } else if (result.errors) {
      console.error('Error fetching session:', result.errors);
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
          value: edge.node.id,
          label: edge.node.name,
        }));
        setDistricts(districtList);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: coordinatorQuery }),
      });

      const result = await response.json();
      if (result.data?.users?.edges) {
        const coordinatorList = result.data.users.edges.map(edge => ({
          value: edge.node.id,
          label: edge.node.lastName,
        }));
        setCoordinators(coordinatorList);
      }
    } catch (error) {
      console.error('Error fetching coordinators:', error);
    }
  };

  const fetchSocialTechnicians = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: socialTechnicianQuery }),
      });

      const result = await response.json();
      if (result.data?.users?.edges) {
        const technicianList = result.data.users.edges.map(edge => ({
          value: edge.node.id,
          label: edge.node.lastName,
        }));
        setSocialTechnicians(technicianList);
      }
    } catch (error) {
      console.error('Error fetching social technicians:', error);
    }
  };

  // const fetchModules = async () => {
  //   try {
  //     const response = await fetch(`${baseApiUrl}/graphql`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'X-CSRFToken': getCookie('csrftoken'),
  //         ...apiHeaders(),
  //       },
  //       body: JSON.stringify({ query: modulesQuery, variables: { first: 100 } }),
  //     });

  //     const result = await response.json();
  //     if (result.data?.modulosEducacionais?.edges) {
  //       const moduleList = result.data.modulosEducacionais.edges.map(edge => ({
  //         value: edge.node.id,
  //         label: `${edge.node.codigo} - ${edge.node.nome}`,
  //       }));
  //       setModules(moduleList);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching modules:', error);
  //   }
  // };

  const fetchFamilyGroups = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: familyGroupsQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.gruposFamiliares?.edges) {
        const groupList = result.data.gruposFamiliares.edges.map(edge => ({
          value: edge.node.id,
          label: `${edge.node.codigo} - ${edge.node.nome}`,
        }));
        setFamilyGroups(groupList);
      }
    } catch (error) {
      console.error('Error fetching family groups:', error);
    }
  };

  const handleChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    console.log('Select change:', field, value);
    setFormData((prev) => ({ ...prev, [field]: { id: value } }));
  };

  const handleSessionChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setSessionData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionSelectChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setSessionData((prev) => ({ ...prev, [field]: { id: value } }));
  };

  const handleAddSession = () => {
    if (readOnly) return;
    setSessions((prev) => [...prev, { ...sessionData, id: Date.now() }]);
    setSessionData({
      diaSemana: "",
      dataSessao: "",
      zona: "",
      numeroFamilias: 0,
      grupoFamilia: null,
      horaSessao: "",
      tempoDeslocamento: 0,
      feedbackDocumentacao: "",
      temSupervisao: false,
    });
  };

  const handleRemoveSession = (id) => {
    if (readOnly) return;
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const handleSessionUpdate = (index, field, value) => {
    setSessions(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSessionSelectUpdate = (index, field, value) => {
    setSessions(prev => prev.map((s, i) => i === index ? { ...s, [field]: { id: value } } : s));
  };

  const renderSessionForm = (session, index) => (
    <Box key={session.id} style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "4px" }}>
      <Typography variant="subtitle2" style={{ marginBottom: "16px", fontWeight: "bold" }}>
        {formatMessage(intl, "prl", "sessionPlanning.session")} {index + 1}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label={formatMessage(intl, "prl", "sessionPlanning.dayOfWeek")}
            value={session.diaSemana}
            onChange={(event) => handleSessionUpdate(index, 'diaSemana', event.target.value)}
            variant="outlined"
            size="small"
            required
            disabled={readOnly}
          >
            {DAYS_OF_WEEK.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="date"
            label={formatMessage(intl, "prl", "sessionPlanning.plannedDate")}
            value={session.dataSessao}
            onChange={(event) => handleSessionUpdate(index, 'dataSessao', event.target.value)}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            required
            disabled={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={formatMessage(intl, "prl", "sessionPlanning.zone")}
            placeholder="Ex: A, B, C, D"
            value={session.zona}
            onChange={(event) => handleSessionUpdate(index, 'zona', event.target.value)}
            variant="outlined"
            size="small"
            required
            InputLabelProps={{ shrink: true }}
            disabled={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            label={formatMessage(intl, "prl", "sessionPlanning.selectFamilyGroup")}
            value={session.grupoFamilia?.id || ""}
            onChange={(event) => handleSessionSelectUpdate(index, 'grupoFamilia', event.target.value)}
            variant="outlined"
            size="small"
            required
            disabled={readOnly}
          >
            {familyGroups.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label={formatMessage(intl, "prl", "sessionPlanning.numFamilies")}
            value={session.numeroFamilias}
            onChange={(event) => handleSessionUpdate(index, 'numeroFamilias', parseInt(event.target.value) || 0)}
            variant="outlined"
            size="small"
            required
            disabled={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label={formatMessage(intl, "prl", "sessionPlanning.travelTime")}
            value={session.tempoDeslocamento}
            onChange={(event) => handleSessionUpdate(index, 'tempoDeslocamento', parseInt(event.target.value) || 0)}
            variant="outlined"
            size="small"
            required
            disabled={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="time"
            label={formatMessage(intl, "prl", "sessionPlanning.sessionTime")}
            value={session.horaSessao}
            onChange={(event) => handleSessionUpdate(index, 'horaSessao', event.target.value)}
            variant="outlined"
            size="small"
            InputLabelProps={{ shrink: true }}
            required
            disabled={readOnly}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset" className={classes.formControl} disabled={readOnly}>
            <FormLabel component="legend">{formatMessage(intl, "prl", "sessionPlanning.isSupervised")}</FormLabel>
            <RadioGroup
              row
              value={session.temSupervisao ? "Sim" : "Não"}
              onChange={(event) => handleSessionUpdate(index, 'temSupervisao', event.target.value === "Sim")}
            >
              <FormControlLabel value="Sim" control={<Radio color="primary" />} label="Sim" />
              <FormControlLabel value="Não" control={<Radio color="primary" />} label="Não" />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={formatMessage(intl, "prl", "sessionPlanning.feedback")}
            placeholder="Feedback da documentação..."
            value={session.feedbackDocumentacao}
            onChange={(event) => handleSessionUpdate(index, 'feedbackDocumentacao', event.target.value)}
            variant="outlined"
            size="small"
            required
            InputLabelProps={{ shrink: true }}
            disabled={readOnly}
          />
        </Grid>
        {!readOnly && (
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Tooltip title={formatMessage(intl, "prl", "sessionPlanning.removeSession")}>
                <IconButton
                  onClick={() => handleRemoveSession(session.id)}
                  style={{ color: "#d32f2f" }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_SESSION_PLANNING}`);
  };

  const handleSave = async () => {
    try {
      if (sessions.length === 0) {
        console.warn('No sessions added to save');
        alert('Por favor, adicione pelo menos uma sessão antes de salvar.');
        return;
      }

      // Validate required fields in basic info
      const missingBasicFields = [];
      if (!formData.codigoSessao) missingBasicFields.push('Código da Sessão');
      if (!formData.dataPlanejamento) missingBasicFields.push('Data do Planejamento');
      if (!formData.coordenadorDistrital?.id || formData.coordenadorDistrital.id === "") missingBasicFields.push('Coordenador Distrital');
      if (!formData.tecnicoSocial?.id || formData.tecnicoSocial.id === "") missingBasicFields.push('Técnico Social');
      if (!formData.distrito?.id || formData.distrito.id === "") missingBasicFields.push('Distrito');
      if (!formData.nomeModulo) missingBasicFields.push('Nome do Módulo');

      if (missingBasicFields.length > 0) {
        console.error('Missing required fields in basic info:', missingBasicFields);
        alert(`Por favor, preencha os seguintes campos obrigatórios na seção de informações básicas:\n• ${missingBasicFields.join('\n• ')}`);
        return;
      }

      // Validate each session
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const missingSessionFields = [];

        if (!session.diaSemana) missingSessionFields.push('Dia da semana');
        if (!session.dataSessao) missingSessionFields.push('Data da sessão');
        if (!session.zona || session.zona.trim() === '') missingSessionFields.push('Zona');
        if (!session.horaSessao) missingSessionFields.push('Hora da sessão');
        if (session.numeroFamilias <= 0 || !session.numeroFamilias) missingSessionFields.push('Número de famílias');
        if (!session.grupoFamilia?.id || session.grupoFamilia.id === "") missingSessionFields.push('Grupo de família');
        if (session.tempoDeslocamento <= 0 || !session.tempoDeslocamento) missingSessionFields.push('Tempo de deslocamento');
        if (!session.feedbackDocumentacao || session.feedbackDocumentacao.trim() === '') missingSessionFields.push('Feedback da documentação');

        if (missingSessionFields.length > 0) {
          console.error(`Session ${i + 1} has missing required fields:`, missingSessionFields);
          alert(`Sessão ${i + 1} - Preencha os seguintes campos obrigatórios:\n• ${missingSessionFields.join('\n• ')}`);
          return;
        }
      }

      const isEditMode = !!initialData?.id;

      let input;
      let mutation;

      if (isEditMode) {
        // Update mode - update single session
        const session = sessions[0]; // Assuming single session edit
        input = {
          id: initialData.id,
          dataPlanejamento: formData.dataPlanejamento,
          nomeModulo: formData.nomeModulo,
          coordenadorDistritalId: formData.coordenadorDistrital.id,
          tecnicoSocialId: formData.tecnicoSocial.id,
          distritoId: formData.distrito.id,
          mesModuloAnterior: formData.mesModuloAnterior,
          diaSemana: session.diaSemana,
          dataSessao: session.dataSessao,
          horaSessao: session.horaSessao,
          zona: session.zona,
          numeroFamilias: parseInt(session.numeroFamilias),
          grupoFamiliaId: session.grupoFamilia.id,
          tempoDeslocamento: parseInt(session.tempoDeslocamento),
          feedbackDocumentacao: session.feedbackDocumentacao,
          temSupervisao: session.temSupervisao,
          observacoes: formData.observacoes,
          status: formData.status,
        };
        mutation = updateMutation;
      } else {
        // Create mode - create multiple sessions
        const coordenadorId = formData.coordenadorDistrital.id;
        const tecnicoId = formData.tecnicoSocial.id;
        const distritoId = formData.distrito.id;

        // Validate that IDs are not empty
        if (!coordenadorId || !tecnicoId || !distritoId) {
          console.error('Invalid IDs:', { coordenadorId, tecnicoId, distritoId });
          alert('Erro: IDs inválidos. Por favor, selecione novamente os coordenadores, técnicos e distritos.');
          return;
        }

        const sessionsInput = sessions.map(session => ({
          codigoSessao: formData.codigoSessao,
          dataPlanejamento: formData.dataPlanejamento,
          coordenadorDistritalId: coordenadorId,
          tecnicoSocialId: tecnicoId,
          distritoId: distritoId,
          nomeModulo: formData.nomeModulo,
          mesModuloAnterior: formData.mesModuloAnterior,
          diaSemana: session.diaSemana,
          dataSessao: session.dataSessao,
          horaSessao: session.horaSessao,
          zona: session.zona,
          numeroFamilias: parseInt(session.numeroFamilias),
          grupoFamiliaId: session.grupoFamilia.id,
          tempoDeslocamento: parseInt(session.tempoDeslocamento),
          feedbackDocumentacao: session.feedbackDocumentacao,
          temSupervisao: session.temSupervisao,
          observacoes: formData.observacoes,
          status: formData.status,
        }));

        input = { sessions: sessionsInput };
        mutation = createMultipleMutation;
      }

      console.log('Sending payload:', JSON.stringify({ query: mutation, variables: { input } }, null, 2));

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input } }),
      });

      const result = await response.json();
      if (result.data) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving sessions:', result.errors);
        const errorMessages = result.errors.map(err => err.message).join('\n\n');
        alert(`Erro ao salvar as sessões:\n\n${errorMessages}`);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar as sessões: ' + error.message);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.sessionPlanning")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "title.sessionPlanning")}
          </Typography>
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "prl", "sessionPlanning.basicInfo")}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.introCode")}
              placeholder="Ex: AG-MD01-Jan-2025"
              value={formData.codigoSessao}
              onChange={handleChange("codigoSessao")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label={formatMessage(intl, "prl", "sessionPlanning.planningDate")}
              value={formData.dataPlanejamento}
              onChange={handleChange("dataPlanejamento")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectCoordinator")}
              value={formData.coordenadorDistrital?.id || ""}
              onChange={handleSelectChange("coordenadorDistrital")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {coordinators.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectTrainer")}
              value={formData.tecnicoSocial?.id || ""}
              onChange={handleSelectChange("tecnicoSocial")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {socialTechnicians.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectDistrict")}
              value={formData.distrito?.id || ""}
              onChange={handleSelectChange("distrito")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {districts.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.moduleName")}
              placeholder="Ex: Módulo 1 - Introdução ao PEP+"
              value={formData.nomeModulo}
              onChange={handleChange("nomeModulo")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.prevModuleMonth")}
              value={formData.mesModuloAnterior}
              onChange={handleChange("mesModuloAnterior")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {MONTHS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={formatMessage(intl, "prl", "sessionPlanning.observations")}
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {formatMessage(intl, "prl", "sessionPlanning.planningSessions")}
          </Typography>
          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddSession}
              size="small"
            >
              {formatMessage(intl, "prl", "sessionPlanning.addSession")}
            </Button>
          )}
        </Box>

        <Grid container spacing={3} style={{ marginBottom: "24px", paddingBottom: "16px", borderBottom: "1px solid #e0e0e0" }}>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.dayOfWeek")}
              value={sessionData.diaSemana}
              onChange={handleSessionChange("diaSemana")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {DAYS_OF_WEEK.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label={formatMessage(intl, "prl", "sessionPlanning.plannedDate")}
              value={sessionData.dataSessao}
              onChange={handleSessionChange("dataSessao")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.zone")}
              placeholder="Ex: A, B, C, D"
              value={sessionData.zona}
              onChange={handleSessionChange("zona")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectFamilyGroup")}
              value={sessionData.grupoFamilia?.id || ""}
              onChange={handleSessionSelectChange("grupoFamilia")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {familyGroups.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={formatMessage(intl, "prl", "sessionPlanning.numFamilies")}
              value={sessionData.numeroFamilias}
              onChange={handleSessionChange("numeroFamilias")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label={formatMessage(intl, "prl", "sessionPlanning.travelTime")}
              value={sessionData.tempoDeslocamento}
              onChange={handleSessionChange("tempoDeslocamento")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label={formatMessage(intl, "prl", "sessionPlanning.sessionTime")}
              value={sessionData.horaSessao}
              onChange={handleSessionChange("horaSessao")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset" className={classes.formControl} disabled={readOnly}>
              <FormLabel component="legend">{formatMessage(intl, "prl", "sessionPlanning.isSupervised")}</FormLabel>
              <RadioGroup
                row
                value={sessionData.temSupervisao ? "Sim" : "Não"}
                onChange={(event) => setSessionData((prev) => ({ ...prev, temSupervisao: event.target.value === "Sim" }))}
              >
                <FormControlLabel value="Sim" control={<Radio color="primary" />} label="Sim" />
                <FormControlLabel value="Não" control={<Radio color="primary" />} label="Não" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={formatMessage(intl, "prl", "sessionPlanning.feedback")}
              placeholder="Feedback da documentação..."
              value={sessionData.feedbackDocumentacao}
              onChange={handleSessionChange("feedbackDocumentacao")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
        </Grid>

        {sessions.map((session, index) => renderSessionForm(session, index))}
      </Paper>

      <Box className={classes.buttonContainer}>
        {readOnly && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => history.push(`/${PRL_ROUTE_SESSION_PLANNING_FORM}`, { data: initialData, readOnly: false })}
          >
            {formatMessage(intl, "prl", "button.edit")}
          </Button>
        )}
        <Button
          variant="outlined"
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
          >
            {initialData?.id ? formatMessage(intl, "prl", "button.update") : formatMessage(intl, "prl", "sessionPlanning.savePlanning")}
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionPlanningEditPage))));
