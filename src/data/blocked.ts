import { utc } from "moment";
import knex from "../knex";

/**
 * @param {String} userId
 * @returns {Promise<{ isBlocked: boolean, expiresAt: string }>}
 */
export async function getBlockStatus(
	userId: string,
): Promise<{ isBlocked: boolean; expiresAt: string }> {
	const row = await knex("blocked_users").where("user_id", userId).first();

	return {
		isBlocked: !!row,
		expiresAt: row?.expires_at,
	};
}

/**
 * Checks whether userId is blocked
 * @param {String} userId
 * @returns {Promise<Boolean>}
 */
export async function isBlocked(userId: string): Promise<boolean> {
	return (await getBlockStatus(userId)).isBlocked;
}

/**
 * Blocks the given userId
 * @param {String} userId
 * @param {String} userName
 * @param {String} blockedBy
 * @returns {Promise}
 */
export async function block(
	userId: string,
	userName: string = "",
	blockedBy: string = "",
	expiresAt = null,
): Promise<any> {
	if (await isBlocked(userId)) return;

	return knex("blocked_users").insert({
		user_id: userId,
		user_name: userName,
		blocked_by: blockedBy,
		blocked_at: utc().format("YYYY-MM-DD HH:mm:ss"),
		expires_at: expiresAt,
	});
}

/**
 * Unblocks the given userId
 * @param {String} userId
 * @returns {Promise}
 */
export async function unblock(userId: string): Promise<any> {
	return knex("blocked_users").where("user_id", userId).delete();
}

/**
 * Updates the expiry time of the block for the given userId
 * @param {String} userId
 * @param {String} expiresAt
 * @returns {Promise<void>}
 */
export async function updateExpiryTime(
	userId: string,
	expiresAt: string,
): Promise<void> {
	return knex("blocked_users").where("user_id", userId).update({
		expires_at: expiresAt,
	});
}

/**
 * @returns {String[]}
 */
export async function getExpiredBlocks(): Promise<string[]> {
	const now = utc().format("YYYY-MM-DD HH:mm:ss");

	const blocks = await knex("blocked_users")
		.whereNotNull("expires_at")
		.where("expires_at", "<=", now)
		.select();

	return blocks.map((_block) => _block.user_id);
}

/**
 * Returns the list of all blocked users
 * @returns {Promise<Array<{ userId: string, userName: string, blockedBy: string, blockedAt: string, expiresAt: string }>>}
 */
export async function getBlockedUsers(): Promise<
	Array<{
		userId: string;
		userName: string;
		blockedBy: string;
		blockedAt: string;
		expiresAt: string;
	}>
> {
	const rows = await knex("blocked_users").select();

	return rows.map((row) => ({
		userId: row.user_id,
		userName: row.user_name,
		blockedBy: row.blocked_by,
		blockedAt: row.blocked_at,
		expiresAt: row.expires_at,
	}));
}

// export default {
//   getBlockStatus,
//   isBlocked,
//   block,
//   unblock,
//   updateExpiryTime,
//   getExpiredBlocks,
//   getBlockedUsers,
// };
