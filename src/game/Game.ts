import { Grid } from "./Grid";
import { UnitManager } from "./UnitManager";
import { UnitData } from "./UnitData";
import { PlayerInput } from "./PlayerInput";
import { PlayerDataObject } from "../fluid/playerDataObject";
import { assert } from "../utils";
import { IUnit } from "./SerializableUnit";

const updateRatePerMs = 1000 / 50; // 33 times per second
export class Game {
	public readonly grid: Grid;
	private players: Map<string, PlayerInput> = new Map();
	private unitData: UnitData = new UnitData();
	private readonly unitManager: UnitManager;
	private serverStartTime: number = 0;
	private lastUpdatedServerTimeMs: number = 0;
	public totalUpdates: number = 0;
	public get timeStart() {
		return this.serverStartTime;
	}

	public constructor(
		public readonly width: number,
		public readonly height: number,
	) {
		this.grid = new Grid(width, height);
		this.unitManager = new UnitManager(this.unitData, this.grid);
	}

	public start(tick: number) {
		this.serverStartTime = tick;
		this.lastUpdatedServerTimeMs = tick;
	}

	public update(localTimeMs: number) {
		// We are given the local time that we should have received updates to
		// This isn't exactly accurate as we may receive updates at some variance.
		// Technically most of this time logic should sit outside of the game loop (TODO)

		// Calculate the number of updates we should run (this is done for exact consistency sake)
		while (
			this.lastUpdatedServerTimeMs <
			// we buffer a game update to account for variance
			this.serverStartTime + localTimeMs - updateRatePerMs
		) {
			this.totalUpdates++;
			for (const player of this.players.values()) {
				player.applyCommands(this.lastUpdatedServerTimeMs, this.totalUpdates);
			}
			// Update all the units, move, attack, kill, etc.
			this.unitManager.update();
			// Update server tick
			this.lastUpdatedServerTimeMs += updateRatePerMs;
		}
	}

	public addPlayer(playerDataObject: PlayerDataObject) {
		const playerId = playerDataObject.playerId;
		const playerInput = new PlayerInput(this.unitManager, playerDataObject);
		assert(this.players.has(playerId) === false, `Player ${playerId} already exists`);
		this.players.set(playerId, playerInput);
	}

	public getColor(unit: IUnit): number {
		const player = this.players.get(unit.playerId);
		assert(player !== undefined, `Player ${unit.playerId} not found`);
		return player.playerDataObject.playerColor;
	}
}
