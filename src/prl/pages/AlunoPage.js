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
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders, withTooltip } from "@stssocialst-stp/fe-core";
import PrlSearcher from "../components/PrlSearcher";
import { PRL_ROUTE_ALUNO_FORM, RIGHT_ALUNO_DELETE, RIGHT_ALUNO_MANAGE } from "../constants";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  actionIcon: { padding: 4 },
});

function AlunoPage(props) {
  const { classes, intl, rights, history } = props;
  const canManageAluno = rights.includes(RIGHT_ALUNO_MANAGE);
  const canDeleteAluno = rights.includes(RIGHT_ALUNO_DELETE);

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

  const query = `query GetAlunos(
    $first: Int, $offset: Int,
    $idMembroCrianca: String,
    $idDaCrianca_Icontains: String,
    $sexo: AlunoSexo,
    $distritoId: ID,
    $localidadeId: ID,
    $escolaId: ID,
    $escolaridadeActual: AlunoEscolaridadeActual,
    $classeId: ID,
    $dadosEscolaresCorrectos: Boolean,
    $ativo: Boolean
  ) {
    alunos(
      first: $first
      offset: $offset
      idMembroCrianca: $idMembroCrianca
      idDaCrianca_Icontains: $idDaCrianca_Icontains
      sexo: $sexo
      distritoId: $distritoId
      localidadeId: $localidadeId
      escolaId: $escolaId
      escolaridadeActual: $escolaridadeActual
      classeId: $classeId
      dadosEscolaresCorrectos: $dadosEscolaresCorrectos
      ativo: $ativo
    ) {
      edges {
        node {
          id
          firstName
          lastName
          dob
          sexo
          nomeEncarregado
          idMembroCrianca
          idDaCrianca
          distrito { id name }
          localidade { id name }
          escola { id nome }
          escolaActual { id nome }
          escolaridadeActual
          classe { id nome }
          classeQueFrequenta { id nome }
          dadosEscolaresCorrectos
          ativo
        }
      }
      totalCount
    }
  }`;

  const fetchAlunos = async (params) => {
    // Se vier params.variables, use diretamente, filtrando apenas os campos preenchidos
    let variables = params.variables || {};
    variables = Object.fromEntries(Object.entries(variables).filter(([_, v]) => v !== null && v !== undefined && v !== ""));
    if (!variables.first) variables.first = params.pageSize || 10;
    // Remove declaração duplicada
    // const filters = params.filters || {};
    // const pageSize = params.pageSize || 10;
    // const offset = ((params.page || 1) - 1) * pageSize;

    // Se precisar adicionar campos extras, faça merge aqui
    // variables = { ...variables, ...outrosCampos }

    const response = await fetch(`${baseApiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
        ...apiHeaders(),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);

    const alunos = result.data.alunos.edges.map(edge => edge.node);
    return alunos.map(aluno => ({
      id: aluno.id,
      firstName: aluno.firstName || "",
      lastName: aluno.lastName || "",
      fullName: `${aluno.firstName || ""} ${aluno.lastName || ""}`.trim(),
      dob: aluno.dob || "",
      sexo: aluno.sexo || "",
      idMembroCrianca: aluno.idMembroCrianca || "",
      idDaCrianca: aluno.idDaCrianca || "",
      nomeEncarregado: aluno.nomeEncarregado || "",
      distrito: aluno.distrito?.name || "",
      localidade: aluno.localidade?.name || "",
      escola: aluno.escola?.nome || "",
      escolaActual: aluno.escolaActual?.nome || "",
      escolaridadeActual: aluno.escolaridadeActual || "",
      classe: aluno.classe?.nome || "",
      classeQueFrequenta: aluno.classeQueFrequenta?.nome || "",
      dadosEscolaresCorrectos: aluno.dadosEscolaresCorrectos,
      ativo: aluno.ativo,
    }));
  };

  const headers = [
    "prl.aluno.fullName",
    "prl.aluno.sexo",
    "prl.aluno.dob",
    "prl.aluno.distrito",
    "prl.aluno.escolaridadeActual",
    "emptyLabel",
  ];

  const handleAdd = () => {
    history.push(`/${PRL_ROUTE_ALUNO_FORM}`);
  };

  const handleView = (item) => {
    history.push(`/${PRL_ROUTE_ALUNO_FORM}?id=${item.id}`);
  };

  const handleEdit = (item) => {
    history.push(`/${PRL_ROUTE_ALUNO_FORM}?id=${item.id}&edit=true`);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(formatMessage(intl, "prl", "aluno.confirmDelete") || "Tem certeza que deseja eliminar este aluno?")) return;
    const mutation = `mutation deleteAluno($input: DeleteAlunoMutationInput!) {
      deleteAluno(input: $input) { internalId }
    }`;
    try {
      await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input: { id: item.id } } }),
      });
      // Force re-render; PrlSearcher will re-fetch
      window.location.reload();
    } catch (e) {
      console.error('Erro ao eliminar aluno.', e);
    }
  };

  const ESCOLARIDADE_LABELS = {
    EP1: "EP1",
    EP2: "EP2",
    ESG1: "ESG1",
    ESG2: "ESG2",
    ENSINO_SUPERIOR: "Ensino Superior",
    OUTRO: "Outro",
  };

  const itemFormatters = [
    (item) => item.fullName,
    (item) => item.sexo,
    (item) => item.dob,
    (item) => item.distrito,
    (item) => ESCOLARIDADE_LABELS[item.escolaridadeActual] || item.escolaridadeActual,
    (item) => (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={formatMessage(intl, "prl", "button.view")}>
          <IconButton size="small" className={classes.actionIcon} onClick={() => handleView(item)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {canManageAluno && (
          <Tooltip title={formatMessage(intl, "prl", "button.edit")}>
            <IconButton size="small" className={classes.actionIcon} onClick={() => handleEdit(item)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {canDeleteAluno && (
          <Tooltip title={formatMessage(intl, "prl", "button.delete")}>
            <IconButton size="small" className={classes.actionIcon} onClick={() => handleDelete(item)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    ),
  ];

  const sorts = [
    ["fullName", true],
    ["sexo", true],
    ["dob", true],
    ["distrito", true],
    ["escolaridadeActual", true],
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
            label={formatMessage(intl, "prl", "aluno.filterIdDaCrianca")}
            value={filters.idDaCrianca?.value || ""}
            onChange={handleChange("idDaCrianca")}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label={formatMessage(intl, "prl", "aluno.filterIdMembroCrianca")}
            value={filters.idMembroCrianca?.value || ""}
            onChange={handleChange("idMembroCrianca")}
            variant="outlined"
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterSexo")}</InputLabel>
            <Select
              value={filters.sexo?.value || ""}
              onChange={handleChange("sexo")}
              label={formatMessage(intl, "prl", "aluno.filterSexo")}
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
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterDistrito")}</InputLabel>
            <Select
              value={filterDistrito}
              onChange={handleDistritoChange}
              label={formatMessage(intl, "prl", "aluno.filterDistrito")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {distritos.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterLocalidade")}</InputLabel>
            <Select
              value={filterLocalidade}
              onChange={handleLocalidadeChange}
              label={formatMessage(intl, "prl", "aluno.filterLocalidade")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {localidades.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterEscola")}</InputLabel>
            <Select
              value={filters.escolaId?.value || ""}
              onChange={handleChange("escolaId")}
              label={formatMessage(intl, "prl", "aluno.filterEscola")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              {escolasFiltradas.map(e => <MenuItem key={e.id} value={e.id}>{e.nome}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterEscolaridade")}</InputLabel>
            <Select
              value={filters.escolaridadeActual?.value || ""}
              onChange={handleChange("escolaridadeActual")}
              label={formatMessage(intl, "prl", "aluno.filterEscolaridade")}
            >
              <MenuItem value="">{formatMessage(intl, "prl", "filter.all")}</MenuItem>
              <MenuItem value="EP1">EP1</MenuItem>
              <MenuItem value="EP2">EP2</MenuItem>
              <MenuItem value="ESG1">ESG1</MenuItem>
              <MenuItem value="ESG2">ESG2</MenuItem>
              <MenuItem value="ENSINO_SUPERIOR">Ensino Superior</MenuItem>
              <MenuItem value="OUTRO">Outro</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel>{formatMessage(intl, "prl", "aluno.filterClasse")}</InputLabel>
            <Select
              value={filters.classeId?.value || ""}
              onChange={handleChange("classeId")}
              label={formatMessage(intl, "prl", "aluno.filterClasse")}
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
      <Helmet title={formatMessage(intl, "prl", "title.alunos")} />

      <PrlSearcher
        FilterPane={FilterPane}
        headers={headers}
        itemFormatters={itemFormatters}
        sorts={sorts}
        fetch={fetchAlunos}
        rights={rights}
      />

      {canManageAluno && withTooltip(
        <div className={classes.fab}>
          <Fab color="primary" onClick={handleAdd}>
            <AddIcon />
          </Fab>
        </div>,
        formatMessage(intl, "prl", "button.add")
      )}
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(connect(mapStateToProps)(AlunoPage)))));
