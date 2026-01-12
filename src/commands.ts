import type Eris from "eris";
import type { TextChannel } from "eris";
import {
	CommandManager,
	defaultParameterTypes,
	type TParseableSignature,
	TypeConversionError,
} from "knub-command-manager";
import config from "./cfg";
import type Thread from "./data/Thread";
import threads from "./data/threads";
import {
	convertDelayStringToMS,
	getUserMention,
	isStaff,
	messageIsOnInboxServer,
	postError,
} from "./utils";

const prefix = config.prefix || "!";

export function createCommandManager(bot: Eris.Client) {
	const manager = new CommandManager({
		prefix,
		types: Object.assign({}, defaultParameterTypes, {
			userId(value: string) {
				const userId = getUserMention(value);
				if (!userId) throw new TypeConversionError();
				return userId;
			},
			delay(value: string) {
				const ms = convertDelayStringToMS(value);
				if (ms === null) throw new TypeConversionError();
				return ms;
			},
		}),
	});

	const handlers: Record<number, any> = {};
	const aliasMap = new Map();

	bot.on("messageCreate", async (msg) => {
		if (msg.author.bot) return;
		if (msg.author.id === bot.user.id) return;
		if (!msg.content) return;

		const matchedCommand = await manager.findMatchingCommand(msg.content, {
			msg,
		});
		if (matchedCommand === null) return;
		if (matchedCommand.error !== undefined) {
			postError(msg.channel as TextChannel, matchedCommand.error);
			return;
		}

		const allArgs: Record<string, any> = {};
		for (const [name, arg] of Object.entries(matchedCommand.args)) {
			allArgs[name] = arg.value;
		}
		for (const [name, opt] of Object.entries(matchedCommand.opts)) {
			allArgs[name] = opt.value;
		}

		handlers[matchedCommand.id](msg, allArgs);
	});

	const addGlobalCommand = (
		trigger: string | RegExp,
		parameters: TParseableSignature | undefined,
		handler: any,
		commandConfig: Record<string, any> = {},
	) => {
		const aliases = aliasMap.has(trigger) ? [...aliasMap.get(trigger)] : [];
		if (commandConfig.aliases) aliases.push(...commandConfig.aliases);

		const cmd = manager.add(trigger, parameters, {
			...commandConfig,
			aliases,
		});
		handlers[cmd.id] = handler;
	};

	const addInboxServerCommand = (
		trigger: string | RegExp,
		parameters: TParseableSignature | undefined,
		handler: (arg0: any, arg1: any, arg2: Thread) => void,
		commandConfig: Record<string, any> = {},
	) => {
		const aliases = aliasMap.has(trigger) ? [...aliasMap.get(trigger)] : [];
		if (commandConfig.aliases) aliases.push(...commandConfig.aliases);

		const cmd = manager.add(trigger, parameters, {
			...commandConfig,
			aliases,
			preFilters: [
				async (_, context) => {
					if (!(await messageIsOnInboxServer(bot, context.msg))) return false;
					if (!isStaff(context.msg.member)) return false;
					return true;
				},
			],
		});

		handlers[cmd.id] = async (msg: Eris.Message, args: any) => {
			const thread = await threads.findOpenThreadByChannelId(msg.channel.id);
			handler(msg, args, thread);
		};
	};

	const addInboxThreadCommand = (
		trigger: string | RegExp,
		parameters: TParseableSignature | undefined,
		handler: (arg0: any, arg1: any, arg2: Thread) => void,
		commandConfig: Record<string, any> = {},
	) => {
		const aliases = aliasMap.has(trigger) ? [...aliasMap.get(trigger)] : [];
		if (commandConfig.aliases) aliases.push(...commandConfig.aliases);

		let thread: null | Thread;

		const cmd = manager.add(trigger, parameters, {
			...commandConfig,
			aliases,
			preFilters: [
				async (_, context) => {
					if (!(await messageIsOnInboxServer(bot, context.msg))) return false;
					if (!isStaff(context.msg.member)) return false;
					if (commandConfig.allowSuspended) {
						thread = await threads.findByChannelId(context.msg.channel.id);
					} else {
						thread = await threads.findOpenThreadByChannelId(
							context.msg.channel.id,
						);
					}
					if (!thread) return false;
					return true;
				},
			],
		});

		handlers[cmd.id] = async (msg: any, args: any) => {
			handler(msg, args, thread as Thread);
		};
	};

	const addAlias = (originalCmd: string, alias: string) => {
		if (!aliasMap.has(originalCmd)) {
			aliasMap.set(originalCmd, new Set());
		}

		aliasMap.get(originalCmd).add(alias);
	};

	return {
		manager,
		addGlobalCommand,
		addInboxServerCommand,
		addInboxThreadCommand,
		addAlias,
	};
}
