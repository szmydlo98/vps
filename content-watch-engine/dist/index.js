"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const inputs_1 = require("./inputs");
const config_1 = require("./config");
async function main() {
    const app = (0, server_1.buildServer)();
    await (0, inputs_1.registerInputs)(app);
    await app.listen({ port: config_1.config.port, host: '0.0.0.0' });
    console.log(`Server listening on port ${config_1.config.port}`);
}
main().catch(err => { console.error(err); process.exit(1); });
