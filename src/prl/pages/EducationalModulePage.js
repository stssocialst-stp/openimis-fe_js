import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab,
  Grid, FormControl, InputLabel, Select, MenuItem, TextField,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import { PRL_ROUTE_EDUCATIONAL_MODULE_FORM } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});



function EducationalModulePage(props) {
  const { classes, intl, rights, history } = props;

  const [escolasAPI, setEscolasAPI] = useState([]);
  const [classesAPI, setClassesAPI] = useState([]);
  const [filterDistrito, setFilterDistrito] = useState("");
  const [filterLocalidade, setFilterLocalidade] = useState("");

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

  useEffect(() => {
    const fetchEscolas = async () => {
      try {
        const res = await fetch(`${baseApiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
          body: JSON.stringify({
            query: `query { escolas(ativo: true, orderBy: ["nome"]) { edges { node { id nome distrito { id name } localidade { id name } } } } }`,
          }),
        });
        const json = await res.json();
        setEscolasAPI(json?.data?.escolas?.edges?.map(e => e.node) ?? []);
      } catch (e) { console.error(e); }
    };
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${baseApiUrl}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
          body: JSON.stringify({
            query: `query { classes(ativo: true, orderBy: ["ordem"]) { edges { node { id nome } } } }`,
          }),
        });
        const json = await res.json();
        setClassesAPI(json?.data?.classes?.edges?.map(e => e.node) ?? []);
      } catch (e) { console.error(e); }
    };
    fetchEscolas();
    fetchClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const query = `query GetModulosEducacionais(
    $first: Int, $offset: Int,
    $nome_Icontains: String,
    $idDaCrianca_Icontains: String,
    $sexo: ModuloEducacionalSexo,
    $escolaId: ID,
    $classeQueFrequentaId: ID
  ) {
    modulosEducacionais(
      first: $first
      offset: $offset
      nome_Icontains: $nome_Icontains
      idDaCrianca_Icontains: $idDaCrianca_Icontains
      sexo: $sexo
      escolaId: $escolaId
      classeQueFrequentaId: $classeQueFrequentaId
    ) {
      edges {
        node {
          id
          idDaCrianca
          nome
          escolaActual {
            id
            nome
          }
          faixaDeFaltas
          disciplinas {
            disciplina {
              id
              nome
              quantidadeFaltasAceitaveis
              faixaFaltasAceitaveis
            }
          }
        }
      }
      totalCount
    }
  }`;

  const FAIXA_FALTAS_LABELS = {
    A_1_3: "1-3",
    A_4_6: "4-6",
    A_7_10: "7-10",
    _10: "+10",
  };

  const fetchModules = async (params) => {
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;

    const variables = {
      first: pageSize,
      offset,
      nome_Icontains: filters.nome?.value || null,
      idDaCrianca_Icontains: filters.idDaCrianca?.value || null,
      sexo: filters.sexo?.value || null,
      escolaId: filters.escolaId?.value || null,
      classeQueFrequentaId: filters.classeQueFrequentaId?.value || null,
    };

    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    const modules = result.data.modulosEducacionais.edges.map(edge => edge.node);
    const mappedData = modules.map(module => ({
      id: module.id,
      idAluno: module.idDaCrianca || "",
      name: module.nome,
      escolaActual: module.escolaActual?.nome || "",
      disciplinas: (module.disciplinas || []).map(d => d.disciplina?.nome).filter(Boolean).join(", "),
      numeroDeFaltas: FAIXA_FALTAS_LABELS[module.faixaDeFaltas] || module.faixaDeFaltas || "-",
      limiteDeFaltas: (module.disciplinas || [])
        .map(d => d.disciplina?.quantidadeFaltasAceitaveis)
        .filter(v => v != null)
        .join(", ") || "-",
    }));
    return mappedData;
  };

  const headers = [
    "prl.educationalModule.idAluno",
    "prl.educationalModule.name",
    "prl.educationalModule.escolaActual",
    "prl.educationalModule.disciplinas",
    "prl.educationalModule.numeroDeFaltas",
    "prl.educationalModule.limiteDeFaltas",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}?id=${item.id}`);
  };

  // Deletar módulo educacional
  const handleDelete = async (item) => {
    const mutation = `mutation deleteModuloEducacional($input: DeleteModuloEducacionalMutationInput!) {\n  deleteModuloEducacional(input: $input) {\n    internalId\n    clientMutationId\n  }\n}`;
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input: { id: item.id } } }),
      });
      const result = await response.json();
      fetchModules();
    } catch (e) {
      console.error('Erro ao deletar.', e);
    }
  };

  const itemFormatters = [
    (item) => item.idAluno,
    (item) => item.name,
    (item) => item.escolaActual,
    (item) => item.disciplinas,
    (item) => item.numeroDeFaltas,
    (item) => item.limiteDeFaltas,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span>
          <Tooltip title={formatMessage(intl, "prl", "educationalModuleDetail")}>
            <IconButton
              size="small"
              className={classes.actionIcon}
              onClick={() => handleView(item)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </span>
        <span>
          <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
            <IconButton size="small" className={classes.actionIcon} onClick={() => handleDelete(item)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </span>
      </div>
    ),
  ];

  const sorts = [
    ["idAluno", true],
    ["name", true],
    ["escolaActual", true],
    ["disciplinas", false],
    ["numeroDeFaltas", false],
    ["limiteDeFaltas", false],
  ];

  const FilterPane = (filterProps) => {
    const { filters, onChangeFilters } = filterProps;

    const handleChange = (field) => (event) => {
      const value = event.target.value;
      const newFilters = { ...filters };
      if (value === '' || value == null) delete newFilters[field];
      else newFilters[field] = { value };
      onChangeFilters(newFilters);
    };

    // Cascading: unique distritos from all escolas
    const distritos = [...new Map(
      escolasAPI.filter(e => e.distrito).map(e => [e.distrito.id, e.distrito])
    ).values()];

    // Localidades filtered by selected distrito
    const localidades = [...new Map(
      escolasAPI
        .filter(e => e.localidade && (!filterDistrito || e.distrito?.id === filterDistrito))
        .map(e => [e.localidade.id, e.localidade])
    ).values()];

    // Escolas filtered by distrito and localidade
    const escolasFiltradas = escolasAPI.filter(e =>
      (!filterDistrito || e.distrito?.id === filterDistrito) &&
      (!filterLocalidade || e.localidade?.id === filterLocalidade)
    );

    const handleDistritoChange = (event) => {
      const value = event.target.value;
      setFilterDistrito(value);
      setFilterLocalidade("");
      const newFilters = { ...filters };
      delete newFilters.escolaId;
      onChangeFilters(newFilters);
    };

    const handleLocalidadeChange = (event) => {
      const value = event.target.value;
      setFilterLocalidade(value);
      const newFilters = { ...filters };
      delete newFilters.escolaId;
      onChangeFilters(newFilters);
    };

    return (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={formatMessage(intl, "prl", "educationalModule.filterAluno")}
            value={filters.nome?.value || ""}
            onChange={handleChange("nome")}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterSexo")}</InputLabel>
            <Select
              value={filters.sexo?.value || ""}
              onChange={handleChange("sexo")}
              label={formatMessage(intl, "prl", "educationalModule.filterSexo")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              <MenuItem value="M">Masculino</MenuItem>
              <MenuItem value="F">Feminino</MenuItem>
              <MenuItem value="I">Indeterminado</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterDistrito")}</InputLabel>
            <Select
              value={filterDistrito}
              onChange={handleDistritoChange}
              label={formatMessage(intl, "prl", "educationalModule.filterDistrito")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {distritos.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterLocalidade")}</InputLabel>
            <Select
              value={filterLocalidade}
              onChange={handleLocalidadeChange}
              label={formatMessage(intl, "prl", "educationalModule.filterLocalidade")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {localidades.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterEscola")}</InputLabel>
            <Select
              value={filters.escolaId?.value || ""}
              onChange={handleChange("escolaId")}
              label={formatMessage(intl, "prl", "educationalModule.filterEscola")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {escolasFiltradas.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterClasse")}</InputLabel>
            <Select
              value={filters.classeQueFrequentaId?.value || ""}
              onChange={handleChange("classeQueFrequentaId")}
              label={formatMessage(intl, "prl", "educationalModule.filterClasse")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {classesAPI.map(c => <MenuItem key={c.id} value={c.id}>{c.nome}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    );
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.educationalModule")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchModules}
        rights={rights}
      />

      <Tooltip title={formatMessage(intl, "prl", "button.add")}>
        <Fab color="primary" className={classes.fab} onClick={handleAdd}>
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(EducationalModulePage)))));
