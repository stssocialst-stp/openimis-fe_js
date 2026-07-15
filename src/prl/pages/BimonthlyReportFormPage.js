import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Box, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import AddIcon from "@material-ui/icons/Add";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PRL_ROUTE_BIMONTHLY_REPORT } from "../constants";

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
  tableHeader: {
    backgroundColor: theme.palette.primary.main,
    "& th": {
      color: "#fff",
      fontWeight: "bold",
      padding: theme.spacing(1),
      textAlign: "center",
    },
  },
  tableCell: {
    textAlign: "center",
    padding: theme.spacing(1),
  },
  percentText: {
    fontWeight: "bold",
    color: theme.palette.primary.main,
  },
  districtChip: {
    margin: theme.spacing(0.5),
    padding: theme.spacing(1, 2),
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${theme.palette.grey[300]}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    },
  },
  districtChipSelected: {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  periodChip: {
    margin: theme.spacing(0.5),
    padding: theme.spacing(1, 2),
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${theme.palette.grey[300]}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.grey[100],
    },
  },
  periodChipSelected: {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
});

const PERIODO_OPTIONS = [
  { value: "BIM1", label: "Janeiro e Fevereiro" },
  { value: "BIM2", label: "Março e Abril" },
  { value: "BIM3", label: "Maio e Junho" },
  { value: "BIM4", label: "Julho e Agosto" },
  { value: "BIM5", label: "Setembro e Outubro" },
  { value: "BIM6", label: "Novembro e Dezembro" },
];

// ENCAMINHAMENTOS is now loaded from the tiposEncaminhamento API
// Fallback static list used only when the API is unavailable
// const FALLBACK_ENCAMINHAMENTOS = [
//   { codigo: "001", descricao: "Encaminhamento devido à violência contra a mulher" },
//   { codigo: "002", descricao: "Encaminhamento devido à dependência química" },
//   { codigo: "003", descricao: "Encaminhamento devido à Insegurança Alimentar" },
//   { codigo: "004", descricao: "Encaminhamento devido à violação de direitos da criança – vítimas de agressão" },
//   { codigo: "005", descricao: "Encaminhamento devido à violação de direitos da criança – vítimas de abuso sexual" },
//   { codigo: "006", descricao: "Encaminhamento devido à violação de direitos da criança – Registo da criança" },
//   { codigo: "007", descricao: "Encaminhamento devido à Saúde mental do cuidador" },
//   { codigo: "008", descricao: "Encaminhamento por falta de acesso a educação" },
//   { codigo: "009", descricao: "Encaminhamento para apoio jurídico" },
//   { codigo: "010", descricao: "Encaminhamento por falta de acesso à saúde" },
//   { codigo: "011", descricao: "Outros" },
// ];

function BimonthlyReportFormPage(props) {
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

  // 1. Identificação
  const [formData, setFormData] = useState({
    coordenadorDistritalId: "",
    coordenadorDistritalNome: "",
    tecnicoAdministrativoId: "",
    tecnicoAdministrativoNome: "",
    numeroLocalidadesAtendidas: 0,
    numeroFamiliasAtendidas: 0,
    numeroTecnicosFormadores: 0,
    distritoId: "",
    periodo: "",
    ano: new Date().getFullYear(),
    periodoInicio: "",
    periodoFim: "",
    observacoes: "",
  });

  // 4. Resumo das Sessões Realizadas
  const [resumoSessoes, setResumoSessoes] = useState({
    numeroSessoesConduzidas: 0,
    numeroTotalFamiliasPresentes: 0,
    numeroSessoesEsperadas: 0,
    numeroTotalFamiliasEsperadas: 0,
    numeroFamiliasMigraram: 0,
    numeroSessoesPerdidas: 0,
  });

  // 6. Tabela de Técnicos
  const [tecnicos, setTecnicos] = useState([
    {
      id: Date.now(),
      nome: "",
      sessoesExecutadas: 0,
      sessoesPerdidas: 0,
      modulos: 0,
      familiasPresentes: 0,
      familiasMigraram: 0,
      naoCompareceram2Sessoes: 0,
      naoCompareceram1Sessao: 0,
    }
  ]);

  // 7. Compromissos
  const [compromissos, setCompromissos] = useState({
    nenhumCompromissoPraticado: 0,
    um5Cuidadores: 0,
    seis10Cuidadores: 0,
    dez15Cuidadores: 0,
    mais15Cuidadores: 0,
  });

  // 8. Encaminhamentos — populated from tiposEncaminhamento API
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  // ENCA presences available for selection in this district/period
  const [presencasDisponiveis, setPresencasDisponiveis] = useState([]);
  // IDs of presences the user selected to include in the report
  const [selectedPresencasIds, setSelectedPresencasIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [previewLoaded, setPreviewLoaded] = useState(false);

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

  const coordenacoesDistritaisQuery = `query GetCoordenacaoByDistrito($distritoId: ID!) {
    coordenacoesDistritais(distritoId: $distritoId, ativo: true) {
      edges {
        node {
          id
          coordenador { id username otherNames lastName }
          tecnicoAdministrativo { id username otherNames lastName }
        }
      }
    }
  }`;

  const tiposEncaminhamentoQuery = `query GetTiposEncaminhamento {
    tiposEncaminhamento(ativo: true) {
      edges {
        node {
          id
          codigo
          nome
          descricao
        }
      }
    }
  }`;

  const previewRelatorioQuery = `query PreviewRelatorioDistrital($distritoId: String!, $periodo: String!, $ano: Int!) {
    previewRelatorioDistrital(distritoId: $distritoId, periodo: $periodo, ano: $ano) {
      periodoInicio
      periodoFim
      numeroSessoesConduzidas
      numeroSessoesEsperadas
      numeroSessoesPerdidas
      numeroLocalidadesAtendidas
      numeroTecnicosFormadores
      numeroFamiliasPresentes
      numeroFamiliasEsperadas
      numeroFamiliasMigraram
      numeroFamiliasAtendidas
      percentualSessoes
      percentualFamilias
      mediaFamiliaPresente
      mediaFamiliaEsperada
    }
  }`;

  const presencasEncaminhadasDispQuery = `query GetPresencasEncaminhadasDisp($distritoId: String!, $periodoInicio: String!, $periodoFim: String!) {
    presencasEncaminhadasDisponiveis(distritoId: $distritoId, periodoInicio: $periodoInicio, periodoFim: $periodoFim) {
      edges {
        node {
          id
          familiaId
          nomeFamilia
          codigoEncaminhamento
          tipoEncaminhamento { id codigo nome }
          sessao { codigoSessao dataSessao }
        }
      }
    }
  }`;

  const setEncaminhamentosMutation = `mutation SetEncaminhamentosRelatorio($input: SetEncaminhamentosRelatorioMutationInput!) {
    setEncaminhamentosRelatorio(input: $input) {
      internalId
    }
  }`;

  const addEncaminhamentoRelatorioMutation = `mutation AddEncaminhamentoRelatorio($input: AddEncaminhamentoRelatorioMutationInput!) {
    addEncaminhamentoRelatorio(input: $input) {
      clientMutationId
      errors { message }
    }
  }`;

  const removeEncaminhamentoRelatorioMutation = `mutation RemoveEncaminhamentoRelatorio($input: RemoveEncaminhamentoRelatorioMutationInput!) {
    removeEncaminhamentoRelatorio(input: $input) {
      clientMutationId
      errors { message }
    }
  }`;

  const createMutation = `mutation CreateRelatorioDistrital($input: CreateRelatorioDistritalMutationInput!) {
    createRelatorioDistrital(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateRelatorioDistrital($input: UpdateRelatorioDistritalMutationInput!) {
    updateRelatorioDistrital(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const fetchReportQuery = `query RelatorioDistrital($id: ID!) {
    relatorioDistrital(id: $id) {
      id
      distrito {
        id
        name
        code
      }
      coordenadorDistrital {
        id
        otherNames
        lastName
      }
      tecnicoAdministrativo {
        id
        otherNames
        lastName
      }
      periodo
      ano
      periodoInicio
      periodoFim
      numeroLocalidadesAtendidas
      numeroFamiliasAtendidas
      numeroTecnicosFormadores
      numeroSessoesConduzidas
      numeroSessoesEsperadas
      numeroFamiliasPresentes
      numeroFamiliasEsperadas
      numeroFamiliasMigraram
      numeroSessoesPerdidas
      percentualSessoes
      percentualFamilias
      mediaFamiliaPresente
      mediaFamiliaEsperada
      dadosTecnicos
      dadosEncaminhamentos
      observacoes
      encaminhamentosEstruturados {
        id
        presenca { id }
      }
    }
  }`;

  useEffect(() => {
    fetchDistricts();
    fetchTiposEncaminhamento();
    if (initialData?.id) {
      fetchReportData(initialData.id);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch coordenacao distrital whenever district changes
  useEffect(() => {
    if (formData.distritoId && !initialData?.id) {
      fetchCoordenacaoByDistrito(formData.distritoId);
    }
  }, [formData.distritoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fill from previewRelatorioDistrital whenever district + period + year are complete
  useEffect(() => {
    if (formData.distritoId && formData.periodo && formData.ano && !initialData?.id) {
      setPreviewLoaded(false);
      autoFillFromPreview();
    }
  }, [formData.distritoId, formData.periodo, formData.ano]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReportData = async (id) => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: fetchReportQuery, variables: { id } }),
      });

      const result = await response.json();
      if (result.data?.relatorioDistrital) {
        const data = result.data.relatorioDistrital;

        // Populate form data
        setFormData({
          coordenadorDistritalId: data.coordenadorDistrital?.id || "",
          coordenadorDistritalNome: data.coordenadorDistrital ? `${data.coordenadorDistrital.lastName} ${data.coordenadorDistrital.otherNames}`.trim() : "",
          tecnicoAdministrativoId: data.tecnicoAdministrativo?.id || "",
          tecnicoAdministrativoNome: data.tecnicoAdministrativo ? `${data.tecnicoAdministrativo.lastName} ${data.tecnicoAdministrativo.otherNames}`.trim() : "",
          numeroLocalidadesAtendidas: data.numeroLocalidadesAtendidas || 0,
          numeroFamiliasAtendidas: data.numeroFamiliasAtendidas || 0,
          numeroTecnicosFormadores: data.numeroTecnicosFormadores || 0,
          distritoId: data.distrito?.id || "",
          periodo: data.periodo || "",
          ano: data.ano || new Date().getFullYear(),
          periodoInicio: data.periodoInicio || "",
          periodoFim: data.periodoFim || "",
          observacoes: data.observacoes || "",
        });

        // Populate resumo sessoes
        setResumoSessoes({
          numeroSessoesConduzidas: data.numeroSessoesConduzidas || 0,
          numeroTotalFamiliasPresentes: data.numeroFamiliasPresentes || 0,
          numeroSessoesEsperadas: data.numeroSessoesEsperadas || 0,
          numeroTotalFamiliasEsperadas: data.numeroFamiliasEsperadas || 0,
          numeroFamiliasMigraram: data.numeroFamiliasMigraram || 0,
          numeroSessoesPerdidas: data.numeroSessoesPerdidas || 0,
        });

        // Populate tecnicos table
        if (data.dadosTecnicos) {
          try {
            const tecnicosData = typeof data.dadosTecnicos === 'string'
              ? JSON.parse(data.dadosTecnicos)
              : data.dadosTecnicos;
            if (Array.isArray(tecnicosData) && tecnicosData.length > 0) {
              setTecnicos(tecnicosData.map((t, i) => ({
                id: t.id || Date.now() + i,
                nome: t.tecnicoFormador || t.nome || "",
                sessoesExecutadas: t.sessoesExecutadas || 0,
                sessoesPerdidas: t.sessoesPerdidas || 0,
                modulos: t.modulos || 0,
                familiasPresentes: t.familiasPresentes || 0,
                familiasMigraram: t.familiasMigraram || 0,
                naoCompareceram2Sessoes: t.naoCompareceram2Sessoes || 0,
                naoCompareceram1Sessao: t.naoCompareceram1Sessao || 0,
              })));
            }
          } catch (e) {
            console.error('Error parsing dadosTecnicos:', e);
          }
        }

        // Populate encaminhamentos — merge saved totals into the current (API-driven) list
        if (data.dadosEncaminhamentos) {
          try {
            const encData = typeof data.dadosEncaminhamentos === 'string'
              ? JSON.parse(data.dadosEncaminhamentos)
              : data.dadosEncaminhamentos;
            if (Array.isArray(encData)) {
              setEncaminhamentos(prev => {
                const merged = prev.length > 0
                  ? prev.map(e => {
                    const found = encData.find(d => d.codigo === e.codigo);
                    return found ? { ...e, numeroTotal: found.numeroTotal || 0 } : e;
                  })
                  : encData.map(d => ({ codigo: d.codigo, descricao: d.descricao || '', numeroTotal: d.numeroTotal || 0 }));
                return merged;
              });
            }
          } catch (e) {
            console.error('Error parsing dadosEncaminhamentos:', e);
          }
        }

        // Pre-select presences already linked to this report
        if (data.encaminhamentosEstruturados?.length > 0) {
          setSelectedPresencasIds(data.encaminhamentosEstruturados.map(e => e.presenca?.id).filter(Boolean));
        }
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      alert('Erro ao carregar dados do relatório: ' + error.message);
    }
  };

  const fetchCoordenacaoByDistrito = async (distritoId) => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: coordenacoesDistritaisQuery, variables: { distritoId } }),
      });
      const result = await response.json();
      const node = result.data?.coordenacoesDistritais?.edges?.[0]?.node;
      const getUserLabel = (u) => u ? `${u.lastName || ''} ${u.otherNames || ''}`.trim() || u.username : '';
      setFormData(prev => ({
        ...prev,
        coordenadorDistritalId: node?.coordenador?.id || '',
        coordenadorDistritalNome: getUserLabel(node?.coordenador),
        tecnicoAdministrativoId: node?.tecnicoAdministrativo?.id || '',
        tecnicoAdministrativoNome: getUserLabel(node?.tecnicoAdministrativo),
      }));
    } catch (error) {
      console.error('Error fetching coordenacao distrital:', error);
    }
  };

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
          id: edge.node.id,
          code: edge.node.code,
          name: edge.node.name,
        }));
        setDistricts(districtList);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const fetchTiposEncaminhamento = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: tiposEncaminhamentoQuery }),
      });
      const result = await response.json();
      const tipos = result.data?.tiposEncaminhamento?.edges?.map(e => e.node) ?? [];
      if (tipos.length > 0) {
        setEncaminhamentos(tipos.map(t => ({
          codigo: t.codigo,
          descricao: t.descricao || t.nome,
          id: t.id,
          numeroTotal: 0,
        })));
      } else {
        // Fallback to static list if API returns nothing
        //setEncaminhamentos(FALLBACK_ENCAMINHAMENTOS.map(e => ({ ...e, numeroTotal: 0 })));
      }
    } catch (error) {
      console.error('Error fetching tipos encaminhamento:', error);
      //setEncaminhamentos(FALLBACK_ENCAMINHAMENTOS.map(e => ({ ...e, numeroTotal: 0 })));
    }
  };

  const autoFillFromPreview = async () => {
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({
          query: previewRelatorioQuery,
          variables: {
            distritoId: formData.distritoId,
            periodo: formData.periodo,
            ano: parseInt(formData.ano),
          },
        }),
      });
      const result = await response.json();
      const preview = result.data?.previewRelatorioDistrital;
      if (!preview) return;
      // Auto-fill identification (coordinator/technician names come from fetchCoordenacaoByDistrito)
      setFormData(prev => ({
        ...prev,
        periodoInicio: preview.periodoInicio || prev.periodoInicio,
        periodoFim: preview.periodoFim || prev.periodoFim,
        numeroLocalidadesAtendidas: preview.numeroLocalidadesAtendidas ?? prev.numeroLocalidadesAtendidas,
        numeroFamiliasAtendidas: preview.numeroFamiliasAtendidas ?? prev.numeroFamiliasAtendidas,
        numeroTecnicosFormadores: preview.numeroTecnicosFormadores ?? prev.numeroTecnicosFormadores,
      }));
      // Auto-fill session summary
      setResumoSessoes(prev => ({
        ...prev,
        numeroSessoesConduzidas: preview.numeroSessoesConduzidas ?? prev.numeroSessoesConduzidas,
        numeroTotalFamiliasPresentes: preview.numeroFamiliasPresentes ?? prev.numeroTotalFamiliasPresentes,
        numeroSessoesEsperadas: preview.numeroSessoesEsperadas ?? prev.numeroSessoesEsperadas,
        numeroTotalFamiliasEsperadas: preview.numeroFamiliasEsperadas ?? prev.numeroTotalFamiliasEsperadas,
        numeroFamiliasMigraram: preview.numeroFamiliasMigraram ?? prev.numeroFamiliasMigraram,
        numeroSessoesPerdidas: preview.numeroSessoesPerdidas ?? prev.numeroSessoesPerdidas,
      }));
      // Auto-calculate encaminhamentos from PresencaSessao records
      autoCalculateEncaminhamentos(preview.periodoInicio, preview.periodoFim);
      setPreviewLoaded(true);
    } catch (error) {
      console.error('Error fetching preview relatorio:', error);
    }
  };

  const autoCalculateEncaminhamentos = async (periodoInicio, periodoFim) => {
    if (!formData.distritoId || !periodoInicio || !periodoFim) return;
    try {
      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({
          query: presencasEncaminhadasDispQuery,
          variables: { distritoId: formData.distritoId, periodoInicio, periodoFim },
        }),
      });
      const result = await response.json();
      const presencas = result.data?.presencasEncaminhadasDisponiveis?.edges?.map(e => e.node) ?? [];
      // Populate available list for the checkbox selector
      setPresencasDisponiveis(presencas);
      // Auto-select all available (user can deselect)
      if (!initialData?.id) {
        setSelectedPresencasIds(presencas.map(p => p.id));
      }
      // Count per tipoEncaminhamento.codigo for the totals table
      const counts = {};
      presencas.forEach(p => {
        const cod = p.tipoEncaminhamento?.codigo;
        if (cod) counts[cod] = (counts[cod] || 0) + 1;
      });
      setEncaminhamentos(prev => prev.map(e => ({
        ...e,
        numeroTotal: counts[e.codigo] !== undefined ? counts[e.codigo] : e.numeroTotal,
      })));
    } catch (error) {
      console.error('Error fetching presencas encaminhadas:', error);
    }
  };

  const handleChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResumoChange = (field) => (event) => {
    if (readOnly) return;
    const value = parseInt(event.target.value) || 0;
    setResumoSessoes((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompromissosChange = (field) => (event) => {
    if (readOnly) return;
    const value = parseInt(event.target.value) || 0;
    setCompromissos((prev) => ({ ...prev, [field]: value }));
  };

  const handleEncaminhamentoChange = (codigo, value) => {
    if (readOnly) return;
    setEncaminhamentos(prev => prev.map(e =>
      e.codigo === codigo ? { ...e, numeroTotal: parseInt(value) || 0 } : e
    ));
  };

  const handleDistrictSelect = (districtId) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, distritoId: districtId }));
  };

  const handlePeriodSelect = (periodo) => {
    if (readOnly) return;
    setFormData((prev) => ({ ...prev, periodo }));
  };

  const handleAddTecnico = () => {
    if (readOnly) return;
    setTecnicos(prev => [...prev, {
      id: Date.now(),
      nome: "",
      sessoesExecutadas: 0,
      sessoesPerdidas: 0,
      modulos: 0,
      familiasPresentes: 0,
      familiasMigraram: 0,
      naoCompareceram2Sessoes: 0,
      naoCompareceram1Sessao: 0,
    }]);
  };

  const handleRemoveTecnico = (id) => {
    if (readOnly) return;
    setTecnicos(prev => prev.filter(t => t.id !== id));
  };

  const handleTecnicoChange = (id, field, value) => {
    if (readOnly) return;
    setTecnicos(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: field === 'nome' ? value : (parseInt(value) || 0) } : t
    ));
  };

  // Calculate percentages
  const percentualSessoes = resumoSessoes.numeroSessoesEsperadas > 0
    ? ((resumoSessoes.numeroSessoesConduzidas / resumoSessoes.numeroSessoesEsperadas) * 100).toFixed(1)
    : 0;
  const percentualFamilias = resumoSessoes.numeroTotalFamiliasEsperadas > 0
    ? ((resumoSessoes.numeroTotalFamiliasPresentes / resumoSessoes.numeroTotalFamiliasEsperadas) * 100).toFixed(1)
    : 0;

  // Calculate averages
  const mediaFamiliasPresentes = resumoSessoes.numeroSessoesConduzidas > 0
    ? (resumoSessoes.numeroTotalFamiliasPresentes / resumoSessoes.numeroSessoesConduzidas).toFixed(1)
    : 0;
  const mediaFamiliasEsperadas = resumoSessoes.numeroSessoesEsperadas > 0
    ? (resumoSessoes.numeroTotalFamiliasEsperadas / resumoSessoes.numeroSessoesEsperadas).toFixed(1)
    : 0;

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_BIMONTHLY_REPORT}`);
  };

  // Helper to calculate period dates based on periodo and ano
  const calculatePeriodDates = (periodo, ano) => {
    const periodMap = {
      'BIM1': { inicio: `${ano}-01-01`, fim: `${ano}-02-28` },
      'BIM2': { inicio: `${ano}-03-01`, fim: `${ano}-04-30` },
      'BIM3': { inicio: `${ano}-05-01`, fim: `${ano}-06-30` },
      'BIM4': { inicio: `${ano}-07-01`, fim: `${ano}-08-31` },
      'BIM5': { inicio: `${ano}-09-01`, fim: `${ano}-10-31` },
      'BIM6': { inicio: `${ano}-11-01`, fim: `${ano}-12-31` },
    };
    // Handle leap year for February
    if (periodo === 'BIM1') {
      const isLeapYear = (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
      periodMap['BIM1'].fim = isLeapYear ? `${ano}-02-29` : `${ano}-02-28`;
    }
    return periodMap[periodo] || { inicio: '', fim: '' };
  };

  const handleSetEncaminhamentos = async (relatorioRelayId) => {
    if (selectedPresencasIds.length === 0 && presencasDisponiveis.length === 0) return;
    try {
      await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({
          query: setEncaminhamentosMutation,
          variables: { input: { relatorioId: relatorioRelayId, presencasIds: selectedPresencasIds } },
        }),
      });
    } catch (error) {
      console.error('Error setting encaminhamentos:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.distritoId) {
        alert('Por favor, selecione um distrito.');
        return;
      }
      if (!formData.periodo) {
        alert('Por favor, selecione um período.');
        return;
      }
      if (formData.distritoId && !formData.coordenadorDistritalNome) {
        alert('O distrito seleccionado não tem uma Coordenação Distrital activa. Configure-a antes de criar o relatório.');
        return;
      }

      // Calculate period dates if not manually set
      const periodDates = calculatePeriodDates(formData.periodo, formData.ano);
      const periodoInicio = formData.periodoInicio || periodDates.inicio;
      const periodoFim = formData.periodoFim || periodDates.fim;

      // Format dadosTecnicos following documentation structure
      const dadosTecnicosFormatted = tecnicos.map(t => ({
        tecnicoFormador: t.nome,
        sessoesExecutadas: t.sessoesExecutadas,
        sessoesPerdidas: t.sessoesPerdidas,
        modulos: t.modulos,
        familiasPresentes: t.familiasPresentes,
        familiasMigraram: t.familiasMigraram,
        naoCompareceram2Sessoes: t.naoCompareceram2Sessoes,
        naoCompareceram1Sessao: t.naoCompareceram1Sessao,
      }));

      const input = {
        distritoId: formData.distritoId,
        coordenadorDistritalId: formData.coordenadorDistritalId,
        tecnicoAdministrativoId: formData.tecnicoAdministrativoId || null,
        periodo: formData.periodo,
        ano: parseInt(formData.ano),
        periodoInicio: periodoInicio,
        periodoFim: periodoFim,
        numeroLocalidadesAtendidas: parseInt(formData.numeroLocalidadesAtendidas) || 0,
        numeroFamiliasAtendidas: parseInt(formData.numeroFamiliasAtendidas) || 0,
        numeroTecnicosFormadores: parseInt(formData.numeroTecnicosFormadores) || 0,
        numeroSessoesConduzidas: resumoSessoes.numeroSessoesConduzidas,
        numeroSessoesEsperadas: resumoSessoes.numeroSessoesEsperadas,
        numeroFamiliasPresentes: resumoSessoes.numeroTotalFamiliasPresentes,
        numeroFamiliasEsperadas: resumoSessoes.numeroTotalFamiliasEsperadas,
        percentualSessoes: parseFloat(percentualSessoes),
        percentualFamilias: parseFloat(percentualFamilias),
        numeroFamiliasMigraram: resumoSessoes.numeroFamiliasMigraram,
        numeroSessoesPerdidas: resumoSessoes.numeroSessoesPerdidas,
        mediaFamiliaPresente: parseFloat(mediaFamiliasPresentes),
        mediaFamiliaEsperada: parseFloat(mediaFamiliasEsperadas),
        dadosTecnicos: JSON.stringify(dadosTecnicosFormatted),
        dadosEncaminhamentos: JSON.stringify(encaminhamentos.map(e => ({
          codigo: e.codigo,
          descricao: e.descricao,
          numeroTotal: e.numeroTotal,
        }))),
        observacoes: formData.observacoes || "",
      };

      if (initialData?.id) {
        input.id = initialData.id;
      }

      console.log('Sending input:', JSON.stringify(input, null, 2));
      setLoading(true);

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({
          query: initialData?.id ? updateMutation : createMutation,
          variables: { input }
        }),
      });

      const result = await response.json();
      const createData = result.data?.createRelatorioDistrital;
      const updateData = result.data?.updateRelatorioDistrital;
      if (createData || updateData) {
        // Associate selected ENCA families with the report
        let relatorioRelayId = initialData?.id || null;
        if (createData?.internalId) {
          relatorioRelayId = btoa(`RelatorioDistritalBimestral:${createData.internalId}`);
        }
        if (relatorioRelayId) {
          await handleSetEncaminhamentos(relatorioRelayId);
        }
        handleBack();
      } else if (result.errors) {
        console.error('Error saving report:', result.errors);
        alert('Erro ao salvar relatório: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.bimonthlyReport")} />

      {/* Header */}
      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            Ferramenta 05 - Relatório Distrital Bimensal de Execução do PEP+
          </Typography>
        </Button>
      </Paper>

      {/* 1. Marque seu Distrito */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          1. Marque seu Distrito
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={12}>
            <TextField
              fullWidth
              select
              label="Distrito"
              value={formData.distritoId}
              onChange={handleChange("distritoId")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              <MenuItem value="">Selecione o distrito</MenuItem>
              {districts.map((district) => (
                <MenuItem key={district.id} value={district.id}>
                  {district.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* 2. Identificação */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          1. Identificação
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome do Coordenador Distrital"
              value={formData.coordenadorDistritalNome || ''}
              variant="outlined"
              size="small"
              required
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              placeholder={!formData.distritoId ? "Selecione um distrito primeiro" : "A carregar..."}
              helperText={formData.distritoId && !formData.coordenadorDistritalNome ? "⚠️ Distrito sem coordenação activa" : ""}
              error={!!(formData.distritoId && !formData.coordenadorDistritalNome)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nome do Técnico Administrativo"
              value={formData.tecnicoAdministrativoNome || ''}
              variant="outlined"
              size="small"
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              placeholder={!formData.distritoId ? "Selecione um distrito primeiro" : "Não definido"}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Número de Localidades Atendidas"
              value={formData.numeroLocalidadesAtendidas}
              onChange={handleChange("numeroLocalidadesAtendidas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Número de Famílias Atendidas"
              value={formData.numeroFamiliasAtendidas}
              onChange={handleChange("numeroFamiliasAtendidas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Número de Técnicos Formadores"
              value={formData.numeroTecnicosFormadores}
              onChange={handleChange("numeroTecnicosFormadores")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Marque o Período do Relatório */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          3. Marque o Período do Relatório
        </Typography>
        <Grid container spacing={2}>
          {PERIODO_OPTIONS.map((periodo) => (
            <Grid item xs={12} sm={4} key={periodo.value}>
              <Box
                className={`${classes.periodChip} ${formData.periodo === periodo.value ? classes.periodChipSelected : ''}`}
                onClick={() => handlePeriodSelect(periodo.value)}
                style={{ textAlign: 'center' }}
              >
                {periodo.label}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* 4. Resumo das Sessões Realizadas */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          4. Resumo das Sessões Realizadas
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número de Sessões Conduzidas"
              value={resumoSessoes.numeroSessoesConduzidas}
              onChange={handleResumoChange("numeroSessoesConduzidas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número Total de Famílias Presentes"
              value={resumoSessoes.numeroTotalFamiliasPresentes}
              onChange={handleResumoChange("numeroTotalFamiliasPresentes")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número de Sessões Esperadas"
              value={resumoSessoes.numeroSessoesEsperadas}
              onChange={handleResumoChange("numeroSessoesEsperadas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número Total de Famílias Esperadas"
              value={resumoSessoes.numeroTotalFamiliasEsperadas}
              onChange={handleResumoChange("numeroTotalFamiliasEsperadas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography className={classes.percentText}>
              Percentual de Sessões: {percentualSessoes}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography className={classes.percentText}>
              Percentual de Famílias: {percentualFamilias}%
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número Total de Famílias que Migraram"
              value={resumoSessoes.numeroFamiliasMigraram}
              onChange={handleResumoChange("numeroFamiliasMigraram")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Número Total de Sessões Perdidas"
              value={resumoSessoes.numeroSessoesPerdidas}
              onChange={handleResumoChange("numeroSessoesPerdidas")}
              variant="outlined"
              size="small"
              disabled={readOnly || previewLoaded}
              helperText={previewLoaded ? "Calculado automaticamente" : ""}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 5. Médias */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          5. Médias
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">Média de Famílias Presentes por Sessão</Typography>
            <Typography variant="h5" className={classes.percentText}>{mediaFamiliasPresentes}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1">Média de Famílias Esperadas por Sessão</Typography>
            <Typography variant="h5" className={classes.percentText}>{mediaFamiliasEsperadas}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 6. Tabela com Número Total de Sessões Por Técnico Responsável */}
      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" className={classes.sectionTitle} style={{ marginBottom: 0 }}>
            6. Tabela com Número Total de Sessões Por Técnico Responsável
          </Typography>
          {/* {!readOnly && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddTecnico}
              size="small"
            >
              Adicionar Técnico
            </Button>
          )} */}
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell>Técnico Formador</TableCell>
                <TableCell>Sessões Executadas</TableCell>
                <TableCell>Sessões Perdidas</TableCell>
                <TableCell>Módulos</TableCell>
                <TableCell>Famílias Presentes</TableCell>
                <TableCell>Famílias Migraram</TableCell>
                <TableCell>Não Compareceram 2 Sessões</TableCell>
                <TableCell>Não Compareceram 1 Sessão</TableCell>
                {/* {!readOnly && <TableCell>Ações</TableCell>} */}
              </TableRow>
            </TableHead>
            <TableBody>
              {tecnicos.map((tecnico) => (
                <TableRow key={tecnico.id}>
                  <TableCell>
                    <TextField
                      value={tecnico.nome}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'nome', e.target.value)}
                      variant="outlined"
                      size="small"
                      placeholder="Nome do técnico"
                      disabled={readOnly}
                      fullWidth
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.sessoesExecutadas}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'sessoesExecutadas', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.sessoesPerdidas}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'sessoesPerdidas', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.modulos}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'modulos', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.familiasPresentes}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'familiasPresentes', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.familiasMigraram}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'familiasMigraram', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.naoCompareceram2Sessoes}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'naoCompareceram2Sessoes', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={tecnico.naoCompareceram1Sessao}
                      onChange={(e) => handleTecnicoChange(tecnico.id, 'naoCompareceram1Sessao', e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 80 }}
                    />
                  </TableCell>
                  {/* {!readOnly && (
                    <TableCell className={classes.tableCell}>
                      <Tooltip title="Remover">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveTecnico(tecnico.id)}
                          style={{ color: "#d32f2f" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 7. Compromissos */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          7. Compromissos (total de incidência do compromisso por distrito)
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Nenhum Compromisso Praticado"
              helperText="Número de cuidadores que não conseguiram praticar nenhum compromisso assumido na sessão anterior."
              value={compromissos.nenhumCompromissoPraticado}
              onChange={handleCompromissosChange("nenhumCompromissoPraticado")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="10-15 Cuidadores"
              helperText="Número de cuidadores que tiveram entre alto grau de compromissos (10 a 15 cuidadores)."
              value={compromissos.dez15Cuidadores}
              onChange={handleCompromissosChange("dez15Cuidadores")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="1-5 Cuidadores"
              helperText="Número de cuidadores que praticaram os compromissos, mas em menor escala (1 a 5 cuidadores)."
              value={compromissos.um5Cuidadores}
              onChange={handleCompromissosChange("um5Cuidadores")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Mais de 15 Cuidadores"
              helperText="Número de cuidadores que praticaram os compromissos de forma muito ampla (mais de 15 cuidadores)."
              value={compromissos.mais15Cuidadores}
              onChange={handleCompromissosChange("mais15Cuidadores")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="6-10 Cuidadores"
              helperText="Número de cuidadores que praticaram os compromissos de maneira moderada (6 a 10 cuidadores)."
              value={compromissos.seis10Cuidadores}
              onChange={handleCompromissosChange("seis10Cuidadores")}
              variant="outlined"
              size="small"
              disabled={readOnly}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* 8. Encaminhamentos */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          8. Encaminhamentos (total de encaminhamento no distrito)
        </Typography>

        {/* 8a. Famílias encaminhadas disponíveis (checkboxes) */}
        {presencasDisponiveis.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle1" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Famílias Encaminhadas no Período
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginBottom: 8 }}>
              Selecione as famílias a incluir neste relatório:
            </Typography>
            <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {presencasDisponiveis.map((p) => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      checked={selectedPresencasIds.includes(p.id)}
                      onChange={(e) => {
                        if (readOnly) return;
                        setSelectedPresencasIds(prev =>
                          e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                        );
                      }}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {p.nomeFamilia || p.familiaId}
                      {p.tipoEncaminhamento?.nome ? ` — ${p.tipoEncaminhamento.nome}` : ''}
                      {p.sessao?.codigoSessao ? ` (${p.sessao.codigoSessao})` : ''}
                    </Typography>
                  }
                  style={{ minWidth: 280, margin: 0 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 8b. Totals per tipo (auto-calculated, still editable) */}
        <TableContainer>
          <Table size="small">
            <TableHead className={classes.tableHeader}>
              <TableRow>
                <TableCell style={{ width: 80 }}>Código</TableCell>
                <TableCell>Encaminhamento</TableCell>
                <TableCell style={{ width: 150 }}>Número Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {encaminhamentos.map((enc) => (
                <TableRow key={enc.codigo}>
                  <TableCell className={classes.tableCell} style={{ fontWeight: 'bold' }}>
                    {enc.codigo}
                  </TableCell>
                  <TableCell>{enc.descricao}</TableCell>
                  <TableCell className={classes.tableCell}>
                    <TextField
                      type="number"
                      value={enc.numeroTotal}
                      onChange={(e) => handleEncaminhamentoChange(enc.codigo, e.target.value)}
                      variant="outlined"
                      size="small"
                      disabled={readOnly}
                      style={{ width: 100 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 8c. Gestão individual de encaminhamentos (após salvar) */}
      {initialData?.id && !readOnly && (
        <Paper className={classes.paper}>
          <Typography variant="h6" className={classes.sectionTitle}>
            8c. Gerir Encaminhamentos do Relatório
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginBottom: 16 }}>
            Adicione ou remova encaminhamentos individuais deste relatório.
          </Typography>

          {presencasDisponiveis.filter(p => selectedPresencasIds.includes(p.id)).length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Encaminhamentos vinculados:
              </Typography>
              {presencasDisponiveis.filter(p => selectedPresencasIds.includes(p.id)).map(p => (
                <Box key={p.id} display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" style={{ flex: 1 }}>
                    {p.nomeFamilia || p.familiaId} — {p.tipoEncaminhamento?.nome || ''} ({p.sessao?.codigoSessao || ''})
                  </Typography>
                  <Button
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onClick={async () => {
                      try {
                        await fetch(`${baseApiUrl}/graphql`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
                          body: JSON.stringify({
                            query: removeEncaminhamentoRelatorioMutation,
                            variables: { input: { relatorioId: initialData.id, presencaId: p.id } },
                          }),
                        });
                        setSelectedPresencasIds(prev => prev.filter(id => id !== p.id));
                      } catch (e) {
                        console.error('Error removing encaminhamento:', e);
                        alert('Erro ao remover encaminhamento.');
                      }
                    }}
                  >
                    Remover
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {presencasDisponiveis.filter(p => !selectedPresencasIds.includes(p.id)).length > 0 && (
            <Box>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Adicionar encaminhamento disponível:
              </Typography>
              {presencasDisponiveis.filter(p => !selectedPresencasIds.includes(p.id)).map(p => (
                <Box key={p.id} display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" style={{ flex: 1 }}>
                    {p.nomeFamilia || p.familiaId} — {p.tipoEncaminhamento?.nome || ''} ({p.sessao?.codigoSessao || ''})
                  </Typography>
                  <Button
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={async () => {
                      try {
                        await fetch(`${baseApiUrl}/graphql`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken'), ...apiHeaders() },
                          body: JSON.stringify({
                            query: addEncaminhamentoRelatorioMutation,
                            variables: { input: { relatorioId: initialData.id, presencaId: p.id } },
                          }),
                        });
                        setSelectedPresencasIds(prev => [...prev, p.id]);
                      } catch (e) {
                        console.error('Error adding encaminhamento:', e);
                        alert('Erro ao adicionar encaminhamento.');
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Observações */}
      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          Observações
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Observações adicionais"
          value={formData.observacoes}
          onChange={handleChange("observacoes")}
          variant="outlined"
          disabled={readOnly}
        />
      </Paper>

      {/* Buttons */}
      <Box className={classes.buttonContainer}>
        <Button
          variant="outlined"
          onClick={handleBack}
        >
          {readOnly ? formatMessage(intl, "prl", "button.back") : formatMessage(intl, "prl", "button.cancel")}
        </Button>
        {!readOnly && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
          >
            Submeter Relatório Distrital
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(BimonthlyReportFormPage))));
