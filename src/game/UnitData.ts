import { IUnit, SerializableUnit } from "./SerializableUnit";
import { IPosition } from "./position";

export class UnitData {
	private unitMap: Record<string, IUnit> = {};
	private unitCounter = 0;

	public get units(): IUnit[] {
		return Object.values(this.unitMap);
	}

	public getUnit(unitId: string): IUnit | undefined {
		return this.unitMap[unitId];
	}

	public createUnit(position: IPosition, playerId: string): IUnit {
		const id = this.unitCounter++;
		const unit = new SerializableUnit(position.x, position.y, id, playerId);
		this.unitMap[id.toString()] = unit;
		return unit;
	}

	public killUnit(id: number): void {
		delete this.unitMap[id.toString()];
	}

	public damageUnit(id: number, damage: number): void {
		const unit = this.unitMap[id.toString()];
		if (unit === undefined) {
			console.log("unit taking damage undefined");
			return;
		}
		unit.health -= damage;
		this.unitMap[id.toString()] = unit;
	}

	public moveUnit(id: number, position: IPosition): void {
		const unit = this.unitMap[id.toString()];
		if (unit === undefined) {
			console.log(`Missing unit ${id}!`);
			return;
		}
		unit.x = position.x;
		unit.y = position.y;
		this.unitMap[id.toString()] = unit;
	}
}
