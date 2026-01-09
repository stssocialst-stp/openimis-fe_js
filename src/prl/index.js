import messages_en from "./translations/en.json";
import messages_pt from "./translations/pt.json";
import PrlMainMenu from "./menus/PrlMainMenu";
import EducationalModuleMenu from "./menus/EducationalModuleMenu";

// Pages
import SessionPlanningPage from "./pages/SessionPlanningPage";
import SessionPlanningEditPage from "./pages/SessionPlanningEditPage";
import AttendanceRegistryPage from "./pages/AttendanceRegistryPage";
import AttendanceEditPage from "./pages/AttendanceEditPage";
import SessionExecutionFormPage from "./pages/SessionExecutionFormPage";
import SessionSupervisionPage from "./pages/SessionSupervisionPage";
import SessionSupervisionFormPage from "./pages/SessionSupervisionFormPage";
import FamilyGroupPage from "./pages/FamilyGroupPage";
import FamilyGroupFormPage from "./pages/FamilyGroupFormPage";
import EducationalModulePage from "./pages/EducationalModulePage";
import EducationalModuleFormPage from "./pages/EducationalModuleFormPage";
import BimonthlyReportPage from "./pages/BimonthlyReportPage";
import BimonthlyReportFormPage from "./pages/BimonthlyReportFormPage";
import BimonthlySupervisionPage from "./pages/BimonthlySupervisionPage";
import BimonthlySupervisionFormPage from "./pages/BimonthlySupervisionFormPage";
import SupervisionReportPage from "./pages/SupervisionReportPage";
import SupervisionReportFormPage from "./pages/SupervisionReportFormPage";
import SessionExecutionPage from "./pages/SessionExecutionPage";

// Constants
import {
  PRL_ROUTE_SESSION_PLANNING,
  PRL_ROUTE_SESSION_PLANNING_FORM,
  PRL_ROUTE_ATTENDANCE,
  PRL_ROUTE_ATTENDANCE_FORM,
  PRL_ROUTE_EXECUTION,
  PRL_ROUTE_EXECUTION_FORM,
  PRL_ROUTE_SUPERVISION,
  PRL_ROUTE_SUPERVISION_FORM,
  PRL_ROUTE_FAMILY_GROUP,
  PRL_ROUTE_FAMILY_GROUP_FORM,
  PRL_ROUTE_EDUCATIONAL_MODULE,
  PRL_ROUTE_EDUCATIONAL_MODULE_FORM,
  PRL_ROUTE_BIMONTHLY_REPORT,
  PRL_ROUTE_BIMONTHLY_REPORT_FORM,
  PRL_ROUTE_BIMONTHLY_SUPERVISION,
  PRL_ROUTE_BIMONTHLY_SUPERVISION_FORM,
  PRL_ROUTE_SUPERVISION_REPORT,
  PRL_ROUTE_SUPERVISION_REPORT_FORM,
} from "./constants";

const DEFAULT_CONFIG = {
  translations: [
    { key: "en", messages: messages_en },
    { key: "pt", messages: messages_pt },
  ],
  "core.MainMenu": [PrlMainMenu, EducationalModuleMenu],
  "core.Router": [
    { path: PRL_ROUTE_SESSION_PLANNING, component: SessionPlanningPage },
    { path: PRL_ROUTE_SESSION_PLANNING_FORM, component: SessionPlanningEditPage },
    { path: PRL_ROUTE_ATTENDANCE, component: AttendanceRegistryPage },
    { path: PRL_ROUTE_ATTENDANCE_FORM, component: AttendanceEditPage },
    { path: PRL_ROUTE_EXECUTION, component: SessionExecutionPage },
    { path: PRL_ROUTE_EXECUTION_FORM, component: SessionExecutionFormPage },
    { path: PRL_ROUTE_SUPERVISION, component: SessionSupervisionPage },
    { path: `${PRL_ROUTE_SUPERVISION_FORM}/:id`, component: SessionSupervisionFormPage },
    { path: PRL_ROUTE_SUPERVISION_FORM, component: SessionSupervisionFormPage },
    { path: PRL_ROUTE_FAMILY_GROUP, component: FamilyGroupPage },
    { path: PRL_ROUTE_FAMILY_GROUP_FORM, component: FamilyGroupFormPage },
    { path: PRL_ROUTE_EDUCATIONAL_MODULE, component: EducationalModulePage },
    { path: PRL_ROUTE_EDUCATIONAL_MODULE_FORM, component: EducationalModuleFormPage },
    { path: PRL_ROUTE_BIMONTHLY_REPORT, component: BimonthlyReportPage },
    { path: PRL_ROUTE_BIMONTHLY_REPORT_FORM, component: BimonthlyReportFormPage },
    { path: PRL_ROUTE_BIMONTHLY_SUPERVISION, component: BimonthlySupervisionPage },
    { path: `${PRL_ROUTE_BIMONTHLY_SUPERVISION}/:id`, component: BimonthlySupervisionFormPage },
    { path: PRL_ROUTE_BIMONTHLY_SUPERVISION_FORM, component: BimonthlySupervisionFormPage },
    { path: PRL_ROUTE_SUPERVISION_REPORT, component: SupervisionReportPage },
    { path: `${PRL_ROUTE_SUPERVISION_REPORT}/form/:action`, component: SupervisionReportFormPage },
    { path: `${PRL_ROUTE_SUPERVISION_REPORT}/:id`, component: SupervisionReportFormPage },
  ],
  refs: [
    { key: "prl.route.sessionPlanning", ref: PRL_ROUTE_SESSION_PLANNING },
    { key: "prl.route.attendance", ref: PRL_ROUTE_ATTENDANCE },
    { key: "prl.route.execution", ref: PRL_ROUTE_EXECUTION },
    { key: "prl.route.supervision", ref: PRL_ROUTE_SUPERVISION },
  ],
};

export const PrlModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
