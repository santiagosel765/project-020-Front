declare module '@tanstack/react-query' {
  export class QueryClient {
    constructor(...args: any[])
  }
  export const QueryClientProvider: any
  export function useQuery(options: any): any
  export function useQueryClient(): any
  export const keepPreviousData: any
}
