import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Checkbox, FormControlLabel, FormGroup, Select, InputLabel, FormControl
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_EDUCATIONAL_MODULE } from "../constants";

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
  formSection: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    background: '#f8f8f8',
    borderRadius: 8,
  },
  greenTitle: {
    color: '#219653',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    fontSize: 22,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: '#219653',
    fontWeight: 500,
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    fontSize: 16,
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
});

function EducationalModuleFormPage(props) {
  const { classes, intl, history, location } = props;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    idMembro: "",
    nome: "",
    nomeEncarregado: "",
    escola: "",
    escolaridade_actual: "",
    dataNascimento: "",
    ID_da_crianca: "",
    sexo: "",
    dadosEscolaresCorrectos: null,
    escolaActual: "",
    classe: "",
    idade: "",
    informacoesLocalizacao: {
      nomeDaRegiao: "",
      distritoId: "",
      Localidade: "",
      nomeEscola: "",
      pontoReferencia: "",
      meioResidencia: "",
    },
    classeQueFrequenta: "",
    aproveitamentoPrimeiroTrimestre: "",
    faixaDeFaltas: "",
    disciplinasBasicas: [],
    disciplinasAvancadas: [],
    observacoes: "",
  });
  const [districts, setDistricts] = useState([]);
  const [escolasAPI, setEscolasAPI] = useState([]);
  const [classesAPI, setClassesAPI] = useState([]);
  const [disciplinasBasicasAPI, setDisciplinasBasicasAPI] = useState([]);
  const [disciplinasAvancadasAPI, setDisciplinasAvancadasAPI] = useState([]);
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('id');
  // Visualização se houver id e não for criação (sem id)
  const isView = !!groupId && !queryParams.get('edit');
  const isEdit = !!groupId && !!queryParams.get('edit');
  // Query para visualizar um módulo educacional
  const viewQuery = `query moduloEducacional($id: ID!) {
    moduloEducacional(id: $id) {
      id
      uuid
      idMembroCrianca
      nome
      nomeEncarregado
      escola {
        id
        nome
      }
      escolaridadeActual
      dataNascimento
      idDaCrianca
      sexo
      dadosEscolarCorrectos
      escolaActual {
        id
        nome
      }
      classe {
        id
        codigo
        nome
      }
      idade
      dadosEscolaresCorrectos
      informacoesLocalizacao
      classeQueFrequenta {
        id
        codigo
        nome
      }
      aproveitamentoPrimeiroTrimestre
      faixaDeFaltas
      disciplinas {
        disciplina {
          id
          nome
          nivel
        }
      }
      observacoes
    }
  }`;

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };
  const handleLocalizacaoChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      informacoesLocalizacao: {
        ...prev.informacoesLocalizacao,
        [field]: event.target.value,
      },
    }));
  };
  const handleCheckboxChange = (field, value) => (event) => {
    setFormData((prev) => {
      const arr = prev[field] || [];
      if (event.target.checked) {
        return { ...prev, [field]: [...arr, value] };
      } else {
        return { ...prev, [field]: arr.filter((v) => v !== value) };
      }
    });
  };


  // GraphQL queries/mutations
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

  const escolasQuery = `query GetEscolas {
    escolas(ativo: true, orderBy: ["nome"]) {
      edges {
        node {
          id
          nome
          nivel
        }
      }
    }
  }`;

  const classesQuery = `query GetClasses {
    classes(ativo: true, orderBy: ["ordem"]) {
      edges {
        node {
          id
          codigo
          nome
          nivel
          ordem
        }
      }
    }
  }`;

  const disciplinasQuery = `query GetDisciplinas($nivel: String) {
    disciplinas(nivel: $nivel, ativo: true, orderBy: ["nome"]) {
      edges {
        node {
          id
          nome
          nivel
        }
      }
    }
  }`;

  // Função para obter o CSRF token do cookie
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
        setDistricts(result.data.locations.edges.map(edge => ({ value: edge.node.id, label: edge.node.name })));
      }
    } catch (error) {
      setDistricts([]);
    }
  };

  const fetchEscolas = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
        body: JSON.stringify({ query: escolasQuery }),
      });
      const result = await response.json();
      if (result.data?.escolas?.edges) {
        setEscolasAPI(result.data.escolas.edges.map(e => ({ id: e.node.id, nome: e.node.nome, nivel: e.node.nivel })));
      }
    } catch (error) { setEscolasAPI([]); }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
        body: JSON.stringify({ query: classesQuery }),
      });
      const result = await response.json();
      if (result.data?.classes?.edges) {
        setClassesAPI(result.data.classes.edges.map(c => ({ id: c.node.id, codigo: c.node.codigo, nome: c.node.nome, nivel: c.node.nivel })));
      }
    } catch (error) { setClassesAPI([]); }
  };

  const fetchDisciplinas = async () => {
    try {
      const [resBasicas, resAvancadas] = await Promise.all([
        fetch(`${baseApiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
          body: JSON.stringify({ query: disciplinasQuery, variables: { nivel: 'BASICA' } }),
        }),
        fetch(`${baseApiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
          body: JSON.stringify({ query: disciplinasQuery, variables: { nivel: 'AVANCADA' } }),
        }),
      ]);
      const [rBasicas, rAvancadas] = await Promise.all([resBasicas.json(), resAvancadas.json()]);
      if (rBasicas.data?.disciplinas?.edges) {
        setDisciplinasBasicasAPI(rBasicas.data.disciplinas.edges.map(d => ({ id: d.node.id, nome: d.node.nome })));
      }
      if (rAvancadas.data?.disciplinas?.edges) {
        setDisciplinasAvancadasAPI(rAvancadas.data.disciplinas.edges.map(d => ({ id: d.node.id, nome: d.node.nome })));
      }
    } catch (error) { console.error('Error fetching disciplinas:', error); }
  };

  useEffect(() => {
    fetchDistricts();
    // Fetch parametrization tables
    fetchEscolas();
    fetchClasses();
    fetchDisciplinas();
    // Se houver id (edição ou visualização), buscar dados do módulo
    if (groupId) {
      (async () => {
        try {
          const response = await fetch(`${baseApiUrl}/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'),
              ...apiHeaders(),
            },
            body: JSON.stringify({ query: viewQuery, variables: { id: groupId } }),
          });
          const result = await response.json();
          const data = result.data?.moduloEducacional;
          if (data) {
            setFormData({
              idMembro: data.idMembroCrianca || "",
              nome: data.nome || "",
              nomeEncarregado: data.nomeEncarregado || "",
              escola: data.escola?.id || "",
              escolaridade_actual: data.escolaridadeActual || "",
              dataNascimento: data.dataNascimento || "",
              ID_da_crianca: data.idDaCrianca || "",
              sexo: data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Feminino' : "",
              dadosEscolaresCorrectos: data.dadosEscolaresCorrectos ?? data.dadosEscolarCorrectos ?? null,
              escolaActual: data.escolaActual?.id || "",
              classe: data.classe?.id || "",
              idade: data.idade || "",
              informacoesLocalizacao: (() => {
                try {
                  return data.informacoesLocalizacao ? JSON.parse(data.informacoesLocalizacao) : {
                    nomeDaRegiao: "",
                    distritoId: "",
                    Localidade: "",
                    nomeEscola: "",
                    pontoReferencia: "",
                    meioResidencia: "",
                  };
                } catch {
                  return {
                    nomeDaRegiao: "",
                    distritoId: "",
                    Localidade: "",
                    nomeEscola: "",
                    pontoReferencia: "",
                    meioResidencia: "",
                  };
                }
              })(),
              classeQueFrequenta: data.classeQueFrequenta?.id || "",
              aproveitamentoPrimeiroTrimestre: data.aproveitamentoPrimeiroTrimestre || "",
              faixaDeFaltas: data.faixaDeFaltas || "",
              disciplinasBasicas: (data.disciplinas || []).filter(d => d.disciplina?.nivel === 'BASICA').map(d => d.disciplina.id),
              disciplinasAvancadas: (data.disciplinas || []).filter(d => d.disciplina?.nivel === 'AVANCADA').map(d => d.disciplina.id),
              observacoes: data.observacoes || "",
            });
          }
        } catch (e) {
          // erro ao buscar dados
        }
      })();
    }
    // eslint-disable-next-line
  }, []);

  // GraphQL mutation for create/update
  const createMutation = `mutation createModuloEducacional($input: CreateModuloEducacionalMutationInput!) {
    createModuloEducacional(input: $input) {
      internalId
      clientMutationId
    }
  }`;
  const updateMutation = `mutation updateModuloEducacional($input: UpdateModuloEducacionalMutationInput!) {
    updateModuloEducacional(input: $input) {
      internalId
      clientMutationId
    }
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Prepare input for mutation
    const input = {
      idMembroCrianca: formData.idMembro,
      nome: formData.nome,
      nomeEncarregado: formData.nomeEncarregado,
      escolaId: formData.escola || null,
      escolaridadeActual: formData.escolaridade_actual,
      dataNascimento: formData.dataNascimento || null,
      idDaCrianca: formData.ID_da_crianca,
      sexo: formData.sexo === 'Masculino' ? 'M' : formData.sexo === 'Feminino' ? 'F' : null,
      dadosEscolarCorrectos: formData.dadosEscolaresCorrectos,
      escolaActualId: formData.escolaActual || null,
      classeId: formData.classe || null,
      idade: formData.idade ? parseInt(formData.idade) : null,
      dadosEscolaresCorrectos: formData.dadosEscolaresCorrectos,
      informacoesLocalizacao: JSON.stringify(formData.informacoesLocalizacao),
      classeQueFrequentaId: formData.classeQueFrequenta || null,
      aproveitamentoPrimeiroTrimestre: formData.aproveitamentoPrimeiroTrimestre,
      faixaDeFaltas: formData.faixaDeFaltas,
      disciplinasIds: [...formData.disciplinasBasicas, ...formData.disciplinasAvancadas],
      observacoes: formData.observacoes,
    };
    const mutation = isEdit ? updateMutation : createMutation;
    const variables = isEdit ? { input: { ...input, id: groupId } } : { input };
    try {
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
      const mutationResult = result.data?.createModuloEducacional || result.data?.updateModuloEducacional;
      // Se não houver internalId, pode ser erro
      if (!mutationResult?.internalId) {
        alert('Erro ao salvar. Verifique os dados e tente novamente.');
      } else {
        history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE}`);
      }
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Listas
  const faltasList = ["1-3", "4-6", "7-10", "+10"];
  const aproveitamentoList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "+10"];

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE}`);
  };

  const pageTitle = isEdit ? "title.editSchoolAttendance" : "title.createSchoolAttendance";

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", pageTitle)} />
      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", pageTitle)}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <form onSubmit={handleSubmit}>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A1: Identificação do Aluno</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="ID do Membro/Criança" fullWidth value={formData.idMembro} onChange={handleChange("idMembro")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome" fullWidth value={formData.nome} onChange={handleChange("nome")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Encarregado de Educação" fullWidth value={formData.nomeEncarregado} onChange={handleChange("nomeEncarregado")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Escola</InputLabel>
                  <Select value={formData.escola} onChange={handleChange("escola")} label="Escola" disabled={isView}>
                    {escolasAPI.map((e) => (
                      <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Escolaridade Atual</InputLabel>
                  <Select value={formData.escolaridade_actual} onChange={handleChange("escolaridade_actual")} label="Escolaridade Atual" disabled={isView}>
                    {classesAPI.map((c) => (
                      <MenuItem key={c.id} value={c.nome}>{c.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Data de Nascimento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dataNascimento} onChange={handleChange("dataNascimento")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="ID da Criança" fullWidth value={formData.ID_da_crianca} onChange={handleChange("ID_da_crianca")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select value={formData.sexo} onChange={handleChange("sexo")}
                    label="Sexo" disabled={isView}>
                    <MenuItem value="Masculino">Masculino</MenuItem>
                    <MenuItem value="Feminino">Feminino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A2: Verificação de Dados Escolares</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Os dados escolares estão corretos?</InputLabel>
                  <Select value={formData.dadosEscolaresCorrectos} onChange={handleChange("dadosEscolaresCorrectos")}
                    label="Os dados escolares estão corretos?" disabled={isView}>
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Escola Atual" fullWidth value={formData.escolaActual}
                  onChange={handleChange("escolaActual")} disabled={isView} select>
                  {escolasAPI.map((e) => (
                    <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A5-A9: Informações de Localização</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Região" fullWidth value={formData.informacoesLocalizacao.nomeDaRegiao} onChange={handleLocalizacaoChange("nomeDaRegiao")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Distrito</InputLabel>
                  <Select
                    value={formData.informacoesLocalizacao.distritoId}
                    onChange={handleLocalizacaoChange("distritoId")}
                    label="Distrito"
                    disabled={isView}
                  >
                    {districts.map((d) => (
                      <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Localidade" fullWidth value={formData.informacoesLocalizacao.Localidade} onChange={handleLocalizacaoChange("Localidade")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Escola" fullWidth value={formData.informacoesLocalizacao.nomeEscola} onChange={handleLocalizacaoChange("nomeEscola")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Ponto de Referência" fullWidth value={formData.informacoesLocalizacao.pontoReferencia} onChange={handleLocalizacaoChange("pontoReferencia")} disabled={isView} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Meio Residência" fullWidth value={formData.informacoesLocalizacao.meioResidencia} onChange={handleLocalizacaoChange("meioResidencia")} disabled={isView} />
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Que classe frequenta?</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Classe</InputLabel>
                  <Select value={formData.classeQueFrequenta} onChange={handleChange("classeQueFrequenta")} label="Classe" disabled={isView}>
                    {classesAPI.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A4: Faltas no Primeiro Trimestre</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Quantas faltas teve no 1º trimestre?</InputLabel>
                  <Select value={formData.aproveitamentoPrimeiroTrimestre} onChange={handleChange("aproveitamentoPrimeiroTrimestre")} label="Quantas faltas teve no 1º trimestre?" disabled={isView}>
                    {aproveitamentoList.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Faixa de Faltas</InputLabel>
                  <Select value={formData.faixaDeFaltas} onChange={handleChange("faixaDeFaltas")} label="Faixa de Faltas" disabled={isView}>
                    {faltasList.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Disciplinas</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Disciplinas Básicas</Typography>
                <FormGroup>
                  {disciplinasBasicasAPI.map((d) => (
                    <FormControlLabel
                      key={d.id}
                      control={<Checkbox color="primary" checked={formData.disciplinasBasicas.includes(d.id)} onChange={handleCheckboxChange("disciplinasBasicas", d.id)} disabled={isView} />}
                      label={d.nome}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Disciplinas Avançadas</Typography>
                <FormGroup>
                  {disciplinasAvancadasAPI.map((d) => (
                    <FormControlLabel
                      key={d.id}
                      control={<Checkbox color="primary" checked={formData.disciplinasAvancadas.includes(d.id)} onChange={handleCheckboxChange("disciplinasAvancadas", d.id)} disabled={isView} />}
                      label={d.nome}
                    />
                  ))}
                </FormGroup>
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Observações</Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Anote quaisquer observações"
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              placeholder="Observações adicionais sobre a assiduidade escolar..."
              disabled={isView}
            />
          </div>
          {!isView && (
            <div className={classes.buttonContainer}>
              <Button variant="contained" color="primary" type="submit" startIcon={<SaveIcon />}>Submeter Formulário</Button>
            </div>
          )}
        </form>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(EducationalModuleFormPage))));
