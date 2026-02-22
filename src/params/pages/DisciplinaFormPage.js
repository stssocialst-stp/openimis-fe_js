import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Switch, FormControlLabel,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PARAMS_ROUTE_DISCIPLINA, DISCIPLINA_NIVEL_OPTIONS } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
});

const FETCH_QUERY = `query GetDisciplina($id: ID!) {
  disciplina(id: $id) { id nome nivel ativo }
}`;
const CREATE_MUTATION = `mutation CreateDisciplina($input: CreateDisciplinaMutationInput!) {
  createDisciplina(input: $input) { clientMutationId internalId }
}`;
const UPDATE_MUTATION = `mutation UpdateDisciplina($input: UpdateDisciplinaMutationInput!) {
  updateDisciplina(input: $input) { clientMutationId internalId }
}`;

function DisciplinaFormPage(props) {
  const { classes, intl, history, location } = props;
  const id = new URLSearchParams(location?.search).get("id");
  const isEdit = !!id;

  const [form, setForm] = useState({ nome: "", nivel: "BASICA", ativo: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: FETCH_QUERY, variables: { id } }),
    })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data?.disciplina;
        if (d) setForm({ nome: d.nome ?? "", nivel: d.nivel ?? "BASICA", ativo: d.ativo ?? true });
      })
      .catch(console.error);
  }, [id]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSwitch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = { ...(isEdit ? { id } : {}), nome: form.nome, nivel: form.nivel, ativo: form.ativo };
      await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: isEdit ? UPDATE_MUTATION : CREATE_MUTATION, variables: { input } }),
      });
      history.push(`/${PARAMS_ROUTE_DISCIPLINA}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", isEdit ? "title.editDisciplina" : "title.createDisciplina")} />
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", isEdit ? "title.editDisciplina" : "title.createDisciplina")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth required label={formatMessage(intl, "params", "disciplina.nome")} value={form.nome} onChange={handleChange("nome")} variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select required label={formatMessage(intl, "params", "disciplina.nivel")} value={form.nivel} onChange={handleChange("nivel")} variant="outlined" size="small">
              {DISCIPLINA_NIVEL_OPTIONS.map((n) => (
                <MenuItem key={n} value={n}>
                  {n === "BASICA" ? formatMessage(intl, "params", "disciplina.nivel.basica") : formatMessage(intl, "params", "disciplina.nivel.avancada")}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4} style={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch checked={form.ativo} onChange={handleSwitch("ativo")} color="primary" />}
              label={formatMessage(intl, "params", "label.ativo")}
            />
          </Grid>
        </Grid>
        <div className={classes.buttonContainer}>
          <Button variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => history.push(`/${PARAMS_ROUTE_DISCIPLINA}`)}>
            {formatMessage(intl, "params", "button.cancel")}
          </Button>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !form.nome || !form.nivel}>
            {formatMessage(intl, "params", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(DisciplinaFormPage)))));
