# Change Case Extension for Visual Studio Code

[![Visual Studio Marketplace Version](https://vsmarketplacebadges.dev/version/frankie.change-case.svg?color=4d9375)
](https://marketplace.visualstudio.com/items?itemName=frankie.change-case) [![Open VSX Version](https://img.shields.io/open-vsx/v/frankie/change-case.svg?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/frankie/change-case)

> [!NOTE]
> Fork of [wmaurer/vscode-change-case](https://github.com/wmaurer/vscode-change-case). Upstream is unmaintained; this repo updates dependencies and carries the project forward.

A wrapper around [change-case](https://github.com/blakeembrey/change-case) for Visual Studio Code.

Quickly change the case of the current selection or current word.

If only one word is selected, the `extension.changeCase.commands` command gives you a preview of each option:

![change-case-preview](https://cloud.githubusercontent.com/assets/2899448/10712456/3c5e29b6-7a9c-11e5-9ce4-7eb944889696.gif)

`change-case` also works with multiple cursors:

![change-case-multi](https://cloud.githubusercontent.com/assets/2899448/10712454/1a9019e8-7a9c-11e5-8f06-91fd2d7e21bf.gif)

_Note:_ Please read the [documentation](https://code.visualstudio.com/Docs/editor/editingevolved) on how to use multiple cursors in Visual Studio Code.

## Quick Start

Install from [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=frankie.change-case) or [Open VSX](https://open-vsx.org/extension/frankie/change-case).

## Commands

| Command ID                        | Title                  | Description                                                                            |
| --------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| `extension.changeCase.commands`   | Change Case Commands   | Quick pick of all variants below; shows a live preview when a single word is selected. |
| `extension.changeCase.camel`      | Change Case camel      | camelCase — uppercase the letter after each separator.                                 |
| `extension.changeCase.constant`   | Change Case constant   | CONSTANT_CASE — uppercase with underscores between words.                              |
| `extension.changeCase.dot`        | Change Case dot        | Lowercase with dots between segments.                                                  |
| `extension.changeCase.kebab`      | Change Case kebab      | kebab-case — lowercase, hyphen-separated (same style as **param**).                    |
| `extension.changeCase.lower`      | Change Case lower      | All characters lowercased.                                                             |
| `extension.changeCase.lowerFirst` | Change Case lowerFirst | Lowercase only the first character.                                                    |
| `extension.changeCase.no`         | Change Case no         | no-case — lowercase, space-separated.                                                  |
| `extension.changeCase.param`      | Change Case param      | kebab-case — lowercase, hyphen-separated.                                              |
| `extension.changeCase.pascal`     | Change Case pascal     | PascalCase — like camelCase, with the first letter uppercased.                         |
| `extension.changeCase.path`       | Change Case path       | Lowercase with slashes between segments.                                               |
| `extension.changeCase.sentence`   | Change Case sentence   | Sentence case.                                                                         |
| `extension.changeCase.snake`      | Change Case snake      | snake_case — lowercase with underscores.                                               |
| `extension.changeCase.swap`       | Change Case swap       | Reverse upper/lower on each character.                                                 |
| `extension.changeCase.title`      | Change Case title      | Title case — capitalise each word.                                                     |
| `extension.changeCase.upper`      | Change Case upper      | All characters uppercased.                                                             |
| `extension.changeCase.upperFirst` | Change Case upperFirst | Uppercase only the first character.                                                    |

## License

MIT
