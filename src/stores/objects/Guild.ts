import type { Snowflake } from "@spacebarchat/spacebar-api-types/globals";
import {
	ChannelType,
	type APIChannel,
	type APIGuild,
	type GatewayGuild,
	type GatewayGuildMemberListUpdateDispatchData,
} from "@spacebarchat/spacebar-api-types/v9";
import { ObservableSet, action, computed, makeObservable, observable } from "mobx";
import AppStore from "../AppStore";
import GuildMemberListStore from "../GuildMemberListStore";
import GuildMemberStore from "../GuildMemberStore";
import Channel from "./Channel";

export default class Guild {
	private readonly app: AppStore;

	id: Snowflake;
	joinedAt: string;
	@observable threads: unknown[];
	@observable stickers: unknown[]; // TODO:
	@observable stageInstances: unknown[]; // TODO:
	@observable roles_: ObservableSet<Snowflake>;
	@observable memberCount: number;
	@observable lazy: boolean;
	@observable large: boolean;
	@observable guildScheduledEvents: unknown[]; // TODO:
	@observable emojis: unknown[]; // TODO:
	@observable channels_: ObservableSet<Snowflake>;
	@observable name: string;
	@observable description: string | null = null;
	@observable icon: string | null = null;
	@observable splash: string | null = null;
	@observable banner: string | null = null;
	@observable features: string[];
	@observable preferredLocale: string;
	@observable ownerId: Snowflake;
	@observable applicationId: Snowflake | null = null;
	@observable afkChannelId: Snowflake | null = null;
	@observable afkTimeout: number;
	@observable systemChannelId: Snowflake | null = null;
	@observable verificationLevel: number;
	@observable explicitContentFilter: number;
	@observable defaultMessageNotifications: number;
	@observable mfaLevel: number;
	@observable vanityUrlCode: string | null = null;
	@observable premiumTier: number;
	//   @observable premium_progress_bar_enabled: boolean
	@observable systemChannelFlags: number;
	@observable discoverySplash: string | null = null;
	@observable rulesChannelId: Snowflake | null = null;
	@observable publicUpdatesChannelId: Snowflake | null = null;
	@observable maxVideoChannelUsers: number;
	@observable maxMembers: number;
	@observable nsfwLevel: number;
	@observable hubType: number | null = null;
	@observable members: GuildMemberStore;
	@observable private memberListStore: GuildMemberListStore | null = null;

	constructor(app: AppStore, data: GatewayGuild) {
		this.app = app;
		this.roles_ = new ObservableSet();
		this.channels_ = new ObservableSet();
		this.members = new GuildMemberStore(app, this);

		this.id = data.id;
		this.joinedAt = data.joined_at;
		this.threads = data.threads;
		this.stickers = data.stickers;
		this.stageInstances = data.stage_instances;
		this.memberCount = data.member_count;
		this.lazy = data.lazy;
		this.large = data.large;
		this.guildScheduledEvents = data.guild_scheduled_events;
		this.emojis = data.emojis;
		this.name = data.properties.name;
		this.description = data.properties.description;
		this.icon = data.properties.icon;
		this.splash = data.properties.splash;
		this.banner = data.properties.banner;
		this.features = data.properties.features;
		this.preferredLocale = data.properties.preferred_locale;
		this.ownerId = data.properties.owner_id;
		this.applicationId = data.properties.application_id;
		this.afkChannelId = data.properties.afk_channel_id;
		this.afkTimeout = data.properties.afk_timeout;
		this.systemChannelId = data.properties.system_channel_id;
		this.verificationLevel = data.properties.verification_level;
		this.explicitContentFilter = data.properties.explicit_content_filter;
		this.defaultMessageNotifications = data.properties.default_message_notifications;
		this.mfaLevel = data.properties.mfa_level;
		this.vanityUrlCode = data.properties.vanity_url_code;
		this.premiumTier = data.properties.premium_tier;
		// this.premium_progress_bar_enabled = data.properties.premium_progress_bar_enabled; // FIXME: missing
		this.systemChannelFlags = data.properties.system_channel_flags;
		this.discoverySplash = data.properties.discovery_splash;
		this.rulesChannelId = data.properties.rules_channel_id;
		this.publicUpdatesChannelId = data.properties.public_updates_channel_id;
		this.maxVideoChannelUsers = data.properties.max_video_channel_users!;
		this.maxMembers = data.properties.max_members!;
		this.nsfwLevel = data.properties.nsfw_level;
		this.hubType = data.properties.hub_type;

		app.roles.addAll(data.roles);
		app.channels.addAll(data.channels);

		data.roles.forEach((role) => this.roles_.add(role.id));
		data.channels?.forEach((channel) => this.channels_.add(channel.id));

		makeObservable(this);
	}

	@action
	update(data: APIGuild | GatewayGuild) {
		if ("properties" in data) {
			Object.assign(this, { ...data, ...data.properties });
			return;
		}

		Object.assign(this, data);
	}

	@action
	updateMemberList(data: GatewayGuildMemberListUpdateDispatchData) {
		if (this.memberListStore) {
			this.memberListStore.update(data);
		} else {
			this.memberListStore = new GuildMemberListStore(this.app, this, data);
		}
	}

	@computed
	get memberList() {
		return this.memberListStore?.list ?? [];
	}

	@computed
	get acronym() {
		return this.name
			.split(" ")
			.map((word) => word.substring(0, 1))
			.join("");
	}

	@computed
	get channels() {
		return this.app.channels
			.getAll()
			.filter((channel) => this.channels_.has(channel.id))
			.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
	}

	@computed
	get channelsSorted() {
		const channels = this.channels;
		const categoryChannels = channels.filter((channel) => channel.type === ChannelType.GuildCategory);
		const nonCatChannels = channels.filter((channel) => channel.type !== ChannelType.GuildCategory);

		const categories: { id: Snowflake; parent: Channel; children: Channel[] }[] = [];
		const uncategorized: Channel[] = [];

		for (const channel of categoryChannels) {
			categories.push({
				id: channel.id,
				parent: channel,
				children: [],
			});
		}

		for (const channel of nonCatChannels) {
			if (channel.parentId) {
				const category = categories.find((category) => category.id === channel.parentId);
				if (category) {
					category.children.push(channel);
				}
			} else {
				uncategorized.push(channel);
			}
		}

		const a = categories.map((x) => {
			// return an array of parent, and children flattened
			return [x.parent, ...x.children.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))];
		});

		return [...a.flat(), ...uncategorized.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))];
	}

	@computed
	get roles() {
		return this.app.roles.getAll().filter((role) => this.roles_.has(role.id));
	}

	@action
	addChannel(data: APIChannel) {
		this.app.channels.add(data);
		this.channels_.add(data.id);
	}

	@action
	removeChannel(id: Snowflake) {
		this.app.channels.remove(id);
		this.channels_.delete(id);
	}
}
