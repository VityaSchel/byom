# Contributing to byom

Development tools:
- TypeScript
- Eslint
- Prettier (via eslint)

Code style (can also be found in ):
- Tabs
- No semicolons
- 

## Setup IDE

Recommended .vscode/settings.json setup:

```json
{
  "editor.tabCompletion": "on",
  "eslint.validate": ["javascript", "typescript"],
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.indentSize": "tabSize"
}
```
