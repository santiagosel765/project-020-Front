import type { Api } from "@/types/api";
import {
  getPaginas,
  createPagina,
  updatePagina,
  deletePagina,
  restorePagina,
} from "./pagesService";
import { getRolePages, setRolePages } from "./rolesService";

export type Page = Api.Pagina;

export {
  getPaginas as getPages,
  createPagina as createPage,
  updatePagina as updatePage,
  deletePagina as deletePage,
  restorePagina as restorePage,
  getRolePages,
  setRolePages as updateRolePages,
};
