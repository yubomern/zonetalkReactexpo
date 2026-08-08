export const THEMES = {
  dark: {
    bg: "#0B1220",
    panel: "#121B2B",
    panelAlt: "#182437",
    border: "#223046",
    mint: "#33D6A6",
    lavender: "#9B8CFF",
    coral: "#FF7A59",
    text: "#EAF0F6",
    muted: "#7E93A7",
    appShell: "#090f1b",
    overlay: "rgba(5,9,16,0.7)",
    hover: "#15202f",
    tone: "#04231a",
  },
  light: {
    bg: "#F4F7FB",
    panel: "#FFFFFF",
    panelAlt: "#EEF3FA",
    border: "#CFDAEA",
    mint: "#19B38A",
    lavender: "#7767F6",
    coral: "#E55C3A",
    text: "#122034",
    muted: "#5B6D82",
    appShell: "#E8EDF5",
    overlay: "rgba(15, 23, 42, 0.3)",
    hover: "#E8EEF8",
    tone: "#FFFFFF",
  },
};

export const GROUP_COLORS = ["#33D6A6", "#9B8CFF", "#FF7A59", "#F2C14E", "#5FB0FF", "#FF8FC7"];

export const DM_CONTACTS = [
  { id: "alice", name: "Alice Kponou", type: "dm", color: "#33D6A6" },
  { id: "bob", name: "Bob Rahmani", type: "dm", color: "#9B8CFF" },
  { id: "sara", name: "Sara Ouedraogo", type: "dm", color: "#FF7A59" },
];

export const DEFAULT_GROUPS = [
  {
    id: "grp-coffee",
    name: "Coffee Crew ☕",
    type: "group",
    color: "#F2C14E",
    members: ["Alice", "Bob", "Sara", "You"],
  },
  {
    id: "grp-uni",
    name: "Campus Squad 🎓",
    type: "group",
    color: "#5FB0FF",
    members: ["Bob", "Sara", "Malik", "You"],
  },
];

export const ZONE_NAME_POOL = [
  "Yassine", "Nour", "Leila", "Karim", "Fatima", "Omar",
  "Ines", "Rayan", "Mariem", "Hamza", "Salma", "Adem",
];

export const EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😴", "😭", "😡", "👍", "👎", "🙏",
  "🎉", "🔥", "❤️", "💯", "☕", "🍕", "⚽", "🎵", "😉", "🙌", "👏", "😅",
  "🤗", "😇", "🥳", "😜", "🤝", "✨", "💡", "📍",
];

export function generateZonePeople(count) {
  const shuffled = [...ZONE_NAME_POOL].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * 2 * Math.PI;
    const distance = +(Math.random() * 2).toFixed(1);
    return {
      id: "zone-" + shuffled[i].toLowerCase(),
      name: shuffled[i],
      type: "zone",
      color: GROUP_COLORS[i % GROUP_COLORS.length],
      angle,
      distance,
    };
  });
}
