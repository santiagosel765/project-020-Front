import {
  getPaginas,
  createPagina,
  updatePagina,
  deletePagina,
  restorePagina,
  type PaginaUI,
  type GetPagesParams,
} from "./pagesService";
import { getRolePages, setRolePages } from "./rolesService";

export type Page = PaginaUI;
export type { GetPagesParams };

export {
  getPaginas as getPages,
  createPagina as createPage,
  updatePagina as updatePage,
  deletePagina as deletePage,
  restorePagina as restorePage,
  getRolePages,
  setRolePages as updateRolePages,
};
