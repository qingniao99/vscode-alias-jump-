# Alias Jump

VS Code extension that allows you to jump to the definition of files using path aliases (e.g., `@/components/Button`).

## Features

- **Alias Support**: Jump to files using configured aliases (e.g., `@` -> `/src`).
- **Suffix Resolution**: Automatically tries to resolve files with configured suffixes if omitted (e.g., `.js`, `.ts`, `.vue`).
- **Configurable**: Customize mappings, allowed suffixes, and root path detection.

## Usage

1.  Configure your aliases in `.vscode/settings.json` or your user settings.
2.  Hold **Ctrl** (or **Cmd** on Mac) and click on an import path that uses an alias.

## Extension Settings

This extension contributes the following settings:

*   `alias-jump.mappings`: Object defining alias mappings. Key is the alias, value is the target path relative to the project root.
    *   Default: `{"@": "/src"}`
*   `alias-jump.allowedSuffix`: Array of file extensions to try if the file path has no extension.
    *   Default: `["js", "jsx", "ts", "tsx", "vue"]`
*   `alias-jump.rootPath`: Filename used to identify the project root directory.
    *   Default: `"package.json"`

### Example Configuration

```json
{
    "alias-jump.mappings": {
        "@": "/src",
        "~": "/src",
        "components": "/src/components"
    },
    "alias-jump.allowedSuffix": [
        "js",
        "ts",
        "vue"
    ],
    "alias-jump.rootPath": "package.json"
}
```

## Known Issues

None.

## Release Notes

### 0.0.1

Initial release of Alias Jump.
