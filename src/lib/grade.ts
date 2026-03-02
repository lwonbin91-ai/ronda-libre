export interface GradeInfo {
  name: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  emoji: string;
  min: number;
}

export const OPEN_GRADES: GradeInfo[] = [
  { min: 100, name: "Leyenda",    label: "레전드",   emoji: "👑", color: "text-yellow-300", bg: "bg-yellow-400/10", border: "border-yellow-400/40" },
  { min: 40,  name: "Élite",      label: "엘리트",   emoji: "⭐", color: "text-purple-300", bg: "bg-purple-400/10", border: "border-purple-400/40" },
  { min: 30,  name: "Campeón",    label: "챔피언",   emoji: "🏆", color: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-400/40" },
  { min: 20,  name: "Guerrero",   label: "전사",     emoji: "🔥", color: "text-red-300",    bg: "bg-red-400/10",    border: "border-red-400/40" },
  { min: 10,  name: "Jugador",    label: "선수",     emoji: "⚽", color: "text-blue-300",   bg: "bg-blue-400/10",   border: "border-blue-400/40" },
  { min: 0,   name: "Visitante",  label: "방문자",   emoji: "🌱", color: "text-gray-400",   bg: "bg-white/5",       border: "border-white/10" },
];

export const SEASON_GRADES: GradeInfo[] = [
  { min: 100, name: "Maestro",    label: "마에스트로", emoji: "👑", color: "text-yellow-300", bg: "bg-yellow-400/10", border: "border-yellow-400/40" },
  { min: 40,  name: "Estrella",   label: "스타",       emoji: "⭐", color: "text-purple-300", bg: "bg-purple-400/10", border: "border-purple-400/40" },
  { min: 30,  name: "Titular",    label: "주전",        emoji: "🎯", color: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-400/40" },
  { min: 20,  name: "Promesa",    label: "약속의 선수", emoji: "✨", color: "text-green-300",  bg: "bg-green-400/10",  border: "border-green-400/40" },
  { min: 10,  name: "Cadete",     label: "유망주",      emoji: "💪", color: "text-blue-300",   bg: "bg-blue-400/10",   border: "border-blue-400/40" },
  { min: 0,   name: "Rookie",     label: "루키",        emoji: "🌱", color: "text-gray-400",   bg: "bg-white/5",       border: "border-white/10" },
];

interface Reg {
  status: string;
  isMVP?: boolean;
  isFairplay?: boolean;
  schedule?: { type: string } | null;
}

export function calcGrade(regs: Reg[], type: "OPEN" | "SEASON"): { grade: GradeInfo; score: number; bonus: number } {
  const filtered = regs.filter(
    (r) => r.status === "CONFIRMED" && r.schedule?.type === (type === "OPEN" ? "ONEDAY" : "SEASON")
  );
  const base = filtered.length;
  const fairplayBonus = filtered.filter((r) => r.isFairplay).length;
  const mvpBonus = filtered.filter((r) => r.isMVP).length * 2;
  const bonus = fairplayBonus + mvpBonus;
  const score = base + bonus;

  const grades = type === "OPEN" ? OPEN_GRADES : SEASON_GRADES;
  const grade = grades.find((g) => score >= g.min) || grades[grades.length - 1];
  return { grade, score, bonus };
}
