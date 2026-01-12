exports.up = async (knex, _Promise) => {
	await knex.schema.table("blocked_users", (table) => {
		table.dateTime("expires_at").nullable();
	});
};

exports.down = async (knex, _Promise) => {
	await knex.schema.table("blocked_users", (table) => {
		table.dropColumn("expires_at");
	});
};
