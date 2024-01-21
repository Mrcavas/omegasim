import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-cyan/theme.css"

export default function App() {
  return (
    <Splitter className="h-full">
      <SplitterPanel className="grid place-items-center" size={60}>
        Panel A
      </SplitterPanel>
      <SplitterPanel className="grid place-items-center" size={40}>
        <Button label="Hello World!" />
      </SplitterPanel>
    </Splitter>
  )
}