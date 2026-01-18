import { Events, GuildChannel } from "discord.js";
import type { ModuleProps } from "../plugins";
import { findByChannelId, findOpenThreadByUserId } from "../data/threads";
import { noop } from "../utils";

export default ({ bot, db, config }: ModuleProps) => {
  // Typing proxy: forwarding typing events between the DM and the modmail thread
  if (config.typingProxy || config.typingProxyReverse) {
    bot.on(Events.TypingStart, async ({ channel, user }) => {
      if (!user) {
        // If the user doesn't exist in the bot's cache, it will be undefined here
        return;
      }

      // config.typingProxy: forward user typing in a DM to the modmail thread
      if (config.typingProxy && !(channel instanceof GuildChannel)) {
        const thread = await findOpenThreadByUserId(db, user.id);
        if (!thread || !channel.isSendable()) return;

        await channel.sendTyping().catch(noop);
      }

      // config.typingProxyReverse: forward moderator typing in a thread to the DM
      else if (
        config.typingProxyReverse &&
        channel instanceof GuildChannel &&
        !user.bot
      ) {
        const thread = await findByChannelId(db, channel.id);
        if (!thread) return;

        const dmChannel = await thread.getDMChannel();
        if (!dmChannel) return;

        dmChannel.sendTyping().catch(noop);
      }
    });
  }
};
