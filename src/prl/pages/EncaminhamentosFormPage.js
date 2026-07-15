import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Box,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_ENCAMINHAMENTOS } from "../constants";

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
});

const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

function EncaminhamentosFormPage(props) {
  const { classes, intl, history, location } = props;
  const readOnly = location?.state?.readOnly || false;
  const initialData = location?.state?.data || null;

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

  const [form, setForm] = useState({
    sessaoId: "",
    familiaId: "",
    nomeFamilia: "",
    codigoEncaminhamento: "",
    descricao: "",
    tipoEncaminhamentoId: "",
    tecnicoResponsavelId: "",
    status: "PENDENTE",
    observacoes: "",
  });

  const [sessoes, setSessoes] = useState([]);
  const [tiposEncaminhamento, setTiposEncaminhamento] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);

  const sessoesQuery = `query GetSessoes($first: Int) {
    sessoesPep(first: $first, orderBy: ["-dataSessao"]) {
      edges {
        node { id codigoSessao dataSessao }
      }
    }
  }`;

  const tiposQuery = `query GetTiposEncaminhamento {
    tiposEncaminhamento(ativo: true) {
      edges {
        node { id codigo nome }
      }
    }
  }`;

  const tecnicosQuery = `query GetTecnicos {
    users(first: 100) {
      edges {
        node { id username lastName otherNames }
      }
    }
  }`;

  useEffect(() => {
    if (initialData?.id) {
      const decodedId = initialData.id;
      setForm(prev => ({ ...prev, id: decodedId }));
    }

    const loadData = async () => {
      const headers = {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      };

      try {
        const [sessoesRes, tiposRes, tecnicosRes] = await Promise.all([
          fetch(`${baseApiUrl}/graphql`, { method: 'POST', headers, body: JSON.stringify({ query: sessoesQuery, variables: { first: 100 } }) }),
          fetch(`${baseApiUrl}/graphql`, { method: 'POST', headers, body: JSON.stringify({ query: tiposQuery }) }),
          fetch(`${baseApiUrl}/graphql`, { method: 'POST', headers, body: JSON.stringify({ query: tecnicosQuery }) }),
        ]);

        const [sessoesJson, tiposJson, tecnicosJson] = await Promise.all([
          sessoesRes.json(), tiposRes.json(), tecnicosRes.json(),
        ]);

        setSessoes(sessoesJson?.data?.sessoesPep?.edges?.map(e => ({ value: e.node.id, label: `${e.node.codigoSessao} (${e.node.dataSessao})` })) || []);
        setTiposEncaminhamento(tiposJson?.data?.tiposEncaminhamento?.edges?.map(e => ({ value: e.node.id, label: `${e.node.codigo} - ${e.node.nome}` })) || []);
        setTecnicos(tecnicosJson?.data?.users?.edges?.map(e => ({ value: e.node.id, label: e.node.lastName || e.node.username })) || []);

        if (initialData?.id) {
          setForm(prev => ({
            ...prev,
            sessaoId: initialData.sessao || "",
            familiaId: initialData.familiaId || "",
            nomeFamilia: initialData.nomeFamilia || "",
            codigoEncaminhamento: initialData.codigoEncaminhamento || "",
            descricao: initialData.descricao || "",
            status: initialData.status || "PENDENTE",
          }));
        }
      } catch (e) {
        console.error('Error loading data:', e);
      }
    };

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field) => (event) => {
    if (readOnly) return;
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const createMutation = `mutation CreateEncaminhamento($input: CreateEncaminhamentoMutationInput!) {
    createEncaminhamento(input: $input) {
      clientMutationId
      errors { message }
    }
  }`;

  const updateMutation = `mutation UpdateEncaminhamento($input: UpdateEncaminhamentoMutationInput!) {
    updateEncaminhamento(input: $input) {
      clientMutationId
      errors { message }
    }
  }`;

  const handleSave = async () => {
    try {
      if (!form.sessaoId) { alert('Selecione uma sessão.'); return; }
      if (!form.familiaId) { alert('Preencha o ID da família.'); return; }
      if (!form.codigoEncaminhamento) { alert('Preencha o código de encaminhamento.'); return; }
      if (!form.tipoEncaminhamentoId) { alert('Selecione o tipo de encaminhamento.'); return; }

      const input = {
        sessaoId: form.sessaoId,
        familiaId: form.familiaId,
        nomeFamilia: form.nomeFamilia,
        codigoEncaminhamento: form.codigoEncaminhamento,
        descricao: form.descricao,
        tipoEncaminhamentoId: form.tipoEncaminhamentoId,
        tecnicoResponsavelId: form.tecnicoResponsavelId || undefined,
        status: form.status,
        observacoes: form.observacoes || undefined,
      };

      if (initialData?.id) {
        input.id = initialData.id;
      }

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({
          query: initialData?.id ? updateMutation : createMutation,
          variables: { input },
        }),
      });

      const result = await response.json();
      if (result.data?.createEncaminhamento || result.data?.updateEncaminhamento) {
        handleBack();
      } else if (result.errors) {
        alert('Erro: ' + result.errors.map(e => e.message).join('\n'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_ENCAMINHAMENTOS}`);
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.encaminhamentos")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "encaminhamentos.title")}
          </Typography>
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "prl", "encaminhamentos.details")}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.sessao")}
              value={form.sessaoId}
              onChange={handleChange("sessaoId")}
              variant="outlined" size="small" required
              disabled={readOnly}
            >
              <MenuItem value="">Selecione</MenuItem>
              {sessoes.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.codigo")}
              value={form.codigoEncaminhamento}
              onChange={handleChange("codigoEncaminhamento")}
              variant="outlined" size="small" required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.familiaId")}
              value={form.familiaId}
              onChange={handleChange("familiaId")}
              variant="outlined" size="small" required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.nomeFamilia")}
              value={form.nomeFamilia}
              onChange={handleChange("nomeFamilia")}
              variant="outlined" size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.tipo")}
              value={form.tipoEncaminhamentoId}
              onChange={handleChange("tipoEncaminhamentoId")}
              variant="outlined" size="small" required
              disabled={readOnly}
            >
              <MenuItem value="">Selecione</MenuItem>
              {tiposEncaminhamento.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.tecnico")}
              value={form.tecnicoResponsavelId}
              onChange={handleChange("tecnicoResponsavelId")}
              variant="outlined" size="small"
              disabled={readOnly}
            >
              <MenuItem value="">Selecione</MenuItem>
              {tecnicos.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth
              label={formatMessage(intl, "prl", "encaminhamentos.status")}
              value={form.status}
              onChange={handleChange("status")}
              variant="outlined" size="small" required
              disabled={readOnly}
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={3}
              label={formatMessage(intl, "prl", "encaminhamentos.descricao")}
              value={form.descricao}
              onChange={handleChange("descricao")}
              variant="outlined" size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={2}
              label={formatMessage(intl, "prl", "encaminhamentos.observacoes")}
              value={form.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined" size="small"
              disabled={readOnly}
            />
          </Grid>
        </Grid>
      </Paper>

      <Box className={classes.buttonContainer}>
        <Button variant="outlined" onClick={handleBack}>
          {readOnly ? formatMessage(intl, "prl", "button.back") : formatMessage(intl, "prl", "button.cancel")}
        </Button>
        {!readOnly && (
          <Button
            variant="contained" color="primary"
            startIcon={<SaveIcon />} onClick={handleSave}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(EncaminhamentosFormPage))));
