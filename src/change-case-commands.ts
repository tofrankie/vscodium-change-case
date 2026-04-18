import * as vscode from 'vscode'
import { EOL } from 'os'
import * as changeCase from 'change-case'
import { uniq } from 'lodash-es'
import { titleCase } from 'title-case'
import { swapCase } from 'swap-case'

export const COMMAND_LABELS = {
  CAMEL: 'camel',
  CONSTANT: 'constant',
  DOT: 'dot',
  KEBAB: 'kebab',
  LOWER: 'lower',
  LOWER_FIRST: 'lowerFirst',
  NO: 'no',
  PARAM: 'param',
  PASCAL: 'pascal',
  PATH: 'path',
  SENTENCE: 'sentence',
  SNAKE: 'snake',
  SWAP: 'swap',
  TITLE: 'title',
  UPPER: 'upper',
  UPPER_FIRST: 'upperFirst',
}

const COMMAND_DEFINITIONS = [
  {
    label: COMMAND_LABELS.CAMEL,
    description:
      'Convert to a string with the separators denoted by having the next letter capitalised',
    func: changeCase.camelCase,
  },
  {
    label: COMMAND_LABELS.CONSTANT,
    description: 'Convert to an upper case, underscore separated string',
    func: changeCase.constantCase,
  },
  {
    label: COMMAND_LABELS.DOT,
    description: 'Convert to a lower case, period separated string',
    func: changeCase.dotCase,
  },
  {
    label: COMMAND_LABELS.KEBAB,
    description: 'Convert to a lower case, dash separated string (alias for param case)',
    func: changeCase.kebabCase,
  },
  {
    label: COMMAND_LABELS.LOWER,
    description: 'Convert to a string in lower case',
    func: (str: string) => str.toLocaleLowerCase(),
  },
  {
    label: COMMAND_LABELS.LOWER_FIRST,
    description: 'Convert to a string with the first character lower cased',
    func: (str: string) => str.charAt(0).toLocaleLowerCase() + str.slice(1),
  },
  {
    label: COMMAND_LABELS.NO,
    description: 'Convert the string without any casing (lower case, space separated)',
    func: changeCase.noCase,
  },
  {
    label: COMMAND_LABELS.PARAM,
    description: 'Convert to a lower case, dash separated string',
    func: changeCase.kebabCase,
  },
  {
    label: COMMAND_LABELS.PASCAL,
    description:
      'Convert to a string denoted in the same fashion as camelCase, but with the first letter also capitalised',
    func: changeCase.pascalCase,
  },
  {
    label: COMMAND_LABELS.PATH,
    description: 'Convert to a lower case, slash separated string',
    func: changeCase.pathCase,
  },
  {
    label: COMMAND_LABELS.SENTENCE,
    description: 'Convert to a lower case, space separated string',
    func: changeCase.sentenceCase,
  },
  {
    label: COMMAND_LABELS.SNAKE,
    description: 'Convert to a lower case, underscore separated string',
    func: changeCase.snakeCase,
  },
  {
    label: COMMAND_LABELS.SWAP,
    description: 'Convert to a string with every character case reversed',
    func: swapCase,
  },
  {
    label: COMMAND_LABELS.TITLE,
    description:
      'Convert to a space separated string with the first character of every word upper cased',
    func: titleCase,
  },
  {
    label: COMMAND_LABELS.UPPER,
    description: 'Convert to a string in upper case',
    func: (str: string) => str.toLocaleUpperCase(),
  },
  {
    label: COMMAND_LABELS.UPPER_FIRST,
    description: 'Convert to a string with the first character upper cased',
    func: (str: string) => str.charAt(0).toLocaleUpperCase() + str.slice(1),
  },
]

export function changeCaseCommands() {
  const firstSelectedText = getSelectedTextIfOnlyOneSelection()
  const opts: vscode.QuickPickOptions = {
    matchOnDescription: true,
    placeHolder: 'What do you want to do to the current word / selection(s)?',
  }

  // if there's only one selection, show a preview of what it will look like after conversion in the QuickPickOptions,
  // otherwise use the description used in COMMAND_DEFINITIONS
  const items: vscode.QuickPickItem[] = COMMAND_DEFINITIONS.map(c => ({
    label: c.label,
    description: firstSelectedText ? `Convert to ${c.func(firstSelectedText)}` : c.description,
  }))

  vscode.window.showQuickPick(items).then(command => runCommand(command.label))
}

export function runCommand(commandLabel: string) {
  const commandDefinition = COMMAND_DEFINITIONS.filter(c => c.label === commandLabel)[0]
  if (!commandDefinition) return

  const editor = vscode.window.activeTextEditor
  const { document, selections } = editor

  let replacementActions = []

  editor
    .edit(editBuilder => {
      replacementActions = selections.map(selection => {
        const { text, range } = getSelectedText(selection, document)

        let replacement
        let offset

        if (selection.isSingleLine) {
          replacement = commandDefinition.func(text)

          // it's possible that the replacement string is shorter or longer than the original,
          // so calculate the offsets and new selection coordinates appropriately
          offset = replacement.length - text.length
        } else {
          const lines = document.getText(range).split(EOL)

          const replacementLines = lines.map(x => commandDefinition.func(x))
          replacement = replacementLines.reduce((acc, v) => (!acc ? '' : acc + EOL) + v, undefined)
          offset =
            replacementLines[replacementLines.length - 1].length - lines[lines.length - 1].length
        }

        return {
          text,
          range,
          replacement,
          offset,
          newRange: isRangeSimplyCursorPosition(range)
            ? range
            : new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character + offset
              ),
        }
      })

      replacementActions
        .filter(x => x.replacement !== x.text)
        .forEach(x => {
          editBuilder.replace(x.range, x.replacement)
        })
    })
    .then(() => {
      const sortedActions = replacementActions.sort((a, b) =>
        compareByEndPosition(a.newRange, b.newRange)
      )

      // in order to maintain the selections based on possible new replacement lengths, calculate the new
      // range coordinates, taking into account possible edits earlier in the line
      const lineRunningOffsets = uniq(sortedActions.map(s => s.range.end.line)).map(lineNumber => ({
        lineNumber,
        runningOffset: 0,
      }))

      const adjustedSelectionCoordinateList = sortedActions.map(s => {
        const lineRunningOffset = lineRunningOffsets.filter(
          lro => lro.lineNumber === s.range.end.line
        )[0]
        const range = new vscode.Range(
          s.newRange.start.line,
          s.newRange.start.character + lineRunningOffset.runningOffset,
          s.newRange.end.line,
          s.newRange.end.character + lineRunningOffset.runningOffset
        )
        lineRunningOffset.runningOffset += s.offset
        return range
      })

      // now finally set the newly created selections
      editor.selections = adjustedSelectionCoordinateList.map(r => toSelection(r))
    })
}

function getSelectedTextIfOnlyOneSelection(): string {
  const editor = vscode.window.activeTextEditor
  const { document, selection, selections } = editor

  // check if there's only one selection or if the selection spans multiple lines
  if (selections.length > 1 || selection.start.line !== selection.end.line) return undefined

  return getSelectedText(selections[0], document).text
}

function getSelectedText(
  selection: vscode.Selection,
  document: vscode.TextDocument
): { text: string; range: vscode.Range } {
  let range: vscode.Range

  if (isRangeSimplyCursorPosition(selection)) {
    range = getChangeCaseWordRangeAtPosition(document, selection.end)
  } else {
    range = new vscode.Range(selection.start, selection.end)
  }

  return {
    text: range ? document.getText(range) : undefined,
    range,
  }
}

const CHANGE_CASE_WORD_CHARACTER_REGEX = /([\w_\.\-\/$]+)/
const CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT = /([\w_\-\/$]+)/

// Change Case has a special definition of a word: it can contain special characters like dots, dashes and slashes
function getChangeCaseWordRangeAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const configuration = vscode.workspace.getConfiguration('changeCase')
  const includeDotInCurrentWord = configuration
    ? configuration.get('includeDotInCurrentWord', false)
    : false
  const regex = includeDotInCurrentWord
    ? CHANGE_CASE_WORD_CHARACTER_REGEX
    : CHANGE_CASE_WORD_CHARACTER_REGEX_WITHOUT_DOT

  const range = document.getWordRangeAtPosition(position)
  if (!range) return undefined

  let startCharacterIndex = range.start.character - 1
  while (startCharacterIndex >= 0) {
    const charRange = new vscode.Range(
      range.start.line,
      startCharacterIndex,
      range.start.line,
      startCharacterIndex + 1
    )
    const character = document.getText(charRange)
    if (character.search(regex) === -1) {
      // no match
      break
    }
    startCharacterIndex--
  }

  const lineMaxColumn = document.lineAt(range.end.line).range.end.character
  let endCharacterIndex = range.end.character
  while (endCharacterIndex < lineMaxColumn) {
    const charRange = new vscode.Range(
      range.end.line,
      endCharacterIndex,
      range.end.line,
      endCharacterIndex + 1
    )
    const character = document.getText(charRange)
    if (character.search(regex) === -1) {
      // no match
      break
    }
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
