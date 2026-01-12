exports.up = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.text("metadata").nullable().defaultTo(null);
	});
};

exports.down = async (knex) => {
	await knex.schema.table("thread_messages", (table) => {
		table.dropColumn("metadata");
	});
};
