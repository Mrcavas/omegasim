import MonacoEditor from "@monaco-editor/react"
import { useStore } from "../store.js"

export default function Editor({ id }) {
  const { code, setCode } = useStore(({ code, setCode }) => ({
    code,
    setCode,
  }))

  return (
    <MonacoEditor
      beforeMount={monaco => {
        monaco.editor.addKeybindingRules([
          {
            keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY,
            command: "editor.action.deleteLines",
          },
        ])
      }}
      value={code[id]}
      language={"cpp"}
      theme="vs-dark"
      wrapperProps={{
        className: "h-full",
      }}
      options={{
        minimap: {
          enabled: false,
        },
        fontSize: 18,
        wordWrap: "on",
      }}
      onChange={code => setCode(id, code)}
    />
  )
}
