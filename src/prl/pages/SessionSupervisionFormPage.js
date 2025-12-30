import { useState } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@material-ui/core";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PRL_ROUTE_SUPERVISION } from "../constants";

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

function SessionSupervisionFormPage(props) {
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
    supervisorId: "",
    formadorId: "",
    dataSupervisao: "",
    dataModuloAnterior: "",
    identificadorGrupo: "",
    avaliacoes: [
      {
        secao: "Práticas Positivas e Estratégias Relatadas",
        descricao: "Avalie as práticas e estratégias observadas durante a supervisão",
        fieldName: "observacoesPraticas",
        itens: [
          { id: 1, descricao: "Cuidadores mantêm rotinas diárias consistentes", resposta: null },
          { id: 2, descricao: "Comunicam-se positivamente com as crianças", resposta: null },
          { id: 3, descricao: "Estimulam a aprendizagem através do brincar", resposta: null },
          { id: 4, descricao: "Implementam hábitos alimentares saudáveis", resposta: null },
          { id: 5, descricao: "Promovem comportamentos positivos", resposta: null },
        ]
      },
      {
        secao: "Transmissão de Mensagens Chave",
        descricao: "Avalie a transmissão das mensagens chave durante a sessão",
        fieldName: "observacoesTransmissao",
        itens: [
          { id: 6, descricao: "Mensagens sobre saúde e higiene foram transmitidas", resposta: null },
          { id: 7, descricao: "Mensagens sobre nutrição foram abordadas", resposta: null },
          { id: 8, descricao: "Mensagens sobre desenvolvimento infantil foram cobertas", resposta: null },
          { id: 9, descricao: "Mensagens sobre bem-estar psicossocial foram discutidas", resposta: null },
        ]
      },
      {
        secao: "Gestão de Desafios",
        descricao: "Avalie como os desafios foram gerenciados",
        fieldName: "observacoesDesafios",
        itens: [
          { id: 10, descricao: "Foram identificados momentos desafiadores", resposta: null },
          { id: 11, descricao: "Estratégias de manejo foram aplicadas adequadamente", resposta: null },
          { id: 12, descricao: "Os cuidadores responderam bem às estratégias", resposta: null },
          { id: 13, descricao: "Houve melhoria no comportamento das crianças", resposta: null },
        ]
      },
      {
        secao: "Alcance dos Objetivos",
        descricao: "Avalie o alcance dos objetivos da sessão",
        fieldName: "observacoesObjetivos",
        itens: [
          { id: 14, descricao: "Os objetivos da sessão foram atingidos", resposta: null },
          { id: 15, descricao: "A participação dos cuidadores foi adequada", resposta: null },
          { id: 16, descricao: "O tempo de sessão foi suficiente", resposta: null },
          { id: 17, descricao: "O ambiente foi apropriado para a atividade", resposta: null },
        ]
      },
    ],
    observacoesPraticas: "",
    observacoesTransmissao: "",
    observacoesDesafios: "",
    observacoesObjetivos: "",
    pontosPositivos: "",
    pontosMelhorar: "",
    observacoes: "",
  });

  const [loading, setLoading] = useState(false);

  const createMutation = `mutation CreateSupervisaoSessao($input: CreateSupervisaoSessaoMutationInput!) {
    createSupervisaoSessao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    history.push(`/${PRL_ROUTE_SUPERVISION}`);
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.sessaoId) {
        alert('Por favor, selecione uma sessão.');
        return;
      }
      if (!formData.supervisorId) {
        alert('Por favor, selecione um supervisor.');
        return;
      }
      if (!formData.formadorId) {
        alert('Por favor, selecione um formador.');
        return;
      }
      if (!formData.dataSupervisao) {
        alert('Por favor, defina a data de supervisão.');
        return;
      }
      if (!formData.identificadorGrupo) {
        alert('Por favor, defina o identificador do grupo.');
        return;
      }

      // Construir perguntasAvaliacao como JSON string
      const perguntasAvaliacao = {};
      formData.avaliacoes.forEach((secao) => {
        secao.itens.forEach((item) => {
          perguntasAvaliacao[`pergunta_${item.id}`] = item.resposta || "nao_respondido";
        });
      });

      const input = {
        sessaoId: parseInt(formData.sessaoId),
        supervisorId: parseInt(formData.supervisorId),
        formadorId: parseInt(formData.formadorId),
        dataSupervisao: formData.dataSupervisao,
        identificadorGrupo: formData.identificadorGrupo,
        dataModuloAnterior: formData.dataModuloAnterior || null,
        perguntasAvaliacao: JSON.stringify(perguntasAvaliacao),
        pontosPositivos: formData.pontosPositivos || null,
        pontosMelhorar: formData.pontosMelhorar || null,
        observacoes: formData.observacoes || null,
      };

      setLoading(true);

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
      if (result.data?.createSupervisaoSessao) {
        handleBack();
      } else if (result.errors) {
        console.error('Error creating session supervision:', result.errors);
        alert('Erro ao criar supervisão de sessão: ' + result.errors[0].message);
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
      <Helmet title={formatMessage(intl, "prl", "title.supervision")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "title.supervision")}
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
              helperText="ID da sessão a ser supervisionada"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="ID do Supervisor"
              value={formData.supervisorId}
              onChange={handleChange("supervisorId")}
              type="number"
              variant="outlined"
              size="small"
              required
              helperText="ID do supervisor responsável"
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
              label="Data de Supervisão"
              value={formData.dataSupervisao}
              onChange={handleChange("dataSupervisao")}
              type="date"
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data do Módulo Anterior (Opcional)"
              value={formData.dataModuloAnterior}
              onChange={handleChange("dataModuloAnterior")}
              type="date"
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Identificador do Grupo"
              value={formData.identificadorGrupo}
              onChange={handleChange("identificadorGrupo")}
              variant="outlined"
              size="small"
              required
              helperText="Identificador único do grupo (ex: GRP01)"
            />
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
            </Grid>
          ))}
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Resumo da Supervisão
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pontos Positivos"
              value={formData.pontosPositivos}
              onChange={handleChange("pontosPositivos")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Descreva os pontos positivos observados durante a supervisão"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Pontos a Melhorar"
              value={formData.pontosMelhorar}
              onChange={handleChange("pontosMelhorar")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Descreva os pontos que precisam de melhoria"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações Gerais"
              value={formData.observacoes}
              onChange={handleChange("observacoes")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              placeholder="Adicione observações gerais sobre a supervisão"
            />
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
export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionSupervisionFormPage))));
