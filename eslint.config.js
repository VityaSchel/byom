import { defineConfig } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
	{ files: ['**/*.{js,mjs,cjs,ts}'] },
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		languageOptions: { globals: globals.node }
	},
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		plugins: { js },
		extends: ['js/recommended'],
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'error'
		}
	},
	tseslint.configs.recommended,
	eslintConfigPrettier
])
