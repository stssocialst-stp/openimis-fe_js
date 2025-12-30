import { useState, useCallback } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@material-ui/core";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";

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
  tableContainer: {
    marginBottom: theme.spacing(2),
  },
  tableCell: {
    textAlign: "center",
    padding: theme.spacing(1),
    cursor: "pointer",
  },
  descriptionCell: {
    textAlign: "left",
  },
  markedCell: {
    backgroundColor: "#e8f5e9",
  },
  markIcon: {
    color: "#4caf50",
    fontSize: "24px",
  },
});

function SessionExecutionFormPage(props) {
  const { classes, intl, history } = props;

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

  const [formData, setFormData] = useState({
    sessaoId: "",
    formadorId: "",
    supervisorId: "",
    localidadeId: "",
    numeroParticipantesCompromissos: 0,
    necessitaEncaminhamento: false,
    avaliacoes: [
      {
        secao: "Estímulos e Promoção de Brincar",
        descricao: "O facilitador promoveu oportunidades para estimular a criança a aprender através da brincadeira.",
        fieldName: "observacoesEstimulos",
        itens: [
          { id: 1, descricao: "Promoveu a participação ativa de todas as crianças presentes", resposta: null },
          { id: 2, descricao: "Realizou comportamentos positivos com crianças na sessão", resposta: null },
          { id: 3, descricao: "Utilizou adequadamente técnicas de reforço positivo", resposta: null },
          { id: 4, descricao: "Incentivou a exploração e descoberta durante a sessão", resposta: null },
          { id: 5, descricao: "Fomentou interações entre as crianças durante as atividades", resposta: null },
          { id: 6, descricao: "Promoveu a criatividade e imaginação das crianças", resposta: null },
          { id: 7, descricao: "Utilizou materiais e recursos apropriados para a idade", resposta: null },
          { id: 8, descricao: "Adaptou as atividades para diferentes níveis de desenvolvimento", resposta: null },
          { id: 9, descricao: "Estabeleceu limites e regras de forma clara e consistente", resposta: null },
          { id: 10, descricao: "Proporcionou feedback construtivo às crianças", resposta: null },
        ]
      },
      {
        secao: "Práticas Positivas e Estratégias Relatadas pelos Cuidadores",
        descricao: "Responda sim ou não as afirmações abaixo",
        fieldName: "observacoesPraticas",
        itens: [
          { id: 11, descricao: "Cuidaram de si mesmo para garantir melhor qualidade de cuidado para as crianças.", resposta: null },
          { id: 12, descricao: "Mantiveram rotinas diárias consistentes", resposta: null },
          { id: 13, descricao: "Comunicaram-se positivamente com as crianças", resposta: null },
          { id: 14, descricao: "Estimularam a aprendizagem através do brincar", resposta: null },
          { id: 15, descricao: "Implementaram hábitos alimentares saudáveis", resposta: null },
        ]
      },
      {
        secao: "Registros de Transmissão das Mensagens Chave",
        descricao: "Registre as mensagens transmitidas durante a sessão",
        fieldName: "observacoesTransmissao",
        itens: [
          { id: 16, descricao: "Mensagens sobre saúde e higiene foram compartilhadas", resposta: null },
          { id: 17, descricao: "Mensagens sobre nutrição foram discutidas", resposta: null },
          { id: 18, descricao: "Mensagens sobre desenvolvimento infantil foram abordadas", resposta: null },
          { id: 19, descricao: "Mensagens sobre bem-estar psicossocial foram cobertas", resposta: null },
        ]
      },
      {
        secao: "Momentos Difíceis e Estratégias de Manejo",
        descricao: "Descreva como foi tratado",
        fieldName: "observacoesMomentos",
        itens: [
          { id: 20, descricao: "Foram identificados momentos desafiadores durante a sessão", resposta: null },
          { id: 21, descricao: "Estratégias de manejo foram aplicadas adequadamente", resposta: null },
          { id: 22, descricao: "Os cuidadores responderam bem às estratégias propostas", resposta: null },
          { id: 23, descricao: "Houve melhoria no comportamento das crianças após intervenção", resposta: null },
        ]
      },
      {
        secao: "Avaliação e Supervisão",
        descricao: "Avaliação geral da execução da sessão",
        fieldName: "observacoesAvaliacao",
        itens: [
          { id: 24, descricao: "Os objetivos da sessão foram atingidos", resposta: null },
          { id: 25, descricao: "A participação dos cuidadores foi adequada", resposta: null },
          { id: 26, descricao: "O tempo de sessão foi suficiente", resposta: null },
          { id: 27, descricao: "O ambiente foi apropriado para a atividade", resposta: null },
          { id: 28, descricao: "Houve necessidade de acompanhamento adicional", resposta: null },
        ]
      },
    ],
    observacoesEstimulos: "",
    observacoesPraticas: "",
    observacoesTransmissao: "",
    observacoesMomentos: "",
    observacoesAvaliacao: "",
  });

  const [loading, setLoading] = useState(false);

  const createMutation = `mutation CreateExecucaoSessao($input: CreateExecucaoSessaoMutationInput!) {
    createExecucaoSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

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

  const handleAvaliacaoChange = (id, resposta) => {
    setFormData((prev) => ({
      ...prev,
      avaliacoes: prev.avaliacoes.map((secao) => ({
        ...secao,
        itens: secao.itens.map((item) =>
          item.id === id ? { ...item, resposta } : item
        ),
      })),
    }));
  };

  const handleBack = () => {
    history.push('/prl/execution');
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.sessaoId) {
        alert('Por favor, selecione uma sessão.');
        return;
      }
      if (!formData.formadorId) {
        alert('Por favor, selecione um formador.');
        return;
      }

      const input = {
        sessaoId: parseInt(formData.sessaoId),
        formadorId: parseInt(formData.formadorId),
        supervisorId: formData.supervisorId ? parseInt(formData.supervisorId) : null,
        localidadeId: formData.localidadeId ? parseInt(formData.localidadeId) : null,
        numeroParticipantesCompromissos: formData.numeroParticipantesCompromissos || 0,
        necessitaEncaminhamento: formData.necessitaEncaminhamento,
      };

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: createMutation, variables: { input } }),
      });

      const result = await response.json();
      if (result.data?.createExecucaoSessao) {
        handleBack();
      } else if (result.errors) {
        console.error('Error creating session execution:', result.errors);
        alert('Erro ao criar execução de sessão: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.createExecution")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "title.createExecution")}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Informações Básicas
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID da Sessão"
              value={formData.sessaoId}
              onChange={handleChange("sessaoId")}
              type="number"
              variant="outlined"
              size="small"
              required
              helperText="ID da sessão planejada"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID do Formador"
              value={formData.formadorId}
              onChange={handleChange("formadorId")}
              type="number"
              variant="outlined"
              size="small"
              required
              helperText="ID do técnico social formador"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID do Supervisor (Opcional)"
              value={formData.supervisorId}
              onChange={handleChange("supervisorId")}
              type="number"
              variant="outlined"
              size="small"
              helperText="ID do supervisor"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID da Localidade (Opcional)"
              value={formData.localidadeId}
              onChange={handleChange("localidadeId")}
              type="number"
              variant="outlined"
              size="small"
              helperText="ID da localidade onde ocorreu a sessão"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Participantes"
              value={formData.numeroParticipantesCompromissos}
              onChange={handleNumberChange("numeroParticipantesCompromissos")}
              type="number"
              variant="outlined"
              size="small"
              helperText="Número de participantes com compromissos"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Necessita Encaminhamento"
              value={formData.necessitaEncaminhamento}
              onChange={handleBooleanChange("necessitaEncaminhamento")}
              variant="outlined"
              size="small"
            >
              <MenuItem value={false}>Não</MenuItem>
              <MenuItem value={true}>Sim</MenuItem>
            </TextField>
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Avaliações e Observações
            </Typography>
          </Grid>

          {formData.avaliacoes.map((secao) => (
            <Grid item xs={12} key={secao.secao}>
              <Typography variant="body1" style={{ fontWeight: "bold", marginBottom: "8px" }}>
                {secao.secao}
              </Typography>
              <Typography variant="caption" style={{ display: "block", marginBottom: "12px", color: "#666" }}>
                {secao.descricao}
              </Typography>
              <TableContainer className={classes.tableContainer}>
                <Table>
                  <TableHead>
                    <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell className={classes.descriptionCell}>
                        <Typography variant="body2" style={{ fontWeight: "bold" }}>
                          Descrição
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Typography variant="body2" style={{ fontWeight: "bold" }}>
                          Sim
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Typography variant="body2" style={{ fontWeight: "bold" }}>
                          Não
                        </Typography>
                      </TableCell>
                      <TableCell className={classes.tableCell}>
                        <Typography variant="body2" style={{ fontWeight: "bold" }}>
                          N/A
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {secao.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className={classes.descriptionCell}>
                          <Typography variant="body2">{item.descricao}</Typography>
                        </TableCell>
                        <TableCell
                          className={`${classes.tableCell} ${item.resposta === "sim" ? classes.markedCell : ""}`}
                          onClick={() => handleAvaliacaoChange(item.id, "sim")}
                        >
                          {item.resposta === "sim" && (
                            <FiberManualRecordIcon className={classes.markIcon} />
                          )}
                        </TableCell>
                        <TableCell
                          className={`${classes.tableCell} ${item.resposta === "nao" ? classes.markedCell : ""}`}
                          onClick={() => handleAvaliacaoChange(item.id, "nao")}
                        >
                          {item.resposta === "nao" && (
                            <FiberManualRecordIcon className={classes.markIcon} />
                          )}
                        </TableCell>
                        <TableCell
                          className={`${classes.tableCell} ${item.resposta === "na" ? classes.markedCell : ""}`}
                          onClick={() => handleAvaliacaoChange(item.id, "na")}
                        >
                          {item.resposta === "na" && (
                            <FiberManualRecordIcon className={classes.markIcon} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Grid container spacing={2} style={{ marginTop: "8px" }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observações"
                    value={formData[secao.fieldName]}
                    onChange={handleChange(secao.fieldName)}
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Adicione observações sobre esta seção"
                  />
                </Grid>
              </Grid>
            </Grid>
          ))}
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionExecutionFormPage))));