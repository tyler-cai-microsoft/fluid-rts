export function assert(condition: boolean, message: string | number): asserts condition {
	if (!condition) {
		throw new Error(`${message}`);
	}
}
