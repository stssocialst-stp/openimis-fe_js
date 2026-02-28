import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_SUPERVISION } from "../constants";
import PracticesTable from "../components/PracticesTable";
import LimitedChecklistComponent from "../components/LimitedChecklistComponent";

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
    observacoes: "",
    feedbackPontosFortes: "",
    feedbackDesafios: "",
    compromissoFormador: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [praticasPositivasSelections, setPraticasPositivasSelections] = useState({});
  const [desafiosTransmissaoSelections, setDesafiosTransmissaoSelections] = useState({});
  const [necessitaEncaminhamento, setNecessitaEncaminhamento] = useState(false);
  const [autoAvaliacaoPontosFortes, setAutoAvaliacaoPontosFortes] = useState({});
  const [autoAvaliacaoPontosAtencao, setAutoAvaliacaoPontosAtencao] = useState({});
  const [metodologiaPassosSelections, setMetodologiaPassosSelections] = useState({});

  const practicesRows = [
    { id: "p1", description: "Cuidaram de si mesmo para garantir melhor qualidade de cuidado para as crianças." },
    { id: "p2", description: "Mantiveram rotinas diárias consistentes" },
    { id: "p3", description: "Comunicaram-se positivamente com as crianças" },
    { id: "p4", description: "Estimularam a aprendizagem através do brincar" },
    { id: "p5", description: "Implementaram hábitos alimentares saudáveis" },
    { id: "p6", description: "Garantiram a segurança da criança em casa" },
    { id: "p7", description: "Garantiram a segurança da criança fora de casa" },
    { id: "p8", description: "Promoveram hábitos de higiene e cuidados com a saúde de toda a família." },
    { id: "p9", description: "Conversaram sobre consentimento e mudanças no corpo" },
    { id: "p10", description: "Ajudaram ao adolescente a estabelecer metas e pensar sobre o futuro." },
    { id: "p11", description: "Praticaram técnicas de gestão do estresse para cuidar de si e da criança." },
    { id: "p12", description: "Respeitaram e promoveram os direitos da criança dentro do ambiente familiar." },
    { id: "p13", description: "Implementaram práticas de planeamento financeiro para administrar os recursos da família." },
  ];

  const challengesRows = [
    { id: "c1", description: "Dificuldade em adaptar a linguagem do conteúdo para o nível de compreensão das famílias." },
    { id: "c2", description: "Resistência dos cuidadores em aceitar novas práticas ou conceitos propostos." },
    { id: "c3", description: "Pouco tempo disponível para abordar todas as mensagens-chave de maneira aprofundada." },
    { id: "c4", description: "Desinteresse ou falta de engajamento dos cuidadores durante a sessão." },
    { id: "c5", description: "Distrações no ambiente da sessão (barulho, interrupções, falta de atenção)." },
    { id: "c6", description: "Dificuldade em manter o foco dos cuidadores na discussão do tema." },
    { id: "c7", description: "Material visual insuficiente para a discussão" },
    { id: "c8", description: "Dificuldade em abordar temas sensíveis sem causar desconforto." },
    { id: "c9", description: "Falta de exemplos práticos na rotina das famílias que ajudem a reforçar a mensagem." },
    { id: "c10", description: "Desafios em promover a participação de todos, com alguns cuidadores permanecendo em silêncio." },
    { id: "c11", description: "Necessidade de reforçar conceitos complexos ou desconhecidos pelos cuidadores." },
  ];

  const autoAvaliacaoPontosFortesRows = [
    { id: "af1", description: "Promoveu a participação ativa de todos os cuidadores presentes." },
    { id: "af2", description: "Reforçou o compartilhamento de experiências pessoais e reflexões pelos cuidadores." },
    { id: "af3", description: "Envolveu as famílias de forma que elas demonstraram interesse e envolvimento com o tema da sessão." },
    { id: "af4", description: "Incentivou o compartilhamento de compromissos e estratégias discutidas na sessão anterior pelos cuidadores." },
    { id: "af5", description: "Proporcionou um ambiente acolhedor, garantindo tempo de fala e respeito aos participantes." },
    { id: "af6", description: "Executou a escuta ativa e promoveu a empatia entre os cuidadores." },
    { id: "af7", description: "Garantiu amplo entendimento e aceitação das mensagens-chave transmitidas dentro das famílias." },
    { id: "af8", description: "Proporcionou um ambiente acolhedor aos cuidadores, permitindo que demonstrassem curiosidade e desejo de aprender." },
    { id: "af9", description: "Incentivou a colaboração durante a sessão" },
    { id: "af10", description: "Outro" },
  ];

  const autoAvaliacaoPontosAtencaoRows = [
    { id: "aa1", description: "Precisa trabalhar formas diferentes de engajar todos os cuidadores durante a sessão para evitar participação passiva ou limitada dos cuidadores." },
    { id: "aa2", description: "Precisa dedicar mais tempo para abordar todas as atividades e os tópicos previstos durante a sessão." },
    { id: "aa3", description: "Precisa explorar outras formas de comunicar as mensagens-chave tendo em vista as dificuldades de entendimento pelos cuidadores." },
    { id: "aa4", description: "Precisa atuar em prol de acolher e incluir a participação das famílias a fim de eliminar desconforto em compartilhar experiências pessoais." },
    { id: "aa5", description: "Precisa atuar de forma a estabelecer um ambiente colaborativo e de apoio mútuo entre as famílias da sessão, incentivando o diálogo e valorizando a participação." },
    { id: "aa6", description: "Precisa comunicar de maneira diferente sobre a importância das práticas positivas discutidas em sessão." },
    { id: "aa7", description: "Precisa estar apto para lidar com temas sensíveis ou complexos durante a sessão, explorando o conteúdo com base na participação e sem julgar as famílias." },
    { id: "aa8", description: "Precisa se colocar com mais confiança na condução da sessão" },
    { id: "aa9", description: "Outro" },
  ];

  const metodologiaPassosRows = [
    { id: "mp1", description: "Anotou a presença dos cuidadores." },
    { id: "mp2", description: "Deu boas-vindas aos cuidadores." },
    { id: "mp3", description: "Reviu os compromissos do mês passado." },
    { id: "mp4", description: "Fez a discussão com a imagem com perguntas no guia." },
    { id: "mp5", description: "Compartilhou as mensagens chave." },
    { id: "mp6", description: "Facilitou a prática de acordo com o guia." },
    { id: "mp7", description: "Fez a reflexão de acordo com o guia." },
    { id: "mp8", description: "Pediu os compromissos aos cuidadores." },
    { id: "mp9", description: "Informou sobre a próxima sessão." },
    { id: "mp10", description: "Preencheu o relatório de execução da sessão." },
  ];

  const sessionsQuery = `query GetSessoesPep($first: Int) {
    sessoesPep(first: $first) {
      edges {
        node {
          id
          codigoSessao
          dataPlanejamento
          dataSessao
          horaSessao
          modulo {
            id
            codigo
            nome
          }
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
          id
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
      dataModuloAnterior
      identificadorGrupo
      numeroParticipantes
      praticasPositivasEstrategias
      desafiosTransmissao
      necessitaEncaminhamento
      autoAvaliacaoPontosFortes
      autoAvaliacaoPontosAtencao
      metodologiaPassos
      feedbackPontosFortes
      feedbackDesafios
      compromissoFormador
      metodologiaPassos
      feedbackPontosFortes
      feedbackDesafios
      compromissoFormador
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
          dataPlanejamento: edge.node.dataPlanejamento,
          dataSessao: edge.node.dataSessao,
          horaSessao: edge.node.horaSessao,
          modulo: edge.node.modulo,
          tecnicoSocial: edge.node.tecnicoSocial,
          coordenadorDistrital: edge.node.coordenadorDistrital,
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

        // Populate form data with all fields
        setFormData({
          sessaoId: data.sessao?.id || "",
          dataSupervisao: data.dataSupervisao || "",
          dataModuloAnterior: data.dataModuloAnterior || "",
          supervisorId: data.supervisor?.id || "",
          formadorId: data.formador?.id || "",
          identificadorGrupo: data.identificadorGrupo || "",
          numeroCuidadores: data.numeroParticipantes || "",
          feedbackPontosFortes: data.feedbackPontosFortes || "",
          feedbackDesafios: data.feedbackDesafios || "",
          compromissoFormador: data.compromissoFormador || "",
          observacoes: data.observacoes || "",
        });

        // Set selected session for display
        if (data.sessao) {
          setSelectedSession({
            id: data.sessao.id,
            codigoSessao: data.sessao.codigoSessao,
            dataSessao: data.sessao.dataSessao,
            modulo: data.sessao.modulo,
            distrito: data.sessao.distrito?.name,
            grupoFamilia: data.sessao.grupoFamilia?.nome,
            status: data.sessao.status,
          });
        }

        // Set necessitaEncaminhamento
        setNecessitaEncaminhamento(data.necessitaEncaminhamento || false);

        // Helper function to parse JSON selections and convert to component format
        const parseSelections = (jsonString, rows) => {
          if (!jsonString) return {};
          try {
            const parsed = JSON.parse(jsonString);
            const selections = {};
            parsed.forEach((item, index) => {
              // Find matching row by description
              const matchingRow = rows.find(r => r.description === item.descricao);
              if (matchingRow) {
                selections[matchingRow.id] = {
                  descricao: item.descricao,
                  confirmacao: item.confirmacao,
                };
              } else {
                // Use index-based key if no match found
                selections[`item_${index}`] = {
                  descricao: item.descricao,
                  confirmacao: item.confirmacao,
                };
              }
            });
            return selections;
          } catch (e) {
            console.error('Error parsing selections:', e);
            return {};
          }
        };

        // Populate table selections
        if (data.praticasPositivasEstrategias) {
          setPraticasPositivasSelections(parseSelections(data.praticasPositivasEstrategias, practicesRows));
        }

        if (data.desafiosTransmissao) {
          setDesafiosTransmissaoSelections(parseSelections(data.desafiosTransmissao, challengesRows));
        }

        if (data.autoAvaliacaoPontosFortes) {
          setAutoAvaliacaoPontosFortes(parseSelections(data.autoAvaliacaoPontosFortes, autoAvaliacaoPontosFortesRows));
        }

        if (data.autoAvaliacaoPontosAtencao) {
          setAutoAvaliacaoPontosAtencao(parseSelections(data.autoAvaliacaoPontosAtencao, autoAvaliacaoPontosAtencaoRows));
        }

        if (data.metodologiaPassos) {
          setMetodologiaPassosSelections(parseSelections(data.metodologiaPassos, metodologiaPassosRows));
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

  const handlePraticasPositivasSelectionChange = (selections) => {
    setPraticasPositivasSelections(selections);
  };

  const handleDesafiosTransmissaoSelectionChange = (selections) => {
    setDesafiosTransmissaoSelections(selections);
  };

  const handleNecessitaEncaminhamentoChange = (event) => {
    setNecessitaEncaminhamento(event.target.value === "sim");
  };

  const handleAutoAvaliacaoPontosFortesChange = (selections) => {
    setAutoAvaliacaoPontosFortes(selections);
  };

  const handleAutoAvaliacaoPontosAtencaoChange = (selections) => {
    setAutoAvaliacaoPontosAtencao(selections);
  };

  const handleMetodologiaPassosChange = (selections) => {
    setMetodologiaPassosSelections(selections);
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

      const input = {
        sessaoId: formData.sessaoId,
        supervisorId: formData.supervisorId,
        formadorId: formData.formadorId,
        identificadorGrupo: formData.identificadorGrupo,
        dataSupervisao: formData.dataSupervisao,
        praticasPositivasEstrategias: Object.values(praticasPositivasSelections).length > 0 ? JSON.stringify(
          Object.values(praticasPositivasSelections)
            .filter(item => item !== null)
            .map(item => ({
              descricao: item.descricao,
              confirmacao: item.confirmacao,
            }))
        ) : null,
        desafiosTransmissao: Object.values(desafiosTransmissaoSelections).length > 0 ? JSON.stringify(
          Object.values(desafiosTransmissaoSelections)
            .filter(item => item !== null)
            .map(item => ({
              descricao: item.descricao,
              confirmacao: item.confirmacao,
            }))
        ) : null,
        necessitaEncaminhamento: necessitaEncaminhamento,
        autoAvaliacaoPontosFortes: Object.values(autoAvaliacaoPontosFortes).length > 0 ? JSON.stringify(
          Object.values(autoAvaliacaoPontosFortes)
            .filter(item => item !== null)
            .map(item => ({
              descricao: item.descricao,
              confirmacao: item.confirmacao,
            }))
        ) : null,
        autoAvaliacaoPontosAtencao: Object.values(autoAvaliacaoPontosAtencao).length > 0 ? JSON.stringify(
          Object.values(autoAvaliacaoPontosAtencao)
            .filter(item => item !== null)
            .map(item => ({
              descricao: item.descricao,
              confirmacao: item.confirmacao,
            }))
        ) : null,
        metodologiaPassos: Object.values(metodologiaPassosSelections).length > 0 ? JSON.stringify(
          Object.values(metodologiaPassosSelections)
            .filter(item => item !== null)
            .map(item => ({
              descricao: item.descricao,
              confirmacao: item.confirmacao,
            }))
        ) : null,
        feedbackPontosFortes: formData.feedbackPontosFortes || "",
        feedbackDesafios: formData.feedbackDesafios || "",
        compromissoFormador: formData.compromissoFormador || "",
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
            {formatMessage(intl, "prl", "tool")} 04 - {isEditMode ? "Editar Supervisão" : formatMessage(intl, "prl", "title.supervision")}
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

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Módulo"
              value={selectedSession?.modulo?.nome}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: selectedSession?.modulo?.nome ? true : false }}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data da Sessão"
              value={selectedSession?.dataSessao}
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Técnico Social"
              value={`${selectedSession?.tecnicoSocial?.lastName || ''} ${selectedSession?.tecnicoSocial?.otherNames || ''}`.trim() || ''}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Coordenador Distrital"
              value={`${selectedSession?.coordenadorDistrital?.lastName || ''} ${selectedSession?.coordenadorDistrital?.otherNames || ''}`.trim() || ''}
              variant="outlined"
              size="small"
              disabled
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Distrito"
              value={selectedSession?.distrito}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: selectedSession?.distrito ? true : false }}
              disabled
            />
          </Grid>

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
              label="Data do Módulo Anterior"
              value={formData.dataModuloAnterior}
              onChange={handleChange("dataModuloAnterior")}
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
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "execution.numberOfParticipants")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "supervision.selectNumberOfParticipants")}
              value={formData.numeroCuidadores}
              onChange={handleChange("numeroCuidadores")}
              variant="outlined"
              size="small"
              required
            >
              <MenuItem value="0">0 cuidadores</MenuItem>
              <MenuItem value="1-5">1-5 cuidadores</MenuItem>
              <MenuItem value="6-10">6-10 cuidadores</MenuItem>
              <MenuItem value="15+">Mais de 15 cuidadores</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.2. {formatMessage(intl, "prl", "supervision.positivePracticesAndStrategies")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.positivePracticesDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <PracticesTable
              title=""
              rows={practicesRows}
              options={["Sim", "Não", "N/A"]}
              onSelectionChange={handlePraticasPositivasSelectionChange}
              selections={praticasPositivasSelections}
              showOtherPractices={false}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.3. {formatMessage(intl, "prl", "supervision.transmissionChallenges")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.transmissionChallengesDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <PracticesTable
              title=""
              rows={challengesRows}
              options={["Sim", "Não", "N/A"]}
              onSelectionChange={handleDesafiosTransmissaoSelectionChange}
              selections={desafiosTransmissaoSelections}
              showOtherPractices={false}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.4. {formatMessage(intl, "prl", "supervision.referralNeed")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.referralNeedDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="radio"
                  name="necessitaEncaminhamento"
                  value="sim"
                  checked={necessitaEncaminhamento === true}
                  onChange={handleNecessitaEncaminhamentoChange}
                />
                Sim
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="radio"
                  name="necessitaEncaminhamento"
                  value="nao"
                  checked={necessitaEncaminhamento === false}
                  onChange={handleNecessitaEncaminhamentoChange}
                />
                Não
              </label>
            </div>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.5.1. {formatMessage(intl, "prl", "supervision.autoEvaluationStrongPoints")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.autoEvaluationStrongPointsDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <LimitedChecklistComponent
              items={autoAvaliacaoPontosFortesRows}
              maxSelections={2}
              onSelectionChange={handleAutoAvaliacaoPontosFortesChange}
              selections={autoAvaliacaoPontosFortes}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.5.2. {formatMessage(intl, "prl", "supervision.autoEvaluationAttentionPoints")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.autoEvaluationAttentionPointsDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <LimitedChecklistComponent
              items={autoAvaliacaoPontosAtencaoRows}
              maxSelections={2}
              onSelectionChange={handleAutoAvaliacaoPontosAtencaoChange}
              selections={autoAvaliacaoPontosAtencao}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.6. {formatMessage(intl, "prl", "supervision.methodologyExecutionEvaluation")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.methodologyExecutionEvaluationDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <PracticesTable
              title=""
              rows={metodologiaPassosRows}
              options={["Não fez", "Não adequado", "Adequado", "Excelente", "N/A"]}
              onSelectionChange={handleMetodologiaPassosChange}
              selections={metodologiaPassosSelections}
              showOtherPractices={false}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              F. {formatMessage(intl, "prl", "supervision.feedbackSessionWithTrainer")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "16px" }}>
              {formatMessage(intl, "prl", "supervision.feedbackSessionWithTrainerDescription")}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {formatMessage(intl, "prl", "supervision.feedbackStrongPoints")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "12px" }}>
              {formatMessage(intl, "prl", "supervision.feedbackStrongPointsDescription")}
            </Typography>
            <TextField
              fullWidth
              value={formData.feedbackPontosFortes}
              onChange={handleChange("feedbackPontosFortes")}
              variant="outlined"
              size="small"
              multiline
              rows={4}
              placeholder="Descrever os pontos fortes..."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {formatMessage(intl, "prl", "supervision.feedbackChallenges")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "12px" }}>
              {formatMessage(intl, "prl", "supervision.feedbackChallengesDescription")}
            </Typography>
            <TextField
              fullWidth
              value={formData.feedbackDesafios}
              onChange={handleChange("feedbackDesafios")}
              variant="outlined"
              size="small"
              multiline
              rows={4}
              placeholder="Descrever os desafios..."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {formatMessage(intl, "prl", "supervision.trainerCommitment")}
            </Typography>
            <Typography variant="body2" style={{ color: "#666", marginBottom: "12px" }}>
              {formatMessage(intl, "prl", "supervision.trainerCommitmentDescription")}
            </Typography>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "supervision.selectCommitment")}
              value={formData.compromissoFormador}
              onChange={handleChange("compromissoFormador")}
              variant="outlined"
              size="small"
            >
              <MenuItem value="">
                {formatMessage(intl, "prl", "supervision.selectCommitment")}
              </MenuItem>
              <MenuItem value="Melhorar técnicas de comunicação">
                {formatMessage(intl, "prl", "supervision.improveCommunicationTechniques")}
              </MenuItem>
              <MenuItem value="Aumentar tempo de interação com os participantes">
                {formatMessage(intl, "prl", "supervision.increaseInteractionTime")}
              </MenuItem>
              <MenuItem value="Explorar novos métodos de ensino">
                {formatMessage(intl, "prl", "supervision.exploreNewTeachingMethods")}
              </MenuItem>
              <MenuItem value="Reforçar a participação ativa">
                {formatMessage(intl, "prl", "supervision.reinforceActiveParticipation")}
              </MenuItem>
              <MenuItem value="Outro">
                {formatMessage(intl, "prl", "supervision.other")}
              </MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" style={{ fontWeight: "bold", marginBottom: "8px" }}>
              {formatMessage(intl, "prl", "supervision.additionalObservations")}
            </Typography>
            <TextField
              fullWidth
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              multiline
              rows={4}
              placeholder="Descrever observações adicionais..."
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
          {!isEditMode &&
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading || !formData.sessaoId || !formData.supervisorId || !formData.formadorId || !formData.identificadorGrupo || !formData.dataSupervisao}
            >
              {/* {isEditMode ? "Atualizar" : "Salvar"} */}
              Salvar
            </Button>
          }
        </Box>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionSupervisionFormPage))));
