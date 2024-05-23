import {
	IChannelStorageService,
	type IFluidDataStoreRuntime,
	type IChannelFactory,
	type IChannelAttributes,
} from "@fluidframework/datastore-definitions";
import { ISequencedDocumentMessage, MessageType } from "@fluidframework/protocol-definitions";
import { readAndParse } from "@fluidframework/driver-utils";
import { ISummaryTreeWithStats } from "@fluidframework/runtime-definitions";
import { SharedObject, createSingleBlobSummary } from "@fluidframework/shared-object-base";
import { TimeArrayFactory as TimeArrayFactory } from "./timeArrayFactory";

interface ITypeArrayOp<T> {
	type: "add";
	value: T;
}

export interface ITypedTime<T> {
	value: T;
	timestamp: number;
}

const snapshotFileName = "header";
export class TimeArray<T> extends SharedObject {
	public static create<T>(runtime: IFluidDataStoreRuntime, id?: string): TimeArray<T> {
		return runtime.createChannel(id, TimeArrayFactory.Type) as TimeArray<T>;
	}

	public static getFactory(): IChannelFactory {
		return new TimeArrayFactory();
	}

	private array: ITypedTime<T>[] = [];
	private lastProcessed: number[] = [];
	private lastTimestamp = 0;

	public constructor(
		id: string,
		runtime: IFluidDataStoreRuntime,
		attributes: IChannelAttributes,
	) {
		super(id, runtime, attributes, "type_map_");
	}

	public add(value: T): void {
		const op: ITypeArrayOp<T> = {
			type: "add",
			value,
		};

		// If you want things to apply immediately, this is where you would need to do the local stuff.
		// Fun fact, this doesn't do anything if this.isAttached() === false
		this.submitLocalMessage(op);
	}

	public get(end: number): T[] {
		const start = this.lastTimestamp;
		const result: T[] = [];
		for (let i = 0; i < this.array.length; i++) {
			if (this.array[i].timestamp >= start && this.array[i].timestamp <= end) {
				const index = this.lastProcessed.find((x) => x === this.array[i].timestamp);
				if (index === undefined) {
					result.push(this.array[i].value);
					this.lastProcessed.push(this.array[i].timestamp);
				} else {
					console.log("collision!");
				}
			}
		}
		this.lastTimestamp = end;
		return result;
	}

	protected summarizeCore(): ISummaryTreeWithStats {
		const stringContent = JSON.stringify(this.array);
		return createSingleBlobSummary(snapshotFileName, stringContent);
	}
	protected async loadCore(storage: IChannelStorageService): Promise<void> {
		this.array = await readAndParse<ITypedTime<T>[]>(storage, snapshotFileName);
	}
	protected processCore(message: ISequencedDocumentMessage) {
		if (message.type === MessageType.Operation) {
			const op = message.contents as ITypeArrayOp<T>;
			const item = { value: op.value, timestamp: message.timestamp };
			this.array.push(item);
			this.emit("valueChanged", item);
		}
	}
	protected onDisconnect() {}
	protected applyStashedOp(content: any): unknown {
		throw new Error("Method not implemented.");
	}
}
