import type { Snowflake } from "@spacebarchat/spacebar-api-types/globals";
import { type APIGuildMember } from "@spacebarchat/spacebar-api-types/v9";
import { Guild, GuildMember } from "@structures";
import { APIUserProfile } from "@utils/interfaces/api";
import { ObservableMap, action, computed, makeAutoObservable, observable } from "mobx";
import AppStore from "./AppStore";

export default class GuildMemberStore {
	private readonly app: AppStore;
	private readonly guild: Guild;

	@observable private readonly members: ObservableMap<Snowflake, GuildMember>;

	constructor(app: AppStore, guild: Guild) {
		this.app = app;
		this.guild = guild;
		this.members = observable.map();

		makeAutoObservable(this);
	}

	@action
	add(member: APIGuildMember) {
		if (!member.user) {
			throw new Error("Member does not have a user");
		}
		if (this.members.has(member.user.id)) {
			return;
		}
		const m = new GuildMember(this.app, this.guild, member);
		this.members.set(member.user.id, m);
		return m;
	}

	@action
	addAll(members: APIGuildMember[]) {
		members.forEach((member) => this.add(member));
	}

	@action
	remove(id: Snowflake) {
		this.members.delete(id);
	}

	@action
	update(member: APIGuildMember) {
		if (!member.user) {
			throw new Error("Member does not have a user");
		}
		this.members.get(member.user.id)?.update(member);
	}

	get(id: Snowflake) {
		return this.members.get(id);
	}

	has(id: Snowflake) {
		return this.members.has(id);
	}

	asList() {
		return Array.from(this.members.values());
	}

	get size() {
		return this.members.size;
	}

	@computed
	get me() {
		const meId = this.app.account?.id;
		if (!meId) return null;
		return this.members.get(meId);
	}

	@action
	async resolve(id: Snowflake, fetch: boolean = false): Promise<GuildMember | undefined> {
		if (this.has(id) && !fetch) return this.get(id);
		const profile = await this.app.rest.get<APIUserProfile>(`/users/${id}/profile`, {
			guild_id: this.guild.id,
		});
		if (!profile.guild_member) return undefined;
		profile.guild_member.user = profile.user;

		return this.add(profile.guild_member);
	}
}
