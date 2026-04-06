import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab,
  Grid, FormControl, InputLabel, Select, MenuItem, TextField,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import VisibilityIcon from "@material-ui/icons/Visibility";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
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
  const [filterAno, setFilterAno] = useState("");

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

  const gqlFetch = async (query, variables = {}) => {
    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query, variables }),
    });
    return response.json();
  };

  useEffect(() => {
    const fetchEscolas = async () => {
      try {
        const json = await gqlFetch(`query { escolas(ativo: true, orderBy: ["nome"]) { edges { node { id nome distrito { id name } localidade { id name } } } } }`);
        setEscolasAPI(json?.data?.escolas?.edges?.map(e => e.node) ?? []);
      } catch (e) { console.error(e); }
    };
    const fetchClasses = async () => {
      try {
        const json = await gqlFetch(`query { classes(ativo: true, orderBy: ["ordem"]) { edges { node { id nome } } } }`);
        setClassesAPI(json?.data?.classes?.edges?.map(e => e.node) ?? []);
      } catch (e) { console.error(e); }
    };
    fetchEscolas();
    fetchClasses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const query = `query GetModulosEducacionais(
    $first: Int, $offset: Int,
    $nome_Icontains: String,
    $sexo: ModuloEducacionalSexo,
    $escolaId: String,
    $classeQueFrequentaId: String,
    $anoRegisto: Int,
    $distritoId: String,
    $localidadeId: String,
    $faixaDeFaltas: ModuloEducacionalFaixaDeFaltas
  ) {
    modulosEducacionais(
      first: $first
      offset: $offset
      nome_Icontains: $nome_Icontains
      sexo: $sexo
      escolaId: $escolaId
      classeQueFrequentaId: $classeQueFrequentaId
      anoRegisto: $anoRegisto
      distritoId: $distritoId
      localidadeId: $localidadeId
      faixaDeFaltas: $faixaDeFaltas
    ) {
      edges {
        node {
          id
          anoRegisto
          aluno {
            id
            firstName
            lastName
            dob
            sexo
            distrito { name }
            localidade { name }
          }
          nome
          idMembroCrianca
          idDaCrianca
          nomeEncarregado
          escola { id nome }
          escolaActual { id nome }
          classe { id nome }
          classeQueFrequenta { id nome }
          dadosEscolaresCorrectos
          aproveitamentoPrimeiroTrimestre
          faixaDeFaltas
          disciplinas {
            disciplina { id nome nivel }
            tipo
          }
          observacoes
          sexo
          idade
          dataNascimento
        }
      }
      totalCount
    }
  }`;

  const fetchModules = async (params) => {
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = params.pageSize || 10;
    const filters = params.filters || {};
    const pageSize = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * pageSize;

    const variables = {
      first: pageSize,
      offset,
      nome_Icontains: filters.nome?.value || null,
      sexo: filters.sexo?.value || null,
      escolaId: filters.escolaId?.value || null,
      classeQueFrequentaId: filters.classeQueFrequentaId?.value || null,
      anoRegisto: filters.anoRegisto?.value ? parseInt(filters.anoRegisto.value) : null,
      distritoId: filters.distritoId?.value || null,
      localidadeId: filters.localidadeId?.value || null,
      faixaDeFaltas: filters.faixaDeFaltas?.value || null,
    };

    const result = await gqlFetch(query, variables);

    if (result.errors && !result.data) {
      throw new Error(result.errors[0].message);
    }

    const modules = result.data.modulosEducacionais.edges.map(edge => edge.node);
    const mappedData = modules.map(module => {
      const alunoName = module.aluno
        ? `${module.aluno.firstName || ""} ${module.aluno.lastName || ""}`.trim()
        : module.nome || "";

      const discList = module.disciplinas || [];
      const discNames = discList.map(d => d?.disciplina?.nome).filter(Boolean).join(", ");

      return {
        id: module.id,
        //idAluno: module.idDaCrianca || "",
        name: alunoName || module.nome || "",
        ano: module.anoRegisto || "-",
        escolaActual: module.escolaActual?.nome || "",
        disciplinas: discNames || "-",
        faixaDeFaltas: module.faixaDeFaltas || "-",
      };
    });
    return mappedData;
  };

  const headers = [
    //"prl.educationalModule.idAluno",
    "prl.educationalModule.name",
    "prl.educationalModule.ano",
    "prl.educationalModule.escolaActual",
    "prl.educationalModule.disciplinas",
    "prl.educationalModule.numeroDeFaltas",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}?id=${item.id}`);
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_EDUCATIONAL_MODULE_FORM}?id=${item.id}&edit=true`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(formatMessage(intl, "prl", "aluno.confirmDelete") || "Tem certeza que deseja eliminar este registo?")) return;
    const mutation = `mutation deleteModuloEducacional($input: DeleteModuloEducacionalMutationInput!) {
      deleteModuloEducacional(input: $input) { internalId clientMutationId }
    }`;
    try {
      await gqlFetch(mutation, { input: { id: item.id } });
    } catch (e) {
      console.error('Erro ao deletar.', e);
    }
  };

  const itemFormatters = [
    //(item) => item.idAluno,
    (item) => item.name,
    (item) => item.ano,
    (item) => item.escolaActual,
    (item) => item.disciplinas,
    (item) => item.faixaDeFaltas,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={formatMessage(intl, "prl", "button.view")}>
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleView(item)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage(intl, "prl", "button.edit")}>
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleEdit(item)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleDelete(item)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  ];

  const sorts = [
    ["name", true],
    ["ano", true],
    ["escolaActual", true],
    ["disciplinas", false],
    null,
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

    const distritos = [...new Map(
      escolasAPI.filter(e => e.distrito).map(e => [e.distrito.id, e.distrito])
    ).values()];

    const localidades = [...new Map(
      escolasAPI
        .filter(e => e.localidade && (!filterDistrito || e.distrito?.id === filterDistrito))
        .map(e => [e.localidade.id, e.localidade])
    ).values()];

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
      delete newFilters.localidadeId;
      if (value) newFilters.distritoId = { value };
      else delete newFilters.distritoId;
      onChangeFilters(newFilters);
    };

    const handleLocalidadeChange = (event) => {
      const value = event.target.value;
      setFilterLocalidade(value);
      const newFilters = { ...filters };
      delete newFilters.escolaId;
      if (value) newFilters.localidadeId = { value };
      else delete newFilters.localidadeId;
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
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "educationalModule.filterFaixaFaltas")}</InputLabel>
            <Select
              value={filters.faixaDeFaltas?.value || ""}
              onChange={handleChange("faixaDeFaltas")}
              label={formatMessage(intl, "prl", "educationalModule.filterFaixaFaltas")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              <MenuItem value="1-3">1-3</MenuItem>
              <MenuItem value="4-6">4-6</MenuItem>
              <MenuItem value="7-10">7-10</MenuItem>
              <MenuItem value="+10">+10</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            type="number"
            label={formatMessage(intl, "prl", "educationalModule.filterAno")}
            value={filterAno}
            onChange={(e) => {
              const value = e.target.value;
              setFilterAno(value);
              const newFilters = { ...filters };
              if (!value) delete newFilters.anoRegisto;
              else newFilters.anoRegisto = { value };
              onChangeFilters(newFilters);
            }}
            variant="outlined"
            size="small"
            inputProps={{ min: 2000, max: new Date().getFullYear() + 5 }}
          />
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
