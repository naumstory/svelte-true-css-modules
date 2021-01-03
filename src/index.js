import postcss from 'postcss'
import postcssModules from 'postcss-modules'
import { parse } from 'node-html-parser'
import { globalStyle } from 'svelte-preprocess'

import {
  DEFAULT_INTERPOLATED_SCOPED_NAME,
  DEFAULT_VARIABLE_NAME_FOR_CLASS_NAMES,
  SELECTOR_STYLE_TAG,
} from './consts'
import { regExpFindVariable } from './utils/reg-exp-find-variable'

export default function svelteCssModules({
  generateScopedName = DEFAULT_INTERPOLATED_SCOPED_NAME,
  stylesVariableName = DEFAULT_VARIABLE_NAME_FOR_CLASS_NAMES,
} = {}) {
  let isModuleCss = false
  let cssProcessed = ''
  let exportedClassNames = {}

  return {
    async markup({ content }) {
      const svelteFileContent = parse(content)
      const tagStyleWithModuleHook = svelteFileContent.querySelector(
        SELECTOR_STYLE_TAG
      )
      isModuleCss = !!tagStyleWithModuleHook

      if (!isModuleCss) {
        return
      }

      const cssBeforeProcessing = tagStyleWithModuleHook.text
      const postcssResult = await postcss([
        postcssModules({
          getJSON(_, exportedData) {
            exportedClassNames = exportedData
          },
          generateScopedName,
        }),
      ]).process(cssBeforeProcessing)
      cssProcessed = postcssResult.css
    },

    script({ content }) {
      if (!isModuleCss) {
        return
      }

      const stylesVariableContent = JSON.stringify(exportedClassNames)
      const code = content.replace(
        regExpFindVariable(stylesVariableName),
        `$1 = ${stylesVariableContent}`
      )

      return {
        code,
      }
    },

    async style({ filename }) {
      if (!isModuleCss) {
        return
      }

      const { style } = globalStyle()
      const { code } = await style({
        content: cssProcessed,
        attributes: { global: true },
        filename,
      })

      return {
        code,
      }
    },
  }
}
