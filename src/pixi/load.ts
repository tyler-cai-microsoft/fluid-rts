import { Application, Sprite } from "pixi.js";

export function load() {
	const app = new Application();

	const commandSprite = Sprite.from("PlayerCommand.png");

	// App stuff
	app.stage.interactive = true;
	app.stage.hitArea = app.renderer.screen;
	app.stage.addChild(commandSprite);
	commandSprite.anchor.set(0.5);
	app.ticker.autoStart = false;
	return app;
}
