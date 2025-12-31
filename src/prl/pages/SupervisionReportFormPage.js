import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Grid, TextField, Button, Card, CardContent, CardHeader, IconButton, Tooltip, Table, TableBody, TableCell, TableHead, TableRow, Paper, Divider, Typography, FormControl, InputLabel, Select, MenuItem,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import SaveIcon from "@material-ui/icons/Save";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_SUPERVISION_REPORT } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  paper: { ...theme.paper.paper, margin: theme.spacing(2), padding: theme.spacing(2) },
  card: { ...theme.paper.paper, margin: theme.spacing(2), marginTop: theme.spacing(1) },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    fontWeight: "bold",
  },
  section: { marginBottom: theme.spacing(2), padding: 0 },
  button: { margin: theme.spacing(1) },
  table: { marginTop: theme.spacing(2) },
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
  headerPaper: {
    ...theme.paper.paper,
    margin: theme.spacing(2),
    padding: theme.spacing(1, 2),
    display: "flex",
    alignItems: "center",
  },
});

function SupervisionReportFormPage(props) {
  const { classes, intl, history, location } = props;
  const isView = location.state?.isView || false;
  const initialData = location.state?.data || {};
  const [districts, setDistricts] = useState([]);
  const [modules, setModules] = useState([]);

  const modulesQuery = `query GetModulosEducacionais($first: Int) {
    modulosEducacionais(
      first: $first
      ativo: true
      orderBy: ["ordem"]
    ) {
      edges {
        node {
          id
          codigo
          nome
          descricao
          ordem
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

  const [formData, setFormData] = useState({
    nomeSupervisores: initialData.nomeSupervisores || "",
    numSessoesSupervisionadas: initialData.numSessoesSupervisionadas || "",
    numTecnicosSupervisionados: initialData.numTecnicosSupervisionados || "",
    distritoId: initialData.distritoId || "",
    periodo: initialData.periodo || "",
    ano: initialData.ano || new Date().getFullYear(),
    periodoInicio: initialData.periodoInicio || "",
    periodoFim: initialData.periodoFim || "",
    moduloMaiorDificuldadeId: initialData.moduloMaiorDificuldadeId || "",
    observacoesAdicionais: initialData.observacoesAdicionais || "",
    passo_a: "",
    passo_b: "",
    passo_c: "",
    passo_d: "",
    passo_e: "",
    passo_f: "",
    passo_g: "",
    passo_h: "",
    passo_i: "",
    passo_j: "",
  });

  const [tecnicosList, setTecnicosList] = useState([]);
  const [newTecnico, setNewTecnico] = useState({
    nome_tecnico: "",
    pontos_positivos: "",
    pontos_aprimorar: "",
  });

  useEffect(() => {
    // Fetch districts and modules
    const fetchDistricts = async () => {
      try {
        const response = await fetch(`${baseApiUrl}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
            ...apiHeaders(),
          },
          body: JSON.stringify({ query: districtQuery, variables: { first: 100 } }),
        });
        const result = await response.json();
        if (result.data?.locations?.edges) {
          setDistricts(result.data.locations.edges.map((edge) => edge.node));
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };

    const fetchModules = async () => {
      try {
        const response = await fetch(`${baseApiUrl}/graphql`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken"),
            ...apiHeaders(),
          },
          body: JSON.stringify({ query: modulesQuery, variables: { first: 100 } }),
        });
        const result = await response.json();
        if (result.data?.modulosEducacionais?.edges) {
          setModules(result.data.modulosEducacionais.edges.map((edge) => edge.node));
        }
      } catch (error) {
        console.error("Error fetching modules:", error);
      }
    };

    fetchDistricts();
    fetchModules();
  }, []); // Empty dependency array to prevent infinite calls

  useEffect(() => {
    if (initialData.notasSessoesPep) {
      try {
        const notasObj = JSON.parse(initialData.notasSessoesPep);
        setFormData((prev) => ({
          ...prev,
          ...notasObj,
        }));
      } catch (e) {
        console.error("Error parsing notas:", e);
      }
    }

    if (initialData.avaliacoesTecnicos) {
      try {
        const avaliacoes = JSON.parse(initialData.avaliacoesTecnicos);
        setTecnicosList(avaliacoes);
      } catch (e) {
        console.error("Error parsing avaliacoes:", e);
      }
    }
  }, [initialData]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTecnico = () => {
    if (newTecnico.nome_tecnico.trim()) {
      setTecnicosList((prev) => [...prev, { ...newTecnico }]);
      setNewTecnico({
        nome_tecnico: "",
        pontos_positivos: "",
        pontos_aprimorar: "",
      });
    }
  };

  const handleRemoveTecnico = (index) => {
    setTecnicosList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_SUPERVISION_REPORT}`);
  };

  const handleSave = async () => {
    const requiredFields = [
      "nomeSupervisores",
      "numSessoesSupervisionadas",
      "numTecnicosSupervisionados",
      "distritoId",
      "periodo",
      "ano",
      "periodoInicio",
      "periodoFim",
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Por favor preencha o campo: ${field}`);
        return;
      }
    }

    const notasSessoesPep = {
      passo_a: parseFloat(formData.passo_a) || 0,
      passo_b: parseFloat(formData.passo_b) || 0,
      passo_c: parseFloat(formData.passo_c) || 0,
      passo_d: parseFloat(formData.passo_d) || 0,
      passo_e: parseFloat(formData.passo_e) || 0,
      passo_f: parseFloat(formData.passo_f) || 0,
      passo_g: parseFloat(formData.passo_g) || 0,
      passo_h: parseFloat(formData.passo_h) || 0,
      passo_i: parseFloat(formData.passo_i) || 0,
      passo_j: parseFloat(formData.passo_j) || 0,
    };

    // Build mutation with proper field inclusion
    let mutationInput = `
      nomeSupervisores: "${formData.nomeSupervisores}"
      numSessoesSupervisionadas: ${parseInt(formData.numSessoesSupervisionadas, 10)}
      numTecnicosSupervisionados: ${parseInt(formData.numTecnicosSupervisionados, 10)}
      periodo: ${parseInt(formData.periodo, 10)}
      ano: ${parseInt(formData.ano, 10)}
      periodoInicio: "${formData.periodoInicio}"
      periodoFim: "${formData.periodoFim}"
      avaliacoesTecnicos: "${JSON.stringify(tecnicosList).replace(/"/g, '\\"')}"
      notasSessoesPep: "${JSON.stringify(notasSessoesPep).replace(/"/g, '\\"')}"
      observacoesAdicionais: "${formData.observacoesAdicionais}"
    `;

    if (formData.moduloMaiorDificuldadeId) {
      mutationInput += `\n      moduloMaiorDificuldadeId: "${formData.moduloMaiorDificuldadeId}"`;
    }

    if (formData.distritoId) {
      mutationInput += `\n      distritoId: "${formData.distritoId}"`;
    }

    const mutation = initialData.id
      ? `
        mutation {
          updateRelatorioSupervisao(
            input: {
              id: ${initialData.id}
              ${mutationInput}
            }
          ) {
            internalId
            clientMutationId
          }
        }
      `
      : `
        mutation {
          createRelatorioSupervisao(
            input: {
              ${mutationInput}
            }
          ) {
            internalId
            clientMutationId
          }
        }
      `;

    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await response.json();
      if (result.errors) {
        console.error("Error saving report:", result.errors);
        alert("Erro ao salvar relatório");
      } else {
        history.push("/prl/supervisionReport");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao salvar relatório");
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.supervisionReport")} />

      <Paper className={classes.headerPaper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
        </Button>
        <Typography className={classes.headerTitle}>
          {formatMessage(intl, "prl", "title.supervisionReport")}
        </Typography>
      </Paper>

      <Card style={{
        padding: "0 16px",
      }} className={classes.card}>
        <CardHeader title={formatMessage(intl, "prl", "supervisionReport.basicInfo")} />
        <CardContent className={classes.section}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.supervisor")}
                name="nomeSupervisores"
                value={formData.nomeSupervisores}
                onChange={handleChange}
                fullWidth
                required
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.period")}
                name="periodo"
                type="number"
                inputProps={{ min: 1, max: 6 }}
                value={formData.periodo}
                onChange={handleChange}
                fullWidth
                required
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.year")}
                name="ano"
                type="number"
                value={formData.ano}
                onChange={handleChange}
                fullWidth
                required
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.startDate")}
                name="periodoInicio"
                type="date"
                value={formData.periodoInicio}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.endDate")}
                name="periodoFim"
                type="date"
                value={formData.periodoFim}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.sessions")}
                name="numSessoesSupervisionadas"
                type="number"
                value={formData.numSessoesSupervisionadas}
                onChange={handleChange}
                fullWidth
                required
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.technicians")}
                name="numTecnicosSupervisionados"
                type="number"
                value={formData.numTecnicosSupervisionados}
                onChange={handleChange}
                fullWidth
                required
                disabled={isView}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={isView}>
                <InputLabel>{formatMessage(intl, "prl", "supervisionReport.district")}</InputLabel>
                <Select
                  name="distritoId"
                  value={formData.distritoId}
                  onChange={handleChange}
                  label={formatMessage(intl, "prl", "supervisionReport.district")}
                >
                  <MenuItem value="">
                    <em>{formatMessage(intl, "prl", "select.none")}</em>
                  </MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={isView}>
                <InputLabel>{formatMessage(intl, "prl", "supervisionReport.module")}</InputLabel>
                <Select
                  name="moduloMaiorDificuldadeId"
                  value={formData.moduloMaiorDificuldadeId}
                  onChange={handleChange}
                  label={formatMessage(intl, "prl", "supervisionReport.module")}
                >
                  <MenuItem value="">
                    <em>{formatMessage(intl, "prl", "select.none")}</em>
                  </MenuItem>
                  {modules.map((module) => (
                    <MenuItem key={module.id} value={module.id}>
                      {module.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card style={{
        padding: "0 16px",
      }} className={classes.card}>
        <CardHeader title={formatMessage(intl, "prl", "supervisionReport.pepGrades")} />
        <CardContent className={classes.section}>
          <Grid container spacing={2}>
            {["passo_a", "passo_b", "passo_c", "passo_d", "passo_e", "passo_f", "passo_g", "passo_h", "passo_i", "passo_j"].map((passo) => (
              <Grid item xs={12} sm={6} md={4} key={passo}>
                <TextField
                  label={`Passo ${passo.split("_")[1].toUpperCase()}`}
                  name={passo}
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 0.5 }}
                  value={formData[passo]}
                  onChange={handleChange}
                  fullWidth
                  disabled={isView}
                  className={classes.gradeField}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Card style={{
        padding: "0 16px",
      }} className={classes.card}>
        <CardHeader title={formatMessage(intl, "prl", "supervisionReport.techniciansEvaluation")} />
        <CardContent className={classes.section}>
          {!isView && (
            <div style={{ marginBottom: 20 }}>
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.technicianName")}
                value={newTecnico.nome_tecnico}
                onChange={(e) => setNewTecnico({ ...newTecnico, nome_tecnico: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.positivePoints")}
                value={newTecnico.pontos_positivos}
                onChange={(e) => setNewTecnico({ ...newTecnico, pontos_positivos: e.target.value })}
                fullWidth
                multiline
                rows={2}
                margin="normal"
              />
              <TextField
                label={formatMessage(intl, "prl", "supervisionReport.improvementPoints")}
                value={newTecnico.pontos_aprimorar}
                onChange={(e) => setNewTecnico({ ...newTecnico, pontos_aprimorar: e.target.value })}
                fullWidth
                multiline
                rows={2}
                margin="normal"
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddTecnico}
                style={{ marginTop: 10 }}
              >
                {formatMessage(intl, "prl", "button.add")}
              </Button>
            </div>
          )}

          {tecnicosList.length > 0 && (
            <Paper className={classes.table}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{formatMessage(intl, "prl", "supervisionReport.technicianName")}</TableCell>
                    <TableCell>{formatMessage(intl, "prl", "supervisionReport.positivePoints")}</TableCell>
                    <TableCell>{formatMessage(intl, "prl", "supervisionReport.improvementPoints")}</TableCell>
                    {!isView && <TableCell align="center">{formatMessage(intl, "prl", "button.delete")}</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tecnicosList.map((tecnico, index) => (
                    <TableRow key={index}>
                      <TableCell>{tecnico.nome_tecnico}</TableCell>
                      <TableCell>{tecnico.pontos_positivos}</TableCell>
                      <TableCell>{tecnico.pontos_aprimorar}</TableCell>
                      {!isView && (
                        <TableCell align="center">
                          <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveTecnico(index)}
                              className={classes.deleteIcon}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </CardContent>
      </Card>

      <Card style={{
        padding: "0 16px",
      }} className={classes.card}>
        <CardHeader title={formatMessage(intl, "prl", "supervisionReport.observations")} />
        <CardContent className={classes.section}>
          <TextField
            label={formatMessage(intl, "prl", "supervisionReport.additionalObservations")}
            name="observacoesAdicionais"
            value={formData.observacoesAdicionais}
            onChange={handleChange}
            fullWidth
            multiline
            rows={5}
            disabled={isView}
          />
        </CardContent>
      </Card>

      {!isView && (
        <div className={classes.buttonContainer}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => history.push("/prl/supervisionReport")}
          >
            {formatMessage(intl, "prl", "button.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SupervisionReportFormPage))));
