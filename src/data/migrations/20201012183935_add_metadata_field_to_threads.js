exports.up = async (knex) => {
	await knex.schema.table("threads", (table) => {
		table.text("metadata").nullable().defaultTo(null);
	});
};

exports.down = async (knex) => {
	await knex.schema.table("threads", (table) => {
		table.dropColumn("metadata");
	});
};
