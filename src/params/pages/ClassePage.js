import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  IconButton, Tooltip, Fab, Typography, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Chip,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@openimis/fe-core";
import { PARAMS_ROUTE_CLASSE_FORM } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  paper: { margin: theme.spacing(2) },
  tableHeader: { backgroundColor: theme.palette.primary.main },
  tableHeaderCell: { color: "#fff", fontWeight: "bold" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 4 },
});

const NIVEL_LABELS = {
  EP1: "EP1 (1ª–4ª Classe)",
  EP2: "EP2 (5ª–6ª Classe)",
  ESG1: "ESG1 (7ª–9ª Classe)",
  ESG2: "ESG2 (10ª–12ª Classe)",
  OUTRO: "Outro",
};

const LIST_QUERY = `query ListClasses($first: Int, $offset: Int) {
  classes(first: $first, offset: $offset, orderBy: ["nivel", "ordem"]) {
    edges {
      node {
        id
        nome
        codigo
        nivel
        ordem
        ativo
        disciplinasAssociadas {
          edges {
            node {
              disciplina { id nome }
            }
          }
        }
      }
    }
    totalCount
  }
}`;

const DELETE_MUTATION = `mutation DeleteClasse($input: DeleteClasseMutationInput!) {
  deleteClasse(input: $input) { clientMutationId internalId }
}`;

function ClassePage(props) {
  const { classes, intl, history } = props;
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({ query: LIST_QUERY, variables: { first: pageSize, offset: page * pageSize } }),
      });
      const json = await res.json();
      const data = json?.data?.classes;
      setRows(data?.edges?.map((e) => e.node) ?? []);
      setTotalCount(data?.totalCount ?? 0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm(formatMessage(intl, "params", "confirm.delete"))) return;
    await fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: DELETE_MUTATION, variables: { input: { id } } }),
    });
    fetchData();
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", "title.classe")} />
      <Typography variant="h5" style={{ margin: "16px" }}>
        {formatMessage(intl, "params", "title.classe")}
      </Typography>
      <TableContainer component={Paper} className={classes.paper}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "classe.codigo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "classe.nome")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "classe.nivel")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "classe.ordem")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "classe.disciplinas")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.ativo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {formatMessage(intl, "params", "message.noData")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.codigo}</TableCell>
                <TableCell>{row.nome}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={NIVEL_LABELS[row.nivel] || row.nivel}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">{row.ordem}</TableCell>
                <TableCell>
                  <div className={classes.chipRow}>
                    {(row.disciplinasAssociadas?.edges || []).length === 0 && (
                      <Typography variant="caption" color="textSecondary">—</Typography>
                    )}
                    {(row.disciplinasAssociadas?.edges || []).map(e => (
                      <Chip key={e.node.disciplina.id} size="small" label={e.node.disciplina.nome} variant="outlined" />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.ativo
                      ? formatMessage(intl, "params", "label.active")
                      : formatMessage(intl, "params", "label.inactive")}
                    color={row.ativo ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={formatMessage(intl, "params", "button.edit")}>
                    <IconButton size="small" onClick={() => history.push({ pathname: `/${PARAMS_ROUTE_CLASSE_FORM}`, search: `?id=${row.id}`, state: { classe: row } })}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={formatMessage(intl, "params", "button.delete")}>
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
          onChangeRowsPerPage={(e) => { setPageSize(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={formatMessage(intl, "params", "label.rowsPerPage")}
        />
      </TableContainer>
      <Fab color="primary" className={classes.fab} onClick={() => history.push(`/${PARAMS_ROUTE_CLASSE_FORM}`)}>
        <AddIcon />
      </Fab>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(ClassePage)))));
