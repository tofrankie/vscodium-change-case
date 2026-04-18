import * as vscode from 'vscode'
import { changeCaseCommands, runCommand, COMMANDS } from './change-case-commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.changeCase.commands', changeCaseCommands)
  )
  for (const command of COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`extension.changeCase.${command.id}`, () =>
        runCommand(command.id)
      )
    )
  }
}
