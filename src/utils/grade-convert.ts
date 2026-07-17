export function convertToGradeSystem(score: number | null | undefined): {
  gradeFour: number;
  gradeLetter: string;
} {
  if (score === null || score === undefined) {
    return { gradeFour: 0, gradeLetter: "N/A" };
  }

  if (score >= 9.0) return { gradeFour: 4.0, gradeLetter: "A+" };
  if (score >= 8.5) return { gradeFour: 3.7, gradeLetter: "A" };
  if (score >= 8.0) return { gradeFour: 3.5, gradeLetter: "B+" };
  if (score >= 7.0) return { gradeFour: 3.0, gradeLetter: "B" };
  if (score >= 6.5) return { gradeFour: 2.5, gradeLetter: "C+" };
  if (score >= 5.5) return { gradeFour: 2.0, gradeLetter: "C" };
  if (score >= 5.0) return { gradeFour: 1.5, gradeLetter: "D+" };
  if (score >= 4.0) return { gradeFour: 1.0, gradeLetter: "D" };
  return { gradeFour: 0.0, gradeLetter: "F" }; // Trượt môn
}
