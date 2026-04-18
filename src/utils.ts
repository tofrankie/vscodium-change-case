/**
 * SpongeBob-style alternating letter case.
 * From: https://github.com/jgarrow/spongebob-case/blob/b845b2cd5b9ff9712903a29d6bf80b7432e4fc3c/src/index.ts
 */
export function spongebobCase(str: string): string {
  const singleCharacter = /[a-z]/i // any letter
  const lowerCaseLetters = /[a-z]+/

  return str.split('').reduce((acc, currChar): string => {
    // check if currChar is a word character
    if (singleCharacter.test(currChar)) {
      // fall back to array of empty string b/c for first character, lastMatch is undefined
      // lowerCaseLetters.test(undefined) returns true, but passing in an empty string returns false (which is what we want for the first character)
      const existingWordChars = acc.match(/[a-z]/gi) ?? ['']
      const lastMatch = existingWordChars[existingWordChars.length - 1]

      // if lastMatch is lowercase
      return lowerCaseLetters.test(lastMatch)
        ? acc + currChar.toUpperCase()
        : acc + currChar.toLowerCase()
    } else {
      return acc + currChar
    }
  }, '')
}
