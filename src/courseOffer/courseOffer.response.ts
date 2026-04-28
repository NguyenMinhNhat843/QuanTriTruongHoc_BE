export class CourseOfferResponseDto {
  id: number;
  courseCode: string;
  subjectName: string;
  className: string; // Tên lớp danh nghĩa (ví dụ: CNTTK18A)
  maxStudents: number;
  status: string;
}
