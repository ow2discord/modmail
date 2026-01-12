import { file } from "bun";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import attachments from "./data/attachments";
import threads from "./data/threads";
import { formatters } from "./formatters";

const app = new Hono();

app.use(cors());
app.use(secureHeaders());

app.get("/logs/:id", async (c) => {
	const { id } = c.req.param();
	const thread = await threads.findById(id);

	if (!thread) return new Response("Thread not found", { status: 404 });

	const threadMessages = await thread.getThreadMessages();

	const params = new URL(c.req.url).searchParams;
	const simple = params.get("simple") !== null;
	const verbose = params.get("verbose") !== null;

	const formattedResult = await formatters.formatLog(thread, threadMessages, {
		simple,
		verbose,
	});

	const contentType =
		formattedResult.extra?.contentType || "text/plain; charset=UTF-8";

	return new Response(formattedResult.content, {
		headers: { "Content-Type": contentType },
	});
});

app.get("/attachments/:id/:filename", async (c) => {
	const { id, filename } = c.req.param();

	if (!/^[0-9]+%/.test(id) || !/^[0-9a-z._-]+$/i.test(filename))
		return c.text("One or more parameters were malformed.");

	const attachmentPath = attachments.getLocalAttachmentPath(id);
	const attachmentFile = file(attachmentPath);
	const exists = await attachmentFile.exists();

	if (!exists) return c.notFound();

	return new Response(attachmentFile);
});

export default app;
