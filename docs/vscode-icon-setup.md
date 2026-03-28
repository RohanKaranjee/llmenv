# VS Code File Icon for `.llmenv`

Want the `.llmenv` file to have a cool icon in VS Code's sidebar (like `.env` does)?

## Option 1: Material Icon Theme (Recommended)

If you use [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme):

1. Open VS Code Settings (`Ctrl + ,`)
2. Search for `material-icon-theme.files.associations`
3. Click "Edit in settings.json"
4. Add this:

```json
"material-icon-theme.files.associations": {
  ".llmenv": "tune"
}
```

This maps `.llmenv` to the "tune/settings" icon (a gear icon that fits the concept).

Other good icon options: `"config"`, `"settings"`, `"key"`, `"robot"`.

## Option 2: vscode-icons

If you use [vscode-icons](https://marketplace.visualstudio.com/items?itemName=vscode-icons-team.vscode-icons):

1. Open VS Code Settings
2. Search for `vsicons.associations.files`
3. Add:

```json
"vsicons.associations.files": [
  {
    "icon": "config",
    "extensions": ["llmenv"],
    "filename": true,
    "format": "svg"
  }
]
```

## Option 3: Custom SVG (Advanced)

We ship a brand icon at `assets/llmenv-icon.svg` in this repo. To use it with Material Icon Theme:

1. Copy `assets/llmenv-icon.svg` to your Material Icon Theme extension folder
2. Reference it in your settings

> **Note:** A dedicated `.llmenv` VS Code extension is planned for the future that will automatically register the icon!
