import { Grid, gridSize } from "./Grid";
import { Unit } from "./Unit";
import { IPosition } from "./position";
import { IUnit } from "./SerializableUnit";
import { UnitData } from "./UnitData";
import { assert } from "../utils";

const actionMultiplier = 2;

export interface ICleanupData {
	deletedMovements: IUnit[];
	deletedTargets: IUnit[];
	deletedWeakTargets: IUnit[];
}

export class UnitManager {
	private movementMap = new Map<number, IPosition>();
	private targetMap = new Map<number, IUnit>();
	private weakTargetMap = new Map<number, IUnit>();

	constructor(
		private readonly unitData: UnitData,
		private readonly grid: Grid,
	) {}

	public moveUnit(id: number, position: IPosition) {
		this.clearCommands(id);
		this.movementMap.set(id, position);
	}

	public createUnit(position: IPosition, playerId: string) {
		const unit = this.unitData.createUnit(position, playerId);
		this.grid.updateUnitOnGrid(unit);
	}

	public killUnit(unit: IUnit) {
		this.unitData.killUnit(unit.id);
		this.movementMap.delete(unit.id);
		this.targetMap.delete(unit.id);
		this.weakTargetMap.delete(unit.id);
		this.grid.killUnit(unit);
	}

	public targetUnit(id: number, target: IUnit) {
		// console.log(`Unit ${id} targeting ${getUniqueUnitId(target)}`);
		this.clearCommands(id);
		this.targetMap.set(id, target);
	}

	private weakTargetUnit(id: number, target: IUnit) {
		if (this.movementMap.has(id) || this.targetMap.has(id)) {
			throw new Error(`Unit ${id} already has a command!`);
		}
		// console.log(`Unit ${id} weak targeting ${getUniqueUnitId(target)}`);
		this.weakTargetMap.set(id, target);
	}

	private clearCommands(id: number) {
		this.weakTargetMap.delete(id);
		this.movementMap.delete(id);
		this.targetMap.delete(id);
	}

	public moveTowardTarget(
		targetMap: Map<number, IUnit>,
		damageMultiplier: number = 1,
		speedMultiplier: number = 1,
	): IUnit[] {
		const removedTargets: IUnit[] = [];
		for (const [id, targetUnit] of targetMap.entries()) {
			const unit = this.unitData.getUnit(id.toString());
			const target = this.unitData.getUnit(targetUnit.id.toString());
			assert(target !== undefined && unit !== undefined, "unit or target is undefined");
			if (
				distanceSquared(unit, target) > (Unit.searchRange + gridSize) ** 2 &&
				damageMultiplier === 1 &&
				speedMultiplier === 1
			) {
				removedTargets.push(target);
			}

			const newPosition = calculateNewUnitPositionWithCollision(
				unit,
				target,
				this.grid,
				speedMultiplier,
			);
			if (!unitIsInRange(newPosition, target)) {
				this.unitData.moveUnit(unit.id, newPosition);
			}
		}

		return removedTargets;
	}

	public attackTarget(
		targetMap: Map<number, IUnit>,
		damageMultiplier: number = 1,
		speedMultiplier: number = 1,
	): void {
		for (const [id, targetUnit] of targetMap.entries()) {
			const unit = this.unitData.getUnit(id.toString());
			const target = this.unitData.getUnit(targetUnit.id.toString());
			assert(target !== undefined && unit !== undefined, "unit or target is undefined");
			const newPosition = calculateNewUnitPositionWithCollision(
				unit,
				target,
				this.grid,
				speedMultiplier,
			);
			if (unitIsInRange(newPosition, target)) {
				this.unitData.damageUnit(target.id, Unit.damage * damageMultiplier);
			}
		}
	}

	public update(): void {
		// move
		for (const [id, position] of this.movementMap.entries()) {
			const unit = this.unitData.getUnit(id.toString());
			assert(unit !== undefined, "unit is undefined");
			const newPosition = calculateNewUnitPositionWithCollision(
				unit,
				position,
				this.grid,
				actionMultiplier,
			);
			if (unitHasArrived(unit, position)) {
				this.movementMap.delete(id);
			}
			this.unitData.moveUnit(id, newPosition);
		}

		// move
		const removedTargets = this.moveTowardTarget(
			this.targetMap,
			actionMultiplier,
			actionMultiplier,
		);
		const removedWeakTargets = this.moveTowardTarget(this.weakTargetMap);

		// attack
		this.attackTarget(this.targetMap, actionMultiplier, actionMultiplier);
		this.attackTarget(this.weakTargetMap);

		// Kill units
		for (const unit of this.unitData.units) {
			if (unit.health <= 0) {
				this.killUnit(unit);
			}
		}

		// Remove old targeting
		for (const unit of removedTargets) {
			this.targetMap.delete(unit.id);
		}

		for (const unit of removedWeakTargets) {
			this.weakTargetMap.delete(unit.id);
		}

		// Remove dead units
		for (const [id, unit] of this.targetMap.entries()) {
			if (this.unitData.getUnit(unit.id.toString()) === undefined) {
				this.targetMap.delete(id);
			}
		}
		for (const [id, unit] of this.weakTargetMap.entries()) {
			if (this.unitData.getUnit(unit.id.toString()) === undefined) {
				this.weakTargetMap.delete(id);
			}
		}

		// Find new weak targets
		for (const unit of this.unitData.units) {
			if (
				this.movementMap.has(unit.id) ||
				this.targetMap.has(unit.id) ||
				this.weakTargetMap.has(unit.id)
			) {
				continue;
			}
			const searchableUnits = this.grid.getUnitsInRadius(unit.x, unit.y, Unit.searchRange);
			const enemyUnits = searchableUnits.filter(
				(searchableUnit) => searchableUnit.playerId !== unit.playerId,
			);
			if (enemyUnits.length === 0) {
				continue;
			}
			let closestEnemyUnit = enemyUnits[0];
			let closestDistance = distanceSquared(unit, closestEnemyUnit);
			for (const enemyUnit of enemyUnits) {
				const distance = distanceSquared(unit, enemyUnit);
				if (distance < closestDistance) {
					closestEnemyUnit = enemyUnit;
					closestDistance = distance;
				}
			}
			this.weakTargetUnit(unit.id, closestEnemyUnit);
			this.grid.updateUnitOnGrid(unit);
		}
	}
}

function calculateNewUnitPositionWithCollision(
	unit: IUnit,
	target: IPosition,
	grid: Grid,
	speedMultiplier: number = 1,
): IPosition {
	const distanceX = target.x - unit.x;
	const distanceY = target.y - unit.y;
	if (distanceX === 0 && distanceY === 0) {
		return { x: unit.x, y: unit.y };
	}
	const deltaX =
		(distanceX / Math.sqrt(distanceX ** 2 + distanceY ** 2)) * Unit.speed * speedMultiplier;
	const deltaY =
		(distanceY / Math.sqrt(distanceX ** 2 + distanceY ** 2)) * Unit.speed * speedMultiplier;
	const newX = Math.fround(unit.x + deltaX);
	const newY = Math.fround(unit.y + deltaY);

	// Collision detection
	const newGridPoint = grid.getGridPoint(newX, newY);
	if (newGridPoint.units.length > 0 && !newGridPoint.hasUnit(unit)) {
		return { x: unit.x, y: unit.y };
	}

	return { x: newX, y: newY };
}

function unitHasArrived(unit: IPosition, target: IPosition): boolean {
	return (
		Math.round(unit.x) === Math.round(target.x) && Math.round(unit.y) === Math.round(target.y)
	);
}

function unitIsInRange(unit: IPosition, target: IPosition): boolean {
	const distanceX = target.x - unit.x;
	const distanceY = target.y - unit.y;
	return distanceX ** 2 + distanceY ** 2 <= Unit.range ** 2;
}

function distanceSquared(a: IPosition, b: IPosition): number {
	return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
