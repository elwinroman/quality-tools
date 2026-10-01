import fs from 'node:fs'
import path from 'node:path'

import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const root = postcss.parse(fs.readFileSync(path.resolve(__dirname, 'global.css'), 'utf8'))

describe('coherencia de tokens en global.css', () => {
  it('debería referenciar en @theme solo variables definidas en la hoja de estilos', () => {
    const defined = new Set<string>()
    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) {
        defined.add(decl.prop)
      }
    })

    const referenced = new Set<string>()
    root.walkAtRules((atRule) => {
      if (atRule.name !== 'theme') {
        return
      }

      // Solo las declaraciones directas del bloque @theme: se excluyen las
      // variables provistas en tiempo de ejecución dentro de @keyframes.
      atRule.each((node) => {
        if (node.type !== 'decl') {
          return
        }

        for (const match of node.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
          referenced.add(match[1])
        }
      })
    })

    const undefinedRefs = [...referenced].filter((name) => !defined.has(name)).sort()

    expect(undefinedRefs).toEqual([])
  })
})
