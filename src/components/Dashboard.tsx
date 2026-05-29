import React, { useMemo, useState } from "react";
import { Student, Classroom, GradeActivity } from "../types";
import { 
  Users, 
  Award, 
  Percent, 
  GraduationCap, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  ArrowRight,
  PlusCircle, 
  Share2,
  FileCheck2,
  Volume2,
  School,
  Clock,
  BookOpen,
  Trash2,
  Edit3,
  X,
  Lock,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardProps {
  students: Student[];
  setCurrentTab: (tab: string) => void;
  setSelectedStudentId: (id: string | null) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  classrooms: Classroom[];
  activeClassroomId: string;
  onSelectClassroom: (classroomId: string) => void;
  onCreateClassroom: (
    name: string, 
    institution: string, 
    schedule: string,
    minGrade: number,
    maxGrade: number,
    passingGrade: number,
    periodType: "trimestre" | "semestre" | "año" | "periodo",
    periodName: string
  ) => void;
  onUpdateClassroom: (
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
  ) => void;
  onDeleteClassroom: (classroomId: string) => void;
  settings?: any;
  googleUser?: any;
  isSyncing?: boolean;
  onManualBackup?: () => void;
}

export default function Dashboard({ 
  students, 
  setCurrentTab, 
  setSelectedStudentId, 
  addSystemNotification,
  classrooms,
  activeClassroomId,
  onSelectClassroom,
  onCreateClassroom,
  onUpdateClassroom,
  onDeleteClassroom,
  settings,
  googleUser,
  isSyncing,
  onManualBackup
}: DashboardProps) {
  
  // Local state for classroom creation
  const [newClassName, setNewClassName] = useState("");
  const [newClassInst, setNewClassInst] = useState("");
  const [newClassSchedule, setNewClassSchedule] = useState("");
  const [newClassMaxGrade, setNewClassMaxGrade] = useState<number>(10);
  const [newClassPassingGrade, setNewClassPassingGrade] = useState<number>(6);
  const [newClassPeriodType, setNewClassPeriodType] = useState<"trimestre" | "semestre" | "año" | "periodo">("trimestre");
  const [newClassPeriodName, setNewClassPeriodName] = useState("Trimestre I 2026");
  const [isAddingClass, setIsAddingClass] = useState(false);

  // States to facilitate editing classroom
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);
  const [editName, setEditName] = useState("");
  const [editInst, setEditInst] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editMaxGrade, setEditMaxGrade] = useState<number>(10);
  const [editPassingGrade, setEditPassingGrade] = useState<number>(6);
  const [editPeriodType, setEditPeriodType] = useState<"trimestre" | "semestre" | "año" | "periodo">("trimestre");
  const [editPeriodName, setEditPeriodName] = useState("");

  // States to facilitate double confirmation delete
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [deleteTypedConfirm, setDeleteTypedConfirm] = useState("");

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassInst.trim() || !newClassSchedule.trim() || !newClassPeriodName.trim()) {
      addSystemNotification("Por favor rellene todos los campos para crear la clase", "warning");
      return;
    }
    if (newClassMaxGrade <= 0 || newClassPassingGrade <= 0) {
      addSystemNotification("Las notas deben ser mayores que cero", "warning");
      return;
    }
    if (newClassPassingGrade > newClassMaxGrade) {
      addSystemNotification("La nota mínima de aprobación no puede exceder la nota máxima", "warning");
      return;
    }

    onCreateClassroom(
      newClassName.trim(), 
      newClassInst.trim(), 
      newClassSchedule.trim(),
      0, // min grade is always 0
      newClassMaxGrade,
      newClassPassingGrade,
      newClassPeriodType,
      newClassPeriodName.trim()
    );

    setNewClassName("");
    setNewClassInst("");
    setNewClassSchedule("");
    setNewClassMaxGrade(10);
    setNewClassPassingGrade(6);
    setNewClassPeriodType("trimestre");
    setNewClassPeriodName("Trimestre I 2026");
    setIsAddingClass(false);
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editName.trim() || !editInst.trim() || !editSchedule.trim() || !editPeriodName.trim()) {
      addSystemNotification("Por favor rellene los campos obligatorios", "warning");
      return;
    }
    if (editPassingGrade > editMaxGrade) {
      addSystemNotification("La nota de aprobación no puede ser superior al límite máximo", "warning");
      return;
    }

    onUpdateClassroom(
      editingClass.id,
      editName.trim(),
      editInst.trim(),
      editSchedule.trim(),
      0, // min
      editMaxGrade,
      editPassingGrade,
      editingClass.activities || [],
      editPeriodType,
      editPeriodName.trim()
    );

    setEditingClass(null);
  };

  const handleConfirmDeleteClass = () => {
    if (!deletingClassId) return;
    if (deleteTypedConfirm.trim() !== "BORRAR") {
      addSystemNotification("Debe escribir exactamente 'BORRAR' para confirmar la eliminación de la clase", "warning");
      return;
    }

    onDeleteClassroom(deletingClassId);
    setDeletingClassId(null);
    setDeleteTypedConfirm("");
  };

  const activeClassroom: Classroom = classrooms.find(c => c.id === activeClassroomId) || classrooms[0] || {
    id: "class-1",
    name: "Clase Inicial",
    institution: "Institución",
    schedule: "Horario",
    minGrade: 0,
    maxGrade: 10,
    passingGrade: 6,
    periodType: "trimestre",
    periodName: "Trimestre I 2026",
    activities: [
      { id: "exam1", name: "Examen 1", weight: 30 },
      { id: "homework1", name: "Tarea 1", weight: 20 },
      { id: "exam2", name: "Examen 2", weight: 30 },
      { id: "project", name: "Proyecto", weight: 20 }
    ],
    students: []
  };
  
  // Memoized general statistics
  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter(s => s.status === "Activo").length;
    
    // Calculates average of students based on their activity weights
    let totalScoreSum = 0;
    let studentsWithGrades = 0;
    
    students.forEach(s => {
      if (s.status === "Activo") {
        const { exam1, exam2, homework1, project } = s.grades;
        const wE1 = activeClassroom.activityWeights?.exam1 ?? 30;
        const wH1 = activeClassroom.activityWeights?.homework1 ?? 20;
        const wE2 = activeClassroom.activityWeights?.exam2 ?? 30;
        const wP = activeClassroom.activityWeights?.project ?? 20;

        const weightedAvg = ((exam1 * wE1) + (homework1 * wH1) + (exam2 * wE2) + (project * wP)) / 100;
        totalScoreSum += weightedAvg;
        studentsWithGrades++;
      }
    });
    
    const classAvg = studentsWithGrades > 0 ? (totalScoreSum / studentsWithGrades) : 0;
    
    // Calculate average attendance percentage
    let totalDays = 0;
    let presentDays = 0;
    
    students.forEach(s => {
      if (s.attendance) {
        s.attendance.forEach(day => {
          totalDays++;
          if (day.status === "presente") {
            presentDays++;
          } else if (day.status === "tarde") {
            presentDays += 0.5;
          }
        });
      }
    });
    
    const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;
    const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);

    return {
      total,
      active,
      classAvg: Number(classAvg.toFixed(2)),
      attendancePct: Number(attendancePct.toFixed(1)),
      totalPoints
    };
  }, [students, activeClassroom]);

  // Students below passing score threshold or with attendance/behavior alerts
  const priorityAlerts = useMemo(() => {
    const passingMark = activeClassroom.passingGrade || 6;
    
    interface AlertItem {
      student: any;
      avg: number;
      criticalBehaviors: number;
      attendancePct: number;
      totalSessions: number;
      alerts: string[];
      riskScore: number;
    }

    const list: AlertItem[] = [];
    
    students.forEach(s => {
      // 1. Calculate academic metrics
      const wE1 = activeClassroom.activityWeights?.exam1 ?? 30;
      const wH1 = activeClassroom.activityWeights?.homework1 ?? 20;
      const wE2 = activeClassroom.activityWeights?.exam2 ?? 30;
      const wP = activeClassroom.activityWeights?.project ?? 20;
      const { exam1, homework1, exam2, project } = s.grades;
      const avg = ((exam1 * wE1) + (homework1 * wH1) + (exam2 * wE2) + (project * wP)) / 100;
      
      const gradedActivities = Object.values(s.grades).filter(g => g > 0).length;
      
      // 2. Calculate attendance metrics
      const totalSessions = s.attendance ? s.attendance.length : 0;
      const presentCount = s.attendance ? s.attendance.filter(a => a.status === "presente").length : 0;
      const tardyCount = s.attendance ? s.attendance.filter(a => a.status === "tarde").length : 0;
      const attendancePct = totalSessions > 0 ? ((presentCount + tardyCount * 0.5) / totalSessions) * 105 : 100;
      
      // 3. Behavior logs
      const criticalBehaviors = s.behaviorLogs ? s.behaviorLogs.filter(b => b.type === "critico").length : 0;
      
      const alerts: string[] = [];
      let riskScore = 0;
      
      // Rule A: Academic risk
      // Only triggers if student has at least 1 actual evaluation score registered and avg < passingMark
      if (gradedActivities > 0 && avg < passingMark) {
        alerts.push("Académica");
        riskScore += (passingMark - avg) * 10;
      }
      
      // Rule B: Attendance risk
      // Only triggers if there is a minimum representation of 5 sessions registered and attendance is low (< 80%)
      if (totalSessions >= 5 && attendancePct < 80) {
        alerts.push("Inasistencia");
        riskScore += (80 - attendancePct) * 1.5;
      }
      
      // Rule C: Behavioral risk
      if (criticalBehaviors > 0) {
        alerts.push("Comportamiento");
        riskScore += criticalBehaviors * 5;
      }
      
      if (alerts.length > 0) {
        list.push({
          student: s,
          avg,
          criticalBehaviors,
          attendancePct,
          totalSessions,
          alerts,
          riskScore
        });
      }
    });
    
    return list
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 3);
  }, [students, activeClassroom]);

  // Interactive local quick notes list
  const [quickNotes, setQuickNotes] = React.useState<string[]>([
    "Revisar bitácoras de laboratorio del grupo C",
    "Evaluar informes de investigación pendientes",
    "Llamar al acudiente de Tomás Riquelme por ausencias reiteradas"
  ]);

  const [newNoteText, setNewNoteText] = React.useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setQuickNotes([...quickNotes, newNoteText.trim()]);
    setNewNoteText("");
    addSystemNotification("Recordatorio añadido de forma local", "success");
  };

  const handleRemoveNote = (index: number) => {
    const updated = quickNotes.filter((_, i) => i !== index);
    setQuickNotes(updated);
    addSystemNotification("Recordatorio completado", "info");
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    let greet = "Buenos días";
    if (hr >= 12 && hr < 19) {
      greet = "Buenas tardes";
    } else if (hr >= 19 || hr < 6) {
      greet = "Buenas noches";
    }
    const fullName = settings?.teacherName || "Iván Solarte";
    const firstName = fullName.trim().split(/\s+/)[0] || "Profe";
    return `${greet} profe, ${firstName}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
      id="klasse-dashboard"
    >
      {/* Welcome Banner */}
      <div className="bg-[#F5F5F0] neo-border p-6 neo-shadow relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-24 h-24 bg-bauhaus-yellow -mr-10 -mt-10 rotate-45 neo-border-thin opacity-30 pointer-events-none"></div>
        <div>
          <span className="bg-[#1A1A1A] text-white px-3 py-1 font-mono text-xs uppercase tracking-widest font-bold">
            AULA VIRTUAL DOCENTE • {getGreeting()}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 uppercase">
            SISTEMA DE GESTIÓN KLASSE
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl font-mono italic">
            "Donde la excelencia pedagógica se encuentra con la organización escolar moderna."
          </p>
        </div>
        <div className="flex flex-wrap gap-2 z-10">
          <button 
            id="shortcut-wheel"
            onClick={() => setCurrentTab("gamification")}
            className="neo-btn bg-bauhaus-yellow text-[#1A1A1A] px-4 py-2 text-xs font-black uppercase neo-border neo-shadow flex items-center gap-2 hover:bg-[#F3A600] cursor-pointer"
          >
            <Volume2 className="w-4 h-4" /> RU_LETA DE CONTROL
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Indicator Bar */}
      {googleUser ? (
        <div className="bg-white neo-border p-4 neo-shadow flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs select-none">
          <div className="flex items-center gap-3">
            <div className={`w-3.5 h-3.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-spin border-2 border-black' : settings?.googleDriveSynced ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'} inline-block`}></div>
            <div className="space-y-0.5">
              <span className="font-extrabold uppercase text-[10px] tracking-wider text-gray-500 block">Sincronización de Respaldo G-Drive</span>
              <span className="text-gray-800 font-bold uppercase">
                {isSyncing 
                  ? "Sincronizando cambios con Google Drive..." 
                  : settings?.googleDriveSynced 
                    ? `✓ Conectado a la Nube (Reg: ${settings?.lastSyncDate || 'Reciente'})` 
                    : "Conexión en Local — Respaldo pendiente"
                }
              </span>
            </div>
          </div>
          <button
            onClick={onManualBackup}
            disabled={isSyncing}
            className={`neo-btn text-[10px] px-3.5 py-2 font-black uppercase neo-border neo-shadow flex items-center gap-1.5 transition-colors cursor-pointer bg-bauhaus-yellow text-black hover:bg-amber-400`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} /> Sincronizar información ahora
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF8F5] border-2 border-dashed border-gray-300 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs select-none text-zinc-700">
          <div className="flex items-center gap-2">
            <span className="bg-[#1A1A1A] text-white font-mono px-2 py-0.5 text-[9px] uppercase">LOCAL</span>
            <span>Usa KLASSE en local. Vincula Google Drive en Ajustes para respaldos en la nube.</span>
          </div>
          <button
            onClick={() => setCurrentTab("settings")}
            className="text-[10px] font-bold uppercase underline hover:text-bauhaus-blue cursor-pointer"
          >
            Configurar Respaldos →
          </button>
        </div>
      )}

      {/* Classroom management widget */}
      <div className="bg-white neo-border p-6 neo-shadow space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-4 border-[#1A1A1A] pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-bauhaus-blue text-white p-2.5 neo-border-thin">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase">Gestión de Clases & Materias</h2>
              <p className="font-mono text-[10px] text-gray-500 uppercase mt-0.5">
                Crea, edita o elimina materias escolares. Configura el rango de notas único para cada salón.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingClass(!isAddingClass)}
            className="neo-btn bg-bauhaus-yellow text-black py-2 px-4 neo-border neo-shadow text-xs font-bold uppercase hover:bg-[#F3A600] cursor-pointer flex items-center gap-1.5 self-start md:self-auto font-black"
          >
            {isAddingClass ? "✖ Cancelar" : "➕ Nueva Clase"}
          </button>
        </div>

        {isAddingClass && (
          <motion.form 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateClass}
            className="bg-[#F5F5F0] neo-border p-5 space-y-4"
          >
            <p className="font-mono text-xs font-black uppercase text-bauhaus-blue">// Configurar Parámetros Nueva Aula</p>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Materia / Clase</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Matemáticas C1"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none focus:bg-amber-50"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Institución</label>
                <input
                  type="text"
                  required
                  placeholder="Colegio Distrital"
                  value={newClassInst}
                  onChange={(e) => setNewClassInst(e.target.value)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-1">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Horario de Clase</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lun y Mié — 8:00 - 10:00"
                  value={newClassSchedule}
                  onChange={(e) => setNewClassSchedule(e.target.value)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-1">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Nota Máxima</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="1"
                  placeholder="Ej. 10.0 o 5.0"
                  value={newClassMaxGrade}
                  onChange={(e) => setNewClassMaxGrade(parseFloat(e.target.value) || 10)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-1">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Nota Aprobatoria</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  min="0.5"
                  placeholder="Ej. 6.0 o 3.0"
                  value={newClassPassingGrade}
                  onChange={(e) => setNewClassPassingGrade(parseFloat(e.target.value) || 6)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              {/* Academic periods controls as requested */}
              <div className="space-y-1.5 col-span-1 md:col-span-3">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Estructura de Periodo</label>
                <select
                  value={newClassPeriodType}
                  onChange={(e) => {
                    const type = e.target.value as "trimestre" | "semestre" | "año" | "periodo";
                    setNewClassPeriodType(type);
                    if (type === "trimestre") setNewClassPeriodName("Trimestre I 2026");
                    else if (type === "semestre") setNewClassPeriodName("Primer Semestre 2026");
                    else if (type === "año") setNewClassPeriodName("Ciclo Lectivo Anual 2026");
                    else setNewClassPeriodName("Periodo Especial 2026");
                  }}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none cursor-pointer"
                >
                  <option value="trimestre">Trimestral (Trimestre)</option>
                  <option value="semestre">Semestral (Semestre)</option>
                  <option value="año">Anual (Año)</option>
                  <option value="periodo">Personalizado (Periodo)</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-4">
                <label className="block font-mono text-[10px] font-bold uppercase text-[#1A1A1A]">Nombre / Descriptor del Periodo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Primer Trimestre 2026"
                  value={newClassPeriodName}
                  onChange={(e) => setNewClassPeriodName(e.target.value)}
                  className="w-full bg-white neo-border-thin px-3 py-2 text-xs font-mono outline-none focus:bg-amber-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="neo-btn bg-[#1A1A1A] text-white py-2 px-5 neo-border-thin text-xs font-black uppercase hover:bg-emerald-600 cursor-pointer"
              >
                🔨 Crear Clase y Salón
              </button>
            </div>
          </motion.form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classrooms.map((cls) => {
            const isActive = cls.id === activeClassroomId;
            return (
              <div
                key={cls.id}
                onClick={() => {
                  onSelectClassroom(cls.id);
                  addSystemNotification(`Has cambiado a la clase: ${cls.name}`, "info");
                }}
                className={`neo-border p-4 transition-all relative select-none flex flex-col justify-between cursor-pointer group ${
                  isActive 
                    ? "bg-bauhaus-yellow/15 border-2 border-black neo-shadow-yellow" 
                    : "bg-[#F5F5F0]/50 hover:bg-[#F5F5F0]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider font-bold bg-[#1A1A1A] text-white px-2 py-0.5">
                      {cls.students.length} Alumnos
                    </span>
                    
                    {/* Inline actions inside the Classroom switcher card */}
                    <div className="flex items-center gap-1 z-15" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Modificar parámetros"
                        onClick={() => {
                          setEditingClass(cls);
                          setEditName(cls.name);
                          setEditInst(cls.institution);
                          setEditSchedule(cls.schedule);
                          setEditMaxGrade(cls.maxGrade || 10);
                          setEditPassingGrade(cls.passingGrade || 6);
                          setEditPeriodType(cls.periodType || "trimestre");
                          setEditPeriodName(cls.periodName || "Trimestre I 2026");
                        }}
                        className="p-1 bg-white hover:bg-bauhaus-blue hover:text-white border border-[#1A1A1A] rounded-sm transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        title="Eliminar clase"
                        onClick={() => {
                          setDeletingClassId(cls.id);
                          setDeleteTypedConfirm("");
                        }}
                        className="p-1 bg-white hover:bg-bauhaus-red hover:text-white border border-[#1A1A1A] rounded-sm transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-sans font-black text-sm uppercase text-[#1A1A1A] group-hover:text-bauhaus-blue transition-colors">
                    {cls.name}
                  </h3>
                  
                  <div className="mt-2 space-y-1 text-[11px] font-mono text-gray-600">
                    <p className="flex items-center gap-1.5 truncate">
                      <School className="w-3.5 h-3.5 flex-shrink-0" /> {cls.institution}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" /> {cls.schedule}
                    </p>
                    <p className="text-[9px] font-black uppercase text-emerald-700">
                      Rango: 0.0 - {cls.maxGrade || 10} | Aprobación: {cls.passingGrade || 6}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-[#1A1A1A]/10 flex justify-between items-center">
                  <span className="text-[9px] font-mono font-bold uppercase text-gray-500">Materia Escolar</span>
                  <span className="text-[10px] font-mono font-black text-[#1A1A1A] group-hover:translate-x-1 transition-transform uppercase flex items-center gap-1">
                    Gestionar <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDIT MODAL OVERLAY FOR CLASSROOMS */}
      <AnimatePresence>
        {editingClass && (
          <div className="fixed inset-0 bg-[#1A1A1A]/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white neo-border p-6 max-w-lg w-full relative neo-shadow"
            >
              <button 
                onClick={() => setEditingClass(null)}
                className="absolute top-4 right-4 p-1 rounded-full border border-black hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-black pb-2 flex items-center gap-2">
                <School className="w-5 h-5 text-bauhaus-blue" /> Actualizar Datos de Materia
              </h3>

              <form onSubmit={handleSaveEditClass} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="block font-black uppercase text-gray-700 mb-1">Nombre de la Clase</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block font-black uppercase text-gray-700 mb-1">Centro Educativo / Institución</label>
                  <input
                    type="text"
                    required
                    value={editInst}
                    onChange={(e) => setEditInst(e.target.value)}
                    className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block font-black uppercase text-gray-700 mb-1">Horario General</label>
                  <input
                    type="text"
                    required
                    value={editSchedule}
                    onChange={(e) => setEditSchedule(e.target.value)}
                    className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black uppercase text-gray-700 mb-1">Nota Máxima</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="1"
                      value={editMaxGrade}
                      onChange={(e) => setEditMaxGrade(parseFloat(e.target.value) || 10)}
                      className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase text-gray-700 mb-1">Nota Aprobatoria</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0.1"
                      value={editPassingGrade}
                      onChange={(e) => setEditPassingGrade(parseFloat(e.target.value) || 6)}
                      className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black uppercase text-gray-700 mb-1">Estructura del Periodo</label>
                    <select
                      value={editPeriodType}
                      onChange={(e) => {
                        const type = e.target.value as "trimestre" | "semestre" | "año" | "periodo";
                        setEditPeriodType(type);
                        if (type === "trimestre") setEditPeriodName("Trimestre I 2026");
                        else if (type === "semestre") setEditPeriodName("Primer Semestre 2026");
                        else if (type === "año") setEditPeriodName("Ciclo Lectivo Anual 2026");
                        else setEditPeriodName("Periodo Especial 2026");
                      }}
                      className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50 cursor-pointer"
                    >
                      <option value="trimestre">Trimestral (Trimestre)</option>
                      <option value="semestre">Semestral (Semestre)</option>
                      <option value="año">Anual (Año)</option>
                      <option value="periodo">Personalizado (Periodo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black uppercase text-gray-700 mb-1 font-mono">Nombre del Periodo</label>
                    <input
                      type="text"
                      required
                      value={editPeriodName}
                      onChange={(e) => setEditPeriodName(e.target.value)}
                      className="w-full bg-white neo-border p-2 focus:outline-none focus:bg-amber-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="bg-white border-2 border-black py-2 px-4 text-xs font-black uppercase hover:bg-zinc-100 cursor-pointer"
                  >
                    Salir
                  </button>
                  <button
                    type="submit"
                    className="bg-bauhaus-yellow border-2 border-black py-2 px-5 text-xs font-black uppercase hover:bg-amber-400 cursor-pointer"
                  >
                    Guardar Parámetros
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE EXTRA CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingClassId && (
          <div className="fixed inset-0 bg-red-900/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-4 border-red-600 p-6 max-w-md w-full relative neo-shadow"
            >
              <h3 className="text-xl font-black text-rose-700 uppercase mb-3 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-rose-700" /> ¡Advertencia Crítica!
              </h3>
              
              <p className="text-xs font-mono text-gray-700 uppercase leading-relaxed mb-4">
                Estás a punto de borrar de forma permanente la clase <strong className="text-black bg-rose-100 px-1">"{classrooms.find(c => c.id === deletingClassId)?.name}"</strong>. Se perderán de manera irreversible todos los alumnos asociados, fichas de asistencia e historiales de notas.
              </p>

              <div className="bg-rose-50 border-2 border-dashed border-rose-300 p-3 mb-4 text-[11px] font-mono text-rose-800">
                <p className="font-extrabold mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> MÉTODO DE DOBLE CONFIRMACIÓN:
                </p>
                <p>Escribe la palabra <span className="bg-red-200 text-red-900 font-black px-1 uppercase">BORRAR</span> exactamente abajo para autorizar la acción:</p>
              </div>

              <input
                type="text"
                placeholder="Escribe BORRAR..."
                value={deleteTypedConfirm}
                onChange={(e) => setDeleteTypedConfirm(e.target.value)}
                className="w-full bg-[#FAF8F5] border-2 border-black p-2.5 font-mono text-sm tracking-widest text-center uppercase focus:outline-none mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDeletingClassId(null);
                    setDeleteTypedConfirm("");
                  }}
                  className="bg-white border-2 border-black py-2 px-4 text-xs font-black font-mono uppercase hover:bg-zinc-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteClass}
                  disabled={deleteTypedConfirm !== "BORRAR"}
                  className={`py-2 px-4 text-xs font-black font-mono uppercase border-2 border-black transition-colors ${
                    deleteTypedConfirm === "BORRAR"
                      ? "bg-rose-600 text-white cursor-pointer hover:bg-rose-700"
                      : "bg-gray-200 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed"
                  }`}
                >
                  BORRAR DEFINITIVAMENTE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Metrics Row (4 Bauhaus Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white neo-border p-5 neo-shadow relative flex flex-col justify-between group overflow-hidden">
          <div className="absolute right-3 top-3 bg-[#1A1A1A] text-white p-2 neo-border-thin group-hover:bg-bauhaus-yellow group-hover:text-black transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500 font-bold">Estudiantes</p>
            <h3 className="text-4xl font-black mt-2">{stats.total}</h3>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A] flex justify-between items-center text-xs font-mono">
            <span className="text-gray-600">Activos: <strong className="text-black">{stats.active}</strong></span>
            <span className="bg-[#1A1A1A]/10 px-2 py-0.5 font-bold">Inscritos</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white neo-border p-5 neo-shadow relative flex flex-col justify-between group overflow-hidden">
          <div className="absolute right-3 top-3 bg-bauhaus-blue text-white p-2 neo-border-thin">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500 font-bold">Promedio Curso</p>
            <h3 className="text-4xl font-black mt-2 text-bauhaus-blue">{stats.classAvg}</h3>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A] flex justify-between items-center text-xs font-mono">
            <span className="text-gray-600">Rango: 0.0 - {activeClassroom.maxGrade || 10}</span>
            <span className={`px-2 py-0.5 font-bold ${stats.classAvg >= (activeClassroom.passingGrade || 6) ? 'bg-bauhaus-green text-white' : 'bg-bauhaus-red text-white'}`}>
              {stats.classAvg >= (activeClassroom.passingGrade || 6) ? "Aprobado" : "Bajo Rendimiento"}
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white neo-border p-5 neo-shadow relative flex flex-col justify-between group overflow-hidden">
          <div className="absolute right-3 top-3 bg-[#1A1A1A] text-white p-2 neo-border-thin">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500 font-bold">Asistencia General</p>
            <h3 className="text-4xl font-black mt-2">{stats.attendancePct}%</h3>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A] flex justify-between items-center text-xs font-mono">
            <span className="text-gray-600">Meta: 90.0%</span>
            <span className="bg-bauhaus-green text-white px-2 py-0.5 font-bold">Estable</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white neo-border p-5 neo-shadow relative flex flex-col justify-between group overflow-hidden">
          <div className="absolute right-3 top-3 bg-bauhaus-yellow text-black p-2 neo-border-thin">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-gray-500 font-bold">Total Puntos Extra</p>
            <h3 className="text-4xl font-black mt-2 text-bauhaus-yellow-600">{stats.totalPoints} pts</h3>
          </div>
          <div className="mt-4 pt-3 border-t-2 border-[#1A1A1A] flex justify-between items-center text-xs font-mono">
            <span className="text-gray-600">Puntos Karma</span>
            <span className="bg-[#1A1A1A] text-white px-2 py-0.5 font-bold">Registros</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Risk Alerts & Interactive Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Priority Alerts - Left Col 7 */}
        <div className="lg:col-span-7 bg-white neo-border p-6 neo-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-4 border-[#1A1A1A] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-bauhaus-red text-white p-2 neo-border-thin">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black uppercase">Alertas de Atención Primaria</h3>
              </div>
              <span className="bg-bauhaus-red text-white px-2 py-0.5 text-xs font-mono font-bold">
                Bajo Rendimiento
              </span>
            </div>

            <p className="text-xs font-mono text-gray-500 mb-4 font-bold">
              Estudiantes identificados de forma automática con calificaciones promedio inferiores a la nota aprobadora ({activeClassroom.passingGrade || 6}) del salón actualmente activo.
            </p>

            <div className="space-y-4">
              {priorityAlerts.map(({ student, avg, criticalBehaviors, attendancePct, totalSessions, alerts }) => {
                const parts = student.name.split(",");
                const namePart = parts[1] ? parts[1].trim() : student.name.trim();
                const init = namePart[0]?.toUpperCase() || "?";

                return (
                  <div 
                    key={student.id}
                    id={`alert-card-${student.id}`}
                    className="bg-[#F5F5F0] neo-border p-4 neo-shadow relative hover:bg-white transition-all group duration-200"
                  >
                    <div className="absolute top-0 right-0 bg-[#1A1A1A] text-white font-mono text-[9px] px-3 py-1 font-bold uppercase tracking-wider">
                      {alerts.join(" | ")}
                    </div>
                    <div className="flex items-start gap-4">
                      {/* Avatar initial or image */}
                      {student.avatar && student.avatar.startsWith("http") ? (
                        <img 
                          src={student.avatar} 
                          alt={student.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 neo-border object-cover bg-amber-50 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      {(!student.avatar || !student.avatar.startsWith("http")) ? (
                        <div className="w-12 h-12 bg-bauhaus-blue text-white flex items-center justify-center font-black text-lg neo-border select-none rounded-sm">
                          {init}
                        </div>
                      ) : (
                        <div style={{ display: 'none' }} className="w-12 h-12 bg-bauhaus-blue text-white flex items-center justify-center font-black text-lg neo-border select-none rounded-sm">
                          {init}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-md truncate group-hover:text-bauhaus-blue transition-colors uppercase">
                          {student.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          Atención de seguimiento requerida en cátedra y registro
                        </p>
                      
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="bg-[#1A1A1A] text-white text-xs font-mono px-2 py-0.5 font-bold">
                            MEDIA: {avg.toFixed(2)} / {activeClassroom.maxGrade || 10}
                          </span>
                          {totalSessions > 0 && (
                            <span className={`text-xs font-mono px-2 py-0.5 font-bold ${attendancePct < 80 ? 'bg-bauhaus-red text-white' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                              ASISTENCIA: {attendancePct.toFixed(0)}% ({totalSessions} s)
                            </span>
                          )}
                          {criticalBehaviors > 0 && (
                            <span className="bg-bauhaus-red text-white text-xs font-mono px-2 py-0.5 font-bold">
                              OBSERVACIONES: {criticalBehaviors} CRÍTICAS
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Drilldown action shortcuts */}
                    <div className="mt-4 pt-3 border-t border-[#1A1A1A]/10 flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setCurrentTab("directory");
                        }}
                        className="bg-white border-2 border-black hover:bg-[#1A1A1A] hover:text-white text-[10px] uppercase font-bold py-1 px-3"
                      >
                        Ver Perfil Detallado →
                      </button>
                    </div>
                  </div>
                );
              })}

              {priorityAlerts.length === 0 && (
                <div className="bg-[#F5F5F0] neo-border p-8 text-center text-gray-500 font-mono text-sm">
                  ✓ NO SE DETECTARON ALUMNOS BAJO EL MÍNIMO REQUERIDO HOY. ¡EXCELENTE DESEMPEÑO!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Notepad Column - Right Col 5 */}
        <div className="lg:col-span-5 bg-white neo-border p-6 neo-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-4 border-[#1A1A1A] pb-4 mb-4">
              <h3 className="text-xl font-black uppercase flex items-center gap-2">
                <Calendar className="w-5 h-5 text-bauhaus-blue" /> Agenda del Día
              </h3>
              <span className="bg-[#1A1A1A] text-white py-0.5 px-2 text-[10px] font-mono leading-relaxed">
                {new Date().toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric' })}
              </span>
            </div>
            
            <p className="text-xs font-mono text-gray-500 mb-4 font-bold">
              Bloc de recordatorios rápidos local. Toca un elemento para marcarlo como resuelto y purgarlo de la agenda del día.
            </p>

            <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
              <input 
                type="text" 
                placeholder="Añadir pendiente docente hoy..." 
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-white neo-border-thin p-2 text-xs font-mono focus:outline-none focus:bg-amber-50"
              />
              <button 
                id="btn-add-note"
                type="submit" 
                className="neo-btn bg-[#1A1A1A] text-white px-3 py-2 neo-border-thin font-bold hover:bg-gray-800 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {quickNotes.map((note, index) => (
                <div 
                  key={index}
                  onClick={() => handleRemoveNote(index)}
                  className="bg-white neo-border-thin p-3 neo-shadow-yellow text-xs font-mono flex items-center justify-between cursor-pointer hover:bg-red-50 hover:border-red-500 group transition-all duration-200"
                >
                  <span className="line-clamp-2 pr-2 text-gray-700 group-hover:line-through group-hover:text-red-500">
                    {note}
                  </span>
                  <span className="bg-[#1A1A1A] text-white text-[10px] uppercase font-bold py-0.5 px-2 group-hover:bg-red-500">
                    COMPLETAR
                  </span>
                </div>
              ))}

              {quickNotes.length === 0 && (
                <div className="bg-white neo-border-thin p-8 text-center text-gray-500 font-mono text-xs">
                  Aún no tienes tareas agregadas para hoy. ¡Todo al día!
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-dashed border-[#1A1A1A] text-[10px] font-mono text-gray-500 text-center">
            KLASSE V.1.0 • Gestión Escolar Activa • Almacenamiento Local Seguro
          </div>
        </div>
      </div>

      {/* Classroom Quick Stats / Tips */}
      <div className="bg-white neo-border p-6 neo-shadow">
        <h3 className="font-extrabold uppercase text-lg border-b-2 border-black pb-2 mb-4 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-bauhaus-blue" />
          Protocolos Docentes y Atajos Rápidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
          <div className="p-4 bg-[#F5F5F0] neo-border-thin">
            <h4 className="font-bold text-bauhaus-blue uppercase mb-1">Copiado y Rápido de Roster</h4>
            <p className="text-gray-600 leading-relaxed">
              Registra alumnos de forma masiva copiando y pegando tus listados directamente en la sección <strong className="text-black">"Registrar Alumno"</strong>. Ofrece soportes de orientación para que nombres y apellidos encajen perfectamente en tu libro oficial.
            </p>
          </div>
          <div className="p-4 bg-[#F5F5F0] neo-border-thin">
            <h4 className="font-bold text-bauhaus-yellow-600 uppercase mb-1">Acuerdo de Calificaciones</h4>
            <p className="text-gray-600 leading-relaxed">
              Establece las ponderaciones acordadas en los primeros días con tus cursos. Puedes modificar dinámicamente el nombre de la prueba e inmediatamente corregir cualquier nota ingresada haciendo doble clic.
            </p>
          </div>
          <div className="p-4 bg-[#F5F5F0] neo-border-thin">
            <h4 className="font-bold text-bauhaus-red uppercase mb-1">Asistencia Escolar</h4>
            <p className="text-gray-600 leading-relaxed">
              Mantén el control de ausencias en la pestaña <strong className="text-black">"Gestión de Clase"</strong>. Registra de forma diaria si el estudiante llegó tarde, estuvo ausente o presente, con estadísticas consolidadas.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
