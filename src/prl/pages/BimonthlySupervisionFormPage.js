import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, Divider, Box, Card, CardContent, IconButton, Checkbox, FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import DeleteIcon from "@material-ui/icons/Delete";
import AddIcon from "@material-ui/icons/Add";
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
  readOnlyField: {
    backgroundColor: "#f5f5f5",
  },
});

function BimonthlySupervisionFormPage(props) {
  const { classes, intl, history, location } = props;
  const isView = location.state?.isView || false;
  const initialData = location.state?.data || null;
  const supervisionId = location.pathname.split('/').pop();

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
    dataReuniao: "",
    horario: "",
    coordenadorNacional: "",
    participantes: "",
    resumoAgenda: "",
    desafiosSolucoes: "",
    oportunidadesPraticas: "",
    analiseDadosTendencias: "",
    acoesDefinidas: "",
    dataProximaReuniao: "",
    observacoesProximaReuniao: "",
  });

  const [agendaItems, setAgendaItems] = useState([]);
  const [newAgendaItem, setNewAgendaItem] = useState({
    topico: "",
    duracao: "",
    concluido: false,
  });

  const [loading, setLoading] = useState(false);

  const createMutation = `mutation CreateRoteiroReuniao($input: CreateRoteiroReuniaoMutationInput!) {
    createRoteiroReuniao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  const updateMutation = `mutation UpdateRoteiroReuniao($input: UpdateRoteiroReuniaoMutationInput!) {
    updateRoteiroReuniao(input: $input) {
      clientMutationId
      internalId
    }
  }`;

  useEffect(() => {
    if (initialData && supervisionId !== 'new') {
      setFormData({
        dataReuniao: initialData.dataReuniao ? initialData.dataReuniao.split('T')[0] : "",
        horario: initialData.horario || "",
        coordenadorNacional: initialData.coordenadorNacional || "",
        participantes: initialData.participantes || "",
        resumoAgenda: initialData.resumoAgenda || "",
        desafiosSolucoes: initialData.desafiosSolucoes || "",
        oportunidadesPraticas: initialData.oportunidadesPraticas || "",
        analiseDadosTendencias: initialData.analiseDadosTendencias || "",
        acoesDefinidas: initialData.acoesDefinidas || "",
        dataProximaReuniao: initialData.dataProximaReuniao ? initialData.dataProximaReuniao.split('T')[0] : "",
        observacoesProximaReuniao: initialData.observacoesProximaReuniao || "",
      });

      // Parse resumoAgenda se for válido
      console.log('initialData:', initialData);
      console.log('initialData.resumoAgenda:', initialData.resumoAgenda);
      if (initialData.resumoAgenda) {
        try {
          const parsed = JSON.parse(initialData.resumoAgenda);
          console.log('Parsed agenda items:', parsed);
          if (Array.isArray(parsed)) {
            setAgendaItems(parsed);
          } else if (parsed && typeof parsed === 'object') {
            setAgendaItems([]);
          }
        } catch (e) {
          console.log('Could not parse resumoAgenda:', initialData.resumoAgenda, 'Error:', e);
          setAgendaItems([]);
        }
      } else {
        console.log('resumoAgenda is empty or undefined');
        setAgendaItems([]);
      }
    }
  }, [initialData, supervisionId]);

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    history.push('/prl/bimonthlySupervision');
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaItem.topico || !newAgendaItem.duracao) {
      alert('Por favor, preencha tópico e duração.');
      return;
    }

    const newItem = {
      topico: newAgendaItem.topico,
      duracao: parseInt(newAgendaItem.duracao, 10),
      concluido: newAgendaItem.concluido,
    };

    setAgendaItems([...agendaItems, newItem]);
    setNewAgendaItem({ topico: "", duracao: "", concluido: false });
  };

  const handleRemoveAgendaItem = (index) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const handleToggleAgendaItem = (index) => {
    const updated = [...agendaItems];
    updated[index].concluido = !updated[index].concluido;
    setAgendaItems(updated);
  };

  const handleSave = async () => {
    try {
      if (!formData.dataReuniao) {
        alert('Por favor, preencha a data da reunião.');
        return;
      }
      if (!formData.coordenadorNacional) {
        alert('Por favor, preencha o coordenador nacional.');
        return;
      }
      if (!formData.horario) {
        alert('Por favor, preencha o horário da reunião.');
        return;
      }
      if (!formData.participantes) {
        alert('Por favor, preencha o campo de participantes.');
        return;
      }
      if (!formData.desafiosSolucoes) {
        alert('Por favor, preencha desafios e soluções.');
        return;
      }
      if (!formData.oportunidadesPraticas) {
        alert('Por favor, preencha oportunidades e práticas.');
        return;
      }
      if (!formData.analiseDadosTendencias) {
        alert('Por favor, preencha análise de dados e tendências.');
        return;
      }
      if (!formData.acoesDefinidas) {
        alert('Por favor, preencha ações definidas.');
        return;
      }

      const input = {
        dataReuniao: formData.dataReuniao,
        horario: formData.horario,
        coordenadorNacional: formData.coordenadorNacional,
        participantes: formData.participantes,
        resumoAgenda: agendaItems.length > 0 ? JSON.stringify(agendaItems) : "{}",
        desafiosSolucoes: formData.desafiosSolucoes,
        oportunidadesPraticas: formData.oportunidadesPraticas,
        analiseDadosTendencias: formData.analiseDadosTendencias,
        acoesDefinidas: formData.acoesDefinidas,
        dataProximaReuniao: formData.dataProximaReuniao || null,
        observacoesProximaReuniao: formData.observacoesProximaReuniao || "",
      };

      if (supervisionId !== 'new') {
        input.id = supervisionId;
      }

      const mutation = supervisionId === 'new' ? createMutation : updateMutation;
      const mutationName = supervisionId === 'new' ? 'createRoteiroReuniao' : 'updateRoteiroReuniao';

      setLoading(true);

      console.log('Sending payload:', JSON.stringify({ query: mutation, variables: { input } }));

      const response = await fetch(`${baseApiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
          ...apiHeaders(),
        },
        body: JSON.stringify({ query: mutation, variables: { input } }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      console.log('Response text:', text);

      const result = JSON.parse(text);
      if (result.data?.[mutationName]) {
        handleBack();
      } else if (result.errors) {
        console.error('Error saving supervision:', result.errors);
        alert('Erro ao salvar: ' + result.errors[0].message);
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = isView ? { disabled: true, className: classes.readOnlyField } : {};

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", isView ? "title.viewSupervision" : "title.createSupervision")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", isView ? "title.viewSupervision" : "title.createSupervision")}
          </Typography>
        </Button>

        <Divider style={{ margin: "16px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Informações da Reunião
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label={formatMessage(intl, "prl", "bimonthlySupervision.date")}
              value={formData.dataReuniao}
              onChange={handleChange("dataReuniao")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label={formatMessage(intl, "prl", "bimonthlySupervision.time")}
              value={formData.horario}
              onChange={handleChange("horario")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.coordinator")}
              value={formData.coordenadorNacional}
              onChange={handleChange("coordenadorNacional")}
              variant="outlined"
              size="small"
              required
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label={formatMessage(intl, "prl", "bimonthlySupervision.nextDate")}
              value={formData.dataProximaReuniao}
              onChange={handleChange("dataProximaReuniao")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.participants")}
              value={formData.participantes}
              onChange={handleChange("participantes")}
              variant="outlined"
              size="small"
              multiline
              rows={2}
              required
              {...fieldProps}
            />
          </Grid>
        </Grid>

        <Divider style={{ margin: "24px 0" }} />

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Detalhes da Reunião
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" className={classes.sectionTitle}>
              Agenda da Reunião
            </Typography>
          </Grid>

          {!isView && (
            <Grid item xs={12}>
              <Card style={{ marginBottom: 16 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Tópico"
                        value={newAgendaItem.topico}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, topico: e.target.value })}
                        variant="outlined"
                        size="small"
                        placeholder="Ex: Abertura e Boas-vindas"
                      />
                    </Grid>

                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Duração (min)"
                        type="number"
                        value={newAgendaItem.duracao}
                        onChange={(e) => setNewAgendaItem({ ...newAgendaItem, duracao: e.target.value })}
                        variant="outlined"
                        size="small"
                        inputProps={{ min: "1" }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={3} style={{ display: "flex", alignItems: "center" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={newAgendaItem.concluido}
                            color="primary"
                            onChange={(e) => setNewAgendaItem({ ...newAgendaItem, concluido: e.target.checked })}
                          />
                        }
                        label="Concluído"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={handleAddAgendaItem}
                      >
                        Adicionar Item
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {agendaItems.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Table size="small">
                    <TableHead>
                      <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell style={{ fontWeight: "bold" }}>Tópico</TableCell>
                        <TableCell align="center" style={{ fontWeight: "bold" }}>Duração (min)</TableCell>
                        <TableCell align="center" style={{ fontWeight: "bold" }}>Concluído</TableCell>
                        {!isView && <TableCell align="center" style={{ fontWeight: "bold" }}>Ações</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agendaItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.topico}</TableCell>
                          <TableCell align="center">{item.duracao}</TableCell>
                          <TableCell align="center">
                            {!isView ? (
                              <Checkbox
                                checked={item.concluido}
                                onChange={() => handleToggleAgendaItem(index)}
                                color="primary"
                              />
                            ) : (
                              item.concluido ? "✓" : "✗"
                            )}
                          </TableCell>
                          {!isView && (
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveAgendaItem(index)}
                                style={{ color: "#f44336" }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}

          {agendaItems.length === 0 && !isView && (
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" style={{ fontStyle: "italic" }}>
                Nenhum item de agenda adicionado ainda.
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.challengesAndSolutions")}
              value={formData.desafiosSolucoes}
              onChange={handleChange("desafiosSolucoes")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              required
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.opportunitiesAndPractices")}
              value={formData.oportunidadesPraticas}
              onChange={handleChange("oportunidadesPraticas")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              required
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.dataAnalysis")}
              value={formData.analiseDadosTendencias}
              onChange={handleChange("analiseDadosTendencias")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              required
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.definedActions")}
              value={formData.acoesDefinidas}
              onChange={handleChange("acoesDefinidas")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              required
              {...fieldProps}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "bimonthlySupervision.nextMeetingObservations")}
              value={formData.observacoesProximaReuniao}
              onChange={handleChange("observacoesProximaReuniao")}
              variant="outlined"
              size="small"
              multiline
              rows={3}
              {...fieldProps}
            />
          </Grid>
        </Grid>

        <Box className={classes.buttonContainer}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleBack}
          >
            {formatMessage(intl, "prl", "button.cancel")}
          </Button>
          {!isView && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading || !formData.dataReuniao || !formData.coordenadorNacional || !formData.horario || !formData.participantes || !formData.desafiosSolucoes || !formData.oportunidadesPraticas || !formData.analiseDadosTendencias || !formData.acoesDefinidas}
            >
              {formatMessage(intl, "prl", "button.save")}
            </Button>
          )}
        </Box>
      </Paper>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(BimonthlySupervisionFormPage))));
