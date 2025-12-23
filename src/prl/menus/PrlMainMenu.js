
import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { AssignmentTurnedIn } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import {
  PRL_ROUTE_SESSION_PLANNING,
  PRL_ROUTE_ATTENDANCE,
  PRL_ROUTE_EXECUTION,
  PRL_ROUTE_SUPERVISION,
  PRL_ROUTE_BIMONTHLY_REPORT,
  PRL_ROUTE_BIMONTHLY_SUPERVISION,
  PRL_ROUTE_SUPERVISION_REPORT,
} from "../constants";

function PrlMainMenu(props) {
  const { intl } = props;

  const entries = [
    {
      id: "prl.sessionPlanning",
      text: formatMessage(intl, "prl", "menu.sessionPlanning") || "Planeamento de Sessões",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_SESSION_PLANNING,
      withDivider: false,
    },
    {
      id: "prl.attendance",
      text: formatMessage(intl, "prl", "menu.attendance") || "Registo de Presença",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_ATTENDANCE,
      withDivider: false,
    },
    {
      id: "prl.execution",
      text: formatMessage(intl, "prl", "menu.execution") || "Execução de Sessão",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_EXECUTION,
      withDivider: false,
    },
    {
      id: "prl.supervision",
      text: formatMessage(intl, "prl", "menu.supervision") || "Supervisão de Sessão",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_SUPERVISION,
      withDivider: true,
    },
    {
      id: "prl.bimonthlyReport",
      text: formatMessage(intl, "prl", "menu.bimonthlyReport") || "Relatório Bimestral",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_BIMONTHLY_REPORT,
      withDivider: false,
    },
    {
      id: "prl.bimonthlySupervision",
      text: formatMessage(intl, "prl", "menu.bimonthlySupervision") || "Supervisão Bimestral",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_BIMONTHLY_SUPERVISION,
      withDivider: false,
    },
    {
      id: "prl.supervisionReport",
      text: formatMessage(intl, "prl", "menu.supervisionReport") || "Relatório de Supervisão",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_SUPERVISION_REPORT,
      withDivider: false,
    },
  ];

  console.log("PRL Menu entries:", entries); // Debug

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(intl, "prl", "menu.prl")}
      icon={<AssignmentTurnedIn />}
      entries={entries}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(PrlMainMenu)));
