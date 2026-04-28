export const supabaseBatchSize = 500;

type SupabaseUpsertClient<TRecord> = {
  from: (table: string) => {
    upsert: (
      records: TRecord[],
      options: { onConflict: string },
    ) => PromiseLike<{ error: unknown }>;
  };
};

export async function loadPagedRecords<TRecord>(
  loadPage: (from: number, to: number) => Promise<{ data: TRecord[] | null; error: unknown }>,
  batchSize = supabaseBatchSize,
) {
  const records: TRecord[] = [];

  for (let from = 0; ; from += batchSize) {
    const to = from + batchSize - 1;
    const { data, error } = await loadPage(from, to);

    if (error) throw error;

    const page = data ?? [];
    records.push(...page);

    if (page.length < batchSize) break;
  }

  return records;
}

export async function upsertSupabaseBatches<TRecord>(
  client: SupabaseUpsertClient<TRecord>,
  table: string,
  records: TRecord[],
  onConflict: string,
  batchSize = supabaseBatchSize,
) {
  if (!records.length) return;

  for (let index = 0; index < records.length; index += batchSize) {
    const batch = records.slice(index, index + batchSize);
    const { error } = await client
      .from(table)
      .upsert(batch, { onConflict });
    if (error) throw error;
  }
}
