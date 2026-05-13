import { FastifyInstance } from 'fastify';

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  sourceName: string;
  hint: string;
  alwaysSave: boolean;
  output: string;
  metadata: Record<string, unknown>;
}

export type RelevanceStatus = 'true' | 'false' | 'error';

export interface FilterResult {
  relevant: RelevanceStatus;
  reason: string;
  errorDetail?: string;
}

export interface InputPlugin {
  id: string;
  register(app: FastifyInstance): Promise<void>;
}

export interface OutputPlugin {
  id: string;
  save(item: ContentItem): Promise<void>;
}
