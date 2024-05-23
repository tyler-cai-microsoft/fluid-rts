import TinyliciousClient from "@fluidframework/tinylicious-client";
import { SharedMap, IFluidContainer } from "fluid-framework";
import { PlayerDataObject } from "./playerDataObject";
import { TimeArray } from "./timeArray";
import { v4 as uuid } from "uuid";

const client = new TinyliciousClient();
// const client2 = new AzureClient({
// 	tenantId: "local",
// });

const containerSchema = {
	initialObjects: { playerMap: SharedMap, gameMap: TimeArray<GameCommand> },
	dynamicObjectTypes: [PlayerDataObject],
};

export interface GameCommand {
	type: "start";
}

const createNew = async (): Promise<
	[SharedMap, TimeArray<GameCommand>, IFluidContainer<typeof containerSchema>, string]
> => {
	const { container } = await client.createContainer(containerSchema);
	const playerMap = container.initialObjects.playerMap;
	const gameMap = container.initialObjects.gameMap;
	const id = await container.attach();
	return [playerMap, gameMap, container, id];
};

const loadExisting = async (
	id: string,
): Promise<[SharedMap, TimeArray<GameCommand>, IFluidContainer<typeof containerSchema>]> => {
	const { container } = await client.getContainer(id, containerSchema);
	const playerMap = container.initialObjects.playerMap;
	const gameMap = container.initialObjects.gameMap;
	return [playerMap, gameMap, container];
};

const initializePlayer = async (container: IFluidContainer<typeof containerSchema>) => {
	const playerData = await container.create(PlayerDataObject);
	playerData.playerId = uuid();
	console.log(`Player ${playerData.playerId} has joined the game`);
	return playerData;
};

export interface FluidData {
	localPlayer: PlayerDataObject;
	playerMap: SharedMap;
	gameMap: TimeArray<GameCommand>;
}

export async function start(): Promise<FluidData> {
	let playerMap: SharedMap;
	let gameMap: TimeArray<GameCommand>;
	let container: IFluidContainer<typeof containerSchema>;
	if (location.hash) {
		[playerMap, gameMap, container] = await loadExisting(location.hash.substring(1));
	} else {
		[playerMap, gameMap, container, location.hash] = await createNew();
	}
	const localPlayer = await initializePlayer(container);
	return {
		localPlayer,
		playerMap,
		gameMap,
	};
}
