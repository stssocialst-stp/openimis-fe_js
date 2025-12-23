import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Grid, TextField, Button, MenuItem, Divider, Box,
  FormControl, FormLabel, RadioGroup, FormControlLabel, Radio,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import SaveIcon from "@material-ui/icons/Save";
import AddIcon from "@material-ui/icons/Add";
import { formatMessage, withModulesManager, Helmet } from "@openimis/fe-core";
import { PRL_ROUTE_SESSION_PLANNING } from "../constants";

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
  formControl: {
    marginTop: theme.spacing(1),
  },
  sessionHeader: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.spacing(0.5),
    display: "inline-block",
    marginBottom: theme.spacing(2),
  }
});

const DISTRICTS = [
  { value: "Maputo", label: "Maputo" },
  { value: "Gaza", label: "Gaza" },
  { value: "Inhambane", label: "Inhambane" },
];

const DAYS_OF_WEEK = [
  { value: "Segunda-feira", label: "Segunda-feira" },
  { value: "Terça-feira", label: "Terça-feira" },
  { value: "Quarta-feira", label: "Quarta-feira" },
  { value: "Quinta-feira", label: "Quinta-feira" },
  { value: "Sexta-feira", label: "Sexta-feira" },
  { value: "Sábado", label: "Sábado" },
  { value: "Domingo", label: "Domingo" },
];

const FAMILY_GROUPS = [
  { value: "Grupo A", label: "Grupo A" },
  { value: "Grupo B", label: "Grupo B" },
];

const TRAINERS = [
  { value: "João Silva", label: "João Silva" },
  { value: "Maria Santos", label: "Maria Santos" },
  { value: "Pedro Macamo", label: "Pedro Macamo" },
  { value: "Ana Cossa", label: "Ana Cossa" },
];

const COORDINATORS = [
  { value: "António Bento", label: "António Bento" },
  { value: "Lídia Mondlane", label: "Lídia Mondlane" },
  { value: "Ermelinda Cossa", label: "Ermelinda Cossa" },
];

const MONTHS = [
  { value: "Janeiro", label: "Janeiro" },
  { value: "Fevereiro", label: "Fevereiro" },
  { value: "Março", label: "Março" },
  { value: "Abril", label: "Abril" },
  { value: "Maio", label: "Maio" },
  { value: "Junho", label: "Junho" },
  { value: "Julho", label: "Julho" },
  { value: "Agosto", label: "Agosto" },
  { value: "Setembro", label: "Setembro" },
  { value: "Outubro", label: "Outubro" },
  { value: "Novembro", label: "Novembro" },
  { value: "Dezembro", label: "Dezembro" },
];

function SessionPlanningEditPage(props) {
  const { classes, intl, history, location } = props;
  const readOnly = location?.state?.readOnly || false;
  const initialData = location?.state?.data || null;

  const [formData, setFormData] = useState({
    sessionCode: "",
    coordinator: "",
    date: "",
    trainer: "",
    district: "",
    moduleName: "",
    prevModuleMonth: "",
    sessions: [
      {
        dayOfWeek: "",
        date: "",
        zone: "",
        familyGroup: "",
        numFamilies: 0,
        travelTime: 0,
        sessionTime: "",
        feedbackTime: "",
        isSupervised: "Não",
        observations: "",
      }
    ]
  });

  useEffect(() => {
    if (initialData) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        ...initialData,
        // If mock data doesn't have sessions, keep the default one
        sessions: initialData.sessions || prevFormData.sessions
      }));
    }
  }, [initialData]);

  const handleChange = (field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSessionChange = (index, field) => (event) => {
    if (readOnly) return;
    const { value } = event.target;
    setFormData((prev) => {
      const newSessions = [...prev.sessions];
      newSessions[index] = { ...newSessions[index], [field]: value };
      return { ...prev, sessions: newSessions };
    });
  };

  const handleAddSession = () => {
    if (readOnly) return;
    setFormData((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        {
          dayOfWeek: "",
          date: "",
          zone: "",
          familyGroup: "",
          numFamilies: 0,
          travelTime: 0,
          sessionTime: "",
          feedbackTime: "",
          isSupervised: "Não",
          observations: "",
        }
      ]
    }));
  };

  const handleBack = () => {
    history.push(`/${PRL_ROUTE_SESSION_PLANNING}`);
  };

  const handleSave = () => {
    console.log("Saving planning:", formData);
    // Mock save
    handleBack();
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "prl", "title.sessionPlanning")} />

      <Paper className={classes.paper}>
        <Button onClick={handleBack}>
          <ChevronLeftIcon fontSize="small" />
          <Typography className={classes.headerTitle}>
            {formatMessage(intl, "prl", "title.sessionPlanning")}
          </Typography>
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "prl", "sessionPlanning.basicInfo")}
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.introCode")}
              placeholder="Ex: AG-MD01-Jan-2025"
              value={formData.sessionCode}
              onChange={handleChange("sessionCode")}
              variant="outlined"
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectCoordinator")}
              value={formData.coordinator}
              onChange={handleChange("coordinator")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {COORDINATORS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="date"
              label={formatMessage(intl, "prl", "sessionPlanning.plannedDate")}
              value={formData.date || formData.plannedDate}
              onChange={handleChange("date")}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectTrainer")}
              value={formData.trainer}
              onChange={handleChange("trainer")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {TRAINERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.selectDistrict")}
              value={formData.district}
              onChange={handleChange("district")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {DISTRICTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.moduleName")}
              value={formData.moduleName || formData.module}
              onChange={handleChange("moduleName")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              label={formatMessage(intl, "prl", "sessionPlanning.prevModuleMonth")}
              value={formData.prevModuleMonth}
              onChange={handleChange("prevModuleMonth")}
              variant="outlined"
              size="small"
              required
              disabled={readOnly}
            >
              {MONTHS.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper className={classes.paper}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {formatMessage(intl, "prl", "sessionPlanning.planningSessions")}
          </Typography>
          {!readOnly && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddSession}
              size="small"
            >
              {formatMessage(intl, "prl", "sessionPlanning.addSession")}
            </Button>
          )}
        </Box>

        {formData.sessions.map((session, index) => (
          <Box key={index} mb={4}>
            <Box className={classes.sessionHeader}>
              <Typography variant="subtitle2" color="primary">
                Sessão {index + 1}
              </Typography>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label={formatMessage(intl, "prl", "sessionPlanning.dayOfWeek")}
                  value={session.dayOfWeek}
                  onChange={handleSessionChange(index, "dayOfWeek")}
                  variant="outlined"
                  size="small"
                  required
                  disabled={readOnly}
                >
                  {DAYS_OF_WEEK.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="date"
                  label={formatMessage(intl, "prl", "sessionPlanning.plannedDate")}
                  value={session.date}
                  onChange={handleSessionChange(index, "date")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label={formatMessage(intl, "prl", "sessionPlanning.zone")}
                  placeholder="Ex: A, B, C, D"
                  value={session.zone}
                  onChange={handleSessionChange(index, "zone")}
                  variant="outlined"
                  size="small"
                  required
                  InputLabelProps={{ shrink: true }}
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  fullWidth
                  label={formatMessage(intl, "prl", "sessionPlanning.selectFamilyGroup")}
                  value={session.familyGroup}
                  onChange={handleSessionChange(index, "familyGroup")}
                  variant="outlined"
                  size="small"
                  required
                  disabled={readOnly}
                >
                  {FAMILY_GROUPS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={formatMessage(intl, "prl", "sessionPlanning.numFamilies")}
                  value={session.numFamilies}
                  onChange={handleSessionChange(index, "numFamilies")}
                  variant="outlined"
                  size="small"
                  required
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label={formatMessage(intl, "prl", "sessionPlanning.travelTime")}
                  value={session.travelTime}
                  onChange={handleSessionChange(index, "travelTime")}
                  variant="outlined"
                  size="small"
                  required
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="time"
                  label={formatMessage(intl, "prl", "sessionPlanning.sessionTime")}
                  placeholder="Ex: 9:00 - 10:15"
                  value={session.sessionTime}
                  onChange={handleSessionChange(index, "sessionTime")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="time"
                  label={formatMessage(intl, "prl", "sessionPlanning.feedbackTime")}
                  placeholder="Ex: 10:15 - 10:35"
                  value={session.feedbackTime}
                  onChange={handleSessionChange(index, "feedbackTime")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={readOnly}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl component="fieldset" className={classes.formControl} disabled={readOnly}>
                  <FormLabel component="legend">{formatMessage(intl, "prl", "sessionPlanning.isSupervised")}</FormLabel>
                  <RadioGroup
                    row
                    value={session.isSupervised}
                    onChange={handleSessionChange(index, "isSupervised")}
                  >
                    <FormControlLabel value="Sim" control={<Radio color="primary" />} label="Sim" />
                    <FormControlLabel value="Não" control={<Radio color="primary" />} label="Não" />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={formatMessage(intl, "prl", "sessionPlanning.observations")}
                  placeholder="Observações adicionais..."
                  value={session.observations}
                  onChange={handleSessionChange(index, "observations")}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  disabled={readOnly}
                />
              </Grid>
            </Grid>
            {index < formData.sessions.length - 1 && <Box mt={4}><Divider /></Box>}
          </Box>
        ))}
      </Paper>

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
          >
            {formatMessage(intl, "prl", "sessionPlanning.savePlanning")}
          </Button>
        )}
      </Box>
    </div>
  );
}

export default withModulesManager(injectIntl(withTheme(withStyles(styles)(SessionPlanningEditPage))));
