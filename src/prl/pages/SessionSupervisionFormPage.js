import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_SUPERVISION } from "../constants";

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
  tableContainer: {
    marginBottom: theme.spacing(2),
  },
  tableCell: {
    textAlign: "center",
    padding: theme.spacing(1),
    cursor: "pointer",
  },
  descriptionCell: {
    textAlign: "left",
  },
  markedCell: {
    backgroundColor: "#e8f5e9",
  },
  markIcon: {
    color: "#4caf50",
    fontSize: "24px",
  },
});

function SessionSupervisionFormPage(props) {
  const { classes, intl, history, match } = props;
  const supervisionId = match?.params?.id;
  const isEditMode = !!supervisionId;

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
    dataSupervisao: "",
    supervisorId: "",
    formadorId: "",
    identificadorGrupo: "",
    pontosPositivos: "",
    pontosMelhorar: "",
    observacoes: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [perguntas, setPerguntas] = useState([]);
  const [novaPergunta, setNovaPergunta] = useState("");

  const sessionsQuery = `query GetSessoesPep($first: Int) {
    sessoesPep(first: $first) {
      edges {
        node {
          id
          codigoSessao
          dataSessao
          horaSessao
          modulo {
            codigo
            nome
          }
          distrito {
            name
          }
          grupoFamilia {
            nome
          }
          status
        }
      }
    }
  }`;

  const trainersQuery = `query GetUsers($first: Int) {
    users(first: $first) {
      edges {
        node {
          id
          username
          lastName
        }
      }
    }
  }`;

  const createMutation = `mutation CreateSupervisaoSessao($input: CreateSupervisaoSessaoMutationInput!) {
    createSupervisaoSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateSupervisaoSessao($input: UpdateSupervisaoSessaoMutationInput!) {
    updateSupervisaoSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const getSupervisionQuery = `query GetSupervision($id: ID!) {
    supervisaoSessao(id: $id) {
      id
      sessao {
        id
        codigoSessao
        dataSessao
        modulo {
          codigo
          nome
        }
        distrito {
          name
        }
        grupoFamilia {
          nome
        }
        status
      }
      supervisor {
        id
        username
        lastName
      }
      formador {
        id
        username
        lastName
      }
      dataSupervisao
      identificadorGrupo
      perguntasAvaliacao
      pontosPositivos
      pontosMelhorar
      observacoes
    }
  }`;

  useEffect(() => {
    fetchSessions();
    fetchTrainersAndSupervisors();
    if (isEditMode) {
      fetchSupervisionData();
    }
  }, [supervisionId]);

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
          dataSessao: edge.node.dataSessao,
          horaSessao: edge.node.horaSessao,
          moduloCodigo: edge.node.modulo?.codigo,
          moduloNome: edge.node.modulo?.nome,
          distrito: edge.node.distrito?.name,
          grupoFamilia: edge.node.grupoFamilia?.nome,
          status: edge.node.status,
          label: `${edge.node.codigoSessao} - ${edge.node.dataSessao} - ${edge.node.modulo?.nome || '-'}`,
        }));
        setSessions(sessionList);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchTrainersAndSupervisors = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: trainersQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.users?.edges) {
        const userList = result.data.users.edges.map(edge => ({
          id: edge.node.id,
          nome: `${edge.node.username} - ${edge.node.lastName}`,
        }));
        setTrainers(userList);
        setSupervisors(userList);
      }
    } catch (error) {
      console.error('Error fetching trainers and supervisors:', error);
    }
  };

  const fetchSupervisionData = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: getSupervisionQuery, variables: { id: supervisionId } }),
      });

      const result = await response.json();
      if (result.data?.supervisaoSessao) {
        const data = result.data.supervisaoSessao;
        
        // Populate form data
        setFormData({
          sessaoId: data.sessao?.id || "",
          dataSupervisao: data.dataSupervisao || "",
          supervisorId: data.supervisor?.id || "",
          formadorId: data.formador?.id || "",
          identificadorGrupo: data.identificadorGrupo || "",
          pontosPositivos: data.pontosPositivos || "",
          pontosMelhorar: data.pontosMelhorar || "",
          observacoes: data.observacoes || "",
        });

        // Set selected session for display
        if (data.sessao) {
          setSelectedSession({
            id: data.sessao.id,
            codigoSessao: data.sessao.codigoSessao,
            dataSessao: data.sessao.dataSessao,
            moduloNome: data.sessao.modulo?.nome,
            distrito: data.sessao.distrito?.name,
            grupoFamilia: data.sessao.grupoFamilia?.nome,
            status: data.sessao.status,
          });
        }

        // Parse perguntas
        if (data.perguntasAvaliacao) {
          try {
            const perguntasObj = typeof data.perguntasAvaliacao === 'string' 
              ? JSON.parse(data.perguntasAvaliacao) 
              : data.perguntasAvaliacao;
            
            const perguntasList = Object.entries(perguntasObj).map(([texto, resposta]) => ({
              texto,
              resposta
            }));
            setPerguntas(perguntasList);
          } catch (e) {
            console.error('Error parsing perguntas:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching supervision data:', error);
      alert('Erro ao carregar supervisão: ' + error.message);
    }
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (event) => {
    const { value } = event.target;
    const session = sessions.find(s => s.id === value);
    setSelectedSession(session);
    setFormData((prev) => ({
      ...prev,
      sessaoId: value,
    }));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_SUPERVISION}`);
  };

  const adicionarPergunta = () => {
    if (novaPergunta.trim()) {
      setPerguntas([...perguntas, { texto: novaPergunta, resposta: "Sim" }]);
      setNovaPergunta("");
    }
  };

  const removerPergunta = (index) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const atualizarResposta = (index, resposta) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index].resposta = resposta;
    setPerguntas(novasPerguntas);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.sessaoId) {
        alert('Por favor, selecione uma sessão.');
        return;
      }
      if (!formData.supervisorId) {
        alert('Por favor, selecione um supervisor.');
        return;
      }
      if (!formData.formadorId) {
        alert('Por favor, selecione um formador.');
        return;
      }
      if (!formData.dataSupervisao) {
        alert('Por favor, defina a data de supervisão.');
        return;
      }
      if (!formData.identificadorGrupo) {
        alert('Por favor, preenchaa o identificador do grupo.');
        return;
      }
      if (perguntas.length === 0) {
        alert('Por favor, adicione pelo menos uma pergunta de avaliação.');
        return;
      }

      const input = {
        sessaoId: formData.sessaoId,
        supervisorId: formData.supervisorId,
        formadorId: formData.formadorId,
        identificadorGrupo: formData.identificadorGrupo,
        dataSupervisao: formData.dataSupervisao,
        perguntasAvaliacao: JSON.stringify(
          perguntas.reduce((acc, p) => {
            acc[p.texto] = p.resposta;
            return acc;
          }, {})
        ),
        pontosPositivos: formData.pontosPositivos || "",
        pontosMelhorar: formData.pontosMelhorar || "",
        observacoes: formData.observacoes || "",
      };

      if (isEditMode) {
        input.id = supervisionId;
      }

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: isEditMode ? updateMutation : createMutation, variables: { input } }),
      });

      const result = await response.json();
      if (result.data?.createSupervisaoSessao || result.data?.updateSupervisaoSessao) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving supervision:', result.errors);
        alert('Erro ao salvar supervisão de sessão: ' + result.errors[0].message);
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
      <Helmet title={formatMessage(intl, "prl", "title.supervision")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {isEditMode ? "Editar Supervisão" : formatMessage(intl, "prl", "title.supervision")}
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
              label="Sessão"
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

          {selectedSession && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código da Sessão"
                  value={selectedSession.codigoSessao}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data da Sessão"
                  value={selectedSession.dataSessao}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Módulo"
                  value={selectedSession.moduloNome}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Distrito"
                  value={selectedSession.distrito}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grupo Familiar"
                  value={selectedSession.grupoFamilia}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={selectedSession.status}
                  variant="outlined"
                  size="small"
                  disabled
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data de Supervisão"
              value={formData.dataSupervisao}
              onChange={handleChange("dataSupervisao")}
              type="date"
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Supervisor"
              value={formData.supervisorId}
              onChange={(e) => setFormData(prev => ({ ...prev, supervisorId: e.target.value }))}
              variant="outlined"
              size="small"
              required
            >
              {supervisors.map((supervisor) => (
                <MenuItem key={supervisor.id} value={supervisor.id}>
                  {supervisor.nome}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Formador"
              value={formData.formadorId}
              onChange={(e) => setFormData(prev => ({ ...prev, formadorId: e.target.value }))}
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
              label="Identificador do Grupo"
              value={formData.identificadorGrupo}
              onChange={handleChange("identificadorGrupo")}
              variant="outlined"
              size="small"
              required
              placeholder="ex: GRP01"
            />
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Perguntas de Avaliação
            </Typography>
          </Grid>

          <Grid item xs={12} sm={10}>
            <TextField
              fullWidth
              label="Adicionar pergunta"
              value={novaPergunta}
              onChange={(e) => setNovaPergunta(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="Digite a pergunta"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  adicionarPergunta();
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={adicionarPergunta}
              style={{ height: '100%' }}
            >
              Adicionar
            </Button>
          </Grid>

          {perguntas.length > 0 && (
            <Grid item xs={12}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><strong>Pergunta</strong></TableCell>
                      <TableCell align="center" width="100"><strong>Sim</strong></TableCell>
                      <TableCell align="center" width="100"><strong>Não</strong></TableCell>
                      <TableCell align="center" width="60"><strong>Ação</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {perguntas.map((pergunta, index) => (
                      <TableRow key={index}>
                        <TableCell>{pergunta.texto}</TableCell>
                        <TableCell align="center">
                          <input
                            type="radio"
                            name={`pergunta-${index}`}
                            value="Sim"
                            checked={pergunta.resposta === "Sim"}
                            onChange={() => atualizarResposta(index, "Sim")}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <input
                            type="radio"
                            name={`pergunta-${index}`}
                            value="Não"
                            checked={pergunta.resposta === "Não"}
                            onChange={() => atualizarResposta(index, "Não")}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => removerPergunta(index)}
                          >
                            <DeleteIcon fontSize="small" color='#ff0000' />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Observações
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pontos Positivos"
              value={formData.pontosPositivos}
              onChange={handleChange("pontosPositivos")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Descreva os pontos positivos observados"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pontos a Melhorar"
              value={formData.pontosMelhorar}
              onChange={handleChange("pontosMelhorar")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Descreva os pontos que precisam de melhoria"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações Gerais"
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Adicione observações gerais"
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
            disabled={loading || !formData.sessaoId || !formData.supervisorId || !formData.formadorId || !formData.identificadorGrupo || !formData.dataSupervisao || perguntas.length === 0}
          >
            {isEditMode ? "Atualizar" : "Salvar"}
          </Button>
        </Box>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionSupervisionFormPage))));
