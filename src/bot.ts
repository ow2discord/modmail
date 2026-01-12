import type Eris from "eris";
import { Client } from "eris";
import config from "./cfg";

const intents = [
	// PRIVILEGED INTENTS
	"guildMembers", // For server greetings

	// REGULAR INTENTS
	"directMessages", // For core functionality
	"guildMessages", // For bot commands and mentions
	"messageContent", // For everything
	"guilds", // For core functionality
	"guildVoiceStates", // For member information in the thread header
	"guildMessageTyping", // For typing indicators
	"directMessageTyping", // For typing indicators
	"guildBans", // For join/leave notification Ban message

	// EXTRA INTENTS (from the config)
	...(config.extraIntents || []),
];

const erisIntents: Array<Eris.IntentStrings> = Array.from(
	new Set(intents),
) as Array<Eris.IntentStrings>;

const bot = new Client(config.token, {
	restMode: true,
	intents: erisIntents,
	allowedMentions: {
		everyone: false,
		roles: false,
		users: false,
	},
});

// Eris allegedly handles these internally, so we can ignore them
const SAFE_TO_IGNORE_ERROR_CODES = [
	1001, // "CloudFlare WebSocket proxy restarting"
	1006, // "Connection reset by peer"
	"ECONNRESET", // Pretty much the same as above
];

bot.on("error", (err: any) => {
	if (err.code && SAFE_TO_IGNORE_ERROR_CODES.includes(err.code)) {
		return;
	}

	throw err;
});

/**
 * @type {Eris.Client}
 */
export default bot;
