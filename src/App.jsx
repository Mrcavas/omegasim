import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import Editor from "./components/editor.jsx"
import { useRunner } from "./runner.js"
import { useEffect } from "react"

import clang from './compiler/assets/clang.wasm?url'
import lld from './compiler/assets/lld.wasm?url'
import memfs from './compiler/assets/memfs.wasm?url'
import sysroot from './compiler/assets/sysroot.tar?url'
import Logs from "./components/logs.jsx"

console.log({ clang, lld, memfs, sysroot })
export default function App() {
  const { init, runCode } = useRunner(({ init, runCode }) => ({ init, runCode }))

  useEffect(init, [])

  return (
    <Splitter className="h-full">
      <SplitterPanel className="overflow-hidden" size={40}>
        <Editor />
      </SplitterPanel>
      <SplitterPanel className="block" size={60}>
        <Button icon="pi pi-caret-right" severity="success" rounded text onClick={runCode} className="m-2" />
        <Logs className="mx-2 mb-2"/>
      </SplitterPanel>
    </Splitter>
  )
}