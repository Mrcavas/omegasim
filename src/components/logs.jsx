import { useStore } from "../store.js"
import { useEffect, useState } from "react"
import Ansi from "ansi-to-html"

const MAX_LENGTH = 5000;

export default function Logs({ className }) {
  const { setOnWrite, setClearLogs } = useStore(({ setOnWrite, setClearLogs }) => ({ setOnWrite, setClearLogs }))
  const [text, setText] = useState("")

  useEffect(() => {
    setOnWrite(msg => {
      setText(text => {
        const combined = text + msg
        if (combined.length <= MAX_LENGTH) return combined
        return combined.slice(combined.length - MAX_LENGTH)
      })
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
