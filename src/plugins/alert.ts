import type { ModuleProps } from "../plugins";

export default ({ config, commands }: ModuleProps) => {
  commands.addInboxThreadCommand(
    "alert",
    "[opt:string]",
    async (msg, args, thread) => {
      if (!thread) return;

      if ((args.opt as string).startsWith("c")) {
        await thread.removeAlert(msg.author.id);
        await thread.postSystemMessage(
          ":red_circle: Cancelled new message alert",
        );
      } else {
        await thread.addAlert(msg.author.id);
        await thread.postSystemMessage(
          `:red_circle: Pinging ${msg.member?.nickname || config.useDisplaynames ? msg.author.globalName || msg.author.username : msg.author.username} when this thread gets a new reply`,
        );
      }
    },
    { allowSuspended: true },
  );
};
