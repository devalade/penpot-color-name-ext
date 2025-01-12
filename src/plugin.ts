import type { PluginMessageEvent } from "./types";
import type { Shape } from "@penpot/plugin-types";

const centerShape = (shape: Shape) => {
  shape.x = penpot.viewport.center.x;
  shape.y = penpot.viewport.center.y;
};
const selectShape = (shape: Shape) => {
  penpot.selection = [shape];
};

penpot.ui.open("Color Name", `?theme=${penpot.theme}`, {
  width: 500,
  height: 600,
});

penpot.ui.onMessage((message: PluginMessageEvent) => {
  if (message.type === "create-color-shape") {
    const shape = penpot.createText(message.content);
    if (shape) {
      centerShape(shape);
      selectShape(shape);
    }
  }
});


penpot.on("selectionchange", () => {
  const colors = penpot.shapesColors(penpot.selection);
  console.log("colors", colors);
  sendColor({ type: "selectionchange", content: JSON.stringify(colors) });
});

function sendColor(message: PluginMessageEvent) {
  penpot.ui.sendMessage(message);
}
