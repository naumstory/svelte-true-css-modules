export function regExpFindVariable(variableName = 'styles') {
  return new RegExp(`((var|let|const) ${variableName})[^\n|;]*`)
}
