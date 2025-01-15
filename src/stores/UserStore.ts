import useLogger from "@hooks/useLogger";
import {
	GatewayUserUpdateDispatchData,
	Routes,
	type APIUser,
	type Snowflake,
} from "@spacebarchat/spacebar-api-types/v9";
import { User } from "@structures";
import { ObservableMap, action, computed, makeAutoObservable, observable } from "mobx";
import AppStore from "./AppStore";

export default class UserStore {
	private readonly logger = useLogger("UserStore");
	@observable readonly users: ObservableMap<string, User>;

	constructor(private readonly app: AppStore) {
		this.users = observable.map();
		makeAutoObservable(this);
	}

	@action
	add(user: APIUser): User {
		const newUser = new User(user);
		this.users.set(user.id, newUser);
		return newUser;
	}

	@action
	addAll(users: APIUser[]) {
		users.forEach((user) => this.add(user));
	}

	@action
	update(user: APIUser | GatewayUserUpdateDispatchData) {
		this.users.get(user.id)?.update(user);
	}

	@action
	get(id: string) {
		return this.users.get(id);
	}

	@computed
	get all() {
		return Array.from(this.users.values());
	}

	@computed
	get count() {
		return this.users.size;
	}

	has(id: string) {
		return this.users.has(id);
	}

	@action
	async resolve(id: Snowflake, force: boolean = false): Promise<User | undefined> {
		if (this.has(id) && !force) return this.get(id);
		const user = await this.app.rest.get<APIUser>(Routes.user(id));
		if (!user) return undefined;
		return this.add(user);
	}
}
