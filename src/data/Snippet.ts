import { setDataModelProps } from "../utils";

export class Snippet {
	public trigger!: string;
	public body!: string;
	public created_by!: string;
	public created_at!: string;

	constructor(props: {
		trigger: string;
		body: string;
		created_by: string;
		created_at: string;
	}) {
		setDataModelProps(this, props);
	}
}
