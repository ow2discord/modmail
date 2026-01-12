exports.up = async (knex, _Promise) => {
	await knex.schema.table("threads", (table) => {
		table
			.string("alert_id", 20)
			.nullable()
			.defaultTo(null)
			.after("scheduled_close_name");
	});
};

exports.down = async (knex, _Promise) => {
	await knex.schema.table("threads", (table) => {
		table.dropColumn("alert_id");
	});
};
