export type PageDto = {
  id: number
  code: string
  name: string
  path: string
  icon?: string | null
  order?: number | null
}

export type MeResponseDto = {
  id: number
  nombre: string
  correo: string
  pages: PageDto[]
  roles: string[]
  signatureUrl: string | null
  hasSignature: boolean
}
