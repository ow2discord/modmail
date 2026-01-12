const path = require("node:path");
const fs = require("node:fs");
const { promisify } = require("node:util");
const utils = require("../utils");
const updates = require("../data/updates");
const { getPrettyVersion } = require("../botVersion");

const _access = promisify(fs.access);
const _readFile = promisify(fs.readFile);

const _GIT_DIR = path.join(__dirname, "..", "..", ".git");

module.exports = ({ bot, knex, config, commands }) => {
	commands.addInboxServerCommand("version", [], async (msg, _args, thread) => {
		let response = `Modmail ${getPrettyVersion()}`;

		if (config.updateNotifications) {
			const availableUpdate = await updates.getAvailableUpdate();
			if (availableUpdate) {
				response += ` (version ${availableUpdate} available)`;
			}
		}

		utils.postSystemMessageWithFallback(msg.channel, thread, response);
	});
};
