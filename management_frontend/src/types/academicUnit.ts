export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { programmes: number; students: number };
}

export interface Programme {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string; code: string };
  _count: { students: number };
}
