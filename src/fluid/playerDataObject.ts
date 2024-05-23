import { DataObject, DataObjectFactory } from "@fluidframework/aqueduct";
import { TimeArray } from "./timeArray";
import { PlayerCommand } from "../game/PlayerInput";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { assert } from "../utils";

const playerRegistryKey = "playerDataObject";
const playerIdKey = "playerId";
const playerColorKey = "playerColor";
const timeMapKey = "timeMap";

export class PlayerDataObject extends DataObject {
	public static readonly factory = new DataObjectFactory(
		playerRegistryKey,
		PlayerDataObject,
		[TimeArray.getFactory()],
		{},
	);
	private _timeArray?: TimeArray<PlayerCommand>;
	public get timeArray(): TimeArray<PlayerCommand> {
		assert(this._timeArray !== undefined, "TimeArray not initialized");
		return this._timeArray;
	}

	public get playerId(): string {
		const id = this.root.get(playerIdKey);
		assert(id !== undefined, "Player ID is undefined");
		return id;
	}
	public set playerId(id: string) {
		assert(
			this.root.get(playerIdKey) === undefined,
			"Player ID should not be defined when being set!",
		);
		this.root.set(playerIdKey, id);
	}

	public get playerColor(): number {
		const color = this.root.get<number>(playerColorKey);
		assert(color !== undefined, "Player color is undefined");
		return color;
	}

	protected async initializingFirstTime(): Promise<void> {
		const timeArray = TimeArray.create<PlayerCommand>(this.runtime, "timeArray");
		this.root.set(timeMapKey, timeArray.handle);
		this.root.set(playerColorKey, Math.random() * 0xffffff);
	}

	protected async hasInitialized(): Promise<void> {
		const handle = this.root.get<IFluidHandle<TimeArray<PlayerCommand>>>(timeMapKey);
		assert(handle !== undefined, "PlayerId not found");
		this._timeArray = await handle.get();
	}
}
