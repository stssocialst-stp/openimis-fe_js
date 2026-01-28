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
import { CLASSES_LIST, ESCOLAS_LIST } from "../constants/schoolClassLists";

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
  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('id');
  const isEdit = !!groupId;

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

  useEffect(() => {
    fetchDistricts();
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
      escola: formData.escola,
      escolaridadeActual: formData.escolaridade_actual,
      dataNascimento: formData.dataNascimento || null,
      idDaCrianca: formData.ID_da_crianca,
      sexo: formData.sexo === 'Masculino' ? 'M' : formData.sexo === 'Feminino' ? 'F' : null,
      dadosEscolarCorrectos: formData.dadosEscolaresCorrectos,
      escolaActual: formData.escolaActual,
      classe: formData.classe,
      idade: formData.idade ? parseInt(formData.idade) : null,
      dadosEscolaresCorrectos: formData.dadosEscolaresCorrectos,
      informacoesLocalizacao: JSON.stringify(formData.informacoesLocalizacao),
      classeQueFrequenta: formData.classeQueFrequenta,
      aproveitamentoPrimeiroTrimestre: formData.aproveitamentoPrimeiroTrimestre,
      faixaDeFaltas: formData.faixaDeFaltas,
      disciplinasBasicas: formData.disciplinasBasicas.join(", ") || null,
      disciplinasAvancadas: formData.disciplinasAvancadas.join(", ") || null,
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
  const classesList = CLASSES_LIST;
  const escolasList = ESCOLAS_LIST;
  const faltasList = ["1-3", "4-6", "7-10", "+10"];
  const aproveitamentoList = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "+10"];
  const disciplinasBasicas = [
    "Ciências Naturais", "Geografia", "História", "Língua Francesa", "Língua Inglesa", "Língua Portuguesa", "Matemática", "Física", "Educação Visual e Oficial", "Educação Ambiental", "Educação Física", "Química", "Educação p/ Saúde", "Expressões Motoras", "Expressões Musical", "Expressões Plástica"
  ];
  const disciplinasAvancadas = [
    "Ciências Naturais e Sociais", "Formação Cívica", "Filosofia", "Finanças/Migais", "Informática/TIC", "Biologia", "Geologia", "Empreendedorismo", "Alemão", "Espanhol", "Economia", "Geografia", "Direito", "Sociologia", "Psicologia", "Oficina de Artes", "Geometria Descritiva"
  ];

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
                <TextField label="ID do Membro/Criança" fullWidth value={formData.idMembro} onChange={handleChange("idMembro")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome" fullWidth value={formData.nome} onChange={handleChange("nome")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Encarregado de Educação" fullWidth value={formData.nomeEncarregado} onChange={handleChange("nomeEncarregado")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Escola</InputLabel>
                  <Select value={formData.escola} onChange={handleChange("escola")} label="Escola">
                    {escolasList.map((e) => (
                      <MenuItem key={e} value={e}>{e}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Escolaridade Atual</InputLabel>
                  <Select value={formData.escolaridade_actual} onChange={handleChange("escolaridade_actual")} label="Escolaridade Atual">
                    {classesList.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Data de Nascimento" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dataNascimento} onChange={handleChange("dataNascimento")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="ID da Criança" fullWidth value={formData.ID_da_crianca} onChange={handleChange("ID_da_crianca")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Sexo</InputLabel>
                  <Select value={formData.sexo} onChange={handleChange("sexo")}
                    label="Sexo">
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
                    label="Os dados escolares estão corretos?">
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Escola Atual" fullWidth value={formData.escolaActual} onChange={handleChange("escolaActual")} />
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A5-A9: Informações de Localização</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Região" fullWidth value={formData.informacoesLocalizacao.nomeDaRegiao} onChange={handleLocalizacaoChange("nomeDaRegiao")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Distrito</InputLabel>
                  <Select
                    value={formData.informacoesLocalizacao.distritoId}
                    onChange={handleLocalizacaoChange("distritoId")}
                    label="Distrito"
                  >
                    {districts.map((d) => (
                      <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Localidade" fullWidth value={formData.informacoesLocalizacao.Localidade} onChange={handleLocalizacaoChange("Localidade")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Escola" fullWidth value={formData.informacoesLocalizacao.nomeEscola} onChange={handleLocalizacaoChange("nomeEscola")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Ponto de Referência" fullWidth value={formData.informacoesLocalizacao.pontoReferencia} onChange={handleLocalizacaoChange("pontoReferencia")} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Meio Residência" fullWidth value={formData.informacoesLocalizacao.meioResidencia} onChange={handleLocalizacaoChange("meioResidencia")} />
              </Grid>
            </Grid>
          </div>
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Que classe frequenta?</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Classe</InputLabel>
                  <Select value={formData.classeQueFrequenta} onChange={handleChange("classeQueFrequenta")} label="Classe">
                    {classesList.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
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
                  <Select value={formData.aproveitamentoPrimeiroTrimestre} onChange={handleChange("aproveitamentoPrimeiroTrimestre")} label="Quantas faltas teve no 1º trimestre?">
                    {aproveitamentoList.map((f) => (
                      <MenuItem key={f} value={f}>{f}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Faixa de Faltas</InputLabel>
                  <Select value={formData.faixaDeFaltas} onChange={handleChange("faixaDeFaltas")} label="Faixa de Faltas">
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
                  {disciplinasBasicas.map((d) => (
                    <FormControlLabel
                      key={d}
                      control={<Checkbox color="primary" checked={formData.disciplinasBasicas.includes(d)} onChange={handleCheckboxChange("disciplinasBasicas", d)} />}
                      label={d}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Disciplinas Avançadas</Typography>
                <FormGroup>
                  {disciplinasAvancadas.map((d) => (
                    <FormControlLabel
                      key={d}
                      control={<Checkbox color="primary" checked={formData.disciplinasAvancadas.includes(d)} onChange={handleCheckboxChange("disciplinasAvancadas", d)} />}
                      label={d}
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
            />
          </div>
          <div className={classes.buttonContainer}>
            <Button variant="contained" color="primary" type="submit" startIcon={<SaveIcon />}>Submeter Formulário</Button>
          </div>
        </form>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(EducationalModuleFormPage))));
