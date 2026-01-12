const _Knex = require("knex");

/**
 * @param {Knex} knex
 */
exports.up = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.string("dm_channel_id", 20).nullable();
	});
};

/**
 * @param {Knex} knex
 */
exports.down = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.dropColumn("dm_channel_id");
	});
};
