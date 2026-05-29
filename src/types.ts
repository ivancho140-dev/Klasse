/**
 * KLASSE - Type Definitions
 */

export type Subject = "Matemáticas" | "Ciencias" | "Historia" | "Literatura";
export type Group = "A" | "B" | "C";

export interface CognitiveSkills {
  logica: number;       // Logic / Analytical
  creatividad: number;  // Creativity
  colaboracion: number; // Collaboration
  liderazgo: number;    // Leadership
  comunicacion: number; // Communication
}

export interface BehaviorLog {
  id: string;
  date: string;
  type: "positivo" | "critico" | "academico";
  tag: string;          // e.g., "Gran Deducción", "Sin Material", "Colaborativo"
  points: number;       // positive or negative e.g. +3, -2
  description: string;
}

export interface AttendanceRecord {
  date: string;
  status: "presente" | "ausente" | "tarde";
}

export interface GradeActivity {
  id: string;
  name: string;
  weight: number; // e.g. 30
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  group: Group;
  subject: Subject;
  status: "Activo" | "Inactivo";
  points: number;       // Gamification points (Karmas)
  grades: {
    exam1: number;
    homework1: number;
    exam2: number;
    project: number;
    [activityId: string]: number; // Allow dynamic activities by id
  };
  cognitiveSkills: CognitiveSkills;
  behaviorLogs: BehaviorLog[];
  attendance: AttendanceRecord[];
}

export interface AppSettings {
  googleDriveSynced: boolean;
  lastSyncDate: string | null;
  notificationsEnabled: boolean;
  academicYear: string;
  offlineMode: boolean;
  dangerZoneActive: boolean;
  theme?: string;
  teacherName?: string;
}

export interface Classroom {
  id: string;
  name: string;
  institution: string;
  schedule: string;
  students: Student[];
  minGrade: number;      // e.g., 0.0 or 1.0
  maxGrade: number;      // e.g., 5.0, 7.0, or 10.0
  passingGrade: number;  // e.g., 3.0, 4.0, or 6.0
  periodType: "trimestre" | "semestre" | "año" | "periodo";
  periodName: string;    // e.g., "Trimestre 1 Escolar"
  activities: GradeActivity[];
  activityNames?: {
    exam1: string;
    homework1: string;
    exam2: string;
    project: string;
  };
  activityWeights?: {
    exam1: number; // percentage, e.g. 30
    homework1: number; // percentage, e.g. 20
    exam2: number; // percentage, e.g. 30
    project: number; // percentage, e.g. 20
  };
}
