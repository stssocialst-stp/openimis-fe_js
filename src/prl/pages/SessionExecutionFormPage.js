import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";

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

function SessionExecutionFormPage(props) {
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
    formadorId: "",
    supervisorId: "",
    localidadeId: "",
    numeroParticipantesCompromissos: 0,
    praticasPositivas: "",
    desafiosTransmissao: "",
    necessitaEncaminhamento: false,
    autoAvaliacaoPontosFortes: "",
    autoAvaliacaoPontosAtencao: "",
    avaliacaoMetodologia: "",
    observacoes: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);

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
        }
      }
    }
  }`;

  const trainersQuery = `query GetSocialTechnicians {
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

  const createMutation = `mutation CreateExecucaoSessao($input: CreateExecucaoSessaoMutationInput!) {
    createExecucaoSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

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
          label: `${edge.node.codigoSessao} - ${edge.node.dataSessao} - ${edge.node.distrito?.name || '-'}`,
        }));
        setSessions(sessionList);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: trainersQuery }),
      });

      const result = await response.json();
      if (result.data?.users?.edges) {
        const trainerList = result.data.users.edges.map(edge => ({
          id: edge.node.id,
          nome: `${edge.node.username} - ${edge.node.lastName}`,
        }));
        setTrainers(trainerList);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchTrainers();
  }, []);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const handleTrainerChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, formadorId: value }));
  };

  const handleBack = () => {
    history.push('/prl/execution');
  };

  const handleSave = async () => {
    try {
      // Validar campos obrigatórios
      if (!formData.sessaoId) {
        alert('Por favor, selecione uma sessão.');
        return;
      }
      if (!formData.formadorId) {
        alert('Por favor, selecione um formador.');
        return;
      }

      // Parse array strings to arrays
      const parseArray = (str) => str.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const input = {
        sessaoId: formData.sessaoId,
        formadorId: formData.formadorId,
        supervisorId: formData.supervisorId || null,
        localidadeId: formData.localidadeId || null,
        numeroParticipantesCompromissos: formData.numeroParticipantesCompromissos || null,
        praticasPositivas: formData.praticasPositivas ? JSON.stringify(parseArray(formData.praticasPositivas)) : null,
        desafiosTransmissao: formData.desafiosTransmissao ? JSON.stringify(parseArray(formData.desafiosTransmissao)) : null,
        necessitaEncaminhamento: formData.necessitaEncaminhamento,
        autoAvaliacaoPontosFortes: formData.autoAvaliacaoPontosFortes ? JSON.stringify(parseArray(formData.autoAvaliacaoPontosFortes)) : null,
        autoAvaliacaoPontosAtencao: formData.autoAvaliacaoPontosAtencao ? JSON.stringify(parseArray(formData.autoAvaliacaoPontosAtencao)) : null,
        avaliacaoMetodologia: formData.avaliacaoMetodologia ? formData.avaliacaoMetodologia : null,
        observacoes: formData.observacoes || "",
      };

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: createMutation, variables: { input } }),
      });

      const result = await response.json();
      if (result.data?.createExecucaoSessao) {
        handleBack();
      } else if (result.errors) {
        console.error('Error creating session execution:', result.errors);
        alert('Erro ao criar execução de sessão: ' + result.errors[0].message);
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
      <Helmet title={formatMessage(intl, "prl", "title.createExecution")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "title.createExecution")}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "execution.sessionCode")}
              value={formData.sessaoId}
              onChange={handleChange("sessaoId")}
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

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "execution.trainer")}
              value={formData.formadorId}
              onChange={handleTrainerChange}
              variant="outlined"
              size="small"
              required
            >
              {trainers.map((trainer) => (
                <MenuItem key={trainer.id} value={trainer.id}>
                  {trainer.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label={formatMessage(intl, "prl", "execution.numParticipants")}
              value={formData.numeroParticipantesCompromissos}
              onChange={handleNumberChange("numeroParticipantesCompromissos")}
              variant="outlined"
              size="small"
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "execution.necessitaEncaminhamento")}
              value={formData.necessitaEncaminhamento}
              onChange={(e) => setFormData(prev => ({ ...prev, necessitaEncaminhamento: e.target.value === 'true' }))}
              variant="outlined"
              size="small"
            >
              <MenuItem value={false}>Não</MenuItem>
              <MenuItem value={true}>Sim</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Detalhes da Sessão
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.positivePractices")}
              value={formData.praticasPositivas}
              onChange={handleChange("praticasPositivas")}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              helperText="Separe com vírgulas"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.challengesTransmission")}
              value={formData.desafiosTransmissao}
              onChange={handleChange("desafiosTransmissao")}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              helperText="Separe com vírgulas"
            />
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Auto-Avaliação
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.selfAssessmentStrengths")}
              value={formData.auto_avaliacao_ponto_fortes}
              onChange={handleChange("auto_avaliacao_ponto_fortes")}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              helperText="Separe com vírgulas"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.selfAssessmentAttention")}
              value={formData.auto_avaliacao_pontos_atencao}
              onChange={handleChange("auto_avaliacao_pontos_atencao")}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              helperText="Separe com vírgulas"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.methodologyEvaluation")}
              value={formData.avaliacao_metodologia}
              onChange={handleChange("avaliacao_metodologia")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              helperText="JSON format (opcional)"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "execution.observations")}
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              multiline
              rows={4}
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
            disabled={loading || !formData.sessaoId || !formData.formadorId}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({});
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionExecutionFormPage))));