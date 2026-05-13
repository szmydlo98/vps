"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeWatchLaterOutput = void 0;
const googleapis_1 = require("googleapis");
const config_1 = require("../../config");
const oauth2Client = new googleapis_1.google.auth.OAuth2(config_1.config.googleClientId, config_1.config.googleClientSecret);
oauth2Client.setCredentials({ refresh_token: config_1.config.googleRefreshToken });
const youtube = googleapis_1.google.youtube({ version: 'v3', auth: oauth2Client });
exports.youtubeWatchLaterOutput = {
    id: 'youtube-watch-later',
    async save(item) {
        const videoId = item.metadata.videoId;
        await youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    playlistId: config_1.config.youtubePlaylistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId,
                    },
                },
            },
        });
    },
};
