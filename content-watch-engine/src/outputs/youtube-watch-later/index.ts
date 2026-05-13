import { google } from 'googleapis';
import { OutputPlugin, ContentItem } from '../../types';
import { config } from '../../config';

const oauth2Client = new google.auth.OAuth2(
  config.googleClientId,
  config.googleClientSecret
);
oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

export const youtubeWatchLaterOutput: OutputPlugin = {
  id: 'youtube-watch-later',
  async save(item: ContentItem): Promise<void> {
    const videoId = item.metadata.videoId as string;
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: 'WL',
          resourceId: {
            kind: 'youtube#video',
            videoId,
          },
        },
      },
    });
  },
};
