import DefaultTheme from "vitepress/theme"
import "@fontsource-variable/ibm-plex-sans"
import "@fontsource/ibm-plex-mono/400.css"

import IconCatalog from "./components/IconCatalog.vue"
import "./style.css"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("IconCatalog", IconCatalog)
  },
}
