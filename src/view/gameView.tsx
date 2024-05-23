/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { Application } from "pixi.js";
import { ITypedTime, TimeArray } from "../fluid/timeArray";
import { GameCommand } from "../fluid/startFluid";
import { Game } from "../game/Game";
import { LocalPlayerInputManager, LocalUnitSpriteManager } from "../pixi/spriteManager";

export const containerId = "pixi-container";

export interface IGameViewProps {
	app: Application;
	game: Game;
	gameMap: TimeArray<GameCommand>;
	spriteManager: LocalUnitSpriteManager;
	localInputManager: LocalPlayerInputManager;
}

export const GameView = (props: IGameViewProps) => {
	const { app, gameMap, game, spriteManager, localInputManager } = props;
	const [time, setTime] = React.useState(app.ticker.lastTime);

	React.useEffect(() => {
		document.getElementById(containerId)?.appendChild((app as any).view);
		gameMap.on("valueChanged", (changed: ITypedTime<GameCommand>) => {
			game.start(changed.timestamp);
			const beginTime = app.ticker.lastTime;
			console.log(changed.timestamp + app.ticker.lastTime);
			console.log(beginTime);
			app.ticker.add(() => {
				// I added beginTime because app.ticker.lastTime doesn't start near 0, it'll be 300ms - 600ms which is significant.
				game.update(Math.floor(app.ticker.lastTime - beginTime));
				spriteManager.update();
				localInputManager.update();
				setTime(app.ticker.lastTime);
			});
			app.ticker.start();
		});
		return () => {
			document.getElementById(containerId)?.removeChild((app as any).view);
		};
	}, []);

	const testFunction = () => {
		console.log("Test");
		gameMap.add({ type: "start" });
	};

	return (
		<div style={{ textAlign: "center" }} tabIndex={0}>
			<h1>RTS Game</h1>
			<div id={containerId}></div>
			<pre>{time}</pre>
			<pre>{game.timeStart}</pre>
			<input type="button" value="Test" onClick={testFunction} />
		</div>
	);
};
