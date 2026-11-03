import * as THREE from "three";
import { Paper } from "../objects/index.js";
import { t } from "../../translations/index.js";

const placements = {
  mum: [
    { id: "family-note-01", room: "bedroom" },
    { id: "family-note-03", room: "livingRoom" },
    { id: "family-note-05", room: "childrenRoom" },
    { id: "family-note-07", room: "bathroom" },
    { id: "family-note-09", room: "kitchen" },
  ],
  dad: [
    { id: "family-note-02", room: "bedroom" },
    { id: "family-note-04", room: "livingRoom" },
    { id: "family-note-06", room: "childrenRoom" },
    { id: "family-note-08", room: "bathroom" },
    { id: "family-note-10", room: "kitchen" },
  ],
};

const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
  let cursorY = y;
  String(text)
    .split("\n")
    .forEach((paragraph) => {
      let line = "";
      paragraph.split(/\s+/).forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (line && context.measureText(candidate).width > maxWidth) {
          context.fillText(line, x, cursorY);
          cursorY += lineHeight;
          line = word;
        } else line = candidate;
      });
      if (line) context.fillText(line, x, cursorY);
      cursorY += lineHeight * 1.35;
    });
};

const drawStoryNote =
  ({ author, title, body }) =>
  (context, canvas) => {
    const isMother = author === "mother";
    const ink = isMother ? "#533a35" : "#293d4a";
    const accent = isMother ? "#a56c68" : "#627f8e";
    const margin = 82;
    context.fillStyle = isMother ? "#ead9b7" : "#d8ded8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const stain = context.createRadialGradient(
      canvas.width * 0.78,
      canvas.height * 0.17,
      8,
      canvas.width * 0.78,
      canvas.height * 0.17,
      250,
    );
    stain.addColorStop(0, isMother ? "rgba(137,82,47,.12)" : "rgba(50,78,91,.10)");
    stain.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = stain;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = `${accent}45`;
    context.lineWidth = 2;
    for (let y = 230; y < canvas.height - 75; y += 70) {
      context.beginPath();
      context.moveTo(margin, y);
      context.lineTo(canvas.width - margin, y);
      context.stroke();
    }
    context.strokeStyle = accent;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(62, 0);
    context.lineTo(62, canvas.height);
    context.stroke();
    context.fillStyle = ink;
    context.textBaseline = "top";
    context.font = "italic 600 58px Georgia";
    context.fillText(title, margin, 75);
    context.fillStyle = accent;
    context.font = "italic 32px Georgia";
    context.fillText(t(`diaryBook.${isMother ? "mother" : "father"}`), margin, 155);
    context.fillStyle = ink;
    context.font = "italic 37px Georgia";
    wrapText(
      context,
      body.replace(/\s+—\s+(Mamá|Papá|Mum|Dad|Maman|Papa)\s*$/, ""),
      margin,
      250,
      canvas.width - margin * 2,
      55,
    );
  };

const showFoundNoteMessage = () => {
  const panel = document.getElementById("story-note-notification");
  if (!panel) return;
  window.clearTimeout(panel.hideTimeout);
  panel.textContent = t("diaryBook.noteFound");
  panel.classList.remove("hidden");
  panel.hideTimeout = window.setTimeout(() => panel.classList.add("hidden"), 4500);
};

const createFamilyStoryNotes = ({ character, rooms, actions, onNoteCollected = null }) =>
  placements[character].map((config) => {
    const author = character === "mum" ? "mother" : "father";
    const note = new Paper({
      id: config.id,
      rotation: new THREE.Euler(-Math.PI / 2, 0, character === "mum" ? -0.05 : 0.06),
      scale: 0.72,
      width: 1.25,
      height: 1.65,
      paperColor: character === "mum" ? "#ead9b7" : "#d8ded8",
      backColor: character === "mum" ? "#c6ad80" : "#afb9b3",
      content: drawStoryNote({
        author,
        title: t(`storyNotes.${config.id}.title`),
        body: t(`storyNotes.${config.id}.body`),
      }),
      collectible: true,
      archiveOnly: true,
      itemName: "family-note",
      onCollect: () => {
        actions[config.room]?.("item.pickup", config.id);
        onNoteCollected?.(config.id);
        showFoundNoteMessage();
      },
    });
    rooms[config.room].addStoryNote(note.object3D);
    return note;
  });

export { createFamilyStoryNotes };
