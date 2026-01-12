import { accessSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import cfg from "../cfg";
import { formatters } from "../formatters";
import { getSelfUrl } from "../utils";
import { THREAD_STATUS } from "./constants";
import type Thread from "./Thread";
import type ThreadMessage from "./ThreadMessage";

const { logStorage, logOptions } = cfg;

interface LogStorageType {
	shouldSave?: (thread: Thread) => Promise<boolean> | boolean;
	save: (thread: Thread, threadMessages: Array<ThreadMessage>) => Promise<any>;
	getFile?: (
		thread: Thread,
	) => Promise<{ file: string; name: string } | null | undefined>;
	getUrl?: (thread: Thread) => Promise<string>;
}

export const logStorageTypes: Record<string, LogStorageType> = {
	none: {
		async save(_thread, _messages) {
			return null;
		},
	},
	local: {
		async save(_thread, _messages) {
			return null;
		},
		getUrl(thread) {
			return getSelfUrl(`logs/${thread.id}`);
		},
	},
	attachment: {
		shouldSave(thread: Thread) {
			return thread.status === THREAD_STATUS.CLOSED;
		},
		async save(thread: Thread, threadMessages: Array<ThreadMessage>) {
			const { fullPath, filename } = getLogAttachmentFilename(thread.id);
			const formatLogResult = formatters.formatLog(thread, threadMessages);
			writeFileSync(fullPath, formatLogResult.content, { encoding: "utf8" });
			return { fullPath, filename };
		},
		async getFile(thread: Thread) {
			const { fullPath, filename } = thread.log_storage_data || {
				fullPath: undefined,
				filename: "unknown",
			};
			if (!fullPath) return;
			try {
				accessSync(fullPath);
			} catch (_e) {
				return null;
			}
			return {
				file: readFileSync(fullPath, { encoding: "utf8" }),
				name: filename,
			};
		},
	},
};

export const addStorageType = (name: string, handler: LogStorageType) => {
	logStorageTypes[name] = handler;
};

export const saveLogToStorage = async (
	thread: Thread,
	storageType?: keyof typeof logStorageTypes,
) => {
	const storageSystem: LogStorageType = logStorageTypes[
		storageType || logStorage || "none"
	] || {
		async save(_) {
			return null;
		},
	};

	if (storageSystem.shouldSave && !(await storageSystem.shouldSave(thread)))
		return;
	if (storageSystem.save) {
		const threadMessages = await thread.getThreadMessages();
		const storageData = await storageSystem.save(thread, threadMessages);
		await thread.updateLogStorageValues(storageType as string, storageData);
	}
};

export const getLogUrl = async (thread: Thread) => {
	if (!thread.log_storage_type) {
		await saveLogToStorage(thread);
	}

	const { getUrl } = logStorageTypes[thread.log_storage_type] || {};
	return getUrl ? getUrl(thread) : null;
};

export const getLogFile = async (
	thread: Thread,
): Promise<{ file: string; name: string } | null | undefined> => {
	if (!thread.log_storage_type) {
		await saveLogToStorage(thread);
	}

	const { getFile } = logStorageTypes[thread.log_storage_type as string] || {};
	if (getFile) {
		return getFile(thread) || null;
	}

	return null;
};

export const getLogCustomResponse = async (_thread: Thread) => {
	return null;
	// if (!thread.log_storage_type) {
	//   await saveLogToStorage(thread);
	// }
	//
	// const { getCustomResponse } = logStorageTypes[thread.log_storage_type] || {};
	// return getCustomResponse ? getCustomResponse(thread) : null;
};

export const getLogAttachmentFilename = (threadId: string) => {
	const filename = `${threadId}.txt`;
	const fullPath = join(logOptions?.attachmentDirectory || "", filename);

	return { filename, fullPath };
};
