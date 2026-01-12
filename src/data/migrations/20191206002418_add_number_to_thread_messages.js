const _Knex = require("knex");

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.integer("message_number").unsigned().nullable();
	});
};

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.dropColumn("message_number");
	});
};
