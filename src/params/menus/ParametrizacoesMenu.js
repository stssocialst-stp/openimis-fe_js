import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { Settings } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@openimis/fe-core";
import {
  PARAMS_ROUTE_MODULO_PEP,
  PARAMS_ROUTE_ESCOLA,
  PARAMS_ROUTE_DISCIPLINA,
  PARAMS_ROUTE_TIPO_ENCAMINHAMENTO,
} from "../constants";

function ParametrizacoesMenu(props) {
  const { intl } = props;

  const entries = [
    {
      id: "params.moduloPEP",
      text: formatMessage(intl, "params", "menu.moduloPEP"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_MODULO_PEP,
      withDivider: false,
    },
    {
      id: "params.escola",
      text: formatMessage(intl, "params", "menu.escola"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_ESCOLA,
      withDivider: false,
    },
    {
      id: "params.disciplina",
      text: formatMessage(intl, "params", "menu.disciplina"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_DISCIPLINA,
      withDivider: false,
    },
    {
      id: "params.tipoEncaminhamento",
      text: formatMessage(intl, "params", "menu.tipoEncaminhamento"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_TIPO_ENCAMINHAMENTO,
      withDivider: false,
    },
  ];

  return (
    <MainMenuContribution
      {...props}
      header={formatMessage(intl, "params", "menu.parametrizacoes")}
      icon={<Settings />}
      entries={entries}
    />
  );
}

const mapStateToProps = (state) => ({
  rights: state.core?.user?.i_user?.rights ?? [],
});

export default withModulesManager(injectIntl(connect(mapStateToProps)(ParametrizacoesMenu)));
