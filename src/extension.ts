import * as vscode from 'vscode'
import { changeCaseCommands, COMMANDS, runCommand } from './commands'

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscodium-change-case.commands', changeCaseCommands)
  )
  for (const command of COMMANDS) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`vscodium-change-case.${command.id}`, async () =>
        runCommand(command.id)
      )
    )
  }
}
