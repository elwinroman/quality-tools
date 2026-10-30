const MAX_SPAN_NAME_LENGTH = 80
const TARGET = String.raw`(?:\[[^\]]+\]|"[^"]+"|[\w$#@]+)(?:\.(?:\[[^\]]+\]|"[^"]+"|[\w$#@]+))*`

export function normalizeSqlWhitespace(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}

function removeLeadingComments(sql: string): string {
  let statement = sql.trim()
  while (statement) {
    if (statement.startsWith('--')) {
      const newline = statement.indexOf('\n')
      statement = newline < 0 ? '' : statement.slice(newline + 1).trim()
    } else if (statement.startsWith('/*')) {
      const end = statement.indexOf('*/', 2)
      if (end < 0) return ''
      statement = statement.slice(end + 2).trim()
    } else {
      break
    }
  }
  return statement
}

export function summarizeSqlSpanName(sql: string): string | null {
  try {
    const statement = normalizeSqlWhitespace(removeLeadingComments(sql).split(';', 1)[0] ?? '')
    if (!statement) return null

    const verb = statement.match(/^(SELECT|INSERT|UPDATE|DELETE|MERGE|EXECUTE|EXEC)\b/i)?.[1]?.toUpperCase()
    if (!verb || (verb === 'SELECT' && /^SELECT\s+(?:\[?WITH\b)/i.test(statement))) {
      return statement.slice(0, MAX_SPAN_NAME_LENGTH)
    }

    const targetPattern =
      verb === 'SELECT'
        ? new RegExp(`\\bFROM\\s+(${TARGET})`, 'i')
        : verb === 'INSERT' || verb === 'MERGE'
          ? new RegExp(`^${verb}\\s+(?:INTO\\s+)?(${TARGET})`, 'i')
          : verb === 'DELETE'
            ? new RegExp(`^DELETE\\s+(?:FROM\\s+)?(${TARGET})`, 'i')
            : verb === 'UPDATE'
              ? new RegExp(`^UPDATE\\s+(${TARGET})`, 'i')
              : new RegExp(`^EXEC(?:UTE)?\\s+(${TARGET})`, 'i')
    const target = statement.match(targetPattern)?.[1]
    const summary = target ? `${verb === 'EXECUTE' ? 'EXEC' : verb} ${target}` : statement
    return summary.slice(0, MAX_SPAN_NAME_LENGTH)
  } catch {
    return null
  }
}
