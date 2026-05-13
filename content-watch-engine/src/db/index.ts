import { Pool } from 'pg';
import { config } from '../config';
import { ContentItem, RelevanceStatus } from '../types';

const pool = new Pool({ connectionString: config.databaseUrl });

export async function hasProcessed(itemId: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM processed_items WHERE item_id = $1',
    [itemId]
  );
  return rows.length > 0;
}

export async function saveDecision(
  item: ContentItem,
  relevant: RelevanceStatus,
  reason: string,
  errorDetail?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO processed_items (item_id, title, source_name, input_plugin, relevant, reason, output, error_detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (item_id) DO NOTHING`,
      [
        item.id,
        item.title,
        item.sourceName,
        (item.metadata.inputPlugin as string) ?? 'unknown',
        relevant,
        reason,
        item.output,
        errorDetail ?? null,
      ]
    );
  } catch (err) {
    console.error('[db] saveDecision failed:', err);
  }
}

export async function logSubscription(
  inputPlugin: string,
  sourceId: string,
  status: 'subscribed' | 'failed',
  message?: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO subscription_log (input_plugin, source_id, status, message) VALUES ($1, $2, $3, $4)`,
      [inputPlugin, sourceId, status, message ?? null]
    );
  } catch (err) {
    console.error('[db] logSubscription failed:', err);
  }
}
