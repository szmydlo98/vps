"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.process = process;
const filter_1 = require("./filter");
const outputs_1 = require("./outputs");
const db_1 = require("./db");
async function process(item) {
    try {
        if (await (0, db_1.hasProcessed)(item.id)) {
            console.log(`[pipeline] Duplicate, skipping: ${item.id}`);
            return;
        }
        let relevant;
        let reason;
        let errorDetail;
        if (item.alwaysSave) {
            relevant = 'true';
            reason = 'alwaysSave';
        }
        else {
            const result = await (0, filter_1.shouldSave)(item);
            relevant = result.relevant;
            reason = result.reason;
            errorDetail = result.errorDetail;
        }
        await (0, db_1.saveDecision)(item, relevant, reason, errorDetail);
        if (relevant === 'true') {
            const plugin = (0, outputs_1.getOutputPlugin)(item.output);
            if (!plugin) {
                console.warn(`⚠️  Unknown output plugin: ${item.output}`);
                return;
            }
            try {
                await plugin.save(item);
                console.log(`✅ Saved [${item.output}]: ${item.title}`);
            }
            catch (err) {
                console.error(`❌ Output failed [${item.output}]: ${err instanceof Error ? err.message : err}`);
            }
        }
        else if (relevant === 'false') {
            console.log(`⏭️  Skipped: ${item.title} — ${reason}`);
        }
        else {
            console.log(`❌ Error: ${item.title} — ${reason}`);
        }
    }
    catch (err) {
        console.error('[pipeline] Unexpected error:', err);
    }
}
