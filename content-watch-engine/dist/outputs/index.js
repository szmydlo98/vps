"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputPlugin = getOutputPlugin;
const youtube_watch_later_1 = require("./youtube-watch-later");
// Add new output plugins to this array to activate them
const outputs = [youtube_watch_later_1.youtubeWatchLaterOutput];
function getOutputPlugin(id) {
    return outputs.find(o => o.id === id);
}
