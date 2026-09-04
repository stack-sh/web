import DefaultTheme from "vitepress/theme"
import "@fontsource-variable/ibm-plex-sans"
import "@fontsource/ibm-plex-mono/400.css"

import IconCatalog from "./components/IconCatalog.vue"
import ProviderCatalog from "./components/ProviderCatalog.vue"
import "./style.css"

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("IconCatalog", IconCatalog)
    app.component("ProviderCatalog", ProviderCatalog)
  },
}
