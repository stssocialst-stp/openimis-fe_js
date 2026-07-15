import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, Button, Box, Chip, MenuItem, TextField,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_ROLE } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
  chip: { margin: theme.spacing(0.5) },
});

const MODULO_OPTIONS = [
  { value: "pep_plus", label: "PEP+" },
  { value: "social_protection", label: "Proteção Social" },
  { value: "payroll", label: "Payroll" },
  { value: "admin", label: "Administração" },
];

function RoleFormPage(props) {
  const { classes, intl, history, location } = props;
  const params = new URLSearchParams(location?.search);
  const roleId = params.get("id");
  const roleNome = params.get("nome") || "";

  const [permissoesDisponiveis, setPermissoesDisponiveis] = useState([]);
  const [permissoesDoRole, setPermissoesDoRole] = useState([]);
  const [modulo, setModulo] = useState("pep_plus");

  const gql = (q, v) =>
    fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: q, variables: v }),
    }).then((r) => r.json());

  const loadPermissoes = async (moduloSel) => {
    const [dispRes, roleRes] = await Promise.all([
      gql(`query { permissoesDisponiveis(modulo: "${moduloSel}") { rightId nome modulo } }`, {}),
      roleId ? gql(`query { permissoesDoRole(roleId: "${roleId}") { id rightId } }`, {}) : Promise.resolve({ data: { permissoesDoRole: [] } }),
    ]);
    setPermissoesDisponiveis(dispRes?.data?.permissoesDisponiveis || []);
    setPermissoesDoRole(roleRes?.data?.permissoesDoRole || []);
  };

  useEffect(() => {
    loadPermissoes(modulo);
  }, [modulo, roleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const roleRightIds = new Set(permissoesDoRole.map(p => p.rightId));

  const handleAddPermissao = async (rightId) => {
    const res = await gql(
      `mutation { adicionarPermissaoAoRole(roleId: "${roleId}", rightId: ${rightId}) { ok errors } }`,
      {}
    );
    if (res?.data?.adicionarPermissaoAoRole?.ok) {
      loadPermissoes(modulo);
    } else {
      alert('Erro: ' + (res?.errors?.[0]?.message || 'Falha ao adicionar permissão'));
    }
  };

  const handleRemovePermissao = async (rightId) => {
    const res = await gql(
      `mutation { removerPermissaoDoRole(roleId: "${roleId}", rightId: ${rightId}) { ok errors } }`,
      {}
    );
    if (res?.data?.removerPermissaoDoRole?.ok) {
      loadPermissoes(modulo);
    } else {
      alert('Erro: ' + (res?.errors?.[0]?.message || 'Falha ao remover permissão'));
    }
  };

  const permissoesAtuais = permissoesDisponiveis.filter(p => roleRightIds.has(p.rightId));
  const permissoesRestantes = permissoesDisponiveis.filter(p => !roleRightIds.has(p.rightId));

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", "title.rolePermissions")} />
      <Paper className={classes.paper}>
        <Button onClick={() => history.push(`/${PARAMS_ROUTE_ROLE}`)}>
          <ChevronLeftIcon fontSize="small" />
          <Typography style={{ marginLeft: 8, fontWeight: 500 }}>
            {formatMessage(intl, "params", "title.rolePermissions")}: {roleNome}
          </Typography>
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", "role.filterModulo")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label="Módulo"
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              variant="outlined" size="small"
            >
              {MODULO_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", "role.currentPermissions")} ({permissoesAtuais.length})
        </Typography>
        <Box display="flex" flexWrap="wrap">
          {permissoesAtuais.length === 0 && (
            <Typography variant="body2" color="textSecondary">Nenhuma permissão atribuída.</Typography>
          )}
          {permissoesAtuais.map(p => (
            <Chip
              key={p.rightId}
              label={`${p.rightId} — ${p.nome}`}
              onDelete={() => handleRemovePermissao(p.rightId)}
              color="primary"
              className={classes.chip}
            />
          ))}
        </Box>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", "role.availablePermissions")} ({permissoesRestantes.length})
        </Typography>
        <Box display="flex" flexWrap="wrap">
          {permissoesRestantes.length === 0 && (
            <Typography variant="body2" color="textSecondary">Todas as permissões já foram atribuídas.</Typography>
          )}
          {permissoesRestantes.map(p => (
            <Chip
              key={p.rightId}
              label={`${p.rightId} — ${p.nome}`}
              onClick={() => handleAddPermissao(p.rightId)}
              variant="outlined"
              className={classes.chip}
              clickable
            />
          ))}
        </Box>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(RoleFormPage)))));
