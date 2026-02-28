import { injectIntl } from "react-intl";
import { connect } from "react-redux";
import { Settings } from "@material-ui/icons";
import { formatMessage, MainMenuContribution, withModulesManager } from "@stssocialst-stp/fe-core";
import {
  PARAMS_ROUTE_MODULO_PEP,
  PARAMS_ROUTE_ESCOLA,
  PARAMS_ROUTE_DISCIPLINA,
  PARAMS_ROUTE_TIPO_ENCAMINHAMENTO,
  PARAMS_ROUTE_CLASSE,
  PARAMS_ROUTE_COORDENACAO_DISTRITAL,
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
      id: "params.classe",
      text: formatMessage(intl, "params", "menu.classe"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_CLASSE,
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
    {
      id: "params.coordenacaoDistrital",
      text: formatMessage(intl, "params", "menu.coordenacaoDistrital"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_COORDENACAO_DISTRITAL,
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
