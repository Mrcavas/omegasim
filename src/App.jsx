import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import Editor from "./components/editor.jsx"
import { useRunner } from "./runner.js"
import { useEffect } from "react"

import clang from "./compiler/assets/clang.wasm?url"
import lld from "./compiler/assets/lld.wasm?url"
import memfs from "./compiler/assets/memfs.wasm?url"
import sysroot from "./compiler/assets/sysroot.tar?url"
import Logs from "./components/logs.jsx"

console.log({ clang, lld, memfs, sysroot })
export default function App() {
  const { init, runCode, clearLogs, registerImport, restart } = useRunner(({
                                                                             init,
                                                                             runCode,
                                                                             clearLogs,
                                                                             registerImport,
                                                                             restart,
                                                                           }) => ({
    init, runCode, clearLogs, registerImport, restart,
  }))

  useEffect(() => {
    init()
    registerImport(function testFn(n = 1) {
      console.log("test function called with", n)
      return n * 2
    })
  }, [])

  return (
    <Splitter className="h-full">
      <SplitterPanel className="overflow-hidden" size={50}>
        <Editor />
      </SplitterPanel>
      <SplitterPanel className="flex flex-col gap-2 p-2" size={50}>
        <div className="flex flex-row gap-2 justify-between">
          <Button icon="pi pi-caret-right" severity="success" rounded text onClick={runCode} />
          <div>
            <Button icon="pi pi-refresh rotate-45" severity="help" rounded text onClick={restart} />
            <Button icon="pi pi-times" severity="danger" rounded text onClick={clearLogs} />
          </div>
        </div>
        <Logs className="flex flex-col-reverse" />
      </SplitterPanel>
    </Splitter>
  )
}