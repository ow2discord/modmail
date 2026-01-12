import Eris, {
  DMChannel,
  GroupChannel,
  GuildChannel,
  ThreadChannel,
} from "eris";
import humanizeDuration from "humanize-duration";
import moment, { type MomentInput } from "moment";
import { publicIp } from "public-ip";
import { BotError } from "./BotError";
import bot from "./bot";
import config from "./cfg";
import type Thread from "./data/Thread";

const userMentionRegex = /^<@!?([0-9]+?)>$/;

let inboxGuild: Eris.Guild | undefined;
let mainGuilds: Array<Eris.Guild> = [];

/**
 * @returns {Eris~Guild}
 */
export function getInboxGuild(): Eris.Guild {
  if (!inboxGuild)
    inboxGuild = bot.guilds.find((g) => g.id === config.inboxServerId);
  if (!inboxGuild) throw new BotError("The bot is not on the inbox server!");
  return inboxGuild;
}

/**
 * @returns {Eris~Guild[]}
 */
export function getMainGuilds(): Array<Eris.Guild> {
  if (mainGuilds.length === 0) {
    mainGuilds = bot.guilds.filter((g) =>
      (config.mainServerId || "").includes(g.id),
    );
  }

  if (mainGuilds.length !== config.mainServerId?.length) {
    if (config.mainServerId?.length === 1) {
      console.warn("[WARN] The bot hasn't joined the main guild!");
    } else {
      console.warn("[WARN] The bot hasn't joined one or more main guilds!");
    }
  }

  return mainGuilds;
}

/**
 * Returns the designated log channel, or the default channel if none is set
 * @returns {Eris~TextChannel}
 */
export function getLogChannel(): Eris.TextChannel {
  const _inboxGuild = getInboxGuild();
  const _logChannel = _inboxGuild.channels.get(config.logChannelId || "");

  if (!_logChannel) {
    throw new BotError("Log channel (logChannelId) not found!");
  }

  if (!(_logChannel instanceof Eris.TextChannel)) {
    throw new BotError(
      "Make sure the logChannelId option is set to a text channel!",
    );
  }

  return _logChannel;
}

export function postLog(
  content: Eris.MessageContent,
  file?: Eris.FileContent | Eris.FileContent[],
) {
  return getLogChannel().createMessage(content, file);
}

export function postError(
  channel: Eris.TextChannel,
  content: string,
  opts = {},
) {
  return channel.createMessage({
    ...opts,
    content: `! ${content}`,
  });
}

/**
 * Returns whether the given member has permission to use modmail commands
 * @param {Eris.Member} member
 * @returns {boolean}
 */
export function isStaff(member: Eris.Member | null): boolean {
  if (!member) return false;
  if (config.inboxServerPermission?.length === 0) return true;
  if (member.guild.ownerID === member.id) return true;

  return (config.inboxServerPermission || []).some((perm) => {
    if (isSnowflake(perm as string)) {
      // If perm is a snowflake, check it against the member's user id and roles
      if (member.id === perm) return true;
      if (member.roles.includes(perm as string)) return true;
    } else {
      // Otherwise assume perm is the name of a permission
      // TODO: properly type
      return member.permissions.has(perm as any);
    }

    return false;
  });
}

/**
 * Returns whether the given message is on the inbox server
 * @param {Eris.Client} client
 * @param {Eris.Message} msg
 * @returns {Promise<boolean>}
 */
export async function messageIsOnInboxServer(
  client: Eris.Client,
  msg: Eris.Message,
): Promise<boolean> {
  const channel = (await getOrFetchChannel(
    client,
    msg.channel.id,
  )) as Eris.TextChannel;
  if (!channel || !channel.guild) return false;
  if (channel.guild.id !== getInboxGuild().id) return false;
  return true;
}

/**
 * Returns whether the given message is on the main server
 * @param {Eris.Client} client
 * @param {Eris.Message} msg
 * @returns {Promise<boolean>}
 */
export async function messageIsOnMainServer(
  client: Eris.Client,
  msg: Eris.Message,
): Promise<boolean> {
  const channel = (await getOrFetchChannel(
    client,
    msg.channel.id,
  )) as Eris.TextChannel | null;
  if (!channel || !channel.guild) return false;

  return getMainGuilds().some((g) => channel.guild.id === g.id);
}

/**
 * @param {Eris.Attachment} attachment
 * @param {string} attachmentUrl
 * @returns {Promise<string>}
 */
export async function formatAttachment(
  attachment: Eris.Attachment,
  attachmentUrl: string,
): Promise<string> {
  let filesize = attachment.size || 0;
  filesize /= 1024;

  return `**Attachment:** ${attachment.filename} (${filesize.toFixed(1)}KB)\n${attachmentUrl}`;
}

/**
 * Returns the user ID of the user mentioned in str, if any
 * @param {String} str
 * @returns {String|null}
 */
export function getUserMention(str: string): string | null {
  if (!str) return null;

  str = str.trim();

  if (isSnowflake(str)) {
    // User ID
    return str;
  } else {
    const mentionMatch = str.match(userMentionRegex);
    if (mentionMatch) return mentionMatch[1] || null;
  }

  return null;
}

/**
 * Returns the current timestamp in an easily readable form
 * @param {...Parameters<typeof moment>>} momentArgs
 * @returns {String}
 */
export function getTimestamp(input: MomentInput, strict = false): string {
  return moment.utc(input, strict).format("HH:mm");
}

/**
 * Disables link previews in the given string by wrapping links in < >
 * @param {String} str
 * @returns {String}
 */
export function disableLinkPreviews(str: string): string {
  return str.replace(/(^|[^<])(https?:\/\/\S+)/gi, "$1<$2>");
}

/** @var {Promise<string>|null} cachedIp */
let cachedIpPromise: Promise<string> | null = null;

/**
 * @returns {Promise<string>}
 */
export async function getSelfIp(): Promise<string> {
  if (!cachedIpPromise) {
    cachedIpPromise = publicIp({ timeout: 1000 }).catch((err) => {
      console.warn(`Error while fetching public ip: ${err}`);
      return "UNKNOWN";
    });
  }

  if (cachedIpPromise === null) {
    return Promise.resolve("");
  }

  return cachedIpPromise;
}

/**
 * Returns a URL to the bot's web server
 * @param {String} path
 * @returns {Promise<String>}
 */
export async function getSelfUrl(path: string = ""): Promise<string> {
  if (config.url) {
    return `${config.url}/${path}`;
  } else {
    const port = config.port || 8890;
    const ip = await getSelfIp();
    return `http://${ip}:${port}/${path}`;
  }
}

/**
 * Returns the highest hoisted role of the given member
 * @param {Eris~Member} member
 * @returns {Eris~Role}
 */
export function getMainRole(member: Eris.Member): Eris.Role {
  const roles = member.roles.map((id) => member.guild.roles.get(id));
  roles.sort((a: Eris.Role | undefined, b: Eris.Role | undefined) => {
    if (a && b) {
      return a.position > b.position ? -1 : 1;
    }

    return 0;
  });

  return roles.find((r) => r?.hoist) as Eris.Role;
}

/**
 * Splits array items into chunks of the specified size
 */
export function chunk<T>(items: Array<T>, chunkSize: number): Array<Array<T>> {
  const result: Array<Array<T>> = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    result.push(items.slice(i, i + chunkSize));
  }

  return result;
}

/**
 * Trims every line in the string
 * @param {String} str
 * @returns {String}
 */
export function trimAll(str: string): string {
  return str
    .split("\n")
    .map((_str) => _str.trim())
    .join("\n");
}

/**
 * Turns a "delay string" such as "1h30m" to milliseconds
 * @param {String} str
 * @returns {Number|null}
 */
export function convertDelayStringToMS(str: string): number | null {
  const regex = /(\d+)([smhdw])/g;
  let totalMs = 0;

  const units: Record<string, number> = {
    s: 1000, // seconds
    m: 60 * 1000, // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000, // days
    w: 7 * 24 * 60 * 60 * 1000, // weeks
  };

  let match = regex.exec(str);
  while (match !== null) {
    if (match.length > 1) {
      const value = parseInt(match[1] || "", 10);
      const unit = match[2] || "";

      if (units[unit]) {
        totalMs += value * units[unit];
      }
    }

    match = regex.exec(str);
  }

  // Return null if no valid time units were found
  return totalMs > 0 ? totalMs : null;
}

/**
 * @param {string|string[]} mentionRoles
 * @returns {string[]}
 */
export function getValidMentionRoles(
  mentionRoles: string | string[],
): string[] {
  if (!Array.isArray(mentionRoles)) {
    mentionRoles = [mentionRoles];
  }

  return mentionRoles.filter((roleStr) => {
    return (
      roleStr !== null &&
      roleStr !== "none" &&
      roleStr !== "off" &&
      roleStr !== ""
    );
  });
}

/**
 * @param {string[]} mentionRoles
 * @returns {string}
 */
export function mentionRolesToMention(mentionRoles: string[]): string {
  const mentions: Array<string> = [];
  for (const role of mentionRoles) {
    if (role === "here") mentions.push("@here");
    else if (role === "everyone") mentions.push("@everyone");
    else mentions.push(`<@&${role}>`);
  }
  return `${mentions.join(" ")} `;
}

/**
 * @returns {string}
 */
export function getInboxMention(): string {
  const mentionRoles = getValidMentionRoles(config.mentionRole || []);
  return mentionRolesToMention(mentionRoles);
}

/**
 * @param {string[]} mentionRoles
 * @returns {object}
 */
export function mentionRolesToAllowedMentions(mentionRoles: string[]): object {
  const allowedMentions = {
    everyone: false,
    roles: [] as Array<string>,
  };

  for (const role of mentionRoles) {
    if (role === "here" || role === "everyone") allowedMentions.everyone = true;
    else allowedMentions.roles.push(role);
  }

  return allowedMentions;
}

/**
 * @returns {object}
 */
export function getInboxMentionAllowedMentions(): object {
  const mentionRoles = getValidMentionRoles(config.mentionRole || []);
  return mentionRolesToAllowedMentions(mentionRoles);
}

export function postSystemMessageWithFallback(
  channel: Eris.TextChannel,
  thread: Thread,
  text: string,
) {
  if (thread) {
    thread.postSystemMessage(text);
  } else {
    channel.createMessage(text);
  }
}

/**
 * A normalized way to set props in data models, fixing some inconsistencies between different DB drivers in knex
 * @param {Object} target
 * @param {Object} props
 */
export function setDataModelProps<
  T extends Record<string | number | symbol, unknown>,
>(target: T, props: T) {
  for (const prop in props) {
    if (!Object.hasOwn(props, prop)) continue;
    // DATETIME fields are always returned as Date objects in MySQL/MariaDB
    if (props[prop] instanceof Date) {
      // ...even when NULL, in which case the date's set to unix epoch
      if (props[prop].getUTCFullYear() === 1970) {
        target[prop] = null as T[Extract<keyof T, string>];
      } else {
        // Set the value as a string in the same format it's returned in SQLite
        target[prop] = moment
          .utc(props[prop])
          .format("YYYY-MM-DD HH:mm:ss") as T[Extract<keyof T, string>];
      }
    } else {
      target[prop] = props[prop];
    }
  }
}

export function isSnowflake(str: string) {
  return /^[0-9]{17,}$/.test(str);
}

export const humanizeDelay = (delay: number, opts = {}) =>
  humanizeDuration(delay, Object.assign({ conjunction: " and " }, opts));

export function escapeMarkdown(str: string) {
  return str.replace(/([\\_*|`~])/g, "\\$1");
}

export function disableInlineCode(str: string) {
  return str.replace(/`/g, "'");
}

export function disableCodeBlocks(str: string) {
  return str.replace(/`/g, "`\u200b");
}

export function readMultilineConfigValue(str: Array<string> | string) {
  return Array.isArray(str) ? str.join("\n") : str;
}

// ()‘ ‘•)
export function noop() {}

// https://discord.com/developers/docs/resources/channel#create-message-params
const MAX_MESSAGE_CONTENT_LENGTH = 2000;

// https://discord.com/developers/docs/resources/channel#embed-limits
const MAX_EMBED_CONTENT_LENGTH = 6000;

/**
 * Checks if the given message content is within Discord's message length limits.
 *
 * Based on testing, Discord appears to enforce length limits (at least in the client)
 * the same way JavaScript does, using the UTF-16 byte count as the number of characters.
 *
 * @param {string|Eris.MessageContent} content
 */
export function messageContentIsWithinMaxLength(
  content: string | Eris.MessageContent,
) {
  if (typeof content === "string") {
    content = { content };
  }

  if (content.content && content.content.length > MAX_MESSAGE_CONTENT_LENGTH) {
    return false;
  }

  if (content.embeds) {
    for (const embed of content.embeds) {
      let embedContentLength = 0;

      if (embed.title) embedContentLength += embed.title.length;
      if (embed.description) embedContentLength += embed.description.length;
      if (embed.footer?.text) {
        embedContentLength += embed.footer.text.length;
      }
      if (embed.author?.name) {
        embedContentLength += embed.author.name.length;
      }

      if (embed.fields) {
        for (const field of embed.fields) {
          if (field.name === "title") embedContentLength += field.name.length;
          if (field.name === "description")
            embedContentLength += field.value.length;
        }
      }

      if (embedContentLength > MAX_EMBED_CONTENT_LENGTH) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Splits a string into chunks, preferring to split at a newline
 * @param {string} str
 * @param {number} [maxChunkLength=2000]
 * @returns {string[]}
 */
export function chunkByLines(
  str: string,
  maxChunkLength: number = 2000,
): string[] {
  if (str.length < maxChunkLength) {
    return [str];
  }

  const chunks = [];

  while (str.length) {
    if (str.length <= maxChunkLength) {
      chunks.push(str);
      break;
    }

    const slice = str.slice(0, maxChunkLength);

    const lastLineBreakIndex = slice.lastIndexOf("\n");
    if (lastLineBreakIndex === -1) {
      chunks.push(str.slice(0, maxChunkLength));
      str = str.slice(maxChunkLength);
    } else {
      chunks.push(str.slice(0, lastLineBreakIndex));
      str = str.slice(lastLineBreakIndex + 1);
    }
  }

  return chunks;
}

/**
 * Chunks a long message to multiple smaller messages, retaining leading and trailing line breaks, open code blocks, etc.
 *
 * Default maxChunkLength is 1990, a bit under the message length limit of 2000, so we have space to add code block
 * shenanigans to the start/end when needed. Take this into account when choosing a custom maxChunkLength as well.
 */
export function chunkMessageLines(str: string, maxChunkLength = 1990) {
  const chunks = chunkByLines(str, maxChunkLength);
  let openCodeBlock = false;

  return chunks.map((_chunk) => {
    // If the chunk starts with a newline, add an invisible unicode char so Discord doesn't strip it away
    if (_chunk[0] === "\n") _chunk = `\u200b${_chunk}`;
    // If the chunk ends with a newline, add an invisible unicode char so Discord doesn't strip it away
    if (_chunk[_chunk.length - 1] === "\n") _chunk = `${_chunk}\u200b`;
    // If the previous chunk had an open code block, open it here again
    if (openCodeBlock) {
      openCodeBlock = false;
      if (_chunk.startsWith("```")) {
        // Edge case: chunk starts with a code block delimiter, e.g. the previous chunk and this one were split right before the end of a code block
        // Fix: just strip the code block delimiter away from here, we don't need it anymore
        _chunk = _chunk.slice(3);
      } else {
        _chunk = `\`\`\`${_chunk}`;
      }
    }
    // If the chunk has an open code block, close it and open it again in the next chunk
    const codeBlockDelimiters = _chunk.match(/```/g);
    if (codeBlockDelimiters && codeBlockDelimiters.length % 2 !== 0) {
      _chunk += "```";
      openCodeBlock = true;
    }

    return _chunk;
  });
}

/**
 * @type {Record<string, Promise<Eris.AnyChannel | null>>}
 */
const fetchChannelPromises: Record<
  string,
  Promise<Eris.AnyChannel | null>
> = {};

/**
 * @param {Eris.Client} client
 * @param {string} channelId
 * @returns {Promise<Eris.AnyChannel | null>}
 */
export async function getOrFetchChannel(
  client: Eris.Client,
  channelId: string,
): Promise<Eris.AnyChannel | null> {
  const cachedChannel = client.getChannel(channelId);
  if (cachedChannel) {
    return cachedChannel;
  }

  if (!fetchChannelPromises[channelId]) {
    fetchChannelPromises[channelId] = (async () => {
      const channel = await client.getRESTChannel(channelId);
      if (!channel) {
        return null;
      }

      // Cache the result
      if (channel instanceof ThreadChannel) {
        channel.guild.threads.add(channel);
        client.threadGuildMap[channel.id] = channel.guild.id;
      } else if (channel instanceof GuildChannel) {
        channel.guild.channels.add(channel);
        client.channelGuildMap[channel.id] = channel.guild.id;
      } else if (channel instanceof DMChannel) {
        client.dmChannels.add(channel);
      } else if (channel instanceof GroupChannel) {
        // TODO: Check if this is even necessary.
        //        client.groupChannels.add(channel);
      }

      return channel;
    })();
  }

  return fetchChannelPromises[channelId];
}

/**
 * Converts a MessageContent, i.e. string | AdvancedMessageContent, to an AdvancedMessageContent object
 * @param {Eris.MessageContent} content
 * @returns {Eris.AdvancedMessageContent}
 */
export function messageContentToAdvancedMessageContent(
  content: Eris.MessageContent,
): Eris.AdvancedMessageContent {
  return typeof content === "string" ? { content } : content;
}

export const START_CODEBLOCK = "```";
export const END_CODEBLOCK = "```";
