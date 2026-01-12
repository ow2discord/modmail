import { utc } from "moment";
import knex from "../knex";
import { Snippet } from "./Snippet";

export async function get(trigger: string): Promise<Snippet | null> {
	const snippet = await knex("snippets")
		.whereRaw("LOWER(`trigger`) = ?", [trigger.toLowerCase()])
		.first();

	return snippet ? new Snippet(snippet) : null;
}

export async function add(trigger: string, body: string, createdBy = 0) {
	if (await get(trigger)) return;

	return knex("snippets").insert({
		trigger,
		body,
		created_by: createdBy,
		created_at: utc().format("YYYY-MM-DD HH:mm:ss"),
	});
}

export async function del(trigger: string) {
	return knex("snippets")
		.whereRaw("LOWER(`trigger`) = ?", [trigger.toLowerCase()])
		.delete();
}

export async function all() {
	const snippets = await knex("snippets").select();

	return snippets.map((s) => new Snippet(s));
}
