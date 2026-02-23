import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem,
  Switch, FormControlLabel, Chip, Select, InputLabel,
  FormControl, OutlinedInput, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PARAMS_ROUTE_COORDENACAO_DISTRITAL } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
  chips: { display: "flex", flexWrap: "wrap", gap: 4 },
  formControl: { fullWidth: true },
});

const FETCH_QUERY = `query GetCoordenacaoDistrital($id: ID!) {
  coordenacaoDistrital(id: $id) {
    id
    ativo
    observacoes
    distrito { id name }
    coordenador { id username otherNames lastName }
    tecnicoAdministrativo { id username otherNames lastName }
    tecnicosOperacionais { tecnico { id username otherNames lastName } }
  }
}`;

const DISTRICTS_QUERY = `query GetDistritos {
  locations(first: 100, type: "D") { edges { node { id code name } } }
}`;

const USERS_QUERY = `query GetUsers {
  users(first: 100) { edges { node { id username otherNames lastName } } }
}`;

const CREATE_MUTATION = `mutation CreateCoordenacaoDistrital($input: CreateCoordenacaoDistritalMutationInput!) {
  createCoordenacaoDistrital(input: $input) { clientMutationId internalId }
}`;

const UPDATE_MUTATION = `mutation UpdateCoordenacaoDistrital($input: UpdateCoordenacaoDistritalMutationInput!) {
  updateCoordenacaoDistrital(input: $input) { clientMutationId internalId }
}`;

function CoordenacaoDistritalFormPage(props) {
  const { classes, intl, history, location } = props;
  const id = new URLSearchParams(location?.search).get("id");
  const isEdit = !!id;

  const [form, setForm] = useState({
    distritoId: "",
    coordenadorId: "",
    tecnicoAdministrativoId: "",
    tecnicosOperacionaisIds: [],
    ativo: true,
    observacoes: "",
  });
  const [districts, setDistricts] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const gql = (q, v) =>
    fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: q, variables: v }),
    }).then((r) => r.json());

  useEffect(() => {
    // Load districts and users in parallel
    Promise.all([
      gql(DISTRICTS_QUERY, {}),
      gql(USERS_QUERY, {}),
    ]).then(([distJson, userJson]) => {
      setDistricts(distJson?.data?.locations?.edges?.map((e) => e.node) ?? []);
      setUsers(userJson?.data?.users?.edges?.map((e) => e.node) ?? []);
    }).catch(console.error);

    if (id) {
      gql(FETCH_QUERY, { id }).then((json) => {
        const d = json?.data?.coordenacaoDistrital;
        if (d) {
          setForm({
            distritoId: d.distrito?.id ?? "",
            coordenadorId: d.coordenador?.id ?? "",
            tecnicoAdministrativoId: d.tecnicoAdministrativo?.id ?? "",
            tecnicosOperacionaisIds: d.tecnicosOperacionais?.map((t) => t.tecnico.id) ?? [],
            ativo: d.ativo ?? true,
            observacoes: d.observacoes ?? "",
          });
        }
      }).catch(console.error);
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSwitch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleTecnicosChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, tecnicosOperacionaisIds: typeof value === "string" ? value.split(",") : value }));
  };

  const handleSave = async () => {
    setError("");
    if (!form.distritoId) { setError(formatMessage(intl, "params", "coordenacaoDistrital.error.distritoRequired")); return; }
    if (!form.coordenadorId) { setError(formatMessage(intl, "params", "coordenacaoDistrital.error.coordenadorRequired")); return; }

    setSaving(true);
    try {
      const input = {
        ...(isEdit ? { id } : {}),
        distritoId: form.distritoId,
        coordenadorId: form.coordenadorId,
        ...(form.tecnicoAdministrativoId ? { tecnicoAdministrativoId: form.tecnicoAdministrativoId } : {}),
        ...(form.tecnicosOperacionaisIds.length > 0 ? { tecnicosOperacionaisIds: form.tecnicosOperacionaisIds } : {}),
        ativo: form.ativo,
        observacoes: form.observacoes || undefined,
      };
      const result = await gql(isEdit ? UPDATE_MUTATION : CREATE_MUTATION, { input });
      if (result.errors) {
        const msg = result.errors.map((e) => e.message).join("\n");
        setError(msg);
        return;
      }
      history.push(`/${PARAMS_ROUTE_COORDENACAO_DISTRITAL}`);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getUserLabel = (user) => {
    const name = [user.lastName, user.otherNames].filter(Boolean).join(" ");
    return name ? `${name} (${user.username})` : user.username;
  };

  const selectedTecnicos = users.filter((u) => form.tecnicosOperacionaisIds.includes(u.id));

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", isEdit ? "title.editCoordenacaoDistrital" : "title.createCoordenacaoDistrital")} />
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", isEdit ? "title.editCoordenacaoDistrital" : "title.createCoordenacaoDistrital")}
        </Typography>

        {error && (
          <Typography color="error" style={{ marginBottom: 16 }}>
            {error}
          </Typography>
        )}

        <Grid container spacing={2}>
          {/* Distrito */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label={formatMessage(intl, "params", "coordenacaoDistrital.distrito")}
              value={form.distritoId}
              onChange={handleChange("distritoId")}
              variant="outlined"
              size="small"
            >
              <MenuItem value=""><em>—</em></MenuItem>
              {districts.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Activo */}
          <Grid item xs={12} sm={6} style={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch checked={form.ativo} onChange={handleSwitch("ativo")} color="primary" />}
              label={formatMessage(intl, "params", "label.ativo")}
            />
          </Grid>

          {/* Coordenador */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label={formatMessage(intl, "params", "coordenacaoDistrital.coordenador")}
              value={form.coordenadorId}
              onChange={handleChange("coordenadorId")}
              variant="outlined"
              size="small"
            >
              <MenuItem value=""><em>—</em></MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{getUserLabel(u)}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Técnico Administrativo */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label={formatMessage(intl, "params", "coordenacaoDistrital.tecnicoAdministrativo")}
              value={form.tecnicoAdministrativoId}
              onChange={handleChange("tecnicoAdministrativoId")}
              variant="outlined"
              size="small"
            >
              <MenuItem value=""><em>— {formatMessage(intl, "params", "coordenacaoDistrital.none")} —</em></MenuItem>
              {users.map((u) => <MenuItem key={u.id} value={u.id}>{getUserLabel(u)}</MenuItem>)}
            </TextField>
          </Grid>

          {/* Técnicos Operacionais (multi-select) */}
          <Grid item xs={12}>
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel>{formatMessage(intl, "params", "coordenacaoDistrital.tecnicosOperacionais")}</InputLabel>
              <Select
                multiple
                value={form.tecnicosOperacionaisIds}
                onChange={handleTecnicosChange}
                input={<OutlinedInput label={formatMessage(intl, "params", "coordenacaoDistrital.tecnicosOperacionais")} />}
                renderValue={() => (
                  <Box className={classes.chips}>
                    {selectedTecnicos.map((u) => (
                      <Chip key={u.id} size="small" label={getUserLabel(u)} />
                    ))}
                  </Box>
                )}
              >
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {getUserLabel(u)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Observações */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label={formatMessage(intl, "params", "coordenacaoDistrital.observacoes")}
              value={form.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              placeholder={formatMessage(intl, "params", "coordenacaoDistrital.observacoesPlaceholder")}
            />
          </Grid>
        </Grid>

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            startIcon={<ChevronLeftIcon />}
            onClick={() => history.push(`/${PARAMS_ROUTE_COORDENACAO_DISTRITAL}`)}
          >
            {formatMessage(intl, "params", "button.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !form.distritoId || !form.coordenadorId}
          >
            {formatMessage(intl, "params", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(CoordenacaoDistritalFormPage)))));
