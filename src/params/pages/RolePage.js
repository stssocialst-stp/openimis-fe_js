import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Chip,
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import SupervisorAccountIcon from "@material-ui/icons/SupervisorAccount";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_ROLE_FORM, PARAMS_ROUTE_USER_ROLE } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2) },
  tableHeader: { backgroundColor: theme.palette.primary.main },
  tableHeaderCell: { color: "#fff", fontWeight: "bold" },
});

function RolePage(props) {
  const { classes, intl, history } = props;
  const [roles, setRoles] = useState([]);

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${baseApiUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
        body: JSON.stringify({
          query: `query { roles { id nome } }`,
        }),
      });
      const json = await res.json();
      const roleList = json?.data?.roles || [];
      const enriched = await Promise.all(roleList.map(async (role) => {
        try {
          const r = await fetch(`${baseApiUrl}/graphql`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
            body: JSON.stringify({
              query: `query { permissoesDoRole(roleId: "${role.id}") { id rightId } }`,
            }),
          });
          const j = await r.json();
          return { ...role, permissoes: j?.data?.permissoesDoRole || [] };
        } catch { return { ...role, permissoes: [] }; }
      }));
      setRoles(enriched);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchRoles(); }, []);

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", "title.roles")} />
      <Typography variant="h5" style={{ margin: "16px" }}>
        {formatMessage(intl, "params", "title.roles")}
      </Typography>
      <TableContainer component={Paper} className={classes.paper}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "role.nome")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "role.permissoesCount")}</TableCell>
              <TableCell className={classes.tableHeaderCell}>{formatMessage(intl, "params", "label.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 && (
              <TableRow><TableCell colSpan={3} align="center">{formatMessage(intl, "params", "message.noData")}</TableCell></TableRow>
            )}
            {roles.map((role) => (
              <TableRow key={role.id} hover>
                <TableCell>{role.nome}</TableCell>
                <TableCell>
                  <Chip size="small" label={`${role.permissoes?.length || 0} permissões`} color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Tooltip title={formatMessage(intl, "params", "role.managePermissions")}>
                    <IconButton size="small" onClick={() => history.push(`/${PARAMS_ROUTE_ROLE_FORM}?id=${role.id}&nome=${encodeURIComponent(role.nome)}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={formatMessage(intl, "params", "role.assignUsers")}>
                    <IconButton size="small" onClick={() => history.push(`/${PARAMS_ROUTE_USER_ROLE}?id=${role.id}&nome=${encodeURIComponent(role.nome)}`)}>
                      <SupervisorAccountIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(RolePage)))));
