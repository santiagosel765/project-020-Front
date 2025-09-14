export interface BuildResponsablesInput {
  elaboraUserId: number;
  revisaUserIds?: number[];
  apruebaUserIds?: number[];
}

export const buildResponsables = ({
  elaboraUserId,
  revisaUserIds = [],
  apruebaUserIds = [],
}: BuildResponsablesInput) => ({
  elabora: { userId: elaboraUserId },
  revisa: revisaUserIds.map((id) => ({ userId: id })),
  aprueba: apruebaUserIds.map((id) => ({ userId: id })),
});

