import 'dotenv/config';
import { shouldSave } from '../src/filter';
import { ContentItem } from '../src/types';

const base: Omit<ContentItem, 'id' | 'title' | 'description' | 'hint'> = {
  sourceUrl: 'https://youtube.com/watch?v=test',
  sourceName: 'Test',
  alwaysSave: false,
  output: 'youtube-watch-later',
  metadata: {},
};

const cases = [
  {
    label: 'RELEVANT — cycling race recap',
    item: {
      ...base,
      id: 'yt:test1',
      title: 'Stage 12 Tour de France 2025 Analysis',
      description: 'Full breakdown of the mountain stage tactics and power data.',
      hint: 'only save videos about road cycling races and race analysis',
    },
    expect: 'true',
  },
  {
    label: 'NOT RELEVANT — cycling vlog',
    item: {
      ...base,
      id: 'yt:test2',
      title: 'My Morning Coffee Ride Through Tuscany',
      description: 'Just a casual ride with friends last weekend.',
      hint: 'only save videos about road cycling races and race analysis',
    },
    expect: 'false',
  },
  {
    label: 'EDGE — empty title and description',
    item: {
      ...base,
      id: 'yt:test3',
      title: '',
      description: '',
      hint: 'only save videos about road cycling races',
    },
    expect: 'false or error',
  },
];

(async () => {
  for (const c of cases) {
    const result = await shouldSave(c.item as ContentItem);
    const pass =
      c.expect === 'false or error'
        ? ['false', 'error'].includes(result.relevant)
        : result.relevant === c.expect;
    console.log(`${pass ? '✅' : '❌'} ${c.label}`);
    console.log(`   → relevant: ${result.relevant}, reason: ${result.reason}\n`);
  }
})();
