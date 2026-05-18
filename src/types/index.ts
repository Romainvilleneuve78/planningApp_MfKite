export interface User {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeekDay {
  date: Date;
  dateStr: string;
  label: string;
  dayName: string;
}
