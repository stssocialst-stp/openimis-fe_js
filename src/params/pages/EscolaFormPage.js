import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Switch, FormControlLabel,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_ESCOLA } from "../constants";
import { getCookie } from "../utils";
import { escolaridadeList } from "../../helpers/constants";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
});

const FETCH_QUERY = `query GetEscola($id: ID!) {
  escola(id: $id) { id nome codigo nivel ativo distrito { id name } localidade { id name } }
}`;
const DISTRICTS_QUERY = `query GetDistritos { locations(first: 100, type: "D") { edges { node { id code name } } } }`;
const CREATE_MUTATION = `mutation CreateEscola($input: CreateEscolaMutationInput!) {
  createEscola(input: $input) { clientMutationId internalId }
}`;
const UPDATE_MUTATION = `mutation UpdateEscola($input: UpdateEscolaMutationInput!) {
  updateEscola(input: $input) { clientMutationId internalId }
}`;

function EscolaFormPage(props) {
  const { classes, intl, history, location } = props;
  const id = new URLSearchParams(location?.search).get("id");
  const isEdit = !!id;

  const [form, setForm] = useState({ nome: "", codigo: "", nivel: "", distritoId: "", ativo: true });
  const [districts, setDistricts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const gql = (q, v) =>
      fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: q, variables: v }),
      }).then((r) => r.json());

    gql(DISTRICTS_QUERY, {}).then((json) => {
      setDistricts(json?.data?.locations?.edges?.map((e) => e.node) ?? []);
    }).catch(console.error);

    if (id) {
      gql(FETCH_QUERY, { id }).then((json) => {
        const d = json?.data?.escola;
        if (d) setForm({ nome: d.nome ?? "", codigo: d.codigo ?? "", nivel: d.nivel ?? "", distritoId: d.distrito?.id ?? "", ativo: d.ativo ?? true });
      }).catch(console.error);
    }
  }, [id]);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSwitch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = {
        ...(isEdit ? { id } : {}),
        nome: form.nome,
        codigo: form.codigo || undefined,
        nivel: form.nivel || undefined,
        distritoId: form.distritoId || undefined,
        ativo: form.ativo,
      };
      await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: isEdit ? UPDATE_MUTATION : CREATE_MUTATION, variables: { input } }),
      });
      history.push(`/${PARAMS_ROUTE_ESCOLA}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", isEdit ? "title.editEscola" : "title.createEscola")} />
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", isEdit ? "title.editEscola" : "title.createEscola")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField fullWidth required label={formatMessage(intl, "params", "escola.nome")} value={form.nome} onChange={handleChange("nome")} variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label={formatMessage(intl, "params", "escola.codigo")} value={form.codigo} onChange={handleChange("codigo")} variant="outlined" size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select label={formatMessage(intl, "params", "escola.nivel")} value={form.nivel} onChange={handleChange("nivel")} variant="outlined" size="small">
              <MenuItem value=""><em>—</em></MenuItem>
              {escolaridadeList.map((n) => <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select label={formatMessage(intl, "params", "escola.distrito")} value={form.distritoId} onChange={handleChange("distritoId")} variant="outlined" size="small">
              <MenuItem value=""><em>—</em></MenuItem>
              {districts.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
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
          <Button variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => history.push(`/${PARAMS_ROUTE_ESCOLA}`)}>
            {formatMessage(intl, "params", "button.cancel")}
          </Button>
          <Button variant="contained" color="primary" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || !form.nome}>
            {formatMessage(intl, "params", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(EscolaFormPage)))));
