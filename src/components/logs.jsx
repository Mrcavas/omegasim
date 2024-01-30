import { useRunner } from "../runner.js"
import { useEffect, useState } from "react"
import Ansi from "ansi-to-html"

export default function Logs({ className }) {
  const { setOnWrite, setClearLogs } = useRunner(({ setOnWrite, setClearLogs }) => ({ setOnWrite, setClearLogs }))
  const [text, setText] = useState("")

  useEffect(() => {
    setOnWrite(msg => {
      setText(text => text + msg)
    })
    setClearLogs(() => {
      setText("")
    })
  }, [])

  return (
    <div className={"h-full overflow-auto " + (className ?? "")}>
      <div
        className="whitespace-pre-line"
        dangerouslySetInnerHTML={{
          __html: new Ansi().toHtml(text),
        }}
      />
    </div>
  )
}
