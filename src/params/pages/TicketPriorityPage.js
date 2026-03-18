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
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_TICKET_PRIORITY_FORM } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  fab: theme.fab,
  paper: { margin: theme.spacing(2) },
  tableHeader: { backgroundColor: theme.palette.primary.main },
  tableHeaderCell: { color: "#fff", fontWeight: "bold" },
});

const LIST_QUERY = `query ListTicketPriorities($first: Int, $offset: Int) {
  ticketPriorities(first: $first, offset: $offset, orderBy: ["ordem"]) {
    edges { node { id codigo nome ordem ativo } }
    totalCount
  }
}`;

const DELETE_MUTATION = `mutation DeleteTicketPriority($input: DeleteTicketPriorityMutationInput!) {
  deleteTicketPriority(input: $input) { clientMutationId }
}`;

function TicketPriorityPage(props) {
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
      const data = json?.data?.ticketPriorities;
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
      <Helmet title={formatMessage(intl, "params", "title.ticketPriority")} />
      <Typography variant="h5" style={{ margin: "16px" }}>
        {formatMessage(intl, "params", "title.ticketPriority")}
      </Typography>
      <TableContainer component={Paper} className={classes.paper}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "ticketPriority.codigo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "ticketPriority.nome")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "ticketPriority.ordem")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.ativo")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">{formatMessage(intl, "params", "message.noData")}</TableCell></TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.codigo}</TableCell>
                <TableCell>{row.nome}</TableCell>
                <TableCell>{row.ordem}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={row.ativo ? formatMessage(intl, "params", "label.active") : formatMessage(intl, "params", "label.inactive")}
                    color={row.ativo ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={formatMessage(intl, "params", "button.edit")}>
                    <IconButton size="small" onClick={() => history.push(`/${PARAMS_ROUTE_TICKET_PRIORITY_FORM}?id=${row.id}`)}>
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
      <Fab color="primary" className={classes.fab} onClick={() => history.push(`/${PARAMS_ROUTE_TICKET_PRIORITY_FORM}`)}>
        <AddIcon />
      </Fab>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(TicketPriorityPage)))));
