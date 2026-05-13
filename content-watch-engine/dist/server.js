"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServer = buildServer;
const fastify_1 = __importDefault(require("fastify"));
const config_1 = require("./config");
function buildServer() {
    const app = (0, fastify_1.default)({ logger: { level: config_1.config.logLevel } });
    app.addContentTypeParser(['application/atom+xml', 'application/xml', 'text/xml'], { parseAs: 'string' }, (_req, body, done) => done(null, body));
    return app;
}
