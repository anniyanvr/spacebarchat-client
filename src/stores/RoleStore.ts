import type { Snowflake } from "@spacebarchat/spacebar-api-types/globals";
import type { APIRole } from "@spacebarchat/spacebar-api-types/v9";
import { Role } from "@structures";
import { action, computed, makeAutoObservable, observable, ObservableMap } from "mobx";
import AppStore from "./AppStore";

export default class RoleStore {
	private readonly app: AppStore;
	@observable private readonly roles: ObservableMap<Snowflake, Role>;

	constructor(app: AppStore) {
		this.app = app;
		this.roles = observable.map();

		makeAutoObservable(this);
	}

	@action
	add(role: APIRole) {
		this.roles.set(role.id, new Role(this.app, role));
	}

	@action
	addAll(roles: APIRole[]) {
		roles.forEach((role) => this.add(role));
	}

	@computed
	get all() {
		return Array.from(this.roles.values());
	}

	@action
	remove(id: Snowflake) {
		this.roles.delete(id);
	}

	@action
	update(role: APIRole) {
		this.roles.get(role.id)?.update(role);
	}

	get(id: Snowflake) {
		return this.roles.get(id);
	}

	has(id: Snowflake) {
		return this.roles.has(id);
	}

	asList() {
		return Array.from(this.roles.values());
	}

	get size() {
		return this.roles.size;
	}
}
