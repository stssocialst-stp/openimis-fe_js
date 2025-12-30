import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_EDUCATIONAL_MODULE } from "../constants";

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

function EducationalModuleFormPage(props) {
  const { classes, intl, history, location } = props;

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

  const queryParams = new URLSearchParams(location.search);
  const moduleId = queryParams.get('id');
  const isEdit = !!moduleId;

  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    ordem: "",
    duracaoSemanas: "",
    ativo: true,
  });

  const [loading, setLoading] = useState(false);

  const fetchModuleQuery = `query GetModuloEducacional($id: ID!) {
    moduloEducacional(id: $id) {
      id
      codigo
      nome
      descricao
      ordem
      duracaoSemanas
      ativo
      validityFrom
    }
  }`;

  const createMutation = `mutation CreateModuloEducacional($input: CreateModuloEducacionalMutationInput!) {
    createModuloEducacional(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateModuloEducacional($input: UpdateModuloEducacionalMutationInput!) {
    updateModuloEducacional(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  useEffect(() => {
    if (isEdit) {
      fetchModule(moduleId);
    }
  }, []);

  const fetchModule = async (id) => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: fetchModuleQuery, variables: { id } }),
      });

      const result = await response.json();
      if (result.data?.moduloEducacional) {
        const module = result.data.moduloEducacional;
        setFormData({
          codigo: module.codigo || "",
          nome: module.nome || "",
          descricao: module.descricao || "",
          ordem: module.ordem || "",
          duracaoSemanas: module.duracaoSemanas || "",
          ativo: module.ativo || false,
        });
      } else if (result.errors) {
        console.error('Error fetching module:', result.errors);
        alert('Erro ao buscar módulo: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in fetchModule:', error);
      alert('Erro ao buscar: ' + error.message);
    }
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: parseInt(value) || "" }));
  };

  const handleBooleanChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value === 'true' }));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE}`);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.codigo) {
        alert('Por favor, defina o código do módulo.');
        return;
      }
      if (!formData.nome) {
        alert('Por favor, defina o nome do módulo.');
        return;
      }
      if (!formData.ordem) {
        alert('Por favor, defina a ordem do módulo.');
        return;
      }
      if (!formData.duracaoSemanas) {
        alert('Por favor, defina a duração em semanas.');
        return;
      }

      const input = {
        codigo: formData.codigo,
        nome: formData.nome,
        descricao: formData.descricao || "",
        ordem: parseInt(formData.ordem),
        duracaoSemanas: parseInt(formData.duracaoSemanas),
        ativo: formData.ativo,
      };

      const mutation = isEdit ? updateMutation : createMutation;
      const variables = isEdit ? { input: { ...input, id: moduleId } } : { input };

      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables }),
      });

      const result = await response.json();
      if (result.data?.createModuloEducacional || result.data?.updateModuloEducacional) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving module:', result.errors);
        alert('Erro ao salvar módulo: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isEdit ? "title.editEducationalModule" : "title.createEducationalModule";

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

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              {formatMessage(intl, "prl", "educationalModule.basicInfo")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.code")}
              value={formData.codigo}
              onChange={handleChange("codigo")}
              variant="outlined"
              size="small"
              required
              disabled={isEdit}
              helperText={isEdit ? "Código não pode ser alterado" : "Código único do módulo"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.name")}
              value={formData.nome}
              onChange={handleChange("nome")}
              variant="outlined"
              size="small"
              required
              helperText="Nome do módulo"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.description")}
              value={formData.descricao}
              onChange={handleChange("descricao")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              helperText="Descrição do módulo educacional"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.order")}
              value={formData.ordem}
              onChange={handleNumberChange("ordem")}
              type="number"
              variant="outlined"
              size="small"
              required
              helperText="Ordem de apresentação"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.duration")}
              value={formData.duracaoSemanas}
              onChange={handleNumberChange("duracaoSemanas")}
              type="number"
              variant="outlined"
              size="small"
              required
              helperText="Duração em semanas"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "educationalModule.active")}
              value={formData.ativo}
              onChange={handleBooleanChange("ativo")}
              variant="outlined"
              size="small"
            >
              <MenuItem value={true}>Ativo</MenuItem>
              <MenuItem value={false}>Inativo</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <div className={classes.buttonContainer}>
          <Button
            variant="outlined"
            onClick={handleBack}
            startIcon={<ChevronLeftIcon />}
          >
            {formatMessage(intl, "prl", "button.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {formatMessage(intl, "prl", "button.save")}
          </Button>
        </div>
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({});
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(EducationalModuleFormPage))));
