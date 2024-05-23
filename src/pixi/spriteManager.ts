import { Application, FederatedPointerEvent, Sprite } from "pixi.js";
import { IUnit, getUniqueUnitId } from "../game/SerializableUnit";
import { Game } from "../game/Game";
import { Unit } from "../game/Unit";
import { assert } from "../utils";
import { PlayerDataObject } from "../fluid/playerDataObject";
import { IPosition } from "../game/position";
import { ICreateUnitCommand, IMoveUnitCommand, ITargetUnitCommand } from "../game/PlayerInput";

export class LocalUnitSpriteManager {
	private sprites: Map<string, Sprite> = new Map();
	constructor(
		private readonly game: Game,
		private readonly app: Application,
		private readonly localInputManager: LocalPlayerInputManager,
	) {}

	createUnit(unit: IUnit) {
		console.log("createUnitSprite", getUniqueUnitId(unit));
		const unitSprite = Sprite.from(
			"https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png",
		);
		const healthSprite = Sprite.from("healthBar.png");
		healthSprite.anchor.set(0.5);
		unitSprite.addChild(healthSprite);
		this.app.stage.addChild(unitSprite);
		unitSprite.anchor.set(0.5);
		unitSprite.x = unit.x;
		unitSprite.y = unit.y;
		this.sprites.set(getUniqueUnitId(unit), unitSprite);
		unitSprite.tint = this.game.getColor(unit);
		unitSprite.interactive = true;
		unitSprite.on("pointerup", () => {
			this.localInputManager.setUnitSelected(unit);
		});
		unitSprite.visible = true;
		return unitSprite;
	}

	update() {
		const units = this.game.grid.units;
		const savedSpriteIds: string[] = [];

		// Draw the unit sprites
		for (const unit of units) {
			let sprite = this.sprites.get(getUniqueUnitId(unit));
			if (sprite === undefined) {
				sprite = this.createUnit(unit);
				this.sprites.set(getUniqueUnitId(unit), sprite);
			}
			sprite.x = unit.x;
			sprite.y = unit.y;
			const healthBar = sprite.children[0] as Sprite;
			healthBar.width = (30 * unit.health) / Unit.health;
			savedSpriteIds.push(getUniqueUnitId(unit));
		}

		// Sprites we didn't update are no longer in the game
		const spriteIds = Array.from(this.sprites.keys()).filter(
			(key) => !savedSpriteIds.includes(key),
		);
		for (const spriteId of spriteIds) {
			const sprite = this.sprites.get(spriteId);
			if (sprite !== undefined) {
				this.app.stage.removeChild(sprite);
				this.sprites.delete(spriteId);
			}
		}
	}
}

export class LocalPlayerInputManager {
	private unitSelected: IUnit | undefined;
	private enemyUnitSelected: IUnit | undefined;
	private commandSprite: Sprite;
	constructor(
		private readonly app: Application,
		private readonly player: PlayerDataObject,
	) {
		app.stage.on("pointerup", (event: FederatedPointerEvent) => {
			const x = Math.round(event.global.x);
			const y = Math.round(event.global.y);
			this.executePointerInput({ x, y });
		});
		this.commandSprite = Sprite.from("command.png");
		this.commandSprite.anchor.set(0.5);
		this.commandSprite.visible = false;
	}

	executePointerInput(position: IPosition) {
		if (this.unitSelected !== undefined && this.enemyUnitSelected) {
			const command: ITargetUnitCommand = {
				type: "targetUnit",
				enemyUnitSelected: this.enemyUnitSelected,
				unitSelected: this.unitSelected,
			};
			this.player.timeArray.add(command);
			this.enemyUnitSelected = undefined;
			this.unitSelected = undefined;
		} else if (this.unitSelected !== undefined) {
			const command: IMoveUnitCommand = {
				type: "moveUnit",
				enemyUnitSelected: undefined,
				unitSelected: this.unitSelected,
				...position,
			};
			this.player.timeArray.add(command);
			this.enemyUnitSelected = undefined;
			this.unitSelected = undefined;
		} else if (this.enemyUnitSelected) {
			this.unitSelected = undefined;
			this.enemyUnitSelected = undefined;
		} else {
			const command: ICreateUnitCommand = {
				type: "createUnit",
				enemyUnitSelected: undefined,
				unitSelected: undefined,
				...position,
			};
			this.player.timeArray.add(command);
			this.enemyUnitSelected = undefined;
			this.unitSelected = undefined;
		}
	}

	setUnitSelected(unit: IUnit) {
		if (unit.playerId === this.player.playerId) {
			this.unitSelected = unit;
		}
		if (unit.playerId !== this.player.playerId && this.unitSelected !== undefined) {
			this.enemyUnitSelected = unit;
		}
	}

	update() {
		if (this.unitSelected !== undefined) {
			this.commandSprite.visible = true;
			this.app.stage.addChild(this.commandSprite);
			this.commandSprite.x = this.unitSelected.x;
			this.commandSprite.y = this.unitSelected.y;
		} else {
			this.app.stage.removeChild(this.commandSprite);
			this.commandSprite.visible = false;
		}
	}
}
