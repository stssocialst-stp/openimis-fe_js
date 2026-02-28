import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_FAMILY_GROUP } from "../constants";

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

function FamilyGroupFormPage(props) {
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
  const groupId = queryParams.get('id');
  const isEdit = !!groupId;

  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    distritoId: "",
    localidadeId: "",
    numeroFamilias: 0,
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [localities, setLocalities] = useState([]);

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

  const localityQuery = `query GetLocalidades($first: Int) {
    locations(first: $first) {
      edges {
        node {
          id
          code
          name
        }
      }
    }
  }`;

  const fetchGroupQuery = `query GetGrupoFamiliar($id: ID!) {
    grupoFamiliar(id: $id) {
      id
      codigo
      nome
      distrito {
        id
        code
        name
      }
      localidade {
        id
        code
        name
      }
      numeroFamilias
      ativo
      validityFrom
    }
  }`;

  const createMutation = `mutation CreateGrupoFamiliar($input: CreateGrupoFamiliarMutationInput!) {
    createGrupoFamiliar(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateGrupoFamiliar($input: UpdateGrupoFamiliarMutationInput!) {
    updateGrupoFamiliar(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  useEffect(() => {
    fetchDistricts();
    if (isEdit) {
      fetchFamilyGroup(groupId);
    }
  }, []);

  useEffect(() => {
    if (formData.distritoId) {
      fetchLocalities(formData.distritoId);
    } else {
      setLocalities([]);
      setFormData((prev) => ({ ...prev, localidadeId: "" }));
    }
  }, [formData.distritoId]);

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: districtQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.locations?.edges) {
        const districtList = result.data.locations.edges.map(edge => ({
          value: edge.node.id,
          label: edge.node.name,
        }));
        setDistricts(districtList);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchLocalities = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: localityQuery, variables: { first: 100 } }),
      });

      const result = await response.json();
      if (result.data?.locations?.edges) {
        const localityList = result.data.locations.edges.map(edge => ({
          value: edge.node.id,
          label: edge.node.name,
        }));
        setLocalities(localityList);
      }
    } catch (error) {
      console.error('Error fetching localities:', error);
    }
  };

  const fetchFamilyGroup = async (id) => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: fetchGroupQuery, variables: { id } }),
      });

      const result = await response.json();
      if (result.data?.grupoFamiliar) {
        const group = result.data.grupoFamiliar;
        setFormData({
          codigo: group.codigo || "",
          nome: group.nome || "",
          distritoId: group.distrito?.id || "",
          localidadeId: group.localidade?.id || "",
          numeroFamilias: group.numeroFamilias || 0,
          ativo: group.ativo || false,
        });
      } else if (result.errors) {
        console.error('Error fetching family group:', result.errors);
        alert('Erro ao buscar grupo familiar: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in fetchFamilyGroup:', error);
      alert('Erro ao buscar: ' + error.message);
    }
  };

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: parseInt(value) || 0 }));
  };

  const handleBooleanChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value === 'true' }));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_FAMILY_GROUP}`);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.codigo) {
        alert('Por favor, defina o código do grupo familiar.');
        return;
      }
      if (!formData.nome) {
        alert('Por favor, defina o nome do grupo familiar.');
        return;
      }
      if (!formData.distritoId) {
        alert('Por favor, selecione um distrito.');
        return;
      }
      if (!formData.localidadeId) {
        alert('Por favor, selecione uma localidade.');
        return;
      }

      const input = {
        codigo: formData.codigo,
        nome: formData.nome,
        distritoId: String(formData.distritoId),
        localidadeId: String(formData.localidadeId),
        numeroFamilias: formData.numeroFamilias || 0,
        ativo: formData.ativo,
      };

      const mutation = isEdit ? updateMutation : createMutation;
      const variables = isEdit ? { input: { ...input, id: groupId } } : { input };

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
      if (result.data?.createGrupoFamiliar || result.data?.updateGrupoFamiliar) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving family group:', result.errors);
        alert('Erro ao salvar grupo familiar: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const pageTitle = isEdit ? "title.editFamilyGroup" : "title.createFamilyGroup";

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
              {formatMessage(intl, "prl", "familyGroup.basicInfo")}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.code")}
              value={formData.codigo}
              onChange={handleChange("codigo")}
              variant="outlined"
              size="small"
              required
              disabled={isEdit}
              helperText={isEdit ? "Código não pode ser alterado" : "Código único do grupo"}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.name")}
              value={formData.nome}
              onChange={handleChange("nome")}
              variant="outlined"
              size="small"
              required
              helperText="Nome descritivo do grupo"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.district")}
              value={formData.distritoId}
              onChange={handleChange("distritoId")}
              variant="outlined"
              size="small"
              required
              helperText="Selecione um distrito"
            >
              <MenuItem value="">
                <em>Selecione um distrito</em>
              </MenuItem>
              {districts.map((district) => (
                <MenuItem key={district.value} value={district.value}>
                  {district.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.locality")}
              value={formData.localidadeId}
              onChange={handleChange("localidadeId")}
              variant="outlined"
              size="small"
              required
              helperText="Selecione uma localidade"
              disabled={!formData.distritoId}
            >
              <MenuItem value="">
                <em>Selecione uma localidade</em>
              </MenuItem>
              {localities.map((locality) => (
                <MenuItem key={locality.value} value={locality.value}>
                  {locality.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.families")}
              value={formData.numeroFamilias}
              onChange={handleNumberChange("numeroFamilias")}
              type="number"
              variant="outlined"
              size="small"
              helperText="Número de famílias no grupo"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "familyGroup.active")}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(FamilyGroupFormPage))));
