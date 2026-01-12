exports.up = async (knex, _Promise) => {
	await knex.schema.table("snippets", (table) => {
		table.dropColumn("is_anonymous");
	});
};

exports.down = async (knex, _Promise) => {
	await knex.schema.table("snippets", (table) => {
		table.integer("is_anonymous").unsigned().notNullable();
	});
};
