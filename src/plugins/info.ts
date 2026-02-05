import {
  type DiscordAPIError,
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type HexColorString,
} from "discord.js";
import type { ModuleProps } from "../plugins";
import { Colours, Emoji, Spacing } from "../style";
import { getMainGuilds } from "../utils";

export default ({ commands, bot }: ModuleProps) => {
  commands.addInboxThreadCommand(
    "fakeclose",
    "",
    async (msg, _args, thread) => {
      if (!thread || !msg.channel.isSendable()) return;

      const user = await bot.users.fetch(thread.user_id);
      if (!user) return;
      const author = user;

      // author name/id
      // participant mod names
      // closing mod name
      // messages sent from user
      // messages sent to user
      // internal messages
      // loglink
      // time open

      const embed = new EmbedBuilder();
      embed.setTitle(`Thread #28 with ${user.username} 📤`);
      embed.setDescription("-# Closed by freakazoidal");
      embed.setColor(Colours.BanRed as HexColorString);
      embed.addFields([
        {
          name: `Participants`,
          value: `-# <:StaffRaised:1159810180695982080> dray (10), Pemoinop (8)`, // , dray (10), kieu_ (8), ash (10), jaedyn (8), & silence (2)
          inline: true,
        },
        {
          name: "Total Messages",
          value: `-# **4** In, **10** Out, **8** Internal`,
          inline: true,
        },
        {
          name: "User ID",
          value: `\`${user.id}\``,
          inline: true,
        },
        {
          name: "",
          value: `-# https://modmail.ow2discord.org/logs/6178575d-6160-42a6-a93e-de3928c18d1c`,
        },
      ]);

      thread.postSystemMessage({
        content: "",
        embeds: [embed],
      });
    },
    {},
  );
  commands.addInboxThreadCommand(
    "header",
    "",
    async (msg, _args, thread) => {
      if (!thread || !msg.channel.isSendable()) return;

      const user = await bot.users.fetch(thread.user_id);
      if (!user) return;

      // Find which main guilds this user is part of
      const mainGuilds = getMainGuilds();
      const userGuildData = new Map<
        string,
        { guild: Guild; member: GuildMember }
      >();

      for (const guild of mainGuilds) {
        try {
          const member = await guild.members.fetch(user.id);

          if (member) {
            userGuildData.set(guild.id, { guild, member });
          }
        } catch (e: unknown) {
          // We can safely discard this error, because it just means we couldn't find the member in the guild
          // Which - for obvious reasons - is completely okay.
          if ((e as DiscordAPIError).code !== 10007) console.log(e);
        }
      }

      try {
        await thread.sendInfoHeader(user, userGuildData);
      } catch (err) {
        console.log("Could not send user header");
        console.error(err);
      }
    },
    {},
  );
};
