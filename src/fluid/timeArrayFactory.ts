import {
	type IChannelAttributes,
	type IFluidDataStoreRuntime,
	type IChannelServices,
	type IChannelFactory,
} from "@fluidframework/datastore-definitions";
import { TimeArray } from "./timeArray";

export class TimeArrayFactory<T> implements IChannelFactory {
	public static readonly Type = "typedMap";
	public static readonly Attributes: IChannelAttributes = {
		type: TimeArrayFactory.Type,
		snapshotFormatVersion: "0.1",
		packageVersion: "abc",
	};
	public get type(): string {
		return TimeArrayFactory.Type;
	}
	public get attributes(): IChannelAttributes {
		return TimeArrayFactory.Attributes;
	}
	public async load(
		runtime: IFluidDataStoreRuntime,
		id: string,
		services: IChannelServices,
		attributes: IChannelAttributes,
	): Promise<TimeArray<T>> {
		const map = new TimeArray<T>(id, runtime, attributes);
		await map.load(services);
		return map;
	}
	public create(document: IFluidDataStoreRuntime, id: string): TimeArray<T> {
		const map = new TimeArray<T>(id, document, this.attributes);
		// You may need to actually do something here for more complicated scenarios
		map.initializeLocal();
		return map;
	}
}
