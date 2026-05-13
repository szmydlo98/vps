import { ContentItem } from './types';
import { shouldSave } from './filter';
import { getOutputPlugin } from './outputs';
import { hasProcessed, saveDecision } from './db';

export async function process(item: ContentItem): Promise<void> {
  try {
    if (await hasProcessed(item.id)) {
      console.log(`[pipeline] Duplicate, skipping: ${item.id}`);
      return;
    }

    let relevant: 'true' | 'false' | 'error';
    let reason: string;
    let errorDetail: string | undefined;

    if (item.alwaysSave) {
      relevant = 'true';
      reason = 'alwaysSave';
    } else {
      const result = await shouldSave(item);
      relevant = result.relevant;
      reason = result.reason;
      errorDetail = result.errorDetail;
    }

    await saveDecision(item, relevant, reason, errorDetail);

    if (relevant === 'true') {
      const plugin = getOutputPlugin(item.output);
      if (!plugin) {
        console.warn(`⚠️  Unknown output plugin: ${item.output}`);
        return;
      }
      try {
        await plugin.save(item);
        console.log(`✅ Saved [${item.output}]: ${item.title}`);
      } catch (err) {
        console.error(`❌ Output failed [${item.output}]: ${err instanceof Error ? err.message : err}`);
      }
    } else if (relevant === 'false') {
      console.log(`⏭️  Skipped: ${item.title} — ${reason}`);
    } else {
      console.log(`❌ Error: ${item.title} — ${reason}`);
    }
  } catch (err) {
    console.error('[pipeline] Unexpected error:', err);
  }
}
