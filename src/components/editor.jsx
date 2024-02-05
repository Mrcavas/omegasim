import { useRunner } from "../runner.js"
import MonacoEditor from "@monaco-editor/react"

export default function Editor() {
  const { code, setCode } = useRunner(({ code, setCode }) => ({
    code,
    setCode,
  }))

  return (
    <MonacoEditor
      value={code}
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
      onChange={code => setCode(code)}
    />
  )
}
