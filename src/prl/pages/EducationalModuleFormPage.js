import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider,
  Checkbox, FormControlLabel, FormGroup, Select, InputLabel, FormControl,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_EDUCATIONAL_MODULE } from "../constants";
import { aproveitamentoList, escolaridadeList, faltasList, sexoList } from "../../helpers/constants";

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
  divider: {
    margin: theme.spacing(2, 0),
  },
  autoFilledField: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
});

/** Decode a Relay global ID (base64 "Type:pk") into the raw numeric PK string. */
const decodeId = (globalId) => {
  if (!globalId) return null;
  try {
    const decoded = atob(globalId);
    const parts = decoded.split(':');
    return parts.length === 2 ? parts[1] : globalId;
  } catch {
    return globalId; // already a plain id
  }
};

function EducationalModuleFormPage(props) {
  const { classes, intl, history, location } = props;
  const [loading, setLoading] = useState(false);

  // --- Aluno list state ---
  const [alunosAPI, setAlunosAPI] = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);

  const [formData, setFormData] = useState({
    alunoId: "",
    // Identification (auto-filled from Aluno when selected)
    idMembro: "",
    nome: "",
    nomeEncarregado: "",
    escola: "",
    escolaridade_actual: "",
    dataNascimento: "",
    ID_da_crianca: "",
    sexo: "",
    dadosEscolaresCorrectos: true,
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
    ano: new Date().getFullYear(),
  });

  const [districts, setDistricts] = useState([]);
  const [escolasAPI, setEscolasAPI] = useState([]);
  const [classesAPI, setClassesAPI] = useState([]);
  const [disciplinasBasicasAPI, setDisciplinasBasicasAPI] = useState([]);
  const [disciplinasAvancadasAPI, setDisciplinasAvancadasAPI] = useState([]);

  const queryParams = new URLSearchParams(location.search);
  const groupId = queryParams.get('id');
  const isView = !!groupId && !queryParams.get('edit');
  const isEdit = !!groupId && !!queryParams.get('edit');

  // --- Helper: CSRF + gqlFetch ---
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

  const gqlFetch = async (query, variables = {}) => {
    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query, variables }),
    });
    return response.json();
  };

  // --- GraphQL queries ---
  const alunosListQuery = `query ListAlunos($first: Int) {
    alunos(first: $first) {
      edges {
        node {
          id
          firstName
          lastName
          dob
          sexo
          idDaCrianca
          idMembroCrianca
          nomeEncarregado
          distrito { id name }
          localidade { id name }
          pontoReferencia
          meioResidencia
          escola { id nome }
          escolaActual { id nome }
          escolaridadeActual
          classe { id nome }
          classeQueFrequenta { id nome }
          dadosEscolaresCorrectos
        }
      }
    }
  }`;

  const viewQuery = `query moduloEducacional($id: ID!) {
    moduloEducacional(id: $id) {
      id
      uuid
      aluno {
        id
        firstName
        lastName
        dob
        sexo
        idDaCrianca
        idMembroCrianca
        nomeEncarregado
        distrito { id name }
        localidade { id name }
        pontoReferencia
        meioResidencia
        escola { id nome }
        escolaActual { id nome }
        escolaridadeActual
        classe { id nome }
        classeQueFrequenta { id nome }
        dadosEscolaresCorrectos
      }
      idMembroCrianca
      nome
      nomeEncarregado
      escola { id nome }
      escolaridadeActual
      dataNascimento
      idDaCrianca
      sexo
      dadosEscolarCorrectos
      escolaActual { id nome }
      classe { id codigo nome }
      idade
      dadosEscolaresCorrectos
      informacoesLocalizacao
      classeQueFrequenta { id codigo nome }
      aproveitamentoPrimeiroTrimestre
      faixaDeFaltas
      disciplinas {
        disciplina { id nome nivel }
        tipo
      }
      observacoes
      anoRegisto
    }
  }`;

  const districtQuery = `query GetDistritos($first: Int) {
    locations(first: $first, type: "D") {
      edges { node { id code name } }
    }
  }`;

  const escolasQuery = `query GetEscolas {
    escolas(ativo: true, orderBy: ["nome"]) {
      edges { node { id nome nivel } }
    }
  }`;

  const classesQuery = `query GetClasses {
    classes(ativo: true, orderBy: ["ordem"]) {
      edges { node { id codigo nome nivel ordem } }
    }
  }`;

  const disciplinasQuery = `query GetDisciplinas($nivel: DisciplinaNivel) {
    disciplinas(nivel: $nivel, ativo: true, orderBy: ["nome"]) {
      edges { node { id nome nivel quantidadeFaltasAceitaveis faixaFaltasAceitaveis } }
    }
  }`;

  // --- Fetch helpers ---
  const fetchDistricts = async () => {
    try {
      const result = await gqlFetch(districtQuery, { first: 100 });
      if (result.data?.locations?.edges) {
        setDistricts(result.data.locations.edges.map(edge => ({ value: edge.node.id, label: edge.node.name })));
      }
    } catch (error) { setDistricts([]); }
  };

  const fetchEscolas = async () => {
    try {
      const result = await gqlFetch(escolasQuery);
      if (result.data?.escolas?.edges) {
        setEscolasAPI(result.data.escolas.edges.map(e => ({ id: e.node.id, nome: e.node.nome, nivel: e.node.nivel })));
      }
    } catch (error) { setEscolasAPI([]); }
  };

  const fetchClasses = async () => {
    try {
      const result = await gqlFetch(classesQuery);
      if (result.data?.classes?.edges) {
        setClassesAPI(result.data.classes.edges.map(c => ({ id: c.node.id, codigo: c.node.codigo, nome: c.node.nome, nivel: c.node.nivel })));
      }
    } catch (error) { setClassesAPI([]); }
  };

  const fetchDisciplinas = async () => {
    try {
      const [resBasicas, resAvancadas] = await Promise.all([
        gqlFetch(disciplinasQuery, { nivel: 'BASICA' }),
        gqlFetch(disciplinasQuery, { nivel: 'AVANCADA' }),
      ]);
      if (resBasicas.data?.disciplinas?.edges) {
        setDisciplinasBasicasAPI(resBasicas.data.disciplinas.edges.map(d => ({
          id: d.node.id, nome: d.node.nome,
          quantidadeFaltasAceitaveis: d.node.quantidadeFaltasAceitaveis || 0,
          faixaFaltasAceitaveis: d.node.faixaFaltasAceitaveis || '',
        })));
      }
      if (resAvancadas.data?.disciplinas?.edges) {
        setDisciplinasAvancadasAPI(resAvancadas.data.disciplinas.edges.map(d => ({
          id: d.node.id, nome: d.node.nome,
          quantidadeFaltasAceitaveis: d.node.quantidadeFaltasAceitaveis || 0,
          faixaFaltasAceitaveis: d.node.faixaFaltasAceitaveis || '',
        })));
      }
    } catch (error) { console.error('Error fetching disciplinas:', error); }
  };

  // --- Fetch all alunos ---
  const fetchAlunos = async () => {
    try {
      const result = await gqlFetch(alunosListQuery, { first: 100 });
      if (result.data?.alunos?.edges) {
        setAlunosAPI(result.data.alunos.edges.map(e => e.node));
      }
    } catch (error) { setAlunosAPI([]); }
  };

  // --- Calculate age from date ---
  const calcAge = (dob) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? age : "";
  };

  // --- When an Aluno is selected, auto-fill as many fields as possible ---
  const handleAlunoSelect = (event) => {
    const alunoId = event.target.value;
    const aluno = alunosAPI.find(a => a.id === alunoId) || null;
    setSelectedAluno(aluno);
    if (!aluno) {
      setFormData(prev => ({ ...prev, alunoId: "" }));
      return;
    }
    setFormData(prev => ({
      ...prev,
      alunoId: aluno.id,
      idMembro: aluno.idMembroCrianca || prev.idMembro,
      nome: `${aluno.firstName || ""} ${aluno.lastName || ""}`.trim() || prev.nome,
      nomeEncarregado: aluno.nomeEncarregado || prev.nomeEncarregado,
      dataNascimento: aluno.dob || prev.dataNascimento,
      ID_da_crianca: aluno.idDaCrianca || prev.ID_da_crianca,
      sexo: aluno.sexo || prev.sexo,
      escola: aluno.escola?.id || prev.escola,
      escolaActual: aluno.escolaActual?.id || prev.escolaActual,
      escolaridade_actual: aluno.escolaridadeActual || prev.escolaridade_actual,
      classe: aluno.classe?.id || prev.classe,
      classeQueFrequenta: aluno.classeQueFrequenta?.id || prev.classeQueFrequenta,
      dadosEscolaresCorrectos: aluno.dadosEscolaresCorrectos ?? prev.dadosEscolaresCorrectos,
      idade: calcAge(aluno.dob) || prev.idade,
      informacoesLocalizacao: {
        ...prev.informacoesLocalizacao,
        distritoId: aluno.distrito?.id || prev.informacoesLocalizacao.distritoId,
        Localidade: aluno.localidade?.name || prev.informacoesLocalizacao.Localidade,
        pontoReferencia: aluno.pontoReferencia || prev.informacoesLocalizacao.pontoReferencia,
        meioResidencia: aluno.meioResidencia || prev.informacoesLocalizacao.meioResidencia,
      },
    }));
  };

  // --- Load initial data ---
  useEffect(() => {
    fetchAlunos();
    fetchDistricts();
    fetchEscolas();
    fetchClasses();
    fetchDisciplinas();

    if (groupId) {
      (async () => {
        try {
          const result = await gqlFetch(viewQuery, { id: groupId });
          const data = result.data?.moduloEducacional;
          if (data) {
            // If there is an aluno link, set selectedAluno for display
            if (data.aluno) {
              setSelectedAluno(data.aluno);
              setAlunosAPI([data.aluno]);
            }

            // Disciplinas from plain list
            const discNodes = data.disciplinas || [];

            setFormData({
              alunoId: data.aluno?.id || "",
              idMembro: data.idMembroCrianca || "",
              nome: data.nome || "",
              nomeEncarregado: data.nomeEncarregado || "",
              escola: data.escola?.id || "",
              escolaridade_actual: data.escolaridadeActual || "",
              dataNascimento: data.dataNascimento || "",
              ID_da_crianca: data.idDaCrianca || "",
              sexo: data.sexo || "",
              dadosEscolaresCorrectos: data.dadosEscolaresCorrectos ?? data.dadosEscolarCorrectos ?? true,
              escolaActual: data.escolaActual?.id || "",
              classe: data.classe?.id || "",
              idade: data.idade || "",
              informacoesLocalizacao: (() => {
                try {
                  return data.informacoesLocalizacao ? JSON.parse(data.informacoesLocalizacao) : {
                    nomeDaRegiao: "", distritoId: "", Localidade: "", nomeEscola: "", pontoReferencia: "", meioResidencia: "",
                  };
                } catch {
                  return { nomeDaRegiao: "", distritoId: "", Localidade: "", nomeEscola: "", pontoReferencia: "", meioResidencia: "" };
                }
              })(),
              classeQueFrequenta: data.classeQueFrequenta?.id || "",
              aproveitamentoPrimeiroTrimestre: data.aproveitamentoPrimeiroTrimestre || "",
              faixaDeFaltas: data.faixaDeFaltas || "",
              disciplinasBasicas: discNodes
                .filter(d => d.disciplina?.nivel === 'BASICA')
                .map(d => ({ disciplinaId: d.disciplina.id, faltas: 0, faixaDeFaltas: '' })),
              disciplinasAvancadas: discNodes
                .filter(d => d.disciplina?.nivel === 'AVANCADA')
                .map(d => ({ disciplinaId: d.disciplina.id, faltas: 0, faixaDeFaltas: '' })),
              observacoes: data.observacoes || "",
              ano: data.anoRegisto || new Date().getFullYear(),
            });
          }
        } catch (e) {
          console.error("Erro ao buscar modulo:", e);
        }
      })();
    }
    // eslint-disable-next-line
  }, []);

  // --- Handlers ---
  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleLocalizacaoChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      informacoesLocalizacao: { ...prev.informacoesLocalizacao, [field]: event.target.value },
    }));
  };

  const handleDisciplinaToggle = (field, disciplinaId) => (event) => {
    setFormData((prev) => {
      const arr = prev[field] || [];
      if (event.target.checked) {
        return { ...prev, [field]: [...arr, { disciplinaId, faltas: 0, faixaDeFaltas: '' }] };
      } else {
        return { ...prev, [field]: arr.filter((d) => d.disciplinaId !== disciplinaId) };
      }
    });
  };

  const handleDisciplinaFaltasChange = (field, disciplinaId, subField) => (event) => {
    const value = subField === 'faltas' ? parseInt(event.target.value) || 0 : event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] || []).map(d =>
        d.disciplinaId === disciplinaId ? { ...d, [subField]: value } : d
      ),
    }));
  };

  // --- Mutations ---
  const createMutation = `mutation createModuloEducacional($input: CreateModuloEducacionalMutationInput!) {
    createModuloEducacional(input: $input) { internalId clientMutationId }
  }`;
  const updateMutation = `mutation updateModuloEducacional($input: UpdateModuloEducacionalMutationInput!) {
    updateModuloEducacional(input: $input) { internalId clientMutationId }
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const input = {
      alunoId: decodeId(formData.alunoId) || null,
      idMembroCrianca: formData.idMembro || null,
      nome: formData.nome || null,
      nomeEncarregado: formData.nomeEncarregado || null,
      escolaId: decodeId(formData.escola) || null,
      escolaridadeActual: formData.escolaridade_actual || null,
      dataNascimento: formData.dataNascimento || null,
      idDaCrianca: formData.ID_da_crianca || null,
      sexo: formData.sexo || null,
      dadosEscolaresCorrectos: formData.dadosEscolaresCorrectos ?? true,
      escolaActualId: decodeId(formData.escolaActual) || null,
      classeId: decodeId(formData.classe) || null,
      idade: formData.idade ? parseInt(formData.idade) : null,
      informacoesLocalizacao: JSON.stringify({
        ...formData.informacoesLocalizacao,
        distritoId: decodeId(formData.informacoesLocalizacao.distritoId) || "",
      }),
      classeQueFrequentaId: decodeId(formData.classeQueFrequenta) || null,
      aproveitamentoPrimeiroTrimestre: formData.aproveitamentoPrimeiroTrimestre || null,
      faixaDeFaltas: formData.faixaDeFaltas || null,
      disciplinasIds: [
        ...formData.disciplinasBasicas.map(d => decodeId(d.disciplinaId)),
        ...formData.disciplinasAvancadas.map(d => decodeId(d.disciplinaId)),
      ],
      observacoes: formData.observacoes || null,
      anoRegisto: parseInt(formData.ano) || new Date().getFullYear(),
    };

    const mutation = isEdit ? updateMutation : createMutation;
    const variables = isEdit ? { input: { ...input, id: groupId } } : { input };

    try {
      const result = await gqlFetch(mutation, variables);
      const mutationResult = result.data?.createModuloEducacional || result.data?.updateModuloEducacional;
      if (!mutationResult?.internalId) {
        const errorMsg = result.errors?.[0]?.message || "Erro ao salvar. Verifique os dados e tente novamente.";
        alert(errorMsg);
      } else {
        history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE}`);
      }
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE}`);
  };

  const pageTitle = isEdit
    ? "title.editSchoolAttendance"
    : isView
      ? "title.viewSchoolAttendance"
      : "title.createSchoolAttendance";

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
          {/* Section 0: Select Aluno */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "educationalModule.selectAluno") || "Seleccionar Aluno"}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel>{formatMessage(intl, "prl", "educationalModule.searchAluno") || "Seleccionar Aluno"}</InputLabel>
                  <Select
                    value={formData.alunoId}
                    onChange={handleAlunoSelect}
                    label={formatMessage(intl, "prl", "educationalModule.searchAluno") || "Seleccionar Aluno"}
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {alunosAPI.map((a) => {
                      const name = `${a.firstName || ""} ${a.lastName || ""}`.trim();
                      const childId = a.idDaCrianca ? ` (${a.idDaCrianca})` : "";
                      return <MenuItem key={a.id} value={a.id}>{name}{childId}</MenuItem>;
                    })}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label={formatMessage(intl, "prl", "educationalModule.ano") || "Ano do Registo"}
                  type="number"
                  fullWidth
                  variant="outlined"
                  size="small"
                  value={formData.ano}
                  onChange={handleChange("ano")}
                  disabled={isView}
                  inputProps={{ min: 2000, max: new Date().getFullYear() + 5 }}
                />
              </Grid>
            </Grid>
          </div>

          {/* Section A1: Identification */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A1: Identificação do Aluno</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="ID do Membro/Criança" fullWidth value={formData.idMembro} onChange={handleChange("idMembro")}
                  disabled className={selectedAluno ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome" fullWidth value={formData.nome} onChange={handleChange("nome")}
                  disabled className={selectedAluno ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Encarregado de Educação" fullWidth value={formData.nomeEncarregado} onChange={handleChange("nomeEncarregado")}
                  disabled className={selectedAluno?.nomeEncarregado ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.escola ? classes.autoFilledField : ""}>
                  <InputLabel>Escola</InputLabel>
                  <Select value={formData.escola} onChange={handleChange("escola")} label="Escola" disabled>
                    <MenuItem value="">—</MenuItem>
                    {escolasAPI.map((e) => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.escolaridadeActual ? classes.autoFilledField : ""}>
                  <InputLabel>Escolaridade Actual</InputLabel>
                  <Select value={formData.escolaridade_actual} onChange={handleChange("escolaridade_actual")} label="Escolaridade Actual" disabled>
                    <MenuItem value="">—</MenuItem>
                    {escolaridadeList.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Data de Nascimento" type="date" fullWidth InputLabelProps={{ shrink: true }}
                  value={formData.dataNascimento} onChange={handleChange("dataNascimento")}
                  disabled className={selectedAluno?.dob ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="ID da Criança" fullWidth value={formData.ID_da_crianca} onChange={handleChange("ID_da_crianca")}
                  disabled className={selectedAluno?.idDaCrianca ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.sexo ? classes.autoFilledField : ""}>
                  <InputLabel>Sexo</InputLabel>
                  <Select value={formData.sexo} onChange={handleChange("sexo")} label="Sexo" disabled>
                    <MenuItem value="">—</MenuItem>
                    {sexoList.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Idade" type="number" fullWidth value={formData.idade} onChange={handleChange("idade")}
                  disabled className={selectedAluno?.dob ? classes.autoFilledField : ""} />
              </Grid>
            </Grid>
          </div>

          {/* Section A2: School Data Verification */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A2: Verificação de Dados Escolares</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <FormControl fullWidth disabled className={selectedAluno?.escolaActual ? classes.autoFilledField : ""}>
                  <InputLabel>Escola Actual</InputLabel>
                  <Select value={formData.escolaActual} onChange={handleChange("escolaActual")} label="Escola Actual" disabled>
                    <MenuItem value="">—</MenuItem>
                    {escolasAPI.map((e) => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {/* <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Dados Escolares Correctos?</InputLabel>
                  <Select value={formData.dadosEscolaresCorrectos} onChange={handleChange("dadosEscolaresCorrectos")} label="Dados Escolares Correctos?" disabled>
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid> */}
            </Grid>
          </div>

          {/* Section A5-A9: Location */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A5-A9: Informações de Localização</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Região" fullWidth value={formData.informacoesLocalizacao.nomeDaRegiao} onChange={handleLocalizacaoChange("nomeDaRegiao")} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.distrito ? classes.autoFilledField : ""}>
                  <InputLabel>Distrito</InputLabel>
                  <Select value={formData.informacoesLocalizacao.distritoId} onChange={handleLocalizacaoChange("distritoId")} label="Distrito" disabled>
                    <MenuItem value="">—</MenuItem>
                    {districts.map((d) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Localidade" fullWidth value={formData.informacoesLocalizacao.Localidade} onChange={handleLocalizacaoChange("Localidade")}
                  disabled className={selectedAluno?.localidade ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Nome da Escola" fullWidth value={formData.informacoesLocalizacao.nomeEscola} onChange={handleLocalizacaoChange("nomeEscola")} disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Ponto de Referência" fullWidth value={formData.informacoesLocalizacao.pontoReferencia} onChange={handleLocalizacaoChange("pontoReferencia")}
                  disabled className={selectedAluno?.pontoReferencia ? classes.autoFilledField : ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Meio Residência" fullWidth value={formData.informacoesLocalizacao.meioResidencia} onChange={handleLocalizacaoChange("meioResidencia")}
                  disabled className={selectedAluno?.meioResidencia ? classes.autoFilledField : ""} />
              </Grid>
            </Grid>
          </div>

          {/* Section: Classe e Ano */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Que classe frequenta?</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.classeQueFrequenta ? classes.autoFilledField : ""}>
                  <InputLabel>Classe que Frequenta</InputLabel>
                  <Select value={formData.classeQueFrequenta} onChange={handleChange("classeQueFrequenta")} label="Classe que Frequenta" disabled>
                    <MenuItem value="">—</MenuItem>
                    {classesAPI.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled className={selectedAluno?.classe ? classes.autoFilledField : ""}>
                  <InputLabel>Classe</InputLabel>
                  <Select value={formData.classe} onChange={handleChange("classe")} label="Classe" disabled>
                    <MenuItem value="">—</MenuItem>
                    {classesAPI.map((c) => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>

          {/* Section A4: Absences */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>A4: Faltas no Primeiro Trimestre</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Quantas faltas teve no 1º trimestre?</InputLabel>
                  <Select value={formData.aproveitamentoPrimeiroTrimestre} onChange={handleChange("aproveitamentoPrimeiroTrimestre")} label="Quantas faltas teve no 1º trimestre?" disabled={isView}>
                    <MenuItem value="">—</MenuItem>
                    {aproveitamentoList.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Faixa de Faltas</InputLabel>
                  <Select value={formData.faixaDeFaltas} onChange={handleChange("faixaDeFaltas")} label="Faixa de Faltas" disabled={isView}>
                    <MenuItem value="">—</MenuItem>
                    {faltasList.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </div>

          {/* Disciplinas */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Disciplinas</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Disciplinas Básicas</Typography>
                <FormGroup>
                  {disciplinasBasicasAPI.map((d) => {
                    const sel = (formData.disciplinasBasicas || []).find(x => x.disciplinaId === d.id);
                    const checked = !!sel;
                    const maxFaltas = d.quantidadeFaltasAceitaveis || 10;
                    return (
                      <div key={d.id} style={{ marginBottom: 8 }}>
                        <FormControlLabel
                          control={<Checkbox color="primary" checked={checked} onChange={handleDisciplinaToggle("disciplinasBasicas", d.id)} disabled={isView} />}
                          label={`${d.nome} (máx. ${maxFaltas} faltas)`}
                        />
                        {checked && (
                          <Grid container spacing={1} style={{ paddingLeft: 32 }}>
                            <Grid item xs={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Nº Faltas</InputLabel>
                                <Select value={sel.faltas || 0} onChange={handleDisciplinaFaltasChange("disciplinasBasicas", d.id, "faltas")} label="Nº Faltas" disabled={isView}>
                                  {Array.from({ length: maxFaltas + 1 }, (_, i) => i).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Faixa</InputLabel>
                                <Select value={sel.faixaDeFaltas || ''} onChange={handleDisciplinaFaltasChange("disciplinasBasicas", d.id, "faixaDeFaltas")} label="Faixa" disabled={isView}>
                                  <MenuItem value="">-</MenuItem>
                                  {faltasList.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        )}
                      </div>
                    );
                  })}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1">Disciplinas Avançadas</Typography>
                <FormGroup>
                  {disciplinasAvancadasAPI.map((d) => {
                    const sel = (formData.disciplinasAvancadas || []).find(x => x.disciplinaId === d.id);
                    const checked = !!sel;
                    const maxFaltas = d.quantidadeFaltasAceitaveis || 10;
                    return (
                      <div key={d.id} style={{ marginBottom: 8 }}>
                        <FormControlLabel
                          control={<Checkbox color="primary" checked={checked} onChange={handleDisciplinaToggle("disciplinasAvancadas", d.id)} disabled={isView} />}
                          label={`${d.nome} (máx. ${maxFaltas} faltas)`}
                        />
                        {checked && (
                          <Grid container spacing={1} style={{ paddingLeft: 32 }}>
                            <Grid item xs={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Nº Faltas</InputLabel>
                                <Select value={sel.faltas || 0} onChange={handleDisciplinaFaltasChange("disciplinasAvancadas", d.id, "faltas")} label="Nº Faltas" disabled={isView}>
                                  {Array.from({ length: maxFaltas + 1 }, (_, i) => i).map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Faixa</InputLabel>
                                <Select value={sel.faixaDeFaltas || ''} onChange={handleDisciplinaFaltasChange("disciplinasAvancadas", d.id, "faixaDeFaltas")} label="Faixa" disabled={isView}>
                                  <MenuItem value="">-</MenuItem>
                                  {faltasList.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        )}
                      </div>
                    );
                  })}
                </FormGroup>
              </Grid>
            </Grid>
          </div>

          {/* Observações */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>Observações</Typography>
            <TextField
              fullWidth multiline rows={3}
              label="Anote quaisquer observações"
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              placeholder="Observações adicionais sobre a assiduidade escolar..."
              disabled={isView}
            />
          </div>

          {/* Submit */}
          {!isView && (
            <div className={classes.buttonContainer}>
              <Button variant="outlined" onClick={handleBack} disabled={loading}>
                {formatMessage(intl, "prl", "button.cancel") || "Cancelar"}
              </Button>
              <Button variant="contained" color="primary" type="submit" startIcon={<SaveIcon />} disabled={loading}>
                {loading
                  ? (formatMessage(intl, "prl", "aluno.saving") || "A guardar...")
                  : (formatMessage(intl, "prl", "button.save") || "Guardar")
                }
              </Button>
            </div>
          )}
        </form>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(EducationalModuleFormPage))));