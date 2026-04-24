export const generateId = (): string => {
  // Lấy 7 số cuối của timestamp (thay đổi theo từng miligiây)
  const timestampPart = Date.now().toString().slice(-7);

  // Tạo thêm 1 số ngẫu nhiên
  const randomPart = Math.floor(Math.random() * 10).toString();

  return `${timestampPart}${randomPart}`;
};
