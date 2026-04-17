import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider,
  Select, InputLabel, FormControl, FormControlLabel, Switch,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_ALUNO } from "../constants";
import { escolaridadeList, sexoList } from "../../helpers/constants";

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
});

function AlunoFormPage(props) {
  const { classes, intl, history, location } = props;
  const [loading, setLoading] = useState(false);
  const [useExistingIndividual, setUseExistingIndividual] = useState(false);
  const [formData, setFormData] = useState({
    // Individual fields (Opção B — criar automaticamente)
    firstName: "",
    lastName: "",
    dob: "",
    // Individual existente (Opção A)
    individualId: "",
    // Aluno fields
    sexo: "",
    nomeEncarregado: "",
    idMembroCrianca: "",
    idDaCrianca: "",
    distritoId: "",
    localidadeId: "",
    pontoReferencia: "",
    meioResidencia: "",
    escolaId: "",
    escolaActualId: "",
    escolaridadeActual: "",
    classeId: "",
    classeQueFrequentaId: "",
    dadosEscolaresCorrectos: true,
    ativo: true,
  });

  const [districts, setDistricts] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [escolasAPI, setEscolasAPI] = useState([]);
  const [classesAPI, setClassesAPI] = useState([]);

  const queryParams = new URLSearchParams(location.search);
  const alunoId = queryParams.get('id');
  const isView = !!alunoId && !queryParams.get('edit');
  const isEdit = !!alunoId && !!queryParams.get('edit');

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

  // Queries
  const districtQuery = `query GetDistritos($first: Int) {
    locations(first: $first, type: "D") {
      edges { node { id code name } }
    }
  }`;

  const localityQuery = `query GetLocalidades($first: Int) {
    locations(first: $first, type: "W") {
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

  const viewQuery = `query aluno($id: ID!) {
    aluno(id: $id) {
      id
      firstName
      lastName
      dob
      sexo
      nomeEncarregado
      idMembroCrianca
      idDaCrianca
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
      ativo
    }
  }`;

  const fetchDistricts = async () => {
    try {
      const result = await gqlFetch(districtQuery, { first: 100 });
      if (result.data?.locations?.edges) {
        setDistricts(result.data.locations.edges.map(e => ({ value: e.node.id, label: e.node.name, uuid: e.node.code })));
      }
    } catch (error) { setDistricts([]); }
  };

  const fetchLocalities = async () => {
    try {
      const result = await gqlFetch(localityQuery, { first: 100 });
      if (result.data?.locations?.edges) {
        setLocalities(result.data.locations.edges.map(e => ({ value: e.node.id, label: e.node.name })));
      }
    } catch (error) { setLocalities([]); }
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

  useEffect(() => {
    fetchDistricts();
    fetchLocalities();
    fetchEscolas();
    fetchClasses();

    if (alunoId) {
      (async () => {
        try {
          const result = await gqlFetch(viewQuery, { id: alunoId });
          const data = result.data?.aluno;
          if (data) {
            setFormData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              dob: data.dob || "",
              individualId: "",
              sexo: data.sexo || "",
              nomeEncarregado: data.nomeEncarregado || "",
              idMembroCrianca: data.idMembroCrianca || "",
              idDaCrianca: data.idDaCrianca || "",
              distritoId: data.distrito?.id || "",
              localidadeId: data.localidade?.id || "",
              pontoReferencia: data.pontoReferencia || "",
              meioResidencia: data.meioResidencia || "",
              escolaId: data.escola?.id || "",
              escolaActualId: data.escolaActual?.id || "",
              escolaridadeActual: data.escolaridadeActual || "",
              classeId: data.classe?.id || "",
              classeQueFrequentaId: data.classeQueFrequenta?.id || "",
              dadosEscolaresCorrectos: data.dadosEscolaresCorrectos ?? true,
              ativo: data.ativo ?? true,
            });
          }
        } catch (e) {
          console.error("Erro ao buscar aluno:", e);
        }
      })();
    }
    // eslint-disable-next-line
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Mutations
  const createMutation = `mutation createAluno($input: CreateAlunoMutationInput!) {
    createAluno(input: $input) {
      internalId
      clientMutationId
    }
  }`;

  const updateMutation = `mutation updateAluno($input: UpdateAlunoMutationInput!) {
    updateAluno(input: $input) {
      internalId
      clientMutationId
    }
  }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const input = {};

    if (!isEdit) {
      // Create: decide between Opção A (existing individual) or Opção B (new individual)
      if (useExistingIndividual && formData.individualId) {
        input.individualId = formData.individualId;
      } else {
        // Opção B — firstName, lastName, dob are required
        if (!formData.firstName || !formData.lastName || !formData.dob) {
          alert(formatMessage(intl, "prl", "aluno.requiredFieldsError") || "Nome, Apelido e Data de Nascimento são obrigatórios quando não se fornece um Individual existente.");
          setLoading(false);
          return;
        }
        input.individualId = null;
        input.firstName = formData.firstName;
        input.lastName = formData.lastName;
        input.dob = formData.dob;
      }
    }

    // All fields must be explicitly present (null, not absent) to avoid
    // backend .get("field", "") defaulting to empty string on UUID fields
    input.sexo = formData.sexo || null;
    input.nomeEncarregado = formData.nomeEncarregado || null;
    input.idMembroCrianca = formData.idMembroCrianca || null;
    input.distritoId = formData.distritoId || null;
    input.localidadeId = formData.localidadeId || null;
    input.pontoReferencia = formData.pontoReferencia || null;
    input.meioResidencia = formData.meioResidencia || null;
    input.escolaId = formData.escolaId || null;
    input.escolaActualId = formData.escolaActualId || null;
    input.escolaridadeActual = formData.escolaridadeActual || null;
    input.classeId = formData.classeId || null;
    input.classeQueFrequentaId = formData.classeQueFrequentaId || null;
    input.dadosEscolaresCorrectos = formData.dadosEscolaresCorrectos;
    input.ativo = formData.ativo;

    const mutation = isEdit ? updateMutation : createMutation;
    const variables = isEdit ? { input: { ...input, id: alunoId } } : { input };

    try {
      const result = await gqlFetch(mutation, variables);
      const mutationResult = result.data?.createAluno || result.data?.updateAluno;
      if (!mutationResult?.internalId) {
        const errorMsg = result.errors?.[0]?.message || "Erro ao salvar. Verifique os dados e tente novamente.";
        alert(errorMsg);
      } else {
        history.push(`/${PRL_ROUTE_ALUNO}`);
      }
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_ALUNO}`);
  };

  const pageTitle = isEdit
    ? "title.editAluno"
    : isView
      ? "title.viewAluno"
      : "title.createAluno";

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
          {/* Section: Individual / Identificação */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "aluno.sectionIdentification") || "Identificação do Aluno"}
            </Typography>

            {!isEdit && !isView && (
              <Grid container spacing={2} style={{ marginBottom: 16 }}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useExistingIndividual}
                        onChange={(e) => setUseExistingIndividual(e.target.checked)}
                        color="primary"
                      />
                    }
                    label={formatMessage(intl, "prl", "aluno.useExistingIndividual") || "Vincular a um Indivíduo existente no sistema"}
                  />
                </Grid>
              </Grid>
            )}

            {!isEdit && !isView && useExistingIndividual ? (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={formatMessage(intl, "prl", "aluno.individualId") || "ID do Indivíduo (Relay ID)"}
                    fullWidth
                    value={formData.individualId}
                    onChange={handleChange("individualId")}
                    required
                    helperText={formatMessage(intl, "prl", "aluno.individualIdHelper") || "Relay ID (base64) do Indivíduo já registado no openIMIS"}
                  />
                </Grid>
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={formatMessage(intl, "prl", "aluno.firstName") || "Nome"}
                    fullWidth
                    value={formData.firstName}
                    onChange={handleChange("firstName")}
                    disabled={isView || isEdit}
                    required={!isEdit && !isView}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={formatMessage(intl, "prl", "aluno.lastName") || "Apelido"}
                    fullWidth
                    value={formData.lastName}
                    onChange={handleChange("lastName")}
                    disabled={isView || isEdit}
                    required={!isEdit && !isView}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label={formatMessage(intl, "prl", "aluno.dob") || "Data de Nascimento"}
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.dob}
                    onChange={handleChange("dob")}
                    disabled={isView || isEdit}
                    required={!isEdit && !isView}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{formatMessage(intl, "prl", "aluno.sexo") || "Sexo"}</InputLabel>
                    <Select
                      value={formData.sexo}
                      onChange={handleChange("sexo")}
                      label="Sexo"
                      disabled={isView}
                    >
                      {sexoList.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            <Grid container spacing={2} style={{ marginTop: 8 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={formatMessage(intl, "prl", "aluno.idMembroCrianca") || "ID Membro/Criança"}
                  fullWidth
                  value={formData.idMembroCrianca}
                  onChange={handleChange("idMembroCrianca")}
                  disabled={isView}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={formatMessage(intl, "prl", "aluno.idDaCrianca") || "ID da Criança"}
                  fullWidth
                  value={formData.idDaCrianca}
                  disabled
                  helperText={!isEdit ? "ID gerado automaticamente ao criar o aluno" : "ID não pode ser alterado"}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={formatMessage(intl, "prl", "aluno.nomeEncarregado") || "Nome do Encarregado de Educação"}
                  fullWidth
                  value={formData.nomeEncarregado}
                  onChange={handleChange("nomeEncarregado")}
                  disabled={isView}
                />
              </Grid>
            </Grid>
          </div>

          {/* Section: Localização */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "aluno.sectionLocation") || "Informações de Localização"}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.distrito") || "Distrito"}</InputLabel>
                  <Select
                    value={formData.distritoId}
                    onChange={handleChange("distritoId")}
                    label="Distrito"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {districts.map((d) => (
                      <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.localidade") || "Localidade"}</InputLabel>
                  <Select
                    value={formData.localidadeId}
                    onChange={handleChange("localidadeId")}
                    label="Localidade"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {localities.map((l) => (
                      <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={formatMessage(intl, "prl", "aluno.pontoReferencia") || "Ponto de Referência"}
                  fullWidth
                  value={formData.pontoReferencia}
                  onChange={handleChange("pontoReferencia")}
                  disabled={isView}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label={formatMessage(intl, "prl", "aluno.meioResidencia") || "Meio de Residência"}
                  fullWidth
                  value={formData.meioResidencia}
                  onChange={handleChange("meioResidencia")}
                  disabled={isView}
                />
              </Grid>
            </Grid>
          </div>

          {/* Section: Dados Escolares */}
          <div className={classes.formSection}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "aluno.sectionSchool") || "Dados Escolares"}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.escola") || "Escola"}</InputLabel>
                  <Select
                    value={formData.escolaId}
                    onChange={handleChange("escolaId")}
                    label="Escola"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {escolasAPI.map((e) => (
                      <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.escolaActual") || "Escola Actual"}</InputLabel>
                  <Select
                    value={formData.escolaActualId}
                    onChange={handleChange("escolaActualId")}
                    label="Escola Actual"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {escolasAPI.map((e) => (
                      <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.escolaridadeActual") || "Escolaridade Actual"}</InputLabel>
                  <Select
                    value={formData.escolaridadeActual}
                    onChange={handleChange("escolaridadeActual")}
                    label="Escolaridade Actual"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {escolaridadeList.map((e) => (
                      <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.classe") || "Classe"}</InputLabel>
                  <Select
                    value={formData.classeId}
                    onChange={handleChange("classeId")}
                    label="Classe"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {classesAPI.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.classeQueFrequenta") || "Classe que Frequenta"}</InputLabel>
                  <Select
                    value={formData.classeQueFrequentaId}
                    onChange={handleChange("classeQueFrequentaId")}
                    label="Classe que Frequenta"
                    disabled={isView}
                  >
                    <MenuItem value="">—</MenuItem>
                    {classesAPI.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>{formatMessage(intl, "prl", "aluno.dadosEscolaresCorrectos") || "Dados Escolares Correctos?"}</InputLabel>
                  <Select
                    value={formData.dadosEscolaresCorrectos}
                    onChange={handleChange("dadosEscolaresCorrectos")}
                    label="Dados Escolares Correctos?"
                    disabled={isView}
                  >
                    <MenuItem value={true}>Sim</MenuItem>
                    <MenuItem value={false}>Não</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(AlunoFormPage))));
