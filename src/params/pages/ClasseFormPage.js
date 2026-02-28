import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Switch, FormControlLabel,
  FormGroup, Checkbox, Divider,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_CLASSE, CLASSE_NIVEL_OPTIONS } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
  disciplinasSection: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    background: "#f8f8f8",
    borderRadius: 8,
  },
  disciplinasGroup: {
    columns: 2,
    "@media (max-width: 600px)": { columns: 1 },
  },
});

const DISCIPLINAS_QUERY = `query GetDisciplinas {
  disciplinas(ativo: true, orderBy: ["nivel", "nome"]) {
    edges {
      node {
        id
        nome
        nivel
        quantidadeFaltasAceitaveis
      }
    }
  }
}`;

const CREATE_MUTATION = `mutation CreateClasse($input: CreateClasseMutationInput!) {
  createClasse(input: $input) { clientMutationId internalId }
}`;

const UPDATE_MUTATION = `mutation UpdateClasse($input: UpdateClasseMutationInput!) {
  updateClasse(input: $input) { clientMutationId internalId }
}`;

const NIVEL_LABELS = {
  EP1: "EP1 — 1ª a 4ª Classe",
  EP2: "EP2 — 5ª a 6ª Classe",
  ESG1: "ESG1 — 7ª a 9ª Classe",
  ESG2: "ESG2 — 10ª a 12ª Classe",
  OUTRO: "Outro",
};

function ClasseFormPage(props) {
  const { classes, intl, history, location } = props;
  const id = new URLSearchParams(location?.search).get("id");
  const isEdit = !!id;

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    nivel: "EP1",
    ordem: 1,
    ativo: true,
    disciplinasIds: [],
  });
  const [disciplinasAPI, setDisciplinasAPI] = useState([]);
  const [saving, setSaving] = useState(false);

  // Load disciplinas on mount
  useEffect(() => {
    fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: DISCIPLINAS_QUERY }),
    })
      .then((r) => r.json())
      .then((json) => {
        setDisciplinasAPI(json?.data?.disciplinas?.edges?.map((e) => e.node) ?? []);
      })
      .catch(console.error);
  }, []);

  // Load existing classe from URL state
  useEffect(() => {
    const d = location?.state?.classe;
    if (!d) return;
    setForm({
      nome: d.nome ?? "",
      codigo: d.codigo ?? "",
      nivel: d.nivel ?? "EP1",
      ordem: d.ordem ?? 1,
      ativo: d.ativo ?? true,
      disciplinasIds: (d.disciplinasAssociadas?.edges || []).map((e) => e.node.disciplina.id),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSwitch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleDisciplinaToggle = (disciplinaId) => (e) => {
    setForm((f) => {
      const ids = f.disciplinasIds || [];
      if (e.target.checked) {
        return { ...f, disciplinasIds: [...ids, disciplinaId] };
      } else {
        return { ...f, disciplinasIds: ids.filter((d) => d !== disciplinaId) };
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = {
        ...(isEdit ? { id } : {}),
        nome: form.nome,
        codigo: form.codigo,
        nivel: form.nivel,
        ordem: parseInt(form.ordem) || 1,
        ativo: form.ativo,
        disciplinasIds: form.disciplinasIds,
      };
      await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: isEdit ? UPDATE_MUTATION : CREATE_MUTATION, variables: { input } }),
      });
      history.push(`/${PARAMS_ROUTE_CLASSE}`);
    } catch (e) {
      console.error(e);
      alert("Erro ao guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Group disciplines by nivel for display
  const disciplinasBasicas = disciplinasAPI.filter((d) => d.nivel === "BASICA");
  const disciplinasAvancadas = disciplinasAPI.filter((d) => d.nivel === "AVANCADA");

  return (
    <div className={classes.page}>
      <Helmet
        title={formatMessage(intl, "params", isEdit ? "title.editClasse" : "title.createClasse")}
      />
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", isEdit ? "title.editClasse" : "title.createClasse")}
        </Typography>

        {/* Basic fields */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              required
              label={formatMessage(intl, "params", "classe.nome")}
              value={form.nome}
              onChange={handleChange("nome")}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              required
              label={formatMessage(intl, "params", "classe.codigo")}
              value={form.codigo}
              onChange={handleChange("codigo")}
              variant="outlined"
              size="small"
              helperText='Ex: "4", "6ª"'
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              select
              required
              label={formatMessage(intl, "params", "classe.nivel")}
              value={form.nivel}
              onChange={handleChange("nivel")}
              variant="outlined"
              size="small"
            >
              {CLASSE_NIVEL_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {NIVEL_LABELS[n] || n}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              required
              type="number"
              label={formatMessage(intl, "params", "classe.ordem")}
              value={form.ordem}
              onChange={handleChange("ordem")}
              variant="outlined"
              size="small"
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4} style={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch checked={form.ativo} onChange={handleSwitch("ativo")} color="primary" />}
              label={formatMessage(intl, "params", "label.ativo")}
            />
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0 16px" }} />

        {/* Disciplinas association */}
        <Typography variant="subtitle1" className={classes.sectionTitle}>
          {formatMessage(intl, "params", "classe.disciplinas")}
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ marginBottom: 12 }}>
          {formatMessage(intl, "params", "classe.disciplinas.helperText")}
        </Typography>

        <div className={classes.disciplinasSection}>
          {disciplinasBasicas.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                {formatMessage(intl, "params", "disciplina.nivel.basica")}
              </Typography>
              <FormGroup className={classes.disciplinasGroup}>
                {disciplinasBasicas.map((d) => (
                  <FormControlLabel
                    key={d.id}
                    control={
                      <Checkbox
                        color="primary"
                        checked={form.disciplinasIds.includes(d.id)}
                        onChange={handleDisciplinaToggle(d.id)}
                      />
                    }
                    label={
                      d.quantidadeFaltasAceitaveis
                        ? `${d.nome} (máx. ${d.quantidadeFaltasAceitaveis} faltas)`
                        : d.nome
                    }
                  />
                ))}
              </FormGroup>
            </>
          )}
          {disciplinasAvancadas.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom style={{ marginTop: 16 }}>
                {formatMessage(intl, "params", "disciplina.nivel.avancada")}
              </Typography>
              <FormGroup className={classes.disciplinasGroup}>
                {disciplinasAvancadas.map((d) => (
                  <FormControlLabel
                    key={d.id}
                    control={
                      <Checkbox
                        color="primary"
                        checked={form.disciplinasIds.includes(d.id)}
                        onChange={handleDisciplinaToggle(d.id)}
                      />
                    }
                    label={
                      d.quantidadeFaltasAceitaveis
                        ? `${d.nome} (máx. ${d.quantidadeFaltasAceitaveis} faltas)`
                        : d.nome
                    }
                  />
                ))}
              </FormGroup>
            </>
          )}
          {disciplinasAPI.length === 0 && (
            <Typography variant="body2" color="textSecondary">
              {formatMessage(intl, "params", "message.noData")}
            </Typography>
          )}
        </div>

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={() => history.push(`/${PARAMS_ROUTE_CLASSE}`)}
          >
            {formatMessage(intl, "params", "button.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !form.nome || !form.codigo || !form.nivel}
          >
            {formatMessage(intl, "params", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(ClasseFormPage)))));
