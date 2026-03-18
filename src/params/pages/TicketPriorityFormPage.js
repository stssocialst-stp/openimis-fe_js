import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, Switch, FormControlLabel,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_TICKET_PRIORITY } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  buttonContainer: { display: "flex", justifyContent: "flex-end", gap: theme.spacing(1), marginTop: theme.spacing(2) },
});

const FETCH_QUERY = `query GetTicketPriority($id: ID!) {
  ticketPriority(id: $id) { id codigo nome ordem ativo }
}`;
const CREATE_MUTATION = `mutation CreateTicketPriority($input: CreateTicketPriorityMutationInput!) {
  createTicketPriority(input: $input) { clientMutationId }
}`;
const UPDATE_MUTATION = `mutation UpdateTicketPriority($input: UpdateTicketPriorityMutationInput!) {
  updateTicketPriority(input: $input) { clientMutationId }
}`;

function TicketPriorityFormPage(props) {
  const { classes, intl, history, location } = props;
  const id = new URLSearchParams(location?.search).get("id");
  const isEdit = !!id;

  const [form, setForm] = useState({ codigo: "", nome: "", ordem: 0, ativo: true });
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
        const d = json?.data?.ticketPriority;
        if (d) setForm({ codigo: d.codigo ?? "", nome: d.nome ?? "", ordem: d.ordem ?? 0, ativo: d.ativo ?? true });
      })
      .catch(console.error);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const handleSwitch = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const input = {
        ...(isEdit ? { id } : {}),
        codigo: form.codigo,
        nome: form.nome,
        ordem: parseInt(form.ordem) || 0,
        ativo: form.ativo,
      };
      await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: isEdit ? UPDATE_MUTATION : CREATE_MUTATION, variables: { input } }),
      });
      history.push(`/${PARAMS_ROUTE_TICKET_PRIORITY}`);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", isEdit ? "title.editTicketPriority" : "title.createTicketPriority")} />
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", isEdit ? "title.editTicketPriority" : "title.createTicketPriority")}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth required
              label={formatMessage(intl, "params", "ticketPriority.codigo")}
              value={form.codigo}
              onChange={handleChange("codigo")}
              variant="outlined" size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required
              label={formatMessage(intl, "params", "ticketPriority.nome")}
              value={form.nome}
              onChange={handleChange("nome")}
              variant="outlined" size="small"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="number"
              label={formatMessage(intl, "params", "ticketPriority.ordem")}
              value={form.ordem}
              onChange={handleChange("ordem")}
              variant="outlined" size="small"
              inputProps={{ min: 0 }}
              helperText={formatMessage(intl, "params", "ticketPriority.ordem.helperText")}
            />
          </Grid>
          <Grid item xs={12} sm={4} style={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Switch checked={form.ativo} onChange={handleSwitch("ativo")} color="primary" />}
              label={formatMessage(intl, "params", "label.ativo")}
            />
          </Grid>
        </Grid>
        <div className={classes.buttonContainer}>
          <Button variant="outlined" startIcon={<ChevronLeftIcon />} onClick={() => history.push(`/${PARAMS_ROUTE_TICKET_PRIORITY}`)}>
            {formatMessage(intl, "params", "button.cancel")}
          </Button>
          <Button
            variant="contained" color="primary" startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !form.codigo || !form.nome}
          >
            {formatMessage(intl, "params", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketPriorityFormPage)))));
