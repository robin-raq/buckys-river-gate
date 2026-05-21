/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module '*.png' {
  const src: string
  export default src
}
