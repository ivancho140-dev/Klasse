import React, { useState, useEffect } from "react";
import { Student, AppSettings, BehaviorLog, Classroom, GradeActivity } from "./types";
import { initialStudents } from "./data/mockData";
import Dashboard from "./components/Dashboard";
import StudentDirectory from "./components/StudentDirectory";
import StudentRegister from "./components/StudentRegister";
import ClassManagement from "./components/ClassManagement";
import StudentProfile from "./components/StudentProfile";
import Reports from "./components/Reports";
import SettingsComponent from "./components/Settings";
import GradesManagement from "./components/GradesManagement";
import { 
  initAuth, 
  googleSignIn, 
  googleSignOut, 
  uploadBackupToDrive, 
  downloadBackupFromDrive 
} from "./lib/driveSync";

import { 
  BookOpen, 
  Settings as SettingsIcon, 
  Users2, 
  LayoutDashboard, 
  BarChart4, 
  UserPlus2, 
  Bell, 
  Award,
  Zap,
  Globe,
  Heart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  
  // ==========================================
  // Persistent Storage State Initialization (Classrooms & Roster)
  // ==========================================
  const [classrooms, setClassrooms] = useState<Classroom[]>(() => {
    const saved = localStorage.getItem("klasse_classrooms");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure classrooms have standard grading parameters
        return parsed.map((c: any) => {
          const mergedActivities = c.activities ?? [
            { id: "exam1", name: c.activityNames?.exam1 ?? "Examen 1", weight: c.activityWeights?.exam1 ?? 30 },
            { id: "homework1", name: c.activityNames?.homework1 ?? "Tarea 1", weight: c.activityWeights?.homework1 ?? 20 },
            { id: "exam2", name: c.activityNames?.exam2 ?? "Examen 2", weight: c.activityWeights?.exam2 ?? 30 },
            { id: "project", name: c.activityNames?.project ?? "Proyecto", weight: c.activityWeights?.project ?? 20 }
          ];
          return {
            ...c,
            minGrade: c.minGrade ?? 0,
            maxGrade: c.maxGrade ?? 10,
            passingGrade: c.passingGrade ?? 6,
            periodType: c.periodType ?? "trimestre",
            periodName: c.periodName ?? "Trimestre 1 Escolar",
            activities: mergedActivities
          };
        });
      } catch (e) {
        console.error("Error parsing saved classrooms", e);
      }
    }

    // Backwards compatibility migration for old stored students
    const savedOldStudents = localStorage.getItem("klasse_students");
    let migratedStudents = initialStudents;
    if (savedOldStudents) {
      try {
        migratedStudents = JSON.parse(savedOldStudents);
      } catch (e) {}
    }

    return [
      {
        id: "class-1",
        name: "Matemáticas e Idiomas IA",
        institution: "Liceo Experimental",
        schedule: "Lun, Mié y Vie — 08:00 a 10:00",
        minGrade: 0,
        maxGrade: 10,
        passingGrade: 6,
        periodType: "trimestre",
        periodName: "Trimestre 1 Escolar",
        activities: [
          { id: "exam1", name: "Examen 1", weight: 30 },
          { id: "homework1", name: "Tarea 1", weight: 20 },
          { id: "exam2", name: "Examen 2", weight: 30 },
          { id: "project", name: "Proyecto", weight: 20 }
        ],
        students: migratedStudents
      }
    ];
  });

  const [activeClassroomId, setActiveClassroomId] = useState<string>(() => {
    const saved = localStorage.getItem("klasse_active_classroom_id");
    return saved || "class-1";
  });

  // Derived state for the active Classroom
  const activeClassroom = classrooms.find((c) => c.id === activeClassroomId) || classrooms[0] || {
    id: "class-1",
    name: "Clase Inicial",
    institution: "Institución",
    schedule: "Horario",
    minGrade: 0,
    maxGrade: 10,
    passingGrade: 6,
    periodType: "trimestre",
    periodName: "Trimestre 1 Escolar",
    activities: [
      { id: "exam1", name: "Examen 1", weight: 30 },
      { id: "homework1", name: "Tarea 1", weight: 20 },
      { id: "exam2", name: "Examen 2", weight: 30 },
      { id: "project", name: "Proyecto", weight: 20 }
    ],
    students: []
  };

  const students = activeClassroom.students;

  // State dispatcher shim so list mutations operate on the active classroom transparently
  const setStudents = (updater: React.SetStateAction<Student[]>) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === activeClassroom.id) {
          const nextStudents = typeof updater === "function" 
            ? (updater as (prev: Student[]) => Student[])(c.students) 
            : updater;
          return { ...c, students: nextStudents };
        }
        return c;
      })
    );
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("klasse_settings");
    const defaults = {
      googleDriveSynced: false,
      lastSyncDate: null,
      notificationsEnabled: true,
      academicYear: "2026 - Ciclo Activo",
      offlineMode: true,
      dangerZoneActive: false,
      theme: "bauhaus",
      teacherName: "Iván Solarte"
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Classroom handlers
  const handleSelectClassroom = (classroomId: string) => {
    setActiveClassroomId(classroomId);
    setSelectedStudentId(null);
  };

  const handleCreateClassroom = (
    name: string, 
    institution: string, 
    schedule: string,
    minGrade: number = 0,
    maxGrade: number = 10,
    passingGrade: number = 6,
    periodType: "trimestre" | "semestre" | "año" | "periodo" = "trimestre",
    periodName: string = "Trimestre 1 Escolar"
  ) => {
    const newClassroom: Classroom = {
      id: `class-${Date.now()}`,
      name,
      institution,
      schedule,
      minGrade,
      maxGrade,
      passingGrade,
      periodType,
      periodName,
      activities: [
        { id: "exam1", name: "Examen 1", weight: 30 },
        { id: "homework1", name: "Tarea 1", weight: 20 },
        { id: "exam2", name: "Examen 2", weight: 30 },
        { id: "project", name: "Proyecto", weight: 20 }
      ],
      students: [],
      activityNames: { exam1: "Examen 1", homework1: "Tarea 1", exam2: "Examen 2", project: "Proyecto" },
      activityWeights: { exam1: 30, homework1: 20, exam2: 30, project: 20 }
    };
    setClassrooms((prev) => [...prev, newClassroom]);
    setActiveClassroomId(newClassroom.id);
    setSelectedStudentId(null);
    setCurrentTab("grades"); // Direct navigation to Grades to configure activity weighting!
    addSystemNotification(`Clase "${name}" creada con éxito`, "success");
  };

  const handleUpdateClassroom = (
    classroomId: string, 
    name: string, 
    institution: string, 
    schedule: string,
    minGrade: number,
    maxGrade: number,
    passingGrade: number,
    activities: GradeActivity[],
    periodType: "trimestre" | "semestre" | "año" | "periodo",
    periodName: string
  ) => {
    setClassrooms((prev) =>
      prev.map((c) => {
        if (c.id === classroomId) {
          const actNamesOld = {
            exam1: activities[0]?.name ?? "Examen 1",
            homework1: activities[1]?.name ?? "Tarea 1",
            exam2: activities[2]?.name ?? "Examen 2",
            project: activities[3]?.name ?? "Proyecto"
          };
          const actWeightsOld = {
            exam1: activities[0]?.weight ?? 30,
            homework1: activities[1]?.weight ?? 20,
            exam2: activities[2]?.weight ?? 30,
            project: activities[3]?.weight ?? 20
          };
          return { 
            ...c, 
            name, 
            institution, 
            schedule,
            minGrade,
            maxGrade,
            passingGrade,
            activities,
            periodType,
            periodName,
            activityNames: actNamesOld,
            activityWeights: actWeightsOld
          };
        }
        return c;
      })
    );
    addSystemNotification("Datos de la materia escolar actualizados correctamente", "success");
  };

  const handleDeleteClassroom = (classroomId: string) => {
    const remaining = classrooms.filter(c => c.id !== classroomId);
    setClassrooms(remaining);

    // Switch active classroom if current is deleted
    if (remaining.length > 0) {
      if (activeClassroomId === classroomId) {
        setActiveClassroomId(remaining[0].id);
        setSelectedStudentId(null);
      }
    } else {
      setActiveClassroomId("");
      setSelectedStudentId(null);
    }
    addSystemNotification("Materia purgada con éxito del panel docente", "warning");
  };

  // ==========================================
  // Google Drive Authentication & Sync Engine
  // ==========================================
  const [googleUser, setGoogleUser] = useState<any | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isDriveSyncing, setIsDriveSyncing] = useState(false);
  const [driveSyncLogs, setDriveSyncLogs] = useState<string[]>([]);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        console.log(`[Firebase Auth] Active session: ${user.email}`);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Silent automatic background backup callback
  const triggerSilentBackup = async () => {
    if (!googleToken) return;
    try {
      await uploadBackupToDrive(googleToken, students, classrooms);
      console.log("[Google Drive AutoSync] Respaldo automático completado.");
    } catch (e) {
      console.error("[Google Drive AutoSync Error] Silent backup failed:", e);
    }
  };

  // Sync to local storage & auto upload
  useEffect(() => {
    localStorage.setItem("klasse_classrooms", JSON.stringify(classrooms));
    if (settings.googleDriveSynced && googleToken) {
      triggerSilentBackup();
    }
  }, [classrooms]);

  useEffect(() => {
    localStorage.setItem("klasse_active_classroom_id", activeClassroomId);
  }, [activeClassroomId]);

  useEffect(() => {
    localStorage.setItem("klasse_settings", JSON.stringify(settings));
  }, [settings]);

  // Manual Trigger: Google Drive Backup
  const triggerRealBackup = async (customToken?: string) => {
    const activeToken = customToken || googleToken;
    if (!activeToken) {
      addSystemNotification("Inicie sesión con su cuenta de Google para respaldar en la nube", "warning");
      return;
    }
    
    setIsDriveSyncing(true);
    setDriveSyncLogs(["🔄 Abriendo conexión OAuth 2.0 segura...", "🔑 Validando alcances de Google Drive en Workspace..."]);
    
    try {
      setDriveSyncLogs(prev => [...prev, "📦 Empaquetando árbol JSON de alumnos y ponderaciones..."]);
      const result = await uploadBackupToDrive(activeToken, students, classrooms);
      
      if (result.success) {
        setDriveSyncLogs(prev => [
          ...prev, 
          "📤 Archivo de datos 'klasse_backup.json' cargado exitosamente.",
          `✓ Sincronización finalizada con éxito a las ${result.lastSyncDate}`
        ]);
        
        setSettings(prev => ({
          ...prev,
          googleDriveSynced: true,
          lastSyncDate: result.lastSyncDate
        }));
        
        addSystemNotification("Copia de seguridad enviada a Google Drive con éxito", "success");
      }
    } catch (e: any) {
      console.error(e);
      setDriveSyncLogs(prev => [...prev, `❌ Error en copia: ${e.message || e}`]);
      addSystemNotification("No se pudo completar el respaldo en la nube", "warning");
    } finally {
      setIsDriveSyncing(false);
    }
  };

  // Manual Trigger: Google Drive Restore
  const triggerRealRestore = async () => {
    if (!googleToken) {
      addSystemNotification("Inicie sesión con su cuenta de Google para restaurar los datos", "warning");
      return;
    }

    setIsDriveSyncing(true);
    setDriveSyncLogs(["🔄 Conectando con Google Drive...", "🔍 Buscando copias de seguridad activas en Workspace..."]);

    try {
      const data = await downloadBackupFromDrive(googleToken);
      if (!data) {
        setDriveSyncLogs(prev => [
          ...prev, 
          "⚠ Ninguna copia activa ('klasse_backup.json') localizada en su Google Drive."
        ]);
        addSystemNotification("No se encontró ningún respaldo compatible en Drive", "warning");
        return;
      }

      if (data.classrooms && Array.isArray(data.classrooms)) {
        setClassrooms(data.classrooms);
        if (data.classrooms.length > 0) {
          setActiveClassroomId(data.classrooms[0].id);
        }
        setDriveSyncLogs(prev => [
          ...prev,
          "✓ Archivo con clases múltiples descargado e interpretado correctamente.",
          `📥 Se restauraron ${data.classrooms.length} clases y registros desde la nube.`
        ]);
        addSystemNotification(`Copia de seguridad de clases restaurada (${data.classrooms.length} clases)`, "success");
      } else if (data.students && Array.isArray(data.students)) {
        setClassrooms([
          {
            id: "class-1",
            name: "Matemáticas e Idiomas IA",
            institution: "Liceo Experimental",
            schedule: "Lun, Mié y Vie — 08:00 a 10:00",
            minGrade: 0,
            maxGrade: 10,
            passingGrade: 6,
            activityNames: { exam1: "Examen 1", homework1: "Tarea 1", exam2: "Examen 2", project: "Proyecto" },
            activityWeights: { exam1: 30, homework1: 20, exam2: 30, project: 20 },
            students: data.students
          }
        ]);
        setActiveClassroomId("class-1");
        setDriveSyncLogs(prev => [
          ...prev,
          "✓ Archivo descargado e interpretado en esquema heredado correctamente.",
          `📥 Se restauraron ${data.students.length} alumnos en la clase inicial.`
        ]);
        addSystemNotification(`Copia de seguridad restaurada (${data.students.length} alumnos)`, "success");
      } else {
        throw new Error("El archivo JSON del respaldo tiene un formato incompatible.");
      }
    } catch (e: any) {
      console.error(e);
      setDriveSyncLogs(prev => [...prev, `❌ Error en restauración: ${e.message || e}`]);
      addSystemNotification("Error integrando archivo recibido de la nube", "warning");
    } finally {
      setIsDriveSyncing(false);
    }
  };

  const triggerGoogleLogin = async () => {
    try {
      addSystemNotification("Abriendo selector de cuentas Google...", "info");
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        addSystemNotification(`Sesión iniciada: ${res.user.displayName || res.user.email}`, "success");
        
        if (settings.googleDriveSynced) {
          triggerRealBackup(res.accessToken);
        }
      }
    } catch (e: any) {
      console.error(e);
      addSystemNotification("El inicio de sesión fue cancelado o falló", "warning");
    }
  };

  const triggerGoogleLogout = async () => {
    try {
      await googleSignOut();
      setGoogleUser(null);
      setGoogleToken(null);
      addSystemNotification("Sesión educativa de Google cerrada correctamente", "info");
    } catch (e: any) {
      console.error(e);
    }
  };

  // ==========================================
  // Notification Mechanism
  // ==========================================
  interface SystemNotification {
    id: string;
    text: string;
    type: "info" | "success" | "warning";
  }
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const addSystemNotification = (text: string, type: "info" | "success" | "warning" = "info") => {
    if (!settings.notificationsEnabled) return;
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, text, type }]);

    // auto dismiss
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // ==========================================
  // Database Mutators and Handlers
  // ==========================================
  
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [newStudent, ...prev]);
  };

  const handleAddBatchStudents = (batchList: Student[]) => {
    setStudents((prev) => [...batchList, ...prev]);
  };

  const handleRemoveStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    addSystemNotification("Estudiante removido de forma definitiva", "warning");
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
    }
  };

  const handleUpdateAttendance = (updatedList: Student[]) => {
    setStudents(updatedList);
  };

  const handleUpdateStudentGrades = (studentId: string, updatedGrades: Student["grades"]) => {
    setStudents((prev) => 
      prev.map((s) => (s.id === studentId ? { ...s, grades: updatedGrades } : s))
    );
  };

  const handleUpdateStudentFields = (studentId: string, updatedFields: Partial<Student>) => {
    setStudents((prev) => 
      prev.map((s) => (s.id === studentId ? { ...s, ...updatedFields } : s))
    );
  };

  // observations log addition
  const handleAddBehaviorLog = (studentId: string, log: BehaviorLog, pointsChange: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          points: Math.max(0, (s.points || 0) + pointsChange),
          behaviorLogs: [log, ...s.behaviorLogs]
        };
      })
    );
  };

  const handleRemoveBehaviorLog = (studentId: string, logId: string, pointsRefund: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          points: Math.max(0, (s.points || 0) - pointsRefund),
          behaviorLogs: s.behaviorLogs.filter((b) => b.id !== logId)
        };
      })
    );
  };

  const handleResetDatabase = () => {
    // Purgar y restablecer
    setClassrooms([
      {
        id: "class-1",
        name: "Matemáticas e Idiomas IA",
        institution: "Liceo Experimental",
        schedule: "Lun, Mié y Vie — 08:00 a 10:00",
        minGrade: 0,
        maxGrade: 10,
        passingGrade: 6,
        periodType: "trimestre",
        periodName: "Trimestre 1 Escolar",
        activities: [
          { id: "exam1", name: "Examen 1", weight: 30 },
          { id: "homework1", name: "Tarea 1", weight: 20 },
          { id: "exam2", name: "Examen 2", weight: 30 },
          { id: "project", name: "Proyecto", weight: 20 }
        ],
        activityNames: { exam1: "Examen 1", homework1: "Tarea 1", exam2: "Examen 2", project: "Proyecto" },
        activityWeights: { exam1: 30, homework1: 20, exam2: 30, project: 20 },
        students: initialStudents
      }
    ]);
    setActiveClassroomId("class-1");
    setSelectedStudentId(null);
    setCurrentTab("dashboard");
    addSystemNotification("Base de datos de clases y alumnos restablecida de fábrica", "success");
  };

  // Find currently selected student
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Quick helper to dismiss toast click
  const dismissToast = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div id="app-container" className={`min-h-screen bg-[#F5F5F0] text-[#1A1A1A] flex flex-col md:flex-row antialiased theme-${settings.theme || 'bauhaus'}`}>
      
      {/* SIDEBAR NAVIGATION (Modern Bauhaus Rail Column) */}
      <aside className="w-full md:w-64 bg-white border-b-4 md:border-b-0 md:border-r-4 border-[#1A1A1A] p-6 flex flex-col justify-between">
        <div className="space-y-8">
          
          {/* Logo Brand Title */}
          <div className="border-4 border-[#1A1A1A] bg-bauhaus-yellow p-4 neo-shadow relative select-none">
            <h1 className="text-3xl font-black tracking-widest text-[#1A1A1A] flex items-center justify-between">
              KLASSE <span className="text-xs bg-[#1A1A1A] text-white py-0.5 px-2 font-mono font-bold rotate-[5deg]">V1</span>
            </h1>
            <p className="text-[10px] font-mono tracking-tighter text-[#1A1A1A] mt-1 font-black uppercase">
              // CONTROL ESCOLAR INTEGRAL
            </p>
          </div>

          {/* Active class indicator box in Sidebar */}
          <div className="bg-[#1A1A1A] text-white p-3.5 neo-border-thin font-mono text-xs space-y-1">
            <p className="text-gray-400 text-[9px] uppercase font-bold tracking-widest">// CLASE ACTIVA</p>
            <p className="font-sans font-black text-xs uppercase text-bauhaus-yellow truncate" title={activeClassroom.name}>
              {activeClassroom.name}
            </p>
            <p className="text-[9px] text-gray-300 truncate" title={activeClassroom.institution}>🏫 {activeClassroom.institution}</p>
            <p className="text-[9px] text-gray-400 truncate" title={activeClassroom.schedule}>⏰ {activeClassroom.schedule}</p>
          </div>

          {/* Navigation link stacks */}
          <nav className="space-y-3 font-sans text-xs">
            {[
              { id: "dashboard", label: "Dashboard General", icon: LayoutDashboard },
              { id: "directory", label: "Directorio Alumnos", icon: BookOpen },
              { id: "grades", label: "Calificaciones", icon: Award },
              { id: "register", label: "Registrar Alumno", icon: UserPlus2 },
              { id: "gamification", label: "Gestión de Clase", icon: Users2 },
              { id: "reports", label: "Analíticas y Reportes", icon: BarChart4 },
              { id: "settings", label: "Ajustes del Portal", icon: SettingsIcon },
            ].map((link) => {
              const Icon = link.icon;
              const active = currentTab === link.id;
              
              return (
                <button
                  key={link.id}
                  id={`nav-link-${link.id}`}
                  onClick={() => {
                    setCurrentTab(link.id);
                    if (link.id !== "directory") {
                      setSelectedStudentId(null);
                    }
                  }}
                  className={`w-full text-left p-3 font-black uppercase neo-border-thin flex items-center gap-3 transition-colors cursor-pointer select-none ${
                    active 
                      ? "bg-bauhaus-yellow text-[#1A1A1A] neo-shadow-yellow transform translate-x-[-2px] translate-y-[-2px] border-2 border-black" 
                      : "bg-white text-gray-700 hover:bg-[#F5F5F0] hover:text-[#1A1A1A]"
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 text-[#1A1A1A]" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Brand visual credits footnotes */}
        <div className="pt-8 border-t-2 border-[#1A1A1A] mt-8 font-mono text-[9px] text-gray-500 space-y-1.5 uppercase select-none">
          <div className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-bauhaus-blue" />
            <span>Soporte nube: {settings.googleDriveSynced ? "Sincronizado" : "Local"}</span>
          </div>
          <div className="flex items-center gap-1 text-[#1A1A1A] font-bold">
            <Heart className="w-3.5 h-3.5 text-bauhaus-red fill-bauhaus-red" />
            <span>Form Follows Function</span>
          </div>
          <p>© 2026 • KLASSE PORTAL</p>
          <p className="text-[#1A1A1A] font-black tracking-wider text-[10px] mt-1">{settings.teacherName || "Iván Solarte"}</p>
        </div>
      </aside>

      {/* MAIN VIEWPORT BODY PANEL */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full overflow-x-hidden space-y-8">
        
        {/* Top Header Indicators */}
        <header className="hidden md:flex justify-between items-center border-b-2 border-gray-200 pb-4 select-none">
          <div className="flex items-center gap-4 text-xs font-mono text-gray-600">
            <span>PERIODO: <strong>{settings.academicYear}</strong></span>
            <span className="border-l border-gray-300 pl-4">MATERIA EN GESTIÓN: <strong className="text-bauhaus-blue uppercase">{activeClassroom.name}</strong></span>
            <span className="border-l border-gray-300 pl-4">ALUMNOS: <strong>{students.length}</strong></span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 font-mono text-[10px] py-1 px-3 neo-border-thin bg-emerald-50 text-emerald-800`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              <span>EMERGENCIA LOCAL: 100% OK</span>
            </div>
          </div>
        </header>

        {/* Tab route loading layouts */}
        <div className="min-h-[70vh] pb-12">
          {classrooms.length === 0 && currentTab !== "settings" ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto bg-white neo-border p-8 neo-shadow text-center space-y-6"
            >
              <div className="w-16 h-16 bg-bauhaus-yellow border-2 border-black flex items-center justify-center font-black text-2xl mx-auto neo-shadow select-none">
                !
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase text-black">¡Bienvenido al Portal KLASSE!</h2>
                <p className="font-mono text-xs text-gray-500 uppercase leading-relaxed">
                  Para empezar a usar el programa de control pedagógico debe añadir su primera materia o clase, o bien restaurar una copia desde Google Drive en Ajustes.
                </p>
              </div>

              {/* Simple inline creation form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const name = fd.get("c_name") as string;
                  const inst = fd.get("c_inst") as string;
                  const sched = fd.get("c_sched") as string;
                  if (name && inst && sched) {
                    handleCreateClassroom(name, inst, sched, 0, 10, 6, "trimestre", "Trimestre I 2026");
                  }
                }}
                className="space-y-4 text-left font-mono text-xs border-y-2 border-dashed border-black py-5 my-4"
              >
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Nombre de la Materia:</label>
                  <input
                    type="text"
                    name="c_name"
                    required
                    placeholder="Ej. Matemáticas e Idiomas IA"
                    className="w-full bg-[#F5F5F0] border-2 border-black p-2 outline-none focus:bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1 font-mono">Institución Educativa:</label>
                  <input
                    type="text"
                    name="c_inst"
                    required
                    placeholder="Ej. Liceo Experimental"
                    className="w-full bg-[#F5F5F0] border-2 border-black p-2 outline-none focus:bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1 font-mono">Horario y Días:</label>
                  <input
                    type="text"
                    name="c_sched"
                    required
                    placeholder="Ej. Lun, Mié y Vie — 08:00 a 10:00"
                    className="w-full bg-[#F5F5F0] border-2 border-black p-2 outline-none focus:bg-amber-50"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-bauhaus-blue text-white font-black uppercase rounded-sm border-2 border-black shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-blue-700 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 cursor-pointer transition-all text-center block"
                  >
                    ➕ Añadir Clase Inicial
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentTab("settings")}
                    className="w-full py-2 bg-white text-black font-black uppercase rounded-sm border-2 border-black hover:bg-gray-50 cursor-pointer text-center block"
                  >
                    ⚙️ IR A AJUSTES (RESTAURAR DESDE DRIVE)
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <>
              {currentTab === "dashboard" && (
                <Dashboard 
                  students={students} 
                  setCurrentTab={setCurrentTab} 
                  setSelectedStudentId={setSelectedStudentId}
                  addSystemNotification={addSystemNotification}
                  classrooms={classrooms}
                  activeClassroomId={activeClassroomId}
                  onSelectClassroom={handleSelectClassroom}
                  onCreateClassroom={handleCreateClassroom}
                  onUpdateClassroom={handleUpdateClassroom}
                  onDeleteClassroom={handleDeleteClassroom}
                  settings={settings}
                  googleUser={googleUser}
                  isSyncing={isDriveSyncing}
                  onManualBackup={() => triggerRealBackup()}
                />
              )}

              {currentTab === "directory" && (
                selectedStudentId && selectedStudent ? (
                  /* Drilling down to Profile detail view inside Directory tab space */
                  <StudentProfile 
                    student={selectedStudent} 
                    onClose={() => setSelectedStudentId(null)}
                    onUpdateStudentGrades={handleUpdateStudentGrades}
                    onAddBehaviorLog={handleAddBehaviorLog}
                    onRemoveBehaviorLog={handleRemoveBehaviorLog}
                    addSystemNotification={addSystemNotification}
                  />
                ) : (
                  /* Core list view matrix */
                  <StudentDirectory 
                    students={students} 
                    onSelectStudent={(id) => setSelectedStudentId(id)}
                    onRemoveStudent={handleRemoveStudent}
                    addSystemNotification={addSystemNotification}
                  />
                )
              )}

              {currentTab === "grades" && (
                <GradesManagement 
                  students={students}
                  activeClassroom={activeClassroom}
                  onUpdateStudentGrades={handleUpdateStudentGrades}
                  onUpdateClassroom={handleUpdateClassroom}
                  onUpdateStudent={handleUpdateStudentFields}
                  addSystemNotification={addSystemNotification}
                />
              )}

              {currentTab === "register" && (
                <StudentRegister 
                  onAddStudent={handleAddStudent}
                  onAddBatchStudents={handleAddBatchStudents}
                  addSystemNotification={addSystemNotification}
                  activeClassroom={activeClassroom}
                />
              )}

              {currentTab === "gamification" && (
                <ClassManagement 
                  students={students} 
                  onUpdateAttendance={handleUpdateAttendance}
                  onAwardPoints={handleAddBehaviorLog}
                  addSystemNotification={addSystemNotification}
                />
              )}

              {currentTab === "reports" && (
                <Reports 
                  students={students} 
                  activeClassroom={activeClassroom}
                  addSystemNotification={addSystemNotification}
                />
              )}

              {currentTab === "settings" && (
                <SettingsComponent 
                  settings={settings}
                  onUpdateSettings={setSettings}
                  onResetDatabase={handleResetDatabase}
                  addSystemNotification={addSystemNotification}
                  googleUser={googleUser}
                  onGoogleLogin={triggerGoogleLogin}
                  onGoogleLogout={triggerGoogleLogout}
                  isSyncing={isDriveSyncing}
                  syncLogs={driveSyncLogs}
                  onManualBackup={() => triggerRealBackup()}
                  onManualRestore={triggerRealRestore}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* SYSTEM TOAST NOTIFICATIONS DRAWER - FLOATING BOTTOM RIGHT Corner */}
      <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none max-w-sm w-full" id="floating-notifications">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              onClick={() => dismissToast(notif.id)}
              className="pointer-events-auto bg-white neo-border p-4 neo-shadow flex items-start gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className={`mt-0.5 p-1 neo-border-thin flex-shrink-0 ${
                notif.type === "success" 
                  ? "bg-bauhaus-green text-white" 
                  : notif.type === "warning"
                  ? "bg-bauhaus-red text-white"
                  : "bg-bauhaus-blue text-white"
              }`}>
                {notif.type === "success" ? (
                  <Award className="w-4 h-4" />
                ) : notif.type === "warning" ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs font-black uppercase text-[#1A1A1A]">
                  {notif.type === "success" ? "ÉXITO" : notif.type === "warning" ? "ATENCIÓN / ALERTA" : "NOTIFICACIÓN"}
                </p>
                <p className="font-mono text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                  {notif.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
