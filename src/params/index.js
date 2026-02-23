import messages_en from "./translations/en.json";
import messages_pt from "./translations/pt.json";

import ParametrizacoesMenu from "./menus/ParametrizacoesMenu";

import ModuloPEPPage from "./pages/ModuloPEPPage";
import ModuloPEPFormPage from "./pages/ModuloPEPFormPage";
import EscolaPage from "./pages/EscolaPage";
import EscolaFormPage from "./pages/EscolaFormPage";
import DisciplinaPage from "./pages/DisciplinaPage";
import DisciplinaFormPage from "./pages/DisciplinaFormPage";
import TipoEncaminhamentoPage from "./pages/TipoEncaminhamentoPage";
import TipoEncaminhamentoFormPage from "./pages/TipoEncaminhamentoFormPage";
import ClassePage from "./pages/ClassePage";
import ClasseFormPage from "./pages/ClasseFormPage";
import CoordenacaoDistritalPage from "./pages/CoordenacaoDistritalPage";
import CoordenacaoDistritalFormPage from "./pages/CoordenacaoDistritalFormPage";

import {
  PARAMS_ROUTE_MODULO_PEP,
  PARAMS_ROUTE_MODULO_PEP_FORM,
  PARAMS_ROUTE_ESCOLA,
  PARAMS_ROUTE_ESCOLA_FORM,
  PARAMS_ROUTE_DISCIPLINA,
  PARAMS_ROUTE_DISCIPLINA_FORM,
  PARAMS_ROUTE_TIPO_ENCAMINHAMENTO,
  PARAMS_ROUTE_TIPO_ENCAMINHAMENTO_FORM,
  PARAMS_ROUTE_CLASSE,
  PARAMS_ROUTE_CLASSE_FORM,
  PARAMS_ROUTE_COORDENACAO_DISTRITAL,
  PARAMS_ROUTE_COORDENACAO_DISTRITAL_FORM,
} from "./constants";

const DEFAULT_CONFIG = {
  translations: [
    { key: "en", messages: messages_en },
    { key: "pt", messages: messages_pt },
  ],
  "core.MainMenu": [ParametrizacoesMenu],
  "core.Router": [
    { path: PARAMS_ROUTE_MODULO_PEP, component: ModuloPEPPage },
    { path: PARAMS_ROUTE_MODULO_PEP_FORM, component: ModuloPEPFormPage },
    { path: PARAMS_ROUTE_ESCOLA, component: EscolaPage },
    { path: PARAMS_ROUTE_ESCOLA_FORM, component: EscolaFormPage },
    { path: PARAMS_ROUTE_DISCIPLINA, component: DisciplinaPage },
    { path: PARAMS_ROUTE_DISCIPLINA_FORM, component: DisciplinaFormPage },
    { path: PARAMS_ROUTE_TIPO_ENCAMINHAMENTO, component: TipoEncaminhamentoPage },
    { path: PARAMS_ROUTE_TIPO_ENCAMINHAMENTO_FORM, component: TipoEncaminhamentoFormPage },
    { path: PARAMS_ROUTE_CLASSE, component: ClassePage },
    { path: PARAMS_ROUTE_CLASSE_FORM, component: ClasseFormPage },
    { path: PARAMS_ROUTE_COORDENACAO_DISTRITAL, component: CoordenacaoDistritalPage },
    { path: PARAMS_ROUTE_COORDENACAO_DISTRITAL_FORM, component: CoordenacaoDistritalFormPage },
  ],
};

export const ParamsModule = (cfg) => ({ ...DEFAULT_CONFIG, ...cfg });
