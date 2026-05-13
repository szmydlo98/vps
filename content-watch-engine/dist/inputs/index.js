"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInputs = registerInputs;
const youtube_1 = require("./youtube");
// Add new input plugins to this array to activate them
const inputs = [youtube_1.youtubeInput];
async function registerInputs(app) {
    for (const input of inputs) {
        await input.register(app);
    }
}
