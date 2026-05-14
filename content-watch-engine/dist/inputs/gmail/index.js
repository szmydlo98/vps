"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gmailInput = void 0;
const poller_1 = require("./poller");
exports.gmailInput = {
    id: 'gmail',
    async register(_app) {
        await (0, poller_1.startGmailPoller)();
    },
};
