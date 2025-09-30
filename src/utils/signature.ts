export function getMySignInfo(item: any, currentUserId: number) {
  const normalizedUserId = Number(currentUserId);
  if (!Number.isFinite(normalizedUserId)) {
    return { assigned: false, signed: false, lastSignedAt: null };
  }
  const entries = Array.isArray(item?.signatureEntries)
    ? item.signatureEntries
    : item?.cuadro_firma?.cuadro_firma_user ?? [];
  const mine = entries.filter(
    (e: any) => Number(e?.user_id ?? e?.userId) === normalizedUserId,
  );
  const assigned = mine.length > 0;
  const signed = mine.some((e: any) => e?.estaFirmado === true);
  const lastSignedAt = signed
    ? mine
        .filter((e: any) => e?.estaFirmado === true && e?.fecha_firma)
        .map((e: any) => new Date(e.fecha_firma).getTime())
        .sort((a: number, b: number) => b - a)[0]
    : null;
  return { assigned, signed, lastSignedAt };
}
