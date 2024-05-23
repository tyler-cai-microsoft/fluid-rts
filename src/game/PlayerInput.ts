import { UnitManager } from "./UnitManager";
import { IUnit } from "./SerializableUnit";
import { PlayerDataObject } from "../fluid/playerDataObject";
import { IPosition } from "./position";
import { assert } from "../utils";

export interface IPlayerCommand {
	enemyUnitSelected?: IUnit;
	unitSelected?: IUnit;
	type: string;
}

export interface ITargetUnitCommand extends IPlayerCommand {
	type: "targetUnit";
	enemyUnitSelected: IUnit;
	unitSelected: IUnit;
}

export interface IMoveUnitCommand extends IPlayerCommand, IPosition {
	type: "moveUnit";
	enemyUnitSelected: undefined;
	unitSelected: IUnit;
}

export interface ICreateUnitCommand extends IPlayerCommand, IPosition {
	type: "createUnit";
	enemyUnitSelected: undefined;
	unitSelected: undefined;
}

export interface IKillUnitCommand extends IPlayerCommand {
	type: "killUnit";
	enemyUnitSelected: undefined;
	unitSelected: IUnit;
}

export type PlayerCommand =
	| ITargetUnitCommand
	| IMoveUnitCommand
	| ICreateUnitCommand
	| IKillUnitCommand;

export class PlayerInput {
	constructor(
		private readonly unitManager: UnitManager,
		public readonly playerDataObject: PlayerDataObject,
	) {}

	private applyCommand(command: PlayerCommand, playerId: string) {
		switch (command.type) {
			case "targetUnit":
				assert(
					command.enemyUnitSelected.playerId !== playerId,
					"enemy unit is owned by player",
				);
				this.unitManager.targetUnit(command.unitSelected.id, command.enemyUnitSelected);
				break;
			case "moveUnit":
				assert(
					command.unitSelected.playerId === playerId,
					"selected unit is not owned by player",
				);
				this.unitManager.moveUnit(command.unitSelected.id, command);
				break;
			case "createUnit":
				this.unitManager.createUnit(command, playerId);
				break;
			case "killUnit":
				assert(
					command.unitSelected.playerId === playerId,
					"selected unit is not owned by player",
				);
				this.unitManager.killUnit(command.unitSelected);
				break;
		}
	}

	applyCommands(end: number, updateCount: number) {
		const commands = this.playerDataObject.timeArray.get(end);
		const playerId = this.playerDataObject.playerId;
		for (const command of commands) {
			console.log("updateCount", updateCount, "command", command);
			this.applyCommand(command, playerId);
		}
	}
}
