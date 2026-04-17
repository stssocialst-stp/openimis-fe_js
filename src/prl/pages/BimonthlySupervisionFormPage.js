import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, Box, IconButton, Checkbox,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer,
  FormControl, InputLabel, Select, MenuItem, Chip,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";

const styles = (theme) => ({
  page: theme.page,
  paper: { ...theme.paper.paper, margin: theme.spacing(2), padding: theme.spacing(2) },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontWeight: 500,
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
  headerSubtitle: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
  },
  agendaHeader: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
  },
  tableHeader: {
    backgroundColor: theme.palette.grey[100],
    "& th": {
      fontWeight: "bold",
      padding: theme.spacing(1),
    },
  },
  durationBadge: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  concludedBadge: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.dark,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
  },
});

// Itens de agenda padrão baseados na imagem
const DEFAULT_AGENDA_ITEMS = [
  { topico: "Abertura e Boas-vindas", descricao: "Cumprimentar os cuidadores e retomar o objetivo da reunião", duracao: 5, concluido: false },
  { topico: "Relato de Desafios e Soluções", descricao: "Cada Coordenador Distrital compartilha desafios e soluções aplicadas", duracao: 15, concluido: false },
  { topico: "Compartilhamento de Oportunidades", descricao: "Oportunidades de melhoria e práticas bem-sucedidas", duracao: 10, concluido: false },
  { topico: "Apreciação dos Relatórios Bimensais", descricao: "Revisão dos relatórios, análise de dados e definição de encaminhamentos", duracao: 20, concluido: false },
  { topico: "Definição de Ações e Encaminhamentos", descricao: "Plano de ação conjunto e alinhamento das estratégias", duracao: 15, concluido: false },
  { topico: "Encerramento e Próxima Reunião", descricao: "Recapitulação das decisões e agendamento da próxima reunião", duracao: 5, concluido: false },
];

function BimonthlySupervisionFormPage(props) {
  const { classes, intl, history, location } = props;
  const isView = location.state?.isView || false;
  const initialData = location.state?.data || null;
  const supervisionId = location.pathname.split('/').pop();

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

  // 1. Informações da Reunião
  const [formData, setFormData] = useState({
    dataReuniao: "",
    horario: "",
    coordenadorNacionalId: "",
    participantes: [],
  });
  const [participantesManuais, setParticipantesManuais] = useState([]);
  const [manualParticipantInput, setManualParticipantInput] = useState("");

  // Agenda da Reunião
  const [agendaItems, setAgendaItems] = useState(
    DEFAULT_AGENDA_ITEMS.map((item, index) => ({ ...item, id: index + 1 }))
  );

  // Resumo da Agenda - Status de conclusão
  const [resumoDaAgenda, setResumoDaAgenda] = useState({
    aberturaEBoasVindas: false,
    relatoDesafiosSolucoes: false,
    compartilhamentoOportunidades: false,
    apreciacaoRelatorios: false,
    definicaoAcoesEncaminhamentos: false,
    encerramentoProximaReuniao: false,
  });

  // 2. Desafios e Soluções
  const [principaisDesafios, setPrincipaisDesafios] = useState("");

  // 3. Oportunidades de Melhoria
  const [oportunidadesMelhoria, setOportunidadesMelhoria] = useState("");

  // 4. Apreciação dos Relatórios Bimensais
  const [apreciacaoRelatorios, setApreciacaoRelatorios] = useState("");

  // 5. Plano de Ação e Encaminhamentos
  const [planoAcao, setPlanoAcao] = useState("");

  // 6. Próxima Reunião
  const [dataProximaReuniao, setDataProximaReuniao] = useState("");
  const [proximaReuniao, setProximaReuniao] = useState("");

  // Usuários (coordenador e participantes)
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  const [loading, setLoading] = useState(false);

  const usersQuery = `query GetSocialTechnicians {
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

  const createMutation = `mutation CreateRoteiroReuniao($input: CreateRoteiroReuniaoMutationInput!) {
    createRoteiroReuniao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateRoteiroReuniao($input: UpdateRoteiroReuniaoMutationInput!) {
    updateRoteiroReuniao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const fetchReportQuery = `query RoteiroReuniao($id: ID!) {
    roteiroReuniaoBimestral(id: $id) {
      id
      dataReuniao
      horario
      coordenadorNacional {
        id
        lastName
        otherNames
      }
      participantes
      participantesManuais
      principaisDesafios
      oportunidadesMelhoria
      apreciacaoRelatorios
      planoAcao
      proximaReuniao
      dataProximaReuniao
      resumoDaAgenda
    }
  }`;

  // Buscar usuários ao montar o componente
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsuarios(true);
      try {
        const response = await fetch(`${baseApiUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
            ...apiHeaders(),
          },
          body: JSON.stringify({ query: usersQuery }),
        });

        const result = await response.json();

        if (result.data?.users?.edges) {
          const userList = result.data.users.edges.map((edge) => ({
            id: edge.node.id,
            username: edge.node.username,
            label: `${edge.node.lastName} ${edge.node.otherNames}`.trim(),
          }));
          setUsuarios(userList);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsuarios(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (initialData && supervisionId !== 'new') {
      setFormData({
        dataReuniao: initialData.dataReuniao ? initialData.dataReuniao.split('T')[0] : "",
        horario: initialData.horario || "",
        coordenadorNacionalId: initialData.coordenadorNacional?.id || "",
        participantes: initialData.participantes ? (typeof initialData.participantes === 'string' ? JSON.parse(initialData.participantes) : initialData.participantes) : [],
      });

      let participantesManuais = [];
      if (initialData.participantesManuais) {
        try {
          participantesManuais = typeof initialData.participantesManuais === 'string'
            ? JSON.parse(initialData.participantesManuais)
            : initialData.participantesManuais;
        } catch (e) {
          console.log('Could not parse participantesManuais:', e);
        }
      }
      setParticipantesManuais(Array.isArray(participantesManuais) ? participantesManuais : []);

      setPrincipaisDesafios(initialData.principaisDesafios || "");
      setOportunidadesMelhoria(initialData.oportunidadesMelhoria || "");
      setApreciacaoRelatorios(initialData.apreciacaoRelatorios || "");
      setPlanoAcao(initialData.planoAcao || "");

      setDataProximaReuniao(initialData.dataProximaReuniao ? initialData.dataProximaReuniao.split('T')[0] : "");
      setProximaReuniao(initialData.proximaReuniao || "");

      // Parse resumoDaAgenda
      if (initialData.resumoDaAgenda) {
        try {
          const parsed = typeof initialData.resumoDaAgenda === 'string' ? JSON.parse(initialData.resumoDaAgenda) : initialData.resumoDaAgenda;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setResumoDaAgenda(parsed[0]);
          }
        } catch (e) {
          console.log('Could not parse resumoDaAgenda:', e);
        }
      }
    }
  }, [initialData, supervisionId]);

  const handleChange = (field) => (event) => {
    if (isView) return;
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProximaReuniaoDateChange = (event) => {
    if (isView) return;
    const { value } = event.target;
    setDataProximaReuniao(value);
  };

  const handleProximaReuniaoChange = (event) => {
    if (isView) return;
    const { value } = event.target;
    setProximaReuniao(value);
  };

  const handleBack = () => {
    history.push('/prl/bimonthlySupervision');
  };

  const handleAddManualParticipant = () => {
    if (isView) return;
    const name = manualParticipantInput.trim();
    if (!name) return;
    if (participantesManuais.includes(name)) {
      setManualParticipantInput("");
      return;
    }
    setParticipantesManuais((prev) => [...prev, name]);
    setManualParticipantInput("");
  };

  const handleRemoveManualParticipant = (nameToRemove) => {
    if (isView) return;
    setParticipantesManuais((prev) => prev.filter((name) => name !== nameToRemove));
  };

  const handleManualParticipantKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      handleAddManualParticipant();
    }
  };

  const handleToggleAgendaItem = (id) => {
    if (isView) return;
    setAgendaItems(prev => prev.map(item =>
      item.id === id ? { ...item, concluido: !item.concluido } : item
    ));
    // Atualizar resumoDaAgenda após toggle
    setTimeout(() => {
      updateResumoDaAgenda();
    }, 0);
  };

  const updateResumoDaAgenda = () => {
    const novo = {
      aberturaEBoasVindas: agendaItems[0]?.concluido || false,
      relatoDesafiosSolucoes: agendaItems[1]?.concluido || false,
      compartilhamentoOportunidades: agendaItems[2]?.concluido || false,
      apreciacaoRelatorios: agendaItems[3]?.concluido || false,
      definicaoAcoesEncaminhamentos: agendaItems[4]?.concluido || false,
      encerramentoProximaReuniao: agendaItems[5]?.concluido || false,
    };
    setResumoDaAgenda(novo);
  };

  const handleAgendaItemChange = (id, field, value) => {
    if (isView) return;
    setAgendaItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleAddAgendaItem = () => {
    if (isView) return;
    const newItem = {
      id: Date.now(),
      topico: "",
      descricao: "",
      duracao: 10,
      concluido: false,
    };
    setAgendaItems(prev => [...prev, newItem]);
  };

  const handleRemoveAgendaItem = (id) => {
    if (isView) return;
    setAgendaItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculate total duration
  const totalDuration = agendaItems.reduce((sum, item) => sum + (parseInt(item.duracao) || 0), 0);

  const handleSave = async () => {
    try {
      if (!formData.dataReuniao) {
        alert('Por favor, preencha a data da reunião.');
        return;
      }
      if (!formData.coordenadorNacionalId) {
        alert('Por favor, preencha o coordenador nacional.');
        return;
      }
      if (!formData.horario) {
        alert('Por favor, preencha o horário da reunião.');
        return;
      }

      // Atualizar resumoDaAgenda antes de salvar
      updateResumoDaAgenda();

      const input = {
        dataReuniao: formData.dataReuniao,
        horario: formData.horario,
        coordenadorNacionalId: formData.coordenadorNacionalId,
        participantes: JSON.stringify(formData.participantes),
        participantesManuais: JSON.stringify(participantesManuais),
        resumoDaAgenda: JSON.stringify([resumoDaAgenda]),
        principaisDesafios: principaisDesafios,
        oportunidadesMelhoria: oportunidadesMelhoria,
        apreciacaoRelatorios: apreciacaoRelatorios,
        planoAcao: planoAcao,
        proximaReuniao: proximaReuniao,
        dataProximaReuniao: dataProximaReuniao || null,
      };

      if (supervisionId !== 'new') {
        input.id = supervisionId;
      }

      const mutation = supervisionId === 'new' ? createMutation : updateMutation;
      const mutationName = supervisionId === 'new' ? 'createRoteiroReuniao' : 'updateRoteiroReuniao';

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input } }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      if (result.data?.[mutationName]) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving supervision:', result.errors);
        alert('Erro ao salvar: ' + result.errors[0].message);
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
      <Helmet title={formatMessage(intl, "prl", isView ? "title.viewSupervision" : "title.createSupervision")} />

      {/* Header */}
      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Box>
            <Typography className={classes.headerTitle}>
              06 - Roteiro das Reuniões Bimensais
            </Typography>
          </Box>
        </Button>
      </Paper>

      {/* 1. Informações da Reunião */}
      <Paper className={classes.paper}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Data da Reunião *"
              value={formData.dataReuniao}
              onChange={handleChange("dataReuniao")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={isView}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label="Horário *"
              value={formData.horario}
              onChange={handleChange("horario")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={isView}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Coordenador Nacional *</InputLabel>
              <Select
                value={formData.coordenadorNacionalId}
                onChange={handleChange("coordenadorNacionalId")}
                label="Coordenador Nacional *"
                disabled={isView || loadingUsuarios}
              >
                <MenuItem value="">
                  <em>Selecione um coordenador</em>
                </MenuItem>
                {usuarios.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Participantes</InputLabel>
              <Select
                multiple
                value={formData.participantes}
                onChange={(e) => !isView && setFormData(prev => ({ ...prev, participantes: e.target.value }))}
                label="Participantes"
                disabled={isView || loadingUsuarios}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const user = usuarios.find(u => u.id === value);
                      return <Chip key={value} label={user?.label || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {usuarios.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Participantes Manuais
            </Typography>
            {!isView && (
              <Box display="flex" gap={1} alignItems="center" mb={1}>
                <TextField
                  fullWidth
                  value={manualParticipantInput}
                  onChange={(e) => setManualParticipantInput(e.target.value)}
                  onKeyDown={handleManualParticipantKeyDown}
                  variant="outlined"
                  size="small"
                  placeholder="Digite o nome e pressione Enter"
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddManualParticipant}
                  disabled={!manualParticipantInput.trim()}
                  style={{ marginLeft: 8 }}
                >
                  Adicionar
                </Button>
              </Box>
            )}
            <Box display="flex" flexWrap="wrap" gridGap={8}>
              {participantesManuais.length > 0 ? (
                participantesManuais.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    onDelete={isView ? undefined : () => handleRemoveManualParticipant(name)}
                    color="default"
                    size="small"
                  />
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  Sem participantes manuais adicionados.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Resumo da Agenda */}
      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box className={classes.agendaHeader} flex={1}>
            <Typography variant="h6" style={{ fontWeight: "bold" }}>
              ⏱ Resumo da Agenda - Duração Total: {totalDuration} minutos
            </Typography>
          </Box>
          {/* {!isView && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddAgendaItem}
              size="small"
              style={{ marginLeft: 16 }}
            >
              Adicionar Item
            </Button>
          )} */}
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell style={{ width: 40 }}>#</TableCell>
                <TableCell>Tópico</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell align="center" style={{ width: 100 }}>Duração</TableCell>
                <TableCell align="center" style={{ width: 100 }}>Concluído</TableCell>
                {/* {!isView && <TableCell align="center" style={{ width: 60 }}>Ações</TableCell>} */}
              </TableRow>
            </TableHead>
            <TableBody>
              {agendaItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}.</TableCell>
                  <TableCell>
                    {isView ? (
                      <Typography variant="body2" style={{ fontWeight: 500 }}>{item.topico}</Typography>
                    ) : (
                      <TextField
                        fullWidth
                        value={item.topico}
                        onChange={(e) => handleAgendaItemChange(item.id, 'topico', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Nome do tópico"
                        disabled
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isView ? (
                      <Typography variant="body2" color="textSecondary">{item.descricao}</Typography>
                    ) : (
                      <TextField
                        fullWidth
                        value={item.descricao}
                        onChange={(e) => handleAgendaItemChange(item.id, 'descricao', e.target.value)}
                        variant="outlined"
                        size="small"
                        placeholder="Descrição do tópico"
                        disabled
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {isView ? (
                      <span className={classes.durationBadge}>{item.duracao} minutos</span>
                    ) : (
                      <TextField
                        type="number"
                        value={item.duracao}
                        onChange={(e) => handleAgendaItemChange(item.id, 'duracao', parseInt(e.target.value) || 0)}
                        variant="outlined"
                        size="small"
                        style={{ width: 80 }}
                        inputProps={{ min: 1 }}
                        disabled
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {isView ? (
                      item.concluido ? (
                        <span className={classes.concludedBadge}>✓ Concluído</span>
                      ) : (
                        <Typography variant="body2" color="textSecondary">Pendente</Typography>
                      )
                    ) : (
                      <Checkbox
                        checked={item.concluido}
                        onChange={() => handleToggleAgendaItem(item.id)}
                        color="primary"
                      />
                    )}
                  </TableCell>
                  {/* {!isView && (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveAgendaItem(item.id)}
                        style={{ color: "#d32f2f" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 2. Desafios e Soluções por Distrito */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          2. Desafios e Soluções por Distrito
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Principais desafios enfrentados e soluções aplicadas
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={principaisDesafios}
          onChange={(e) => !isView && setPrincipaisDesafios(e.target.value)}
          variant="outlined"
          placeholder="Registre os desafios compartilhados por cada coordenador distrital e as soluções discutidas..."
          disabled={isView}
        />
      </Paper>

      {/* 3. Oportunidades de Melhoria */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          3. Oportunidades de Melhoria
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Oportunidades identificadas e práticas bem-sucedidas
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={oportunidadesMelhoria}
          onChange={(e) => !isView && setOportunidadesMelhoria(e.target.value)}
          variant="outlined"
          placeholder="Documente as oportunidades de melhoria e práticas que podem ser replicadas..."
          disabled={isView}
        />
      </Paper>

      {/* 4. Apreciação dos Relatórios Bimensais */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          4. Apreciação dos Relatórios Bimensais
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Análise dos dados e tendências identificadas
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={apreciacaoRelatorios}
          onChange={(e) => !isView && setApreciacaoRelatorios(e.target.value)}
          variant="outlined"
          placeholder="Resuma a análise dos relatórios bimensais, tendências observadas e encaminhamentos definidos..."
          disabled={isView}
        />
      </Paper>

      {/* 5. Plano de Ação e Encaminhamentos */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          5. Plano de Ação e Encaminhamentos
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Ações definidas, responsáveis e prazos
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={planoAcao}
          onChange={(e) => !isView && setPlanoAcao(e.target.value)}
          variant="outlined"
          placeholder="Liste as ações acordadas, responsáveis por cada uma e prazos estabelecidos..."
          disabled={isView}
        />
      </Paper>

      {/* 6. Próxima Reunião */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          6. Próxima Reunião
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Data e informações para a próxima reunião
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Data da Próxima Reunião"
              value={dataProximaReuniao}
              onChange={handleProximaReuniaoDateChange}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={isView}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Informações da Próxima Reunião"
              value={proximaReuniao}
              onChange={handleProximaReuniaoChange}
              variant="outlined"
              placeholder="Data: DD/MM/YYYY, Horário: HH:mm, Local: Descrição, Plataforma: Presencial/Zoom, Agenda: Tópicos"
              disabled={isView}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Buttons */}
      <Box className={classes.buttonContainer}>
        <Button
          variant="outlined"
          onClick={handleBack}
        >
          {isView ? "Voltar" : "Limpar Formulário"}
        </Button>
        {!isView && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || !formData.dataReuniao || !formData.coordenadorNacionalId || !formData.horario}
          >
            Salvar Roteiro da Reunião
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(BimonthlySupervisionFormPage))));
