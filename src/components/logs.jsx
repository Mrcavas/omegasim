import { useRunner } from "../runner.js"
import { useEffect, useState } from "react"
import Ansi from "ansi-to-html"

export default function Logs({ className }) {
  const setOnWrite = useRunner(({ setOnWrite }) => setOnWrite)
  const [text, setText] = useState("")

  useEffect(() => {
    setOnWrite(msg => {
      setText(text => `${text}\n${new Ansi().toHtml(msg)}`)
    })
  }, [])

  return <div className={"whitespace-pre-line " + (className ?? "")} dangerouslySetInnerHTML={{
    __html: text
  }} />
}