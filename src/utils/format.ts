export const formatTime = (timeStr: string): Date => {
  return new Date(`1970-01-01T${timeStr}Z`);
};
