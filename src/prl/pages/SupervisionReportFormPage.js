import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box, FormControl, InputLabel, Select, Chip,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import LimitedChecklistComponent from "../components/LimitedChecklistComponent";

const styles = (theme) => ({
  page: theme.page,
  paper: { ...theme.paper.paper, margin: theme.spacing(2), padding: theme.spacing(2) },
  headerPaper: {
    ...theme.paper.paper,
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    marginBottom: 0,
  },
  headerTitle: {
    marginBottom: theme.spacing(1),
    fontWeight: 500,
    fontSize: "1.3rem",
  },
  headerSubtitle: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  sectionSubtitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.textSecondary,
    fontSize: "0.9rem",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: theme.spacing(2),
    gap: theme.spacing(1),
    padding: theme.spacing(0, 1, 2, 1),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  headerButton: {
    color: "white",
    marginRight: theme.spacing(1),
  },
});

function SupervisionReportFormPage(props) {
  const { classes, intl, history, location } = props;
  const isView = location?.state?.isView || false;
  const initialData = location?.state?.data || null;
  const reportId = location?.pathname?.split('/').pop() || null;

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

  // 1. Identificação
  const [identificacao, setIdentificacao] = useState({
    supervisores: [],
    numeroSessoes: "",
    numeroTecnicosFormadores: "",
  });

  // 2. Marque seu Distrito
  const [distrito, setDistrito] = useState("");
  const [distritos, setDistritos] = useState([
    { id: "aguas_grande", name: "Águas Grande" },
    { id: "cairu", name: "Cairu" },
    { id: "caul", name: "Caúl" },
    { id: "lambai", name: "Lâmbai" },
  ]);

  // 3. Marque o Período do Relatório
  const [periodo, setPeriodo] = useState({
    janfev: false,
    marabb: false,
    maijun: false,
    julaug: false,
    setout: false,
    novdec: false,
  });

  // 4. Avaliação dos Técnicos Formadores
  const [avaliacoesTecnicos, setAvaliacoesTecnicos] = useState([
    {
      id: 1,
      idDoTecnico: "",
      pontosPositivos: "",
      pontosAprimorar: "",
    },
  ]);

  // 5. Sessões do PEP+
  const [sessoesPep, setSessoesPep] = useState([
    { passo: "a. Acolhida a apresentação dos cuidadores.", nota: 0 },
    { passo: "b. Acolheu a presença dos cuidadores.", nota: 0 },
    { passo: "c. Reviu os compromissos do mês passado.", nota: 0 },
    { passo: "d. Fez a discussão com a imagem preparada no guia.", nota: 0 },
    { passo: "e. Compartilhou as mensagens chave.", nota: 0 },
    { passo: "f. Facilitou a prática de acordo com o guia.", nota: 0 },
    { passo: "g. Fez a reflexão de acordo com o guia.", nota: 0 },
    { passo: "h. Pediu os compromissos aos cuidadores.", nota: 0 },
    { passo: "i. Informou sobre a próxima sessão.", nota: 0 },
  ]);

  // B. Qual módulo com dificuldade
  const modulosOptions = [
    { id: "modulo1", description: "Módulo 1: Eu Como Cuidador" },
    { id: "modulo2", description: "Módulo 2: Rotinas Diárias" },
    { id: "modulo3", description: "Módulo 3: Dimensão Afetiva - Apoiar a Aprendizagem das Crianças" },
    { id: "modulo4", description: "Módulo 4: Desenvolvimento Integral - Como Manter a Família Saudável" },
    { id: "modulo5", description: "Módulo 5: Conversar e Aprender com as Vossas Crianças" },
    { id: "modulo6", description: "Módulo 6: Direitos da Criança" },
    { id: "modulo7", description: "Módulo 7: Consentimento e Mudanças de Vida" },
    { id: "modulo8", description: "Módulo 8: Adolescentes - Expectativas para o Futuro" },
    { id: "modulo9", description: "Módulo 9: Promover um Ambiente Familiar Acolhedor" },
    { id: "modulo10", description: "Módulo 10: Cuidar de Quem Cuida" },
    { id: "modulo11", description: "Módulo 11: Planeamento Financeiro" },
    { id: "modulo12", description: "Módulo 12: Graduação e Próximos Passos" },
  ];

  const [modulosDificuldade, setModulosDificuldade] = useState(
    modulosOptions.reduce((acc, modulo) => {
      acc[modulo.id] = { ...modulo, confirmacao: false };
      return acc;
    }, {})
  );

  // 6. Observações Adicionais
  const [observacoes, setObservacoes] = useState("");

  // Usuários (supervisores e técnicos)
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

  // Helper para converter período checkboxes para enum
  const getPeriodoEnum = () => {
    if (periodo.janfev) return 'JAN_FEV';
    if (periodo.marabb) return 'MAR_ABR';
    if (periodo.maijun) return 'MAI_JUN';
    if (periodo.julaug) return 'JUL_AGO';
    if (periodo.setout) return 'SET_OUT';
    if (periodo.novdec) return 'NOV_DEZ';
    return null;
  };

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

  const createMutation = `mutation CreateRelatorioSupervisao($input: CreateRelatorioSupervisaoMutationInput!) {
    createRelatorioSupervisao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateRelatorioSupervisao($input: UpdateRelatorioSupervisaoMutationInput!) {
    updateRelatorioSupervisao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  useEffect(() => {
    // Load data if editing
    if (initialData) {
      setIdentificacao({
        supervisores: initialData.supervisores || [],
        numeroSessoes: initialData.numeroSessoes || "",
        numeroTecnicosFormadores: initialData.numeroTecnicosFormadores || "",
      });
    }
  }, [initialData]);

  const handleSave = async () => {
    try {
      if (identificacao.supervisores.length === 0) {
        alert("Por favor, adicione pelo menos um supervisor.");
        return;
      }
      if (!distrito) {
        alert("Por favor, selecione o distrito.");
        return;
      }
      const periodoEnum = getPeriodoEnum();
      if (!periodoEnum) {
        alert("Por favor, selecione um período.");
        return;
      }

      const currentYear = new Date().getFullYear();

      // Filtrar avaliações com idDoTecnico preenchido
      const avaliacoesValidas = avaliacoesTecnicos.filter(a => a.idDoTecnico.trim());

      const input = {
        supervisores: JSON.stringify(identificacao.supervisores),
        numeroSessoes: parseInt(identificacao.numeroSessoes) || 0,
        numeroTecnicosFormadores: parseInt(identificacao.numeroTecnicosFormadores) || 0,
        ano: currentYear,
        distritoId: distrito,
        periodo: periodoEnum,
        avaliacoesTecnicos: JSON.stringify(avaliacoesValidas.map(a => ({
          idDoTecnico: a.idDoTecnico,
          pontosPositivos: a.pontosPositivos,
          pontosAprimorar: a.pontosAprimorar,
        }))),
        sessoesPep: JSON.stringify(sessoesPep.map(s => ({
          passo: s.passo,
          nota: parseInt(s.nota) || 0,
        }))),
        modulosDificuldade: JSON.stringify(modulosDificuldade),
        observacoes: observacoes,
      };

      if (reportId && reportId !== 'new') {
        input.id = reportId;
      }

      const mutation = reportId === 'new' ? createMutation : updateMutation;
      const mutationName = reportId === 'new' ? 'createRelatorioSupervisao' : 'updateRelatorioSupervisao';

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

      const result = await response.json();

      if (result.errors) {
        console.error('Errors:', result.errors);
        alert(`Erro ao salvar: ${result.errors[0].message}`);
      } else if (result.data?.[mutationName]) {
        alert("Relatório salvo com sucesso!");
        history.push('/prl/supervisionReport');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert("Erro ao salvar o relatório");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.push('/prl/supervisionReport');
  };

  const handleAddTecnico = () => {
    if (isView) return;
    const newId = Math.max(...avaliacoesTecnicos.map(t => t.id), 0) + 1;
    setAvaliacoesTecnicos([...avaliacoesTecnicos, {
      id: newId,
      idDoTecnico: "",
      pontosPositivos: "",
      pontosAprimorar: "",
    }]);
  };

  const handleRemoveTecnico = (id) => {
    if (isView) return;
    if (avaliacoesTecnicos.length > 1) {
      setAvaliacoesTecnicos(avaliacoesTecnicos.filter(t => t.id !== id));
    }
  };

  const handleTecnicoChange = (id, field, value) => {
    if (isView) return;
    setAvaliacoesTecnicos(avaliacoesTecnicos.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ));
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.supervisionReport")} />

      {/* Header */}
      <Box className={classes.headerPaper}>
        <Box style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {!isView && (
            <Button
              startIcon={<ChevronLeftIcon />}
              onClick={handleBack}
              className={classes.headerButton}
            >
              Voltar
            </Button>
          )}
          <Typography variant="h6" className={classes.headerTitle}>
            Relatório Bimestral de Supervisão - PEP+
          </Typography>
        </Box>
      </Box>

      {/* 1. Identificação */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          I. Identificação
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Supervisores *</InputLabel>
              <Select
                multiple
                value={identificacao.supervisores}
                onChange={(e) => !isView && setIdentificacao({ ...identificacao, supervisores: e.target.value })}
                label="Supervisores *"
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
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Nº de Sessões Supervisionadas *"
              type="number"
              value={identificacao.numeroSessoes}
              onChange={(e) => !isView && setIdentificacao({ ...identificacao, numeroSessoes: e.target.value })}
              variant="outlined"
              size="small"
              disabled={isView}
              InputProps={{ inputProps: { min: 0 } }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              label="Nº de Técnicos Supervisionados *"
              type="number"
              value={identificacao.numeroTecnicosFormadores}
              onChange={(e) => !isView && setIdentificacao({ ...identificacao, numeroTecnicosFormadores: e.target.value })}
              variant="outlined"
              size="small"
              disabled={isView}
              InputProps={{ inputProps: { min: 0 } }}
              required
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Marque seu Distrito */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          II. Marque seu Distrito
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label="Distrito"
              value={distrito}
              onChange={(e) => !isView && setDistrito(e.target.value)}
              variant="outlined"
              size="small"
              required
              disabled={isView}
            >
              <MenuItem value="">
                <em>Selecione o distrito</em>
              </MenuItem>
              {distritos.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Marque o Período do Relatório */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          III. Marque o Período do Relatório
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.janfev}
                onChange={(e) => !isView && setPeriodo({ ...periodo, janfev: e.target.checked })}
              />
              <Typography>Janeiro e Fevereiro</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.marabb}
                onChange={(e) => !isView && setPeriodo({ ...periodo, marabb: e.target.checked })}
              />
              <Typography>Março e Abril</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.maijun}
                onChange={(e) => !isView && setPeriodo({ ...periodo, maijun: e.target.checked })}
              />
              <Typography>Maio e Junho</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.julaug}
                onChange={(e) => !isView && setPeriodo({ ...periodo, julaug: e.target.checked })}
              />
              <Typography>Julho e Agosto</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.setout}
                onChange={(e) => !isView && setPeriodo({ ...periodo, setout: e.target.checked })}
              />
              <Typography>Setembro e Outubro</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                disabled={isView}
                checked={periodo.novdec}
                onChange={(e) => !isView && setPeriodo({ ...periodo, novdec: e.target.checked })}
              />
              <Typography>Novembro e Dezembro</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 4. Avaliação dos Técnicos Formadores */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          IV. Avaliação dos Técnicos Formadores
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Descreva os pontos fortes e as áreas de melhoria de cada técnico
        </Typography>

        {avaliacoesTecnicos.map((tecnico, index) => (
          <Box key={tecnico.id} style={{ marginBottom: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
            <Typography variant="subtitle2" style={{ marginBottom: 12, fontWeight: 500 }}>
              Técnico Formador {index + 1}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Técnico Formador</InputLabel>
                  <Select
                    value={tecnico.idDoTecnico}
                    onChange={(e) => handleTecnicoChange(tecnico.id, 'idDoTecnico', e.target.value)}
                    label="ID do Técnico Formador"
                    disabled={isView || loadingUsuarios}
                  >
                    <MenuItem value="">
                      <em>Selecione um técnico</em>
                    </MenuItem>
                    {usuarios.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Pontos Positivos"
                  value={tecnico.pontosPositivos}
                  onChange={(e) => handleTecnicoChange(tecnico.id, 'pontosPositivos', e.target.value)}
                  variant="outlined"
                  disabled={isView}
                  placeholder="Descreva os pontos positivos do técnico"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Pontos a Aproveitar"
                  value={tecnico.pontosAprimorar}
                  onChange={(e) => handleTecnicoChange(tecnico.id, 'pontosAprimorar', e.target.value)}
                  variant="outlined"
                  disabled={isView}
                  placeholder="Descreva os pontos a melhorar"
                />
              </Grid>
              {!isView && avaliacoesTecnicos.length > 1 && (
                <Grid item xs={12}>
                  <Button
                    color="secondary"
                    size="small"
                    onClick={() => handleRemoveTecnico(tecnico.id)}
                  >
                    Remover Técnico
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        ))}

        {!isView && (
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={handleAddTecnico}
            style={{ marginTop: 8 }}
          >
            + Adicionar Técnico
          </Button>
        )}
      </Paper>

      {/* 5. Sessões do PEP+ */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          V. Sessões do PEP+
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          A. Marque a nota de observação de cada item (use escala de 0-10)
        </Typography>

        {sessoesPep.map((sessao, index) => (
          <Box key={index} style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
            <Box
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #ccc',
                borderRadius: 4,
                backgroundColor: '#fafafa',
              }}
            >
              <Typography variant="body2">{sessao.passo}</Typography>
            </Box>
            <TextField
              type="number"
              size="small"
              inputProps={{ min: 1, max: 5, step: 1 }}
              value={sessao.nota || 0}
              onChange={(e) => !isView && setSessoesPep(
                sessoesPep.map((s, i) => i === index ? { ...s, nota: parseInt(e.target.value) || 0 } : s)
              )}
              disabled={isView}
              style={{ width: 80 }}
              variant="outlined"
            />
          </Box>
        ))}

        <Divider className={classes.divider} />

        <Typography variant="subtitle2" style={{ marginTop: 24, marginBottom: 12, fontWeight: 500 }}>
          B. Marque os módulos com maior dificuldade de compreensão
        </Typography>
        <Typography variant="body2" style={{ marginBottom: 16, color: "#3d3d3d" }}>
          (obs, é o módulo com menor nota. Marcar apenas para o bimestre de execução corrente)
        </Typography>
        <LimitedChecklistComponent
          items={modulosOptions}
          maxSelections={1}
          onSelectionChange={(updated) => !isView && setModulosDificuldade(updated)}
          selections={modulosDificuldade}
          footer={false}
        />
      </Paper>

      {/* 6. Observações Adicionais */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          VI. Observações Adicionais
        </Typography>
        <Typography variant="body2" className={classes.sectionSubtitle}>
          Campo aberto para adicionar observações para discussão
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Observações"
          value={observacoes}
          onChange={(e) => !isView && setObservacoes(e.target.value)}
          variant="outlined"
          placeholder="Adicione suas observações aqui..."
          disabled={isView}
        />
      </Paper>

      {/* Buttons */}
      <Box className={classes.buttonContainer}>
        <Button
          variant="outlined"
          onClick={handleBack}
          startIcon={<ChevronLeftIcon />}
        >
          {isView ? "Voltar" : "Cancelar"}
        </Button>
        {!isView && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading || identificacao.supervisores.length === 0 || !distrito}
          >
            Salvar Relatório de Supervisão
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SupervisionReportFormPage))));
