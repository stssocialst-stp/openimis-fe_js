import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography, Paper, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import PersonAddIcon from "@material-ui/icons/PersonAdd";
import PersonAddDisabledIcon from "@material-ui/icons/PersonAddDisabled";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_COORDENACAO_DISTRITAL_FORM } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  paper: { margin: theme.spacing(2) },
  tableHeader: { backgroundColor: theme.palette.primary.main },
  tableHeaderCell: { color: "#fff", fontWeight: "bold" },
});

const LIST_QUERY = `query ListCoordenacoes($first: Int, $offset: Int) {
  coordenacoesDistritais(first: $first, offset: $offset) {
    edges {
      node {
        id
        ativo
        observacoes
        distrito { id name }
        coordenador { id username otherNames lastName }
        tecnicoAdministrativo { id username otherNames lastName }
        tecnicosOperacionais { tecnico { id username otherNames lastName } }
      }
    }
    totalCount
  }
}`;

const DELETE_MUTATION = `mutation DeleteCoordenacaoDistrital($input: DeleteCoordenacaoDistritalMutationInput!) {
  deleteCoordenacaoDistrital(input: $input) { clientMutationId internalId }
}`;

const ADD_TECNICO_MUTATION = `mutation AddTecnicoOperacional($input: AddTecnicoOperacionalMutationInput!) {
  addTecnicoOperacional(input: $input) { clientMutationId errors { message } }
}`;

const REMOVE_TECNICO_MUTATION = `mutation RemoveTecnicoOperacional($input: RemoveTecnicoOperacionalMutationInput!) {
  removeTecnicoOperacional(input: $input) { clientMutationId errors { message } }
}`;

function CoordenacaoDistritalPage(props) {
  const { classes, intl, history } = props;
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogCoordenacao, setAddDialogCoordenacao] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: LIST_QUERY, variables: { first: pageSize, offset: page * pageSize } }),
      });
      const json = await res.json();
      const data = json?.data?.coordenacoesDistritais;
      setRows(data?.edges?.map((e) => e.node) ?? []);
      setTotalCount(data?.totalCount ?? 0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm(formatMessage(intl, "params", "confirm.delete"))) return;
    try {
      await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: DELETE_MUTATION, variables: { input: { id } } }),
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleRemoveTecnico = async (coordenacaoId, tecnicoId) => {
    if (!window.confirm(formatMessage(intl, "params", "coordenacaoDistrital.confirmRemoveTecnico"))) return;
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: REMOVE_TECNICO_MUTATION, variables: { input: { coordenacaoId, tecnicoId } } }),
      });
      const json = await res.json();
      if (json.errors) { alert(json.errors[0].message); return; }
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleOpenAddDialog = async (coordenacao) => {
    setAddDialogCoordenacao(coordenacao);
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: `query GetUsers { users(first: 100) { edges { node { id username otherNames lastName } } } }` }),
      });
      const json = await res.json();
      const allUsers = json?.data?.users?.edges?.map(e => e.node) || [];
      const existingIds = (coordenacao.tecnicosOperacionais || []).map(t => t.tecnico.id);
      setAvailableUsers(allUsers.filter(u => !existingIds.includes(u.id)));
    } catch (e) { console.error(e); }
    setAddDialogOpen(true);
  };

  const handleAddTecnico = async (tecnicoId) => {
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: ADD_TECNICO_MUTATION, variables: { input: { coordenacaoId: addDialogCoordenacao.id, tecnicoId } } }),
      });
      const json = await res.json();
      if (json.errors) { alert(json.errors[0].message); return; }
      setAddDialogOpen(false);
      setAddDialogCoordenacao(null);
      fetchData();
    } catch (e) { console.error(e); }
  };

  const getUserLabel = (user) => {
    if (!user) return "—";
    const name = [user.lastName, user.otherNames].filter(Boolean).join(" ");
    return name || user.username;
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", "title.coordenacaoDistrital")} />
      <Typography variant="h5" style={{ margin: "16px" }}>
        {formatMessage(intl, "params", "title.coordenacaoDistrital")}
      </Typography>
      <TableContainer component={Paper} className={classes.paper}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "coordenacaoDistrital.distrito")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "coordenacaoDistrital.coordenador")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "coordenacaoDistrital.tecnicoAdministrativo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "coordenacaoDistrital.tecnicosOperacionais")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.ativo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">{formatMessage(intl, "params", "message.noData")}</TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.distrito?.name ?? "—"}</TableCell>
                <TableCell>{getUserLabel(row.coordenador)}</TableCell>
                <TableCell>{getUserLabel(row.tecnicoAdministrativo)}</TableCell>
                <TableCell>
                  {row.tecnicosOperacionais?.length > 0
                    ? row.tecnicosOperacionais.map((t) => (
                      <span key={t.tecnico.id} style={{ display: "inline-flex", alignItems: "center", margin: "2px" }}>
                        <Chip size="small" label={getUserLabel(t.tecnico)} style={{ marginRight: 2 }} />
                        <IconButton
                          size="small"
                          style={{ width: 20, height: 20, color: "#d32f2f" }}
                          onClick={() => handleRemoveTecnico(row.id, t.tecnico.id)}
                        >
                          <PersonAddDisabledIcon fontSize="inherit" />
                        </IconButton>
                      </span>
                    ))
                    : "—"}
                  <Tooltip title="Adicionar Técnico">
                    <IconButton
                      size="small"
                      style={{ width: 24, height: 24, color: "#2e7d32", marginLeft: 4 }}
                      onClick={() => handleOpenAddDialog(row)}
                    >
                      <PersonAddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.ativo ? formatMessage(intl, "params", "label.active") : formatMessage(intl, "params", "label.inactive")}
                    color={row.ativo ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={formatMessage(intl, "params", "button.edit")}>
                    <IconButton size="small" onClick={() => history.push(`/${PARAMS_ROUTE_COORDENACAO_DISTRITAL_FORM}?id=${row.id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={formatMessage(intl, "params", "coordenacaoDistrital.deactivate")}>
                    <IconButton size="small" onClick={() => handleDelete(row.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onChangePage={(_, p) => setPage(p)}
          rowsPerPage={pageSize}
          onChangeRowsPerPage={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage={formatMessage(intl, "params", "label.rowsPerPage")}
        />
      </TableContainer>
      <Fab
        color="primary"
        className={classes.fab}
        onClick={() => history.push(`/${PARAMS_ROUTE_COORDENACAO_DISTRITAL_FORM}`)}
      >
        <AddIcon />
      </Fab>
      {/* Add Technician Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Técnico Operacional</DialogTitle>
        <DialogContent>
          {availableUsers.length === 0 ? (
            <Typography>Todos os utilizadores já são técnicos operacionais.</Typography>
          ) : (
            availableUsers.map(u => (
              <Box key={u.id} display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2">{getUserLabel(u)}</Typography>
                <MuiButton
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleAddTecnico(u.id)}
                >
                  Adicionar
                </MuiButton>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setAddDialogOpen(false)} color="primary">
            Fechar
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(CoordenacaoDistritalPage)))));
