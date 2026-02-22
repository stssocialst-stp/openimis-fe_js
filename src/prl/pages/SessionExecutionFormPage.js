import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { useLocation } from "react-router-dom";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PracticesTable from "../components/PracticesTable";

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
  const { classes, intl, history } = props;
  const location = useLocation();
  const viewData = location.state?.data;
  const isViewMode = !!viewData;

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
    numeroCuidadores: "",
    observacoes: "",
  });

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [practicesSelections, setPracticesSelections] = useState({});
  const [otherPractices, setOtherPractices] = useState("");
  const [challengesSelections, setChallengesSelections] = useState({});
  const [otherChallenges, setOtherChallenges] = useState("");
  const [necessitaEncaminhamento, setNecessitaEncaminhamento] = useState(false);
  const [strengthsSelections, setStrengthsSelections] = useState({});
  const [otherStrengths, setOtherStrengths] = useState("");
  const [attentionSelections, setAttentionSelections] = useState({});
  const [otherAttention, setOtherAttention] = useState("");
  const [metodologySelections, setMetodologySelections] = useState({});

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

  const strengthsRows = [
    { id: "s1", description: "a: Promoveu a participação ativa de todos os cuidadores presentes." },
    { id: "s2", description: "b: Reforçou o compartilhamento de experiências pessoais e reflexões pelos cuidadores." },
    { id: "s3", description: "c: Envolveu as famílias de forma que elas demonstraram interesse e envolvimento com o tema da sessão." },
    { id: "s4", description: "d: Incentivou o compartilhamento de compromissos e estratégias discutidas na sessão anterior pelos cuidadores." },
    { id: "s5", description: "f: Proporcionou um ambiente acolhedor, garantindo tempo de fala e respeito aos participantes." },
    { id: "s6", description: "g: Executou a escuta ativa e promoveu a empatia entre os cuidadores." },
    { id: "s7", description: "h: Garantiu amplo entendimento e aceitação das mensagens-chave transmitidas dentre as famílias." },
    { id: "s8", description: "i: Proporcionou um ambiente acolhedor aos cuidadores, permitindo que demonstrassem curiosidade e desejo de aprender." },
    { id: "s9", description: "j: Incentivou a colaboração durante a sessão" },
  ];

  const attentionRows = [
    { id: "a1", description: "a: Precisa trabalhar formas diferentes de engajar todos os cuidadores durante a sessão para evitar participação passiva ou limitada dos cuidadores." },
    { id: "a2", description: "b: Precisa dedicar mais tempo para abordar todas as atividades e os tópicos previstos durante a sessão." },
    { id: "a3", description: "c: Precisa explorar outras formas de comunicar as mensagens-chave tendo em vista as dificuldades de entendimento pelos cuidadores." },
    { id: "a4", description: "d: Precisa atuar em prol de acolher e incluir a participação das famílias a fim de eliminar desconforto em compartilhar experiências pessoais." },
    { id: "a5", description: "f: Precisa atuar de forma a estabelecer um ambiente colaborativo e de apoio mútuo entre as famílias da sessão, incentivando o diálogo e valorizando a participação." },
    { id: "a6", description: "g: Precisa comunicar de maneira diferente sobre a importância das práticas positivas discutidas em sessão." },
    { id: "a7", description: "h: Precisa estar apto para lidar com temas sensíveis ou complexos durante a sessão, explorando o conteúdo com base na participação e sem julgar as famílias." },
    { id: "a8", description: "i: Precisa se colocar com mais confiança na condução da sessão" },
  ];

  const metodologyRows = [
    { id: "m1", description: "a: Anotou a presença dos cuidadores." },
    { id: "m2", description: "b: Deu boas-vindas aos cuidadores." },
    { id: "m3", description: "c: Reviu os compromissos do mês passado." },
    { id: "m4", description: "d: Fez a discussão com a imagem com perguntas no guia." },
    { id: "m5", description: "e: Compartilhou as mensagens chave." },
    { id: "m6", description: "f: Facilitou a prática de acordo com o guia." },
    { id: "m7", description: "g: Fez a reflexão de acordo com o guia." },
    { id: "m8", description: "h: Pediu os compromissos aos cuidadores." },
    { id: "m9", description: "i: Informou sobre a próxima sessão." },
    { id: "m10", description: "j: Preencheu o relatório de execução da sessão." },
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
            id
            name
          }
          grupoFamilia {
            id
            nome
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
          otherNames
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
          codigoSessao: edge.node.codigoSessao,
          dataPlanejamento: edge.node.dataPlanejamento,
          dataSessao: edge.node.dataSessao,
          horaSessao: edge.node.horaSessao,
          modulo: edge.node.modulo,
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
          nome: `${edge.node.lastName} ${edge.node.otherNames}`.trim(),
        }));
        setTrainers(trainerList);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
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
      } else if (result.errors) {
        console.error('Error fetching districts:', result.errors);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchTrainers();
    fetchDistricts();
  }, []);

  useEffect(() => {
    if (isViewMode && viewData) {
      try {
        const mapCuidadores = (val) => {
          if (val === 'A_0') return '0';
          if (val === 'A_1_5') return '1-5';
          if (val === 'A_6_10') return '6-10';
          if (val === 'A_15') return '15+';
          return val;
        };

        // Load data for view mode
        setFormData({
          sessaoId: viewData.sessao?.id || "",
          formadorId: viewData.formador?.id || "",
          supervisorId: viewData.supervisor?.id || "",
          localidadeId: viewData.localidade?.id || "",
          numeroCuidadores: mapCuidadores(viewData.numeroCuidadores) || "",
          observacoes: viewData.observacoes || "",
        });

        // Helper function to safely parse JSON
        const safeJsonParse = (jsonString) => {
          if (!jsonString) return [];
          try {
            return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
          } catch (e) {
            console.error('Error parsing JSON:', e, jsonString);
            return [];
          }
        };

        // Parse selections from JSON strings
        if (viewData.praticasPositivas) {
          const positivas = safeJsonParse(viewData.praticasPositivas);
          const selections = {};
          positivas.forEach(item => {
            const row = practicesRows.find(r => r.description === item.descricao);
            if (row) {
              selections[row.id] = { descricao: item.descricao, confirmacao: item.confirmacao };
            }
          });
          setPracticesSelections(selections);
          setOtherPractices(viewData.outrasPraticasPositivas || "");
        }

        if (viewData.desafiosTransmissao) {
          const desafios = safeJsonParse(viewData.desafiosTransmissao);
          const selections = {};
          desafios.forEach(item => {
            const row = challengesRows.find(r => r.description === item.descricao);
            if (row) {
              selections[row.id] = { descricao: item.descricao, confirmacao: item.confirmacao };
            }
          });
          setChallengesSelections(selections);
          setOtherChallenges(viewData.outrosDesafios || "");
        }

        setNecessitaEncaminhamento(viewData.necessitaEncaminhamento || false);

        if (viewData.autoAvaliacaoPontosFortes) {
          const pontosFortes = safeJsonParse(viewData.autoAvaliacaoPontosFortes);
          const selections = {};
          pontosFortes.forEach(item => {
            const row = strengthsRows.find(r => r.description === item.descricao);
            if (row) {
              selections[row.id] = { descricao: item.descricao, confirmacao: item.confirmacao };
            }
          });
          setStrengthsSelections(selections);
          setOtherStrengths(viewData.outrosPontosFortes || "");
        }

        if (viewData.autoAvaliacaoPontosAtencao) {
          const pontosAtencao = safeJsonParse(viewData.autoAvaliacaoPontosAtencao);
          const selections = {};
          pontosAtencao.forEach(item => {
            const row = attentionRows.find(r => r.description === item.descricao);
            if (row) {
              selections[row.id] = { descricao: item.descricao, confirmacao: item.confirmacao };
            }
          });
          setAttentionSelections(selections);
          setOtherAttention(viewData.outrosPontosAtencao || "");
        }

        if (viewData.avaliacaoMetodologia) {
          const metodologia = safeJsonParse(viewData.avaliacaoMetodologia);
          const selections = {};
          metodologia.forEach(item => {
            const row = metodologyRows.find(r => r.description === item.descricao);
            if (row) {
              selections[row.id] = {
                descricao: item.descricao,
                confirmacao: item.confirmacao || item.avaliacao
              };
            }
          });
          setMetodologySelections(selections);
        }

        // Set selected session
        if (viewData.sessao) {
          setSelectedSession(viewData.sessao);
        }
      } catch (error) {
        console.error('Error loading view data:', error);
      }
    }
  }, [isViewMode, viewData]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTrainerChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, formadorId: value }));
  };

  const handleSessionChange = (event) => {
    const sessionId = event.target.value;
    const session = sessions.find(s => s.id === sessionId);

    if (session) {
      setSelectedSession(session);
      setFormData((prev) => ({
        ...prev,
        sessaoId: session.id,
      }));
    } else {
      setSelectedSession(null);
      setFormData((prev) => ({
        ...prev,
        sessaoId: "",
      }));
    }
  };

  const handlePracticesSelectionChange = (selections) => {
    setPracticesSelections(selections);
  };

  const handleOtherPracticesChange = (event) => {
    setOtherPractices(event.target.value);
  };

  const handleChallengesSelectionChange = (selections) => {
    setChallengesSelections(selections);
  };

  const handleOtherChallengesChange = (event) => {
    setOtherChallenges(event.target.value);
  };

  const handleNecessitaEncaminhamentoChange = (event) => {
    setNecessitaEncaminhamento(event.target.value === "sim");
  };

  const handleStrengthsSelectionChange = (selections) => {
    setStrengthsSelections(selections);
  };

  const handleOtherStrengthsChange = (event) => {
    setOtherStrengths(event.target.value);
  };

  const handleAttentionSelectionChange = (selections) => {
    setAttentionSelections(selections);
  };

  const handleOtherAttentionChange = (event) => {
    setOtherAttention(event.target.value);
  };

  const handleMetodologySelectionChange = (selections) => {
    setMetodologySelections(selections);
  };

  const convertPracticesToArray = () => {
    return Object.values(practicesSelections)
      .filter(item => item !== null)
      .map(item => ({
        descricao: item.descricao,
        confirmacao: item.confirmacao,
      }));
  };

  const convertChallengesToArray = () => {
    return Object.values(challengesSelections)
      .filter(item => item !== null)
      .map(item => ({
        descricao: item.descricao,
        confirmacao: item.confirmacao,
      }));
  };

  const convertStrengthsToArray = () => {
    return Object.values(strengthsSelections)
      .filter(item => item !== null)
      .map(item => ({
        descricao: item.descricao,
        confirmacao: item.confirmacao,
      }));
  };

  const convertAttentionToArray = () => {
    return Object.values(attentionSelections)
      .filter(item => item !== null)
      .map(item => ({
        descricao: item.descricao,
        confirmacao: item.confirmacao,
      }));
  };
  const convertMetodologyToArray = () => {
    return Object.values(metodologySelections)
      .filter(item => item !== null)
      .map(item => ({
        descricao: item.descricao,
        confirmacao: item.confirmacao,
      }));
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

      const input = {
        sessaoId: formData.sessaoId,
        formadorId: formData.formadorId,
        supervisorId: formData.supervisorId || null,
        localidadeId: formData.localidadeId && formData.localidadeId !== "" ? String(formData.localidadeId) : null,
        numeroCuidadores: formData.numeroCuidadores || "0",
        praticasPositivas: convertPracticesToArray().length > 0 ? JSON.stringify(convertPracticesToArray()) : null,
        outrasPraticasPositivas: otherPractices || null,
        desafiosTransmissao: convertChallengesToArray().length > 0 ? JSON.stringify(convertChallengesToArray()) : null,
        outrosDesafios: otherChallenges || null,
        necessitaEncaminhamento: necessitaEncaminhamento,
        autoAvaliacaoPontosFortes: convertStrengthsToArray().length > 0 ? JSON.stringify(convertStrengthsToArray()) : null,
        autoAvaliacaoPontosAtencao: convertAttentionToArray().length > 0 ? JSON.stringify(convertAttentionToArray()) : null,
        avaliacaoMetodologia: convertMetodologyToArray().length > 0 ? JSON.stringify(convertMetodologyToArray()) : null,
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
      <Helmet title={formatMessage(intl, "prl", isViewMode ? "title.viewExecution" : "title.createExecution")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "form")} 03 - {formatMessage(intl, "prl", isViewMode ? "title.viewExecution" : "title.createExecution")}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              A. Detalhes do planeamento da Sessão
            </Typography>
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "attendance.selectSession")}
              value={formData.sessaoId}
              onChange={handleSessionChange}
              variant="outlined"
              size="small"
              required
              disabled={isViewMode}
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
              label={formatMessage(intl, "prl", "execution.supervisor")}
              value={formData.supervisorId}
              onChange={handleChange("supervisorId")}
              variant="outlined"
              size="small"
              disabled={isViewMode}
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
              select
              label={formatMessage(intl, "prl", "execution.trainer")}
              value={formData.formadorId}
              onChange={handleTrainerChange}
              variant="outlined"
              size="small"
              required
              disabled={isViewMode}
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
              select
              label={formatMessage(intl, "prl", "attendance.locality")}
              value={formData.localidadeId}
              onChange={handleChange("localidadeId")}
              variant="outlined"
              size="small"
              disabled={isViewMode}
            >
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              B. Detalhes de Execução da Sessão PEP+
            </Typography>
          </Grid>

          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "prl", "execution.numberOfParticipants")}
              value={formData.numeroCuidadores}
              onChange={handleChange("numeroCuidadores")}
              variant="outlined"
              size="small"
              required
              disabled={isViewMode}
            >
              <MenuItem value="0">0 cuidadores</MenuItem>
              <MenuItem value="1-5">1-5 cuidadores</MenuItem>
              <MenuItem value="6-10">6-10 cuidadores</MenuItem>
              <MenuItem value="15+">Mais de 15 cuidadores</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <PracticesTable
              title={formatMessage(intl, "prl", "execution.positivePracticesTitle")}
              subtitle={formatMessage(intl, "prl", "execution.positivePracticesSubtitle")}
              rows={practicesRows}
              options={["Sim", "Não", "N/A"]}
              onSelectionChange={handlePracticesSelectionChange}
              selections={practicesSelections}
              showOtherPractices={true}
              otherPracticesLabel={formatMessage(intl, "prl", "execution.otherPositivePractices")}
              otherPracticesPlaceholder={formatMessage(intl, "prl", "execution.otherPositivePracticesPlaceholder")}
              otherPracticesValue={otherPractices}
              onOtherPracticesChange={handleOtherPracticesChange}
              disabled={isViewMode}
            />
          </Grid>
        </Grid>

        {/* Transmission section */}
        <Divider style={{ margin: "16px 0" }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <PracticesTable
              title={formatMessage(intl, "prl", "execution.challengesTitle")}
              subtitle={formatMessage(intl, "prl", "execution.challengesSubtitle")}
              rows={challengesRows}
              options={["Sim", "Não", "N/A"]}
              onSelectionChange={handleChallengesSelectionChange}
              selections={challengesSelections}
              showOtherPractices={true}
              otherPracticesLabel={formatMessage(intl, "prl", "execution.otherChallenges")}
              otherPracticesPlaceholder={formatMessage(intl, "prl", "execution.otherChallengesPlaceholder")}
              otherPracticesValue={otherChallenges}
              onOtherPracticesChange={handleOtherChallengesChange}
            />
          </Grid>
        </Grid>

        {/* Referral and Self-Assessment section */}
        <Divider style={{ margin: "16px 0" }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              3.4. {formatMessage(intl, "prl", "execution.referralQuestion")}
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
                  disabled={isViewMode}
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
                  disabled={isViewMode}
                />
                Não
              </label>
            </div>
          </Grid>
        </Grid>

        {/* Strengths Self-Assessment section */}
        <Divider style={{ margin: "16px 0" }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <PracticesTable
              title={formatMessage(intl, "prl", "execution.selfAssessmentStrengths")}
              subtitle={formatMessage(intl, "prl", "execution.selfAssessmentStrengthsSubtitle")}
              rows={strengthsRows}
              options={["1", "2", "N/A"]}
              onSelectionChange={handleStrengthsSelectionChange}
              selections={strengthsSelections}
              showOtherPractices={true}
              otherPracticesLabel={formatMessage(intl, "prl", "execution.otherStrengths")}
              otherPracticesPlaceholder={formatMessage(intl, "prl", "execution.otherStrengthsPlaceholder")}
              otherPracticesValue={otherStrengths}
              onOtherPracticesChange={handleOtherStrengthsChange}
            />
          </Grid>
        </Grid>

        {/* Attention Self-Assessment section */}
        <Divider style={{ margin: "16px 0" }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <PracticesTable
              title={formatMessage(intl, "prl", "execution.selfAssessmentAttention")}
              subtitle={formatMessage(intl, "prl", "execution.selfAssessmentAttentionSubtitle")}
              rows={attentionRows}
              options={["1", "2", "N/A"]}
              onSelectionChange={handleAttentionSelectionChange}
              selections={attentionSelections}
              showOtherPractices={true}
              otherPracticesLabel={formatMessage(intl, "prl", "execution.otherAttention")}
              otherPracticesPlaceholder={formatMessage(intl, "prl", "execution.otherAttentionPlaceholder")}
              otherPracticesValue={otherAttention}
              onOtherPracticesChange={handleOtherAttentionChange}
              disabled={isViewMode}
            />
          </Grid>
        </Grid>

        {/* Metodologia section */}
        <Divider style={{ margin: "16px 0" }} />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <PracticesTable
              title={formatMessage(intl, "prl", "execution.methodologyTitle")}
              subtitle={formatMessage(intl, "prl", "execution.methodologySubtitle")}
              rows={metodologyRows}
              options={["Não fez", "Não adequado", "Adequado", "Excelente", "N/A"]}
              onSelectionChange={handleMetodologySelectionChange}
              selections={metodologySelections}
              showOtherPractices={false}
              disabled={isViewMode}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Observações da Sessão
            </Typography>
          </Grid>
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
            disabled={isViewMode}
          />
        </Grid>
      </Paper>

      <Box className={classes.buttonContainer}>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleBack}
        >
          {formatMessage(intl, "prl", "button.cancel")}
        </Button>
        {!isViewMode && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || !formData.sessaoId || !formData.formadorId}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionExecutionFormPage))));