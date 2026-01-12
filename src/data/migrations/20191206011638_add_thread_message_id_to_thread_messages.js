const _Knex = require("knex");

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.string("inbox_message_id", 20).nullable().unique();
	});
};

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.dropColumn("inbox_message_id");
	});
};
