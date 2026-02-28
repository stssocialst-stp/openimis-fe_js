import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { AssignmentTurnedIn } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@stssocialst-stp/fe-corefe-core";
import {
  PRL_ROUTE_EDUCATIONAL_MODULE,
  PRL_ROUTE_ALUNO,
} from "../constants";

function EducationalModuleMenu(props) {
  const { intl } = props;

  const entries = [
    {
      id: "prl.educationalModule",
      text: formatMessage(intl, "prl", "menu.educationalModule") || "Assiduidade Escolar",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_EDUCATIONAL_MODULE,
      withDivider: false,
    },
    {
      id: "prl.alunos",
      text: formatMessage(intl, "prl", "menu.alunos") || "Alunos",
      icon: <AssignmentTurnedIn />,
      route: "/" + PRL_ROUTE_ALUNO,
      withDivider: false,
    },
  ];

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(intl, "prl", "menu.educationalModule") || "Assiduidade Escolar"}
      icon={<AssignmentTurnedIn />}
      entries={entries}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(EducationalModuleMenu)));
