"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasProcessed = hasProcessed;
exports.saveDecision = saveDecision;
exports.logSubscription = logSubscription;
const pg_1 = require("pg");
const config_1 = require("../config");
const pool = new pg_1.Pool({ connectionString: config_1.config.databaseUrl });
async function hasProcessed(itemId) {
    const { rows } = await pool.query("SELECT 1 FROM processed_items WHERE item_id = $1 AND relevant != 'error'", [itemId]);
    return rows.length > 0;
}
async function saveDecision(item, relevant, reason, errorDetail) {
    try {
        await pool.query(`INSERT INTO processed_items (item_id, title, source_name, input_plugin, relevant, reason, output, error_detail)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (item_id) DO UPDATE SET relevant = EXCLUDED.relevant, reason = EXCLUDED.reason, error_detail = EXCLUDED.error_detail
       WHERE processed_items.relevant = 'error'`, [
            item.id,
            item.title,
            item.sourceName,
            item.metadata.inputPlugin ?? 'unknown',
            relevant,
            reason,
            item.output,
            errorDetail ?? null,
        ]);
    }
    catch (err) {
        console.error('[db] saveDecision failed:', err);
    }
}
async function logSubscription(inputPlugin, sourceId, status, message) {
    try {
        await pool.query(`INSERT INTO subscription_log (input_plugin, source_id, status, message) VALUES ($1, $2, $3, $4)`, [inputPlugin, sourceId, status, message ?? null]);
    }
    catch (err) {
        console.error('[db] logSubscription failed:', err);
    }
}
