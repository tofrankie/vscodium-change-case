import * as vscode from 'vscode'
import { EOL } from 'os'
import * as changeCase from 'change-case'
import { titleCase } from 'title-case'
import { swapCase } from 'swap-case'

export const COMMANDS = [
  {
    id: 'camel',
    label: 'camel',
    description:
      'Convert to a string with the separators denoted by having the next letter capitalised',
    func: changeCase.camelCase,
  },
  {
    id: 'constant',
    label: 'constant',
    description: 'Convert to an upper case, underscore separated string',
    func: changeCase.constantCase,
  },
  {
    id: 'dot',
    label: 'dot',
    description: 'Convert to a lower case, period separated string',
    func: changeCase.dotCase,
  },
  {
    id: 'kebab',
    label: 'kebab',
    description: 'Convert to a lower case, dash separated string (alias for param case)',
    func: changeCase.kebabCase,
  },
  {
    id: 'lower',
    label: 'lower',
    description: 'Convert to a string in lower case',
    func: (str: string) => str.toLocaleLowerCase(),
  },
  {
    id: 'lowerFirst',
    label: 'lowerFirst',
    description: 'Convert to a string with the first character lower cased',
    func: (str: string) => str.charAt(0).toLocaleLowerCase() + str.slice(1),
  },
  {
    id: 'no',
    label: 'no',
    description: 'Convert the string without any casing (lower case, space separated)',
    func: changeCase.noCase,
  },
  {
    id: 'param',
    label: 'param',
    description: 'Convert to a lower case, dash separated string',
    func: changeCase.kebabCase,
  },
  {
    id: 'pascal',
    label: 'pascal',
    description:
      'Convert to a string denoted in the same fashion as camelCase, but with the first letter also capitalised',
    func: changeCase.pascalCase,
  },
  {
    id: 'path',
    label: 'path',
    description: 'Convert to a lower case, slash separated string',
    func: changeCase.pathCase,
  },
  {
    id: 'sentence',
    label: 'sentence',
    description: 'Convert to a lower case, space separated string',
    func: changeCase.sentenceCase,
  },
  {
    id: 'snake',
    label: 'snake',
    description: 'Convert to a lower case, underscore separated string',
    func: changeCase.snakeCase,
  },
  {
    id: 'swap',
    label: 'swap',
    description: 'Convert to a string with every character case reversed',
    func: swapCase,
  },
  {
    id: 'title',
    label: 'title',
    description:
      'Convert to a space separated string with the first character of every word upper cased',
    func: titleCase,
  },
  {
    id: 'upper',
    label: 'upper',
    description: 'Convert to a string in upper case',
    func: (str: string) => str.toLocaleUpperCase(),
  },
  {
    id: 'upperFirst',
    label: 'upperFirst',
    description: 'Convert to a string with the first character upper cased',
    func: (str: string) => str.charAt(0).toLocaleUpperCase() + str.slice(1),
  },
] as const

export async function changeCaseCommands() {
  const firstSelectedText = getSelectedTextIfOnlyOneSelection()
  const opts: vscode.QuickPickOptions = {
    matchOnDescription: true,
    placeHolder: 'What do you want to do to the current word / selection(s)?',
  }

  // if there's only one selection, show a preview of what it will look like after conversion in the QuickPickOptions,
  // otherwise use the description used in COMMANDS
  const items: vscode.QuickPickItem[] = COMMANDS.map(c => ({
    label: c.label,
    description: firstSelectedText ? `Convert to ${c.func(firstSelectedText)}` : c.description,
  }))

  const command = await vscode.window.showQuickPick(items, opts)
  if (command) {
    await runCommand(command.label)
  }
}

export async function runCommand(commandIdOrLabel: string) {
  const commandDefinition = COMMANDS.find(
    c => c.id === commandIdOrLabel || c.label === commandIdOrLabel
  )
  if (!commandDefinition) return

  const editor = vscode.window.activeTextEditor
  if (!editor) return
  const { document, selections } = editor

  let replacementActions: {
    text: string | undefined
    range: vscode.Range
    replacement: string | undefined
    offset: number | undefined
    newRange: vscode.Range
  }[] = []

  const success = await editor.edit(editBuilder => {
    replacementActions = selections.map(selection => {
      const { text, range } = getSelectedText(selection, document)
      if (!text || !range)
        return {
          text,
          range: range || selection,
          replacement: undefined,
          offset: 0,
          newRange: range || selection,
        }

      let replacement
      let offset = 0

      if (selection.isSingleLine) {
        replacement = commandDefinition.func(text)

        // it's possible that the replacement string is shorter or longer than the original,
        // so calculate the offsets and new selection coordinates appropriately
        offset = replacement.length - text.length
      } else {
        const lines = document.getText(range).split(EOL)
        const replacementLines = lines.map(x => commandDefinition.func(x))
        replacement = replacementLines.join(EOL) // simpler than reduce
        offset =
          replacementLines[replacementLines.length - 1].length - lines[lines.length - 1].length
      }

      const newRange = isRangeSimplyCursorPosition(range)
        ? range
        : new vscode.Range(
            range.start.line,
            range.start.character,
            range.end.line,
            range.end.character + offset
          )

      return { text, range, replacement, offset, newRange }
    })

    replacementActions
      .filter(x => x && x.replacement !== undefined && x.replacement !== x.text)
      .forEach(x => {
        editBuilder.replace(x.range, x.replacement!)
      })
  })

  if (success) {
    const sortedActions = replacementActions
      .filter(x => x.range)
      .sort((a, b) => compareByEndPosition(a.newRange, b.newRange))

    const lineRunningOffsets = Array.from(new Set(sortedActions.map(s => s.range.end.line))).map(
      lineNumber => ({
        lineNumber,
        runningOffset: 0,
      })
    )

    const adjustedSelectionCoordinateList = sortedActions.map(s => {
      const lineRunningOffset = lineRunningOffsets.find(lro => lro.lineNumber === s.range.end.line)
      if (!lineRunningOffset) return s.newRange

      const range = new vscode.Range(
        s.newRange.start.line,
        s.newRange.start.character + lineRunningOffset.runningOffset,
        s.newRange.end.line,
        s.newRange.end.character + lineRunningOffset.runningOffset
      )
      lineRunningOffset.runningOffset += s.offset || 0
      return range
    })

    editor.selections = adjustedSelectionCoordinateList.map(r => toSelection(r))
  }
}

function getSelectedTextIfOnlyOneSelection(): string | undefined {
  const editor = vscode.window.activeTextEditor
  if (!editor) return undefined
  const { document, selection, selections } = editor

  if (selections.length > 1 || selection.start.line !== selection.end.line) return undefined

  return getSelectedText(selections[0], document).text
}

function getSelectedText(
  selection: vscode.Selection,
  document: vscode.TextDocument
): { text: string | undefined; range: vscode.Range } {
  let range: vscode.Range | undefined

  if (isRangeSimplyCursorPosition(selection)) {
    range = getChangeCaseWordRangeAtPosition(document, selection.end)
  } else {
    range = new vscode.Range(selection.start, selection.end)
  }

  return {
    text: range ? document.getText(range) : undefined,
    range: range || selection,
  }
}

const CHANGE_CASE_WORD_CHARACTER_REGEX = /([\w_\.\-\/$]+)/
const CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT = /([\w_\-\/$]+)/

function getChangeCaseWordRangeAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.Range | undefined {
  const configuration = vscode.workspace.getConfiguration('changeCase')
  const includeDotInCurrentWord = configuration
    ? configuration.get('includeDotInCurrentWord', false)
    : false
  const regex = includeDotInCurrentWord
    ? CHANGE_CASE_WORD_CHARACTER_REGEX
    : CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT

  const range = document.getWordRangeAtPosition(position)
  if (!range) return undefined

  const lineText = document.lineAt(range.start.line).text

  let startCharacterIndex = range.start.character - 1
  while (startCharacterIndex >= 0) {
    const character = lineText.charAt(startCharacterIndex)
    if (character.search(regex) === -1) break
    startCharacterIndex--
  }

  const lineMaxColumn = document.lineAt(range.end.line).range.end.character
  let endCharacterIndex = range.end.character
  while (endCharacterIndex < lineMaxColumn) {
    const character = lineText.charAt(endCharacterIndex)
    if (character.search(regex) === -1) break
    endCharacterIndex++
  }

  return new vscode.Range(
    range.start.line,
    startCharacterIndex + 1,
    range.end.line,
    endCharacterIndex
  )
}

function isRangeSimplyCursorPosition(range: vscode.Range): boolean {
  return range.start.line === range.end.line && range.start.character === range.end.character
}

function toSelection(range: vscode.Range): vscode.Selection {
  return new vscode.Selection(
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character
  )
}

function compareByEndPosition(
  a: vscode.Range | vscode.Selection,
  b: vscode.Range | vscode.Selection
): number {
  if (a.end.line < b.end.line) return -1
  if (a.end.line > b.end.line) return 1
  if (a.end.character < b.end.character) return -1
  if (a.end.character > b.end.character) return 1
  return 0
}
