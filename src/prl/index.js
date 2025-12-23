import messages_en from "./translations/en.json";
import messages_pt from "./translations/pt.json";
import PrlMainMenu from "./menus/PrlMainMenu";

// Pages
import SessionPlanningPage from "./pages/SessionPlanningPage";
import SessionPlanningEditPage from "./pages/SessionPlanningEditPage";
import AttendanceRegistryPage from "./pages/AttendanceRegistryPage";
import SessionExecutionPage from "./pages/SessionExecutionPage";
import SessionSupervisionPage from "./pages/SessionSupervisionPage";
import BimonthlyReportPage from "./pages/BimonthlyReportPage";
import BimonthlySupervisionPage from "./pages/BimonthlySupervisionPage";
import SupervisionReportPage from "./pages/SupervisionReportPage";

// Constants
import {
  PRL_ROUTE_SESSION_PLANNING,
  PRL_ROUTE_SESSION_PLANNING_FORM,
  PRL_ROUTE_ATTENDANCE,
  PRL_ROUTE_EXECUTION,
  PRL_ROUTE_SUPERVISION,
  PRL_ROUTE_BIMONTHLY_REPORT,
  PRL_ROUTE_BIMONTHLY_SUPERVISION,
  PRL_ROUTE_SUPERVISION_REPORT,
} from "./constants";

const DEFAULT_CONFIG = {
  translations: [
    { key: "en", messages: messages_en },
    { key: "pt", messages: messages_pt },
  ],
  "core.MainMenu": [PrlMainMenu],
  "core.Router": [
    { path: PRL_ROUTE_SESSION_PLANNING, component: SessionPlanningPage },
    { path: PRL_ROUTE_SESSION_PLANNING_FORM, component: SessionPlanningEditPage },
    { path: PRL_ROUTE_ATTENDANCE, component: AttendanceRegistryPage },
    { path: PRL_ROUTE_EXECUTION, component: SessionExecutionPage },
    { path: PRL_ROUTE_SUPERVISION, component: SessionSupervisionPage },
    { path: PRL_ROUTE_BIMONTHLY_REPORT, component: BimonthlyReportPage },
    { path: PRL_ROUTE_BIMONTHLY_SUPERVISION, component: BimonthlySupervisionPage },
    { path: PRL_ROUTE_SUPERVISION_REPORT, component: SupervisionReportPage },
  ],
  refs: [
    { key: "prl.route.sessionPlanning", ref: PRL_ROUTE_SESSION_PLANNING },
    { key: "prl.route.attendance", ref: PRL_ROUTE_ATTENDANCE },
    { key: "prl.route.execution", ref: PRL_ROUTE_EXECUTION },
    { key: "prl.route.supervision", ref: PRL_ROUTE_SUPERVISION },
  ],
};

export const PrlModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
