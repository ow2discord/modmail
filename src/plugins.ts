import path from "node:path";
import attachments from "./data/attachments";
import * as logs from "./data/logs";
import * as formats from "./formatters";
import { afterNewMessageReceived } from "./hooks/afterNewMessageReceived";
import { afterThreadClose } from "./hooks/afterThreadClose";
import { afterThreadCloseScheduleCanceled } from "./hooks/afterThreadCloseScheduleCanceled";
import { afterThreadCloseScheduled } from "./hooks/afterThreadCloseScheduled";
import { beforeNewMessageReceived } from "./hooks/beforeNewMessageReceived";
import { beforeNewThread } from "./hooks/beforeNewThread";

const threads = require("./data/threads").default;

import type { Knex } from "knex";
import displayRoles from "./data/displayRoles";

export class PluginInstallationError extends Error {}

const pluginSources = {
	file: {},
};

function loadFilePlugin(
	plugin: string,
	pluginApi: ReturnType<typeof getPluginAPI>,
) {
	const requirePath = path.join(__dirname, "..", plugin);
	const pluginFn = require(requirePath);
	if (typeof pluginFn !== "function") {
		throw new PluginInstallationError(
			`Plugin '${plugin}' is not a valid plugin`,
		);
	}
	return pluginFn(pluginApi);
}

const defaultPluginSource = "file";

function splitPluginSource(pluginName: string) {
	for (const pluginSource of Object.keys(pluginSources)) {
		if (pluginName.startsWith(`${pluginSource}:`)) {
			return {
				source: pluginSource,
				plugin: pluginName.slice(pluginSource.length + 1),
			};
		}
	}

	return {
		source: defaultPluginSource,
		plugin: pluginName,
	};
}

export async function loadPlugins(
	plugins: Array<string>,
	pluginApi: ReturnType<typeof getPluginAPI>,
) {
	for (const pluginName of plugins) {
		const { source: _, plugin } = splitPluginSource(pluginName);
		await loadFilePlugin(plugin, pluginApi);
	}
}

export function getPluginAPI({
	bot,
	knex,
	config,
	commands,
}: {
	bot: any;
	knex: Knex;
	config: any;
	commands: any;
}) {
	return {
		bot,
		knex,
		config,
		commands: {
			manager: commands.manager,
			addGlobalCommand: commands.addGlobalCommand,
			addInboxServerCommand: commands.addInboxServerCommand,
			addInboxThreadCommand: commands.addInboxThreadCommand,
			addAlias: commands.addAlias,
		},
		attachments: {
			addStorageType: attachments.addStorageType,
			downloadAttachment: attachments.downloadAttachment,
			saveAttachment: attachments.saveAttachment,
		},
		logs: {
			addStorageType: logs.addStorageType,
			saveLogToStorage: logs.saveLogToStorage,
			getLogUrl: logs.getLogUrl,
			getLogFile: logs.getLogFile,
			getLogCustomResponse: logs.getLogCustomResponse,
		},
		hooks: {
			beforeNewThread,
			beforeNewMessageReceived,
			afterNewMessageReceived,
			afterThreadClose,
			afterThreadCloseScheduled,
			afterThreadCloseScheduleCanceled,
		},
		formats,
		threads,
		displayRoles,
	};
}
