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
  PARAMS_ROUTE_TICKET_CATEGORY,
  PARAMS_ROUTE_TICKET_CHANNEL,
  PARAMS_ROUTE_TICKET_FLAG,
  PARAMS_ROUTE_TICKET_PRIORITY,
  PARAMS_ROUTE_ROLE,
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
    {
      id: "params.ticketCategory",
      text: formatMessage(intl, "params", "menu.ticketCategory"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_TICKET_CATEGORY,
      withDivider: true,
    },
    {
      id: "params.ticketChannel",
      text: formatMessage(intl, "params", "menu.ticketChannel"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_TICKET_CHANNEL,
      withDivider: false,
    },
    {
      id: "params.ticketFlag",
      text: formatMessage(intl, "params", "menu.ticketFlag"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_TICKET_FLAG,
      withDivider: false,
    },
    {
      id: "params.ticketPriority",
      text: formatMessage(intl, "params", "menu.ticketPriority"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_TICKET_PRIORITY,
      withDivider: false,
    },
    {
      id: "params.role",
      text: formatMessage(intl, "params", "menu.role"),
      icon: <Settings />,
      route: "/" + PARAMS_ROUTE_ROLE,
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
