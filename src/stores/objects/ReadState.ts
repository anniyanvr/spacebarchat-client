import { type APIReadState } from "@spacebarchat/spacebar-api-types/v9";
import { AppStore } from "@stores";
import { Logger } from "@utils";
import { action, makeAutoObservable, observable } from "mobx";

export default class ReadState {
	private readonly logger: Logger;
	private readonly app: AppStore;

	id: string;
	@observable lastMessageId: string;
	@observable lastPinTimestamp: string | null;
	@observable mentionCount: number | null;

	constructor(app: AppStore, data: APIReadState) {
		this.logger = new Logger("ReadState");
		this.app = app;

		this.id = data.id; // channel id
		this.lastMessageId = data.last_message_id;
		this.lastPinTimestamp = data.last_pin_timestamp;
		this.mentionCount = data.mention_count;

		makeAutoObservable(this);
	}

	@action
	update(role: APIReadState) {
		Object.assign(this, role);
	}
}
