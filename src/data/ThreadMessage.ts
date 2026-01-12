import knex from "../knex";
import { setDataModelProps } from "../utils";
import { THREAD_MESSAGE_TYPE } from "./constants";

type ThreadMessageProps = {
	message_type?: number;
	user_id?: any;
	user_name?: any;
	body?: any;
	is_anonymous?: number;
	role_name?: string | null;
	attachments?: any;
	dm_message_id?: any;
	dm_channel_id?: any;
	small_attachments?: any;
	metadata?: any;
};

export class ThreadMessage {
	public id: number = 0;
	public thread_id: string = "";
	public message_type: number = 0;
	public message_number: number = 0;
	public user_id: string = "";
	public user_name: string = "";
	public role_name: string = "";
	public body: string = "";
	public is_anonymous: number = 0;
	public attachments: string[] = [];
	public small_attachments: string[] = [];
	public dm_channel_id: string = "";
	public dm_message_id: string = "";
	public inbox_message_id: string = "";
	public created_at: string = "";
	public use_legacy_format: number = 0;
	public metadata: Record<string, string | ThreadMessage> = {};

	constructor(props: ThreadMessageProps) {
		setDataModelProps(this, props);

		if (props.attachments) {
			if (typeof props.attachments === "string") {
				this.attachments = JSON.parse(props.attachments);
			}
		} else {
			this.attachments = [];
		}

		if (props.small_attachments) {
			if (typeof props.small_attachments === "string") {
				this.small_attachments = JSON.parse(props.small_attachments);
			}
		} else {
			this.small_attachments = [];
		}

		if (props.metadata) {
			if (typeof props.metadata === "string") {
				this.metadata = JSON.parse(props.metadata);
			}
		}
	}

	getSQLProps(): {} {
		return Object.entries(this).reduce(
			(obj, [key, value]) => {
				if (typeof value === "function") return obj;
				if (typeof value === "object" && value != null) {
					obj[key] = JSON.stringify(value);
				} else {
					obj[key] = value;
				}
				return obj;
			},
			{} as Record<string, any>,
		);
	}

	async setMetadataValue(key: string, value: string | ThreadMessage) {
		this.metadata = this.metadata || {};
		this.metadata[key] = value;

		if (this.id) {
			await knex("thread_messages")
				.where("id", this.id)
				.update({
					metadata: JSON.stringify(this.metadata),
				});
		}
	}

	getMetadataValue(key: string): any | null {
		return this.metadata ? this.metadata[key] : null;
	}

	isFromUser(): boolean {
		return this.message_type === THREAD_MESSAGE_TYPE.FROM_USER;
	}

	isChat(): boolean {
		return this.message_type === THREAD_MESSAGE_TYPE.CHAT;
	}

	clone() {
		return new ThreadMessage(this.getSQLProps());
	}
}

export default ThreadMessage;
