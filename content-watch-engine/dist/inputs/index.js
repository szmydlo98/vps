"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInputs = registerInputs;
const youtube_1 = require("./youtube");
const gmail_1 = require("./gmail");
// Add new input plugins to this array to activate them
const inputs = [youtube_1.youtubeInput, gmail_1.gmailInput];
async function registerInputs(app) {
    for (const input of inputs) {
        await input.register(app);
    }
}
