import { useState, useEffect } from "react";
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { withTheme, withStyles } from "@material-ui/core/styles";
import {
  Paper, Typography, Button, Box, Chip,
} from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import { formatMessage, withModulesManager, Helmet, baseApiUrl, apiHeaders } from "@stssocialst-stp/fe-core";
import { PARAMS_ROUTE_ROLE } from "../constants";
import { getCookie } from "../utils";

const styles = (theme) => ({
  page: theme.page,
  paper: { margin: theme.spacing(2), padding: theme.spacing(3) },
  sectionTitle: { color: theme.palette.primary.main, fontWeight: "bold", marginBottom: theme.spacing(2) },
  chip: { margin: theme.spacing(0.5) },
});

function UserRolePage(props) {
  const { classes, intl, history, location } = props;
  const params = new URLSearchParams(location?.search);
  const roleId = params.get("id");
  const roleNome = params.get("nome") || "";

  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState({});

  const gql = (q, v) =>
    fetch(`${baseApiUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken"), ...apiHeaders() },
      body: JSON.stringify({ query: q, variables: v }),
    }).then((r) => r.json());

  const loadData = async () => {
    const usersRes = await gql(
      `query { users(first: 100) { edges { node { id username lastName otherNames } } } }`,
      {}
    );
    const userList = usersRes?.data?.users?.edges?.map(e => e.node) || [];
    setUsers(userList);

    const rolesMap = {};
    await Promise.all(userList.map(async (u) => {
      try {
        const r = await gql(`query { rolesDoUtilizador(userId: "${u.id}") { id nome } }`, {});
        rolesMap[u.id] = r?.data?.rolesDoUtilizador || [];
      } catch { rolesMap[u.id] = []; }
    }));
    setUserRoles(rolesMap);
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasRole = (userId) => userRoles[userId]?.some(r => String(r.id) === String(roleId));

  const handleToggleRole = async (userId, add) => {
    const mutation = add
      ? `mutation { atribuirRoleAoUtilizador(userId: "${userId}", roleId: "${roleId}") { ok errors } }`
      : `mutation { removerRoleDoUtilizador(userId: "${userId}", roleId: "${roleId}") { ok errors } }`;
    const res = await gql(mutation, {});
    if (res?.data?.atribuirRoleAoUtilizador?.ok || res?.data?.removerRoleDoUtilizador?.ok) {
      loadData();
    } else {
      alert('Erro: ' + (res?.errors?.[0]?.message || 'Falha na operação'));
    }
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage(intl, "params", "title.roleUsers")} />
      <Paper className={classes.paper}>
        <Button onClick={() => history.push(`/${PARAMS_ROUTE_ROLE}`)}>
          <ChevronLeftIcon fontSize="small" />
          <Typography style={{ marginLeft: 8, fontWeight: 500 }}>
            {formatMessage(intl, "params", "title.roleUsers")}: {roleNome}
          </Typography>
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h6" className={classes.sectionTitle}>
          {formatMessage(intl, "params", "role.users")}
        </Typography>
        {users.map(u => {
          const assigned = hasRole(u.id);
          return (
            <Box key={u.id} display="flex" alignItems="center" justifyContent="space-between" mb={1} p={1} style={{ borderBottom: "1px solid #eee" }}>
              <Box>
                <Typography variant="body2" style={{ fontWeight: assigned ? 'bold' : 'normal' }}>
                  {u.lastName || u.username}
                  {u.otherNames ? ` ${u.otherNames}` : ''}
                </Typography>
                <Typography variant="caption" color="textSecondary">{u.username}</Typography>
              </Box>
              <Chip
                size="small"
                label={assigned ? "Remover Role" : "Atribuir Role"}
                color={assigned ? "secondary" : "primary"}
                onClick={() => handleToggleRole(u.id, !assigned)}
                clickable
              />
            </Box>
          );
        })}
      </Paper>
    </div>
  );
}

const mapStateToProps = (state) => ({ rights: state.core?.user?.i_user?.rights ?? [] });
export default withModulesManager(injectIntl(connect(mapStateToProps)(withTheme(withStyles(styles)(UserRolePage)))));
