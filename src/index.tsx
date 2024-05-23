/* eslint-disable no-restricted-globals */
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Game } from "./game/Game";
import { start } from "./fluid/startFluid";
import { load } from "./pixi/load";
import { LocalPlayerInputManager, LocalUnitSpriteManager } from "./pixi/spriteManager";
import { PlayerDataObject } from "./fluid/playerDataObject";
import { IFluidHandle } from "@fluidframework/core-interfaces";
import { GameView } from "./view/gameView";

start()
	.then((fluidData) => {
		const app = load();
		const game = new Game(800, 600);
		fluidData.playerMap.on("valueChanged", async (changed) => {
			const handle = fluidData.playerMap.get(changed.key) as IFluidHandle<PlayerDataObject>;
			const player = await handle.get();
			game.addPlayer(player);
		});
		fluidData.playerMap.set(fluidData.localPlayer.playerId, fluidData.localPlayer.handle);
		const localPlayerInputManager = new LocalPlayerInputManager(app, fluidData.localPlayer);
		const spriteManager = new LocalUnitSpriteManager(game, app, localPlayerInputManager);
		const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
		root.render(
			<React.StrictMode>
				<GameView
					app={app}
					gameMap={fluidData.gameMap}
					game={game}
					spriteManager={spriteManager}
					localInputManager={localPlayerInputManager}
				/>
			</React.StrictMode>,
		);
	})
	.catch((error) => {
		console.error(error);
	});
