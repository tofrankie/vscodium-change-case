import * as vscode from 'vscode'
import { changeCaseCommands, runCommand, COMMAND_LABELS } from './change-case-commands'

const CHANGE_CASE_COMMAND_MAPPING = {
  camel: COMMAND_LABELS.CAMEL,
  constant: COMMAND_LABELS.CONSTANT,
  dot: COMMAND_LABELS.DOT,
  kebab: COMMAND_LABELS.KEBAB,
  lower: COMMAND_LABELS.LOWER,
  lowerFirst: COMMAND_LABELS.LOWER_FIRST,
  no: COMMAND_LABELS.NO,
  param: COMMAND_LABELS.PARAM,
  pascal: COMMAND_LABELS.PASCAL,
  path: COMMAND_LABELS.PATH,
  sentence: COMMAND_LABELS.SENTENCE,
  snake: COMMAND_LABELS.SNAKE,
  swap: COMMAND_LABELS.SWAP,
  title: COMMAND_LABELS.TITLE,
  upper: COMMAND_LABELS.UPPER,
  upperFirst: COMMAND_LABELS.UPPER_FIRST,
} as const

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.changeCase.commands', changeCaseCommands)
  )
  for (const [suffix, label] of Object.entries(CHANGE_CASE_COMMAND_MAPPING)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`extension.changeCase.${suffix}`, () => runCommand(label))
    )
  }
}
