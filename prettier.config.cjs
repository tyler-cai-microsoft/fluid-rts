/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = {
	printWidth: 100,
	quoteProps: "consistent",
	semi: true,
	singleQuote: false,
	tabWidth: 4,
	trailingComma: "all",
	useTabs: true,
	overrides: [
		{
			files: "lerna.json",
			options: {
				printWidth: 50,
				tabWidth: 2,
			},
		},
		{
			// Some JSON files are only ever used by JSON5-aware tools
			files: ["tsconfig*.json", ".vscode/*.json"],
			options: {
				parser: "json5",
				tabWidth: 2,
				quoteProps: "preserve",
			},
		},
		{
			files: "*.json",
			options: {
				tabWidth: 2,
				quoteProps: "preserve",
			},
		},
		{
			// YAML formatting should not use tabs, and use a 2-space indent instead
			files: ["*.yaml", "*.yml"],
			options: {
				tabWidth: 2,
				useTabs: false,
				quoteProps: "preserve",
			},
		},
	],
};
