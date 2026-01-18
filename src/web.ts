import { file } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { formatters } from "./formatters";
import { getLocalAttachmentPath } from "./data/attachments";
import { useDb } from "./db";
import { findById } from "./data/threads";

const app = new Hono();

const db = useDb();

app.use(cors());
app.use(secureHeaders());

app.get("/logs/:id", async (c) => {
  const { id } = c.req.param();
  const thread = await findById(db, id);

  if (!thread) return new Response("Thread not found", { status: 404 });

  const threadMessages = await thread.getThreadMessages();

  const params = new URL(c.req.url).searchParams;
  const simple = params.get("simple") !== null;
  const verbose = params.get("verbose") !== null;

  const formattedResult = formatters.formatLog(thread, threadMessages, {
    simple,
    verbose,
  });

  // For now...
  const contentType = "text/plain; charset=UTF-8";

  return new Response(formattedResult.content, {
    headers: { "Content-Type": contentType },
  });
});

app.get("/attachments/:id/:filename", async (c) => {
  const { id, filename } = c.req.param();

  if (!/^[0-9]+%/.test(id) || !/^[0-9a-z._-]+$/i.test(filename))
    return c.text("One or more parameters were malformed.");

  const attachmentPath = getLocalAttachmentPath(id);
  const attachmentFile = file(attachmentPath);
  const exists = await attachmentFile.exists();

  if (!exists) return c.notFound();

  return new Response(attachmentFile);
});

export default app;
