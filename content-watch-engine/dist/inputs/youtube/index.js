"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeInput = void 0;
const parser_1 = require("./parser");
const subscribe_1 = require("./subscribe");
const pipeline_1 = require("../../pipeline");
exports.youtubeInput = {
    id: 'youtube',
    async register(app) {
        // GET — hub verification challenge
        app.get('/webhook/youtube', async (req, reply) => {
            const { 'hub.mode': mode, 'hub.challenge': challenge } = req.query;
            if (mode === 'subscribe' && challenge)
                return reply.send(challenge);
            return reply.code(400).send();
        });
        // POST — new video notification
        app.post('/webhook/youtube', async (req, reply) => {
            reply.code(204).send();
            const item = await (0, parser_1.parseAtom)(req.body).catch(() => null);
            if (!item)
                return;
            await (0, pipeline_1.process)(item).catch(err => console.error('[youtube] pipeline error:', err));
        });
        await (0, subscribe_1.subscribeAll)();
        (0, subscribe_1.startSubscriptionCron)();
    },
};
