import React, { useState, useMemo } from "react";
import { Student, AttendanceRecord, BehaviorLog, Group, Subject } from "../types";
import { BEHAVIOR_CATALOG } from "../data/mockData";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserSquare2, 
  Dices, 
  Award, 
  Coins, 
  Calendar,
  Share2,
  Trash2,
  User,
  Users2,
  Zap,
  Volume2,
  Printer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Maximize2,
  Minimize2,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClassManagementProps {
  students: Student[];
  onUpdateAttendance: (updatedStudents: Student[]) => void;
  onAwardPoints: (studentId: string, log: BehaviorLog, pointsChange: number) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
}

export default function ClassManagement({
  students,
  onUpdateAttendance,
  onAwardPoints,
  addSystemNotification
}: ClassManagementProps) {

  // Sub-tabs: attendance, randomWheel, groupGenerator, rewardsPanel, pomodoro
  const [activeSubTab, setActiveSubTab] = useState<"attendance" | "wheel" | "groups" | "behaviors" | "pomodoro">("attendance");

  // Pomodoro Timer States
  const [pomodoroMode, setPomodoroMode] = useState<"trabajo" | "corto" | "largo">("trabajo");
  const [customWorkMin, setCustomWorkMin] = useState<number>(25);
  const [customShortMin, setCustomShortMin] = useState<number>(5);
  const [customLongMin, setCustomLongMin] = useState<number>(15);
  const [pomodoroTime, setPomodoroTime] = useState<number>(25 * 60); // initially 25 min
  const [pomodoroActive, setPomodoroActive] = useState<boolean>(false);
  const [pomodoroCycles, setPomodoroCycles] = useState<number>(0);
  const [pomodoroTask, setPomodoroTask] = useState<string>("");

  // Classroom Timer & Stopwatch States
  const [activeTimerTool, setActiveTimerTool] = useState<"pomodoro" | "classroom_timer">("pomodoro");
  const [classroomTimerType, setClassroomTimerType] = useState<"countdown" | "stopwatch">("countdown");
  const [classroomTimerActive, setClassroomTimerActive] = useState<boolean>(false);
  const [classroomTimerSeconds, setClassroomTimerSeconds] = useState<number>(10 * 60);
  const [classroomTimerInputMin, setClassroomTimerInputMin] = useState<number>(10);
  const [classroomTimerTask, setClassroomTimerTask] = useState<string>("Lectura Silenciosa");
  const [projectorModeActive, setProjectorModeActive] = useState<boolean>(false);
  const [projectorTheme, setProjectorTheme] = useState<"dark" | "light" | "bauhaus">("dark");

  React.useEffect(() => {
    let interval: any = null;
    if (classroomTimerActive) {
      interval = setInterval(() => {
        setClassroomTimerSeconds((prev) => {
          if (classroomTimerType === "countdown") {
            if (prev <= 1) {
              clearInterval(interval);
              setClassroomTimerActive(false);

              // Sound alert
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const playBeep = (freq: number, startTime: number, duration: number) => {
                  const osc = ctx.createOscillator();
                  const gain = ctx.createGain();
                  osc.type = "sine";
                  osc.frequency.setValueAtTime(freq, startTime);
                  gain.gain.setValueAtTime(0.15, startTime);
                  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration - 0.05);
                  osc.connect(gain);
                  gain.connect(ctx.destination);
                  osc.start(startTime);
                  osc.stop(startTime + duration);
                };
                playBeep(660, ctx.currentTime, 0.15);
                playBeep(660, ctx.currentTime + 0.2, 0.15);
                playBeep(880, ctx.currentTime + 0.4, 0.4);
              } catch (err) {
                console.log("AudioContext blocked or unavailable", err);
              }

              addSystemNotification(`⏰ El tiempo para "${classroomTimerTask || "Actividad Escolar"}" ha finalizado correctamente.`, "success");
              return 0;
            }
            return prev - 1;
          } else {
            // stopwatch: goes up
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [classroomTimerActive, classroomTimerType, classroomTimerTask]);

  React.useEffect(() => {
    let interval: any = null;
    if (pomodoroActive) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPomodoroActive(false);

            // Play retro sound Synthesizer using AudioContext
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
              osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.3);
              gain.gain.setValueAtTime(0.12, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.5);
            } catch (err) {
              console.log("Audio not allowed yet or unsupported", err);
            }

            // Determine next mode
            let nextMode: "trabajo" | "corto" | "largo" = "trabajo";
            let nextSeconds = customWorkMin * 60;
            let message = "";

            if (pomodoroMode === "trabajo") {
              const nextCycles = pomodoroCycles + 1;
              setPomodoroCycles(nextCycles);
              if (nextCycles % 4 === 0) {
                nextMode = "largo";
                nextSeconds = customLongMin * 60;
                message = "🎯 ¡Excelente! Ciclo de trabajo de Pomodoro completado. Toma un descanso largo de " + customLongMin + " minutos.";
              } else {
                nextMode = "corto";
                nextSeconds = customShortMin * 60;
                message = "🎯 ¡Buen trabajo! Ciclo de trabajo de Pomodoro completado. Toma un descanso corto de " + customShortMin + " minutos.";
              }
            } else {
              nextMode = "trabajo";
              nextSeconds = customWorkMin * 60;
              message = "⏰ ¡El descanso ha terminado! De vuelta al trabajo enfocado.";
            }

            setPomodoroMode(nextMode);
            setPomodoroTime(nextSeconds);
            addSystemNotification(message, "success");
            return nextSeconds;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroMode, customWorkMin, customShortMin, customLongMin, pomodoroCycles]);

  const handleUpdateDuration = (mode: "trabajo" | "corto" | "largo", mins: number) => {
    const val = Math.max(1, Math.min(180, mins));
    if (mode === "trabajo") {
      setCustomWorkMin(val);
      if (pomodoroMode === "trabajo") setPomodoroTime(val * 60);
    } else if (mode === "corto") {
      setCustomShortMin(val);
      if (pomodoroMode === "corto") setPomodoroTime(val * 60);
    } else if (mode === "largo") {
      setCustomLongMin(val);
      if (pomodoroMode === "largo") setPomodoroTime(val * 60);
    }
  };

  const setFixedMode = (mode: "trabajo" | "corto" | "largo") => {
    setPomodoroActive(false);
    setPomodoroMode(mode);
    if (mode === "trabajo") setPomodoroTime(customWorkMin * 60);
    else if (mode === "corto") setPomodoroTime(customShortMin * 60);
    else if (mode === "largo") setPomodoroTime(customLongMin * 60);
  };

  const handleAwardClassPomodoroBonus = () => {
    if (activeStudents.length === 0) {
      addSystemNotification("No hay estudiantes activos para premiar.", "warning");
      return;
    }

    activeStudents.forEach((student) => {
      const logObj: BehaviorLog = {
        id: `pomodoro-bonus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        date: new Date().toISOString().split("T")[0],
        type: "positivo",
        tag: "Enfoque Profundo",
        description: pomodoroTask 
          ? `Ciclo de Pomodoro enfocado en: "${pomodoroTask}"` 
          : "Ciclo de Pomodoro de clase completado con éxito.",
        points: 5
      };
      onAwardPoints(student.id, logObj, 5);
    });

    addSystemNotification(`🎯 ¡Exitoso! Se ha otorgado +5 puntos de karma de "Enfoque Profundo" a todos los ${activeStudents.length} alumnos activos del aula.`, "success");
  };

  // Filter students active list (to work purely on present pupils)
  const activeStudents = useMemo(() => students.filter(s => s.status === "Activo"), [students]);

  // ==========================================
  // Attendance Subsystem
  // ==========================================
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Temporary state for attendance logging
  const [tempAttendance, setTempAttendance] = useState<Record<string, "presente" | "ausente" | "tarde">>({});

  // Sync tempAttendance whenever attendanceDate, students, or classroom changes
  React.useEffect(() => {
    const records: Record<string, "presente" | "ausente" | "tarde"> = {};
    activeStudents.forEach(s => {
      const savedRecord = s.attendance?.find(a => a.date === attendanceDate);
      records[s.id] = savedRecord ? savedRecord.status : "presente";
    });
    setTempAttendance(records);
  }, [attendanceDate, students, activeStudents]);

  const handleGlobalAttendance = (status: "presente" | "ausente" | "tarde") => {
    const updated = { ...tempAttendance };
    activeStudents.forEach(s => {
      updated[s.id] = status;
    });
    setTempAttendance(updated);
    addSystemNotification(`Se marcaron todos como ${status.toUpperCase()}`, "info");
  };

  const handleSingleAttendance = (studentId: string, status: "presente" | "ausente" | "tarde") => {
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = () => {
    const updatedStudents = students.map(student => {
      if (student.status === "Inactivo") return student;
      const status = tempAttendance[student.id] || "presente";
      
      // Check if date already exists in history, if so update it, otherwise append
      const history = student.attendance ? [...student.attendance] : [];
      const existingIdx = history.findIndex(h => h.date === attendanceDate);

      const record: AttendanceRecord = { date: attendanceDate, status };
      if (existingIdx >= 0) {
        history[existingIdx] = record;
      } else {
        history.push(record);
      }

      return {
        ...student,
        attendance: history
      };
    });

    onUpdateAttendance(updatedStudents);
    addSystemNotification(`Registro de asistencia del ${attendanceDate} guardada perfectamente`, "success");
  };

  // Computed unique dates representing saved sessions:
  const savedSessions = useMemo(() => {
    const dateSet = new Set<string>();
    activeStudents.forEach(s => {
      if (s.attendance) {
        s.attendance.forEach(a => {
          dateSet.add(a.date);
        });
      }
    });
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a)); // sorted descending (newest first)
  }, [activeStudents]);


  // ==========================================
  // Ruleta de Participación (Random Picker & Dialog Award)
  // ==========================================
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState("");
  const [selectedWheelStudent, setSelectedWheelStudent] = useState<Student | null>(null);
  const [selectedRewardIdx, setSelectedRewardIdx] = useState(0);
  const [customRewardDesc, setCustomRewardDesc] = useState("");

  const spinWheel = () => {
    if (activeStudents.length === 0) {
      addSystemNotification("No hay estudiantes activos para girar la ruleta", "warning");
      return;
    }
    setIsSpinning(true);
    setSelectedWheelStudent(null);
    setCustomRewardDesc("");

    let ticks = 0;
    const maxTicks = 20;
    const intervalTime = 100;

    const runTick = () => {
      const randomStudent = activeStudents[Math.floor(Math.random() * activeStudents.length)];
      setSpinningName(randomStudent.name);
      ticks++;

      if (ticks < maxTicks) {
        setTimeout(runTick, intervalTime + (ticks * 15)); // decay speed
      } else {
        // Selection complete
        setIsSpinning(false);
        const finalStudent = activeStudents[Math.floor(Math.random() * activeStudents.length)];
        setSpinningName(finalStudent.name);
        setSelectedWheelStudent(finalStudent);
        addSystemNotification(`Estudiante seleccionado: ${finalStudent.name}`, "success");
      }
    };

    runTick();
  };

  const handleApplyWheelReward = () => {
    if (!selectedWheelStudent) return;
    const catalogItem = BEHAVIOR_CATALOG[selectedRewardIdx];

    const newLog: BehaviorLog = {
      id: `log-wheel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      type: catalogItem.type as any,
      tag: catalogItem.tag,
      points: catalogItem.points,
      description: customRewardDesc.trim() || `Puntos otorgados vía Ruleta de Participación bajo rúbrica '${catalogItem.text}'`
    };

    onAwardPoints(selectedWheelStudent.id, newLog, catalogItem.points);
    addSystemNotification(`Se asignaron ${catalogItem.points > 0 ? '+' : ''}${catalogItem.points} Karma a ${selectedWheelStudent.name}`, "success");
    setSelectedWheelStudent(null); // Close modal
  };


  // ==========================================
  // Smart Group Generator
  // ==========================================
  const [groupSize, setGroupSize] = useState(3);
  const [groupStrategy, setGroupStrategy] = useState<"random" | "academic">("random");
  const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);

  const handleGenerateGroups = () => {
    if (activeStudents.length < 2) {
      addSystemNotification("Insuficientes estudiantes activos para confeccionar grupos", "warning");
      return;
    }

    let listToGroup = [...activeStudents];

    if (groupStrategy === "academic") {
      // Sort by average grade so we can distribute evenly (Heterogeneous Grouping Strategy)
      listToGroup.sort((a, b) => {
        const avgA = (a.grades.exam1 + a.grades.exam2 + a.grades.homework1 + a.grades.project) / 4;
        const avgB = (b.grades.exam1 + b.grades.exam2 + b.grades.homework1 + b.grades.project) / 4;
        return avgA - avgB;
      });
    } else {
      // Fully random shuffle
      listToGroup.sort(() => Math.random() - 0.5);
    }

    const totalGroupsCount = Math.ceil(listToGroup.length / groupSize);
    const result: Student[][] = Array.from({ length: totalGroupsCount }, () => []);

    // Round-robin distribution
    listToGroup.forEach((std, index) => {
      const targetGroupIdx = index % totalGroupsCount;
      result[targetGroupIdx].push(std);
    });

    setGeneratedGroups(result);
    addSystemNotification(`Se han generado ${totalGroupsCount} grupos de trabajo balanceados`, "success");
  };


  // ==========================================
  // Direct Behavior Awards Autocomplete Panel
  // ==========================================
  const [selectedDirectStd, setSelectedDirectStd] = useState<string>(activeStudents[0]?.id || "");
  const [selectedDirectReward, setSelectedDirectReward] = useState<number>(0);
  const [directDescription, setDirectDescription] = useState("");

  const handleApplyDirectReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDirectStd) {
      addSystemNotification("Debe seleccionar un estudiante para valorar", "warning");
      return;
    }

    const catalogItem = BEHAVIOR_CATALOG[selectedDirectReward];
    const targetStudent = activeStudents.find(s => s.id === selectedDirectStd);
    if (!targetStudent) return;

    const newLog: BehaviorLog = {
      id: `log-direct-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      type: catalogItem.type as any,
      tag: catalogItem.tag,
      points: catalogItem.points,
      description: directDescription.trim() || `Valoración directa: ${catalogItem.text}`
    };

    onAwardPoints(selectedDirectStd, newLog, catalogItem.points);
    addSystemNotification(`Calificación de conducta aplicada exitosamente a ${targetStudent.name}`, "success");
    
    // reset notes
    setDirectDescription("");
  };


  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Tab Switch Headers */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <Users2 className="w-8 h-8 text-bauhaus-blue" />
            GESTIÓN DE CLASE Y LÚDICA
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Control de asistencia, herramientas lúdicas, ruleta de participación y agrupador cooperativo.
          </p>
        </div>

        {/* Small switches sub tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1.5 neo-border">
          {[
            { id: "attendance", label: "📄 CONTROL ASISTENCIA", icon: Calendar },
            { id: "wheel", label: "🎡 RULETA PARTICIPACIÓN", icon: Volume2 },
            { id: "groups", label: "🎲 GENERADOR DE GRUPOS", icon: Dices },
            { id: "behaviors", label: "★ HISTORIAL Y CONDUCTAS", icon: Zap },
            { id: "pomodoro", label: "⏱️ POMODORO ENFOQUE", icon: Clock }
          ].map((item) => {
            const Icon = item.icon;
            const active = activeSubTab === item.id;
            return (
              <button 
                key={item.id}
                id={`subtab-${item.id}`}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`px-3 py-2 text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer ${
                  active 
                    ? "bg-[#1A1A1A] text-white" 
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Tab 1: ATTENDANCE CONTROL */}
      {activeSubTab === "attendance" && (
        <div className="bg-white neo-border p-6 neo-shadow space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-bauhaus-blue" />
              <h3 className="text-lg font-black uppercase">Planilla de Asistencia Diaria</h3>
            </div>
            
            {/* Date Picker Input & Print */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { window.focus(); window.print(); }}
                className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-1.5 px-3 neo-border-thin flex items-center gap-1 text-[11px] font-mono cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-bauhaus-blue font-bold" /> IMPRIMIR ASISTENCIA
              </button>
              <div className="flex items-center gap-2 bg-white neo-border-thin p-1">
                <span className="font-mono text-xs px-2 font-black">FECHA:</span>
                <input 
                  type="date" 
                  id="attendance-date-picker"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="font-mono text-xs focus:outline-none p-1.5"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="font-bold uppercase text-gray-500 mr-2">Acciones Rápidas Globales:</span>
            <button 
              id="btn-attendance-all-present"
              onClick={() => handleGlobalAttendance("presente")}
              className="neo-border-thin px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold uppercase transition-colors cursor-pointer"
            >
              ✓ PRESENTES TODOS
            </button>
            <button 
              id="btn-attendance-all-absent"
              onClick={() => handleGlobalAttendance("ausente")}
              className="neo-border-thin px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 font-bold uppercase transition-colors cursor-pointer"
            >
              × AUSENTES TODOS
            </button>
            <button 
              id="btn-attendance-all-late"
              onClick={() => handleGlobalAttendance("tarde")}
              className="neo-border-thin px-3 py-1 bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold uppercase transition-colors cursor-pointer"
            >
              ⏰ TARDES TODOS
            </button>
          </div>

          {/* Student attendance Checklist table */}
          <div className="neo-border overflow-hidden">
            <table className="w-full text-left font-mono text-xs border-collapse bg-white">
              <thead>
                <tr className="bg-[#1A1A1A] text-white">
                  <th className="p-3 border-r border-gray-700 w-12 text-center bg-zinc-800">N°</th>
                  <th className="p-3 border-r border-gray-700">Estudiante</th>
                  <th className="p-3 border-r border-gray-700 w-44 text-center">Faltas Acumuladas</th>
                  <th className="p-3 text-center w-80">Estado de Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {activeStudents.map((std, idx) => {
                  const currentStatus = tempAttendance[std.id] || "presente";
                  return (
                    <tr key={std.id} className="border-b-2 border-black hover:bg-gray-50">
                      <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-500 bg-[#F5F5F0]">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-gray-300">
                        <div>
                          <p className="font-extrabold text-[#1A1A1A] text-sm uppercase">{std.name}</p>
                          <p className="text-[10px] text-gray-500">{std.email}</p>
                        </div>
                      </td>
                      <td className="p-3 border-r border-gray-300 text-center whitespace-nowrap">
                        {(() => {
                          const absences = std.attendance ? std.attendance.filter(a => a.status === "ausente").length : 0;
                          if (absences === 0) {
                            return <span className="inline-block bg-emerald-50 text-emerald-800 text-[9px] px-2 py-0.5 font-bold border border-emerald-300 rounded-sm">0 INASISTENCIAS</span>;
                          } else if (absences < 3) {
                            return <span className="inline-block bg-amber-50 text-amber-800 text-[9px] px-2 py-0.5 font-bold border border-amber-300 rounded-sm">{absences} SIN JUSTIFICAR</span>;
                          } else {
                            return <span className="inline-block bg-red-100 text-red-800 text-[9px] px-2 py-0.5 font-black border border-red-300 rounded-sm animate-pulse">{absences} ACUMULADAS 🚨</span>;
                          }
                        })()}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex bg-gray-100 p-1 rounded neo-border-thin">
                          {[
                            { val: "presente", label: "Presente", activeBg: "bg-bauhaus-green text-white" },
                            { val: "ausente", label: "Ausente", activeBg: "bg-bauhaus-red text-white" },
                            { val: "tarde", label: "Tarde", activeBg: "bg-bauhaus-yellow text-black" }
                          ].map(item => (
                            <button
                              key={item.val}
                              type="button"
                              id={`attendance-${std.id}-${item.val}`}
                              onClick={() => handleSingleAttendance(std.id, item.val as any)}
                              className={`px-3 py-1 text-[10px] font-bold uppercase transition-all cursor-pointer ${
                                currentStatus === item.val 
                                  ? `${item.activeBg} rounded-sm shadow-inner` 
                                  : "text-gray-500 hover:text-[#1A1A1A]"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t-4 border-[#1A1A1A] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span className="font-mono text-[9px] uppercase tracking-wider text-gray-500">
              * Presione actualizar para guardar de forma persistente.
            </span>
            <button 
              id="btn-save-attendance"
              onClick={handleSaveAttendance}
              className="neo-btn bg-bauhaus-blue text-white py-3 px-6 neo-border neo-shadow font-black uppercase text-xs hover:bg-blue-700 cursor-pointer self-end sm:self-auto"
            >
              💾 ACTUALIZAR PLANILLA DE ASISTENCIA
            </button>
          </div>

          {/* History / Sessions registered list */}
          <div className="pt-6 border-t-4 border-[#1A1A1A]/30 space-y-4">
            <h4 className="font-extrabold text-[#1A1A1A] text-sm uppercase flex items-center gap-1.5">
              <span>📋 Sesiones Registradas Históricas ({savedSessions.length})</span>
            </h4>
            <p className="text-[10px] text-gray-500 font-mono uppercase">
              Selecciona cualquiera de las planillas pasadas para auditar o reconfigurar la asistencia de ese día:
            </p>

            {savedSessions.length === 0 ? (
              <div className="bg-[#F5F5F0] p-4 text-center neo-border text-xs text-gray-500 font-mono uppercase">
                Aún no hay planillas de asistencia guardadas en esta clase.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                {savedSessions.map(dateStr => {
                  const isCurrent = attendanceDate === dateStr;
                  // Compute stats for that day
                  let presentCount = 0;
                  let absentCount = 0;
                  let lateCount = 0;
                  activeStudents.forEach(s => {
                    const record = s.attendance?.find(a => a.date === dateStr);
                    if (record) {
                      if (record.status === "presente") presentCount++;
                      if (record.status === "ausente") absentCount++;
                      if (record.status === "tarde") lateCount++;
                    }
                  });

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        setAttendanceDate(dateStr);
                        addSystemNotification(`Cargadora asistencia del día ${dateStr}`, "info");
                      }}
                      className={`neo-border-thin p-2 text-center cursor-pointer transition-all flex flex-col justify-between ${
                        isCurrent 
                          ? "bg-bauhaus-yellow border-2 border-black font-extrabold neo-shadow-yellow" 
                          : "bg-[#F5F5F0]/70 hover:bg-[#F5F5F0]"
                      }`}
                    >
                      <span className="font-mono text-[11px] font-black">{dateStr}</span>
                      <div className="mt-1.5 flex justify-center gap-1.5 text-[8px] font-mono">
                        <span className="text-emerald-700 bg-emerald-100/50 px-1 font-bold">P:{presentCount}</span>
                        <span className="text-red-700 bg-red-100/50 px-1 font-bold">A:{absentCount}</span>
                        <span className="text-amber-700 bg-amber-100/50 px-1 font-bold">T:{lateCount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Tab 2: RULETA DE PARTICIPACIÓN (RANDOM PICKER) */}
      {activeSubTab === "wheel" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Wheel visual - Left 7 */}
          <div className="md:col-span-7 bg-white neo-border p-6 neo-shadow flex flex-col justify-between min-h-[400px]">
            <div>
              <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
                <Volume2 className="w-5 h-5 text-bauhaus-blue animate-pulse" />
                <h3 className="text-lg font-black uppercase">Ruleta Mecánica de Participación</h3>
              </div>
              <p className="text-xs font-mono text-gray-500 leading-relaxed mb-6">
                Selecciona aleatoriamente a un alumno del curso de forma visual y de alto impacto físico. Premia su participación proactiva vinculándolo al instante con el catálogo de recompensas académicas.
              </p>
            </div>

            {/* Wheel graphic box */}
            <div className="bg-[#F5F5F0] neo-border p-8 text-center relative overflow-hidden flex flex-col justify-center items-center min-h-[220px]">
              
              {/* Spinning background layout effects */}
              <div className={`absolute w-44 h-44 border-8 border-dashed border-[#1A1A1A] rounded-full opacity-10 animate-spin`} style={{ animationDuration: isSpinning ? "1s" : "15s" }}></div>

              <AnimatePresence mode="wait">
                {isSpinning ? (
                  <motion.div 
                    key="spinning"
                    initial={{ scale: 0.9, opacity: 0.5 }}
                    animate={{ scale: 1.1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0.5 }}
                    className="space-y-2 z-10"
                  >
                    <div className="bg-bauhaus-yellow inline-block px-4 py-1 neo-border-thin text-[10px] font-mono font-bold animate-bounce uppercase">
                      🎡 SELECCIONANDO AL AZAR...
                    </div>
                    <h4 className="text-2xl md:text-3xl font-black font-mono tracking-tight text-[#1A1A1A] line-clamp-1">
                      {spinningName}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono">Buscando perfil de retórica del alumno...</p>
                  </motion.div>
                ) : selectedWheelStudent ? (
                  <motion.div 
                    key="selected"
                    initial={{ scale: 0.8, rotate: -2 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="space-y-4 z-10 bg-white neo-border p-6 neo-shadow-yellow-lg max-w-sm"
                  >
                    <span className="bg-bauhaus-green text-white px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider">
                      ★ ESTUDIANTE SELECCIONADO
                    </span>
                    
                    <div className="flex items-center gap-3 pt-2">
                      {selectedWheelStudent.avatar && selectedWheelStudent.avatar.startsWith("http") ? (
                        <img 
                          src={selectedWheelStudent.avatar} 
                          alt={selectedWheelStudent.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 neo-border object-cover bg-amber-50 rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      {(!selectedWheelStudent.avatar || !selectedWheelStudent.avatar.startsWith("http")) ? (
                        <div className="w-12 h-12 bg-bauhaus-blue text-white flex items-center justify-center font-mono font-black text-xs neo-border rounded-full select-none">
                          {selectedWheelStudent.name[0]?.toUpperCase() || "?"}
                        </div>
                      ) : (
                        <div style={{ display: 'none' }} className="w-12 h-12 bg-bauhaus-blue text-white flex items-center justify-center font-mono font-black text-xs neo-border rounded-full select-none">
                          {selectedWheelStudent.name[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <h4 className="font-extrabold text-md text-[#1A1A1A] truncate">{selectedWheelStudent.name}</h4>
                        <p className="text-[10px] text-gray-500 font-mono">Cátedra: {selectedWheelStudent.subject} | Grupo {selectedWheelStudent.group}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-3 z-10">
                    <User className="w-16 h-16 opacity-30 mx-auto" />
                    <div>
                      <p className="font-mono text-xs font-bold uppercase text-gray-600">Ningún estudiante electo en este ciclo</p>
                      <p className="font-mono text-[9px] text-gray-400 mt-1 uppercase">El Picker seleccionará con retroalimentación física</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6 border-t-2 border-dashed border-[#1A1A1A]">
              <button 
                id="btn-spin-wheel"
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full neo-btn bg-bauhaus-yellow text-black py-4 neo-border neo-shadow text-center font-black uppercase text-xs hover:bg-amber-400 cursor-pointer"
              >
                🎰 GIRAR RULETA DINÁMICA
              </button>
            </div>
          </div>

          {/* Award panel - Right 5 */}
          <div className="md:col-span-5 bg-white neo-border p-6 neo-shadow flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                <Award className="w-5 h-5 text-bauhaus-yellow-600" />
                <h3 className="text-lg font-black uppercase">Premios por Selección</h3>
              </div>

              {!selectedWheelStudent ? (
                <div className="bg-[#F5F5F0] neo-border-thin p-8 text-center text-gray-500 font-mono text-xs">
                  Gira la ruleta y selecciona un estudiante activo para activar la matriz directa de incentivos Karma.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 neo-border-thin p-3 text-xs font-mono">
                    Aplica una valoración de conducta de inmediato a <strong>{selectedWheelStudent.name}</strong> para incrementar su nota motivacional o corregir comportamiento.
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase text-gray-700 mb-1">
                      Asignar Criterio del Catálogo
                    </label>
                    <select 
                      id="wheel-reward-select"
                      value={selectedRewardIdx}
                      onChange={(e) => setSelectedRewardIdx(parseInt(e.target.value))}
                      className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none"
                    >
                      {BEHAVIOR_CATALOG.map((item, idx) => (
                        <option key={idx} value={idx}>
                          {item.icon} {item.text} ({item.points > 0 ? '+' : ''}{item.points} Karma pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-black uppercase text-gray-700 mb-1">
                      Nota o Glosa del Profesor (Opcional)
                    </label>
                    <textarea 
                      id="wheel-reward-textarea"
                      placeholder="Redacta la circunstancia de la participación..."
                      value={customRewardDesc}
                      onChange={(e) => setCustomRewardDesc(e.target.value)}
                      className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t-2 border-dashed border-[#1A1A1A]">
              <button 
                id="btn-apply-wheel-reward"
                onClick={handleApplyWheelReward}
                disabled={!selectedWheelStudent}
                className={`w-full neo-btn py-4 neo-border text-center font-black uppercase text-xs block cursor-pointer transition-colors ${
                  selectedWheelStudent 
                    ? "bg-[#1A1A1A] text-white neo-shadow hover:bg-gray-800"
                    : "bg-gray-200 text-gray-400 border-gray-300 opacity-60 cursor-not-allowed"
                }`}
              >
                🏆 OTORGAR PRESTACIÓN ACADÉMICA
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Tab 3: GROUP GENERATOR */}
      {activeSubTab === "groups" && (
        <div className="bg-white neo-border p-6 neo-shadow space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-3">
            <div className="flex items-center gap-2">
              <Dices className="w-5 h-5 text-bauhaus-blue animate-bounce" />
              <h3 className="text-lg font-black uppercase">Generador de Equipos de Aprendizaje</h3>
            </div>
            {generatedGroups.length > 0 && (
              <button
                onClick={() => { window.focus(); window.print(); }}
                className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-1 px-3 neo-border-thin flex items-center gap-1 text-[10px] font-mono cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-bauhaus-blue font-bold" /> IMPRIMIR GRUPOS
              </button>
            )}
          </div>

          <p className="text-xs font-mono text-gray-500">
            Confecciona equipos cooperativos equilibrados de manera automática. Selecciona el número deseado de alumnos y decide si quieres un algoritmo totalmente azaroso o uno heterogéneo basado en el promedio académico.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#F5F5F0] neo-border-thin font-mono text-xs">
            <div>
              <label className="block font-black text-gray-700 uppercase mb-1">Fichas por Grupo:</label>
              <select 
                id="group-size-select"
                value={groupSize} 
                onChange={(e) => setGroupSize(parseInt(e.target.value))}
                className="w-full bg-white p-2 neo-border-thin focus:outline-none"
              >
                <option value={2}>Parejas (2 personas)</option>
                <option value={3}>Tríos (3 personas)</option>
                <option value={4}>Cuarteto (4 personas)</option>
                <option value={5}>Quinteto (5 personas)</option>
              </select>
            </div>

            <div>
              <label className="block font-black text-gray-700 uppercase mb-1">Estrategia de Reparto:</label>
              <select 
                id="group-strategy-select"
                value={groupStrategy} 
                onChange={(e) => setGroupStrategy(e.target.value as any)}
                className="w-full bg-white p-2 neo-border-thin focus:outline-none"
              >
                <option value="random">Totalmente Aleatorio (Shuffle)</option>
                <option value="academic">Balance Heterogéneo (Por Notas)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <button 
                id="btn-generate-groups"
                onClick={handleGenerateGroups}
                className="w-full neo-btn bg-bauhaus-blue text-white py-2.5 font-bold uppercase hover:bg-blue-700 neo-border neo-shadow cursor-pointer"
              >
                🎯 GENERAR GRUPOS COOPERATIVOS
              </button>
            </div>
          </div>

          {/* Generated view */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {generatedGroups.map((grpList, idx) => (
              <div key={idx} className="bg-white neo-border p-4 neo-shadow relative flex flex-col justify-between">
                <div className="absolute top-0 right-0 bg-[#1A1A1A] text-white text-[9px] font-mono font-bold px-3 py-1">
                  GRUPO Nº {idx + 1}
                </div>
                
                <div>
                  <h4 className="font-extrabold text-sm uppercase text-[#1A1A1A] border-b border-gray-200 pb-2 mb-3">
                    EQUIPO COOPERATIVO
                  </h4>
                  
                  <div className="space-y-2">
                    {grpList.map(std => {
                      const avg = Number(((std.grades.exam1 + std.grades.exam2 + std.grades.homework1 + std.grades.project) / 4).toFixed(1));
                      return (
                        <div key={std.id} className="flex items-center justify-between font-mono text-xs">
                          <div className="flex items-center gap-2">
                            {std.avatar && std.avatar.startsWith("http") ? (
                              <img 
                                src={std.avatar} 
                                alt={std.name} 
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover neo-border-thin"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            {(!std.avatar || !std.avatar.startsWith("http")) ? (
                              <div className="w-6 h-6 bg-bauhaus-blue text-white flex items-center justify-center rounded-full text-[9px] font-mono font-black neo-border-thin select-none">
                                {std.name[0]?.toUpperCase() || "?"}
                              </div>
                            ) : (
                              <div style={{ display: 'none' }} className="w-6 h-6 bg-bauhaus-blue text-white flex items-center justify-center rounded-full text-[9px] font-mono font-black neo-border-thin select-none">
                                {std.name[0]?.toUpperCase() || "?"}
                              </div>
                            )}
                            <span className="truncate max-w-[120px] font-bold">{std.name.split(" ")[0]} {std.name.split(" ")[1] || ""}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5" title="Promedio">
                            ({avg}) ({std.subject.substring(0,3)})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-gray-300 text-center">
                  <button 
                    onClick={() => {
                      const text = grpList.map(s => s.name).join(", ");
                      navigator.clipboard.writeText(`Grupo ${idx + 1}: ${text}`);
                      addSystemNotification(`Copiado listado de Grupo ${idx + 1} al portapapeles`, "success");
                    }}
                    className="text-[9px] font-mono text-gray-500 hover:text-black uppercase underline cursor-pointer"
                  >
                    Copiar listado de texto
                  </button>
                </div>
              </div>
            ))}

            {generatedGroups.length === 0 && (
              <div className="col-span-full bg-[#F5F5F0] neo-border-thin p-12 text-center text-gray-500 font-mono text-xs">
                Ajusta las configuraciones de arriba y haz click en generar para de-estructurar tus equipos de aula cooperativa.
              </div>
            )}
          </div>
        </div>
      )}


      {/* Tab 4: DIRECT BEHAVIORAL AWARDS SHEET */}
      {activeSubTab === "behaviors" && (
        <form onSubmit={handleApplyDirectReward} className="bg-white neo-border p-6 neo-shadow space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-black pb-3">
            <Award className="w-5 h-5 text-bauhaus-yellow-600 animate-pulse" />
            <h3 className="text-lg font-black uppercase">Rúbrica Motivacional / Registro Rápido</h3>
          </div>

          <p className="text-xs font-mono text-gray-500">
            Valora el comportamiento o amonestaciones de disciplina de manera directa. Selecciona un alumno de la clase, escoge una rúbrica motivacional del catálogo y añade una descripción descriptiva correspondiente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Form selections */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  1. Alumno Destinado *
                </label>
                <select 
                  id="direct-student-select"
                  value={selectedDirectStd}
                  onChange={(e) => setSelectedDirectStd(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                  required
                >
                  <option value="" disabled>Seleccionar estudiante...</option>
                  {activeStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Grupo {s.group} - {s.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  2. Valoración Criterio Catálogo
                </label>
                <select 
                  id="direct-reward-select"
                  value={selectedDirectReward}
                  onChange={(e) => setSelectedDirectReward(parseInt(e.target.value))}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none"
                >
                  {BEHAVIOR_CATALOG.map((item, idx) => (
                    <option key={idx} value={idx}>
                      {item.icon} {item.text} | Karma ({item.points > 0 ? `+${item.points}` : item.points} p)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  3. Notas / Glosa del Expediente
                </label>
                <textarea 
                  id="direct-reward-textarea"
                  placeholder="Redacta la circunstancia de la valoración..."
                  value={directDescription}
                  onChange={(e) => setDirectDescription(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                  rows={3}
                />
              </div>
            </div>

            {/* Helper catalog cards reference */}
            <div className="bg-[#F5F5F0] neo-border-thin p-4 space-y-3">
              <h4 className="font-mono text-xs font-black uppercase text-gray-700 border-b border-gray-300 pb-1">
                Catálogo de Ponderación (Karma Rápido)
              </h4>
              
              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {BEHAVIOR_CATALOG.map((item, idX) => (
                  <div 
                    key={idX}
                    onClick={() => {
                      setSelectedDirectReward(idX);
                      addSystemNotification(`Seleccionado criterio '${item.text}'`, "info");
                    }}
                    className={`bg-white p-2 neo-border-thin flex justify-between items-center font-mono text-[10px] cursor-pointer hover:border-[#1A1A1A] transition-all ${
                      selectedDirectReward === idX ? "bg-amber-50 outline outline-2 outline-[#1A1A1A]" : ""
                    }`}
                  >
                    <span className="truncate pr-1">{item.icon} {item.text}</span>
                    <span className={`font-black py-0.5 px-2 text-[9px] uppercase ${
                      item.points > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {item.points > 0 ? `+${item.points}` : item.points} KARM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-4 border-[#1A1A1A] text-right">
            <button 
              id="btn-apply-direct-behavior"
              type="submit"
              className="neo-btn bg-[#1A1A1A] text-white py-3 px-6 neo-border neo-shadow font-black uppercase text-xs hover:bg-gray-800 cursor-pointer"
            >
              ★ APLICAR VALORACIÓN MOTIVACIONAL
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: POMODORO Y TIEMPO ENFOQUE */}
      {activeSubTab === "pomodoro" && (
        <div className="space-y-6">
          {/* Internal Tool Toggle (Pomodoro vs classroom Activity timer) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100 neo-border">
            <button
              id="btn-switch-pomodoro"
              onClick={() => setActiveTimerTool("pomodoro")}
              className={`flex-1 py-1.5 text-center font-mono text-[10px] font-black uppercase cursor-pointer transition-colors border ${
                activeTimerTool === "pomodoro" ? "bg-[#1A1A1A] text-white border-black" : "bg-white text-gray-600 hover:bg-gray-100 border-gray-300"
              }`}
            >
              🍅 MÉTODO POMODORO
            </button>
            <button
              id="btn-switch-classroom-timer"
              onClick={() => setActiveTimerTool("classroom_timer")}
              className={`flex-1 py-1.5 text-center font-mono text-[10px] font-black uppercase cursor-pointer transition-colors border ${
                activeTimerTool === "classroom_timer" ? "bg-[#1A1A1A] text-white border-black" : "bg-white text-gray-600 hover:bg-gray-100 border-gray-300"
              }`}
            >
              ⏱️ TEMPORIZADOR DE ACTIVIDADES
            </button>
          </div>

          {activeTimerTool === "classroom_timer" ? (
            /* CLASSROOM TEMPORIZADOR Y CRONOMETRO */
            <div className="bg-white neo-border p-6 neo-shadow space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-6 h-6 text-bauhaus-blue animate-pulse" />
                  <div>
                    <h3 className="text-lg font-black uppercase">Temporizador y Cronómetro de Actividades</h3>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">
                      Gestione dinámicamente y con precisión el avance de sus exámenes, dinámicas o lecturas del aula.
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    id="btn-projector-classroom-timer"
                    onClick={() => {
                      setProjectorModeActive(true);
                      addSystemNotification("Visualización para Proyector activada.", "info");
                    }}
                    className="neo-btn bg-bauhaus-blue text-white hover:bg-blue-600 py-1.5 px-3 neo-border-thin font-mono text-[11px] uppercase font-black cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Monitor className="w-4 h-4" /> 📺 PROYECTAR EN GRANDE
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left side: Beautiful counter */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-zinc-50 neo-border relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-2 bg-bauhaus-blue" />
                  
                  <div className="text-center space-y-5 w-full">
                    {/* Mode Toggle */}
                    <div className="inline-flex rounded-sm p-1 bg-gray-200 neo-border-thin gap-1">
                      <button
                        onClick={() => {
                          setClassroomTimerActive(false);
                          setClassroomTimerType("countdown");
                          setClassroomTimerSeconds(classroomTimerInputMin * 60);
                        }}
                        className={`px-3 py-1 font-mono text-[10px] uppercase font-black cursor-pointer ${
                          classroomTimerType === "countdown" ? "bg-[#1A1A1A] text-white" : "hover:bg-gray-300"
                        }`}
                      >
                        ⏱️ Cuenta Atrás
                      </button>
                      <button
                        onClick={() => {
                          setClassroomTimerActive(false);
                          setClassroomTimerType("stopwatch");
                          setClassroomTimerSeconds(0);
                        }}
                        className={`px-3 py-1 font-mono text-[10px] uppercase font-black cursor-pointer ${
                          classroomTimerType === "stopwatch" ? "bg-[#1A1A1A] text-white" : "hover:bg-gray-300"
                        }`}
                      >
                        ⏱️ Cronómetro
                      </button>
                    </div>

                    {/* Task Title Input */}
                    <div className="max-w-md mx-auto">
                      <label className="block text-[9px] font-mono font-black text-gray-500 uppercase mb-1">
                        Nombre de la Actividad Escolar
                      </label>
                      <input
                        type="text"
                        value={classroomTimerTask}
                        onChange={(e) => setClassroomTimerTask(e.target.value)}
                        placeholder="Ej: Examen de Lectura, Dinámica de Grupo..."
                        className="w-full text-center bg-white neo-border-thin p-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 text-black font-extrabold border border-black"
                      />
                    </div>

                    {/* Timer Big Display */}
                    <div className="py-2 select-none">
                      <h2 className="text-6xl md:text-7xl font-black font-mono tracking-tighter text-[#1A1A1A]">
                        {(() => {
                          const mins = Math.floor(classroomTimerSeconds / 60);
                          const secs = classroomTimerSeconds % 60;
                          return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                        })()}
                      </h2>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => setClassroomTimerActive(!classroomTimerActive)}
                        className={`neo-btn py-2 px-5 neo-border text-xs font-black uppercase flex items-center gap-2 cursor-pointer ${
                          classroomTimerActive ? "bg-amber-100 text-amber-800" : "bg-bauhaus-blue text-white"
                        }`}
                      >
                        {classroomTimerActive ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Iniciar</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setClassroomTimerActive(false);
                          setClassroomTimerSeconds(classroomTimerType === "countdown" ? classroomTimerInputMin * 60 : 0);
                        }}
                        className="neo-btn bg-white hover:bg-gray-100 text-gray-800 py-2 px-4 neo-border text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reiniciar</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Configuration & Presets */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  {/* Preset Buttons */}
                  <div className="bg-white neo-border p-4 space-y-4">
                    <h4 className="font-mono text-xs font-black uppercase border-b border-black pb-2 text-[#1A1A1A]">
                      Plantillas Rápidas de Aula
                    </h4>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { title: "📄 Examen de Unidad", min: 45 },
                        { title: "👥 Dinámica de Grupo", min: 20 },
                        { title: "📖 Lectura Guiada", min: 10 },
                        { title: "💡 Debate o Brainstorming", min: 5 },
                        { title: "🧹 Limpieza y Clausura", min: 2 }
                      ].map((preset) => (
                        <button
                          key={preset.title}
                          onClick={() => {
                            setClassroomTimerType("countdown");
                            setClassroomTimerActive(false);
                            setClassroomTimerTask(preset.title);
                            setClassroomTimerInputMin(preset.min);
                            setClassroomTimerSeconds(preset.min * 60);
                            addSystemNotification(`Cargada actividad: "${preset.title}" (${preset.min}m)`, "info");
                          }}
                          className="p-2.5 neo-border-thin font-mono text-[11px] text-left flex items-center justify-between hover:bg-gray-55 cursor-pointer"
                        >
                          <span className="font-black truncate mr-2">{preset.title}</span>
                          <span className="font-black text-bauhaus-blue whitespace-nowrap">{preset.min} min</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Setting */}
                  {classroomTimerType === "countdown" && (
                    <div className="bg-gray-100 neo-border-thin p-4 space-y-3">
                      <h4 className="font-mono text-[11px] font-black uppercase text-gray-700">
                        Ajuste Manual de Temporizador
                      </h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={classroomTimerInputMin}
                          onChange={(e) => {
                            const val = Math.max(1, Math.min(240, parseInt(e.target.value) || 1));
                            setClassroomTimerInputMin(val);
                            if (!classroomTimerActive) setClassroomTimerSeconds(val * 60);
                          }}
                          className="w-20 bg-white neo-border-thin p-1.5 font-mono text-xs text-center focus:outline-none border border-black text-black font-bold"
                          min={1}
                          max={240}
                        />
                        <span className="font-mono text-xs">Minutos</span>
                        <button
                          onClick={() => {
                            setClassroomTimerSeconds(classroomTimerInputMin * 60);
                            addSystemNotification("Tiempo restablecido a " + classroomTimerInputMin + " minutos", "success");
                          }}
                          className="ml-auto px-3 py-1 font-mono text-[10px] font-black bg-white border border-[#1A1A1A] hover:bg-gray-150 uppercase cursor-pointer"
                        >
                          FIJAR
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reward presents */}
                  <div className="bg-blue-50/50 neo-border-thin p-4 space-y-2">
                    <h4 className="font-mono text-xs font-black text-bauhaus-blue uppercase">
                      ★ Incentivo por Enfoque de Grupo
                    </h4>
                    <p className="font-mono text-[9px] text-gray-500 uppercase leading-normal">
                      Si finalizan la actividad en orden y dentro del rango de tiempo, puede otorgar +3 puntos de karma de "Trabajo en Equipo" a toda la clase presente de forma inmediata:
                    </p>
                    <button
                      onClick={() => {
                        if (activeStudents.length === 0) {
                          addSystemNotification("No hay estudiantes activos para premiar.", "warning");
                          return;
                        }
                        activeStudents.forEach((student) => {
                          const logObj: BehaviorLog = {
                            id: `activity-bonus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            date: new Date().toISOString().split("T")[0],
                            type: "positivo",
                            tag: "Trabajo en Equipo",
                            description: `Completó exitosamente la actividad de: "${classroomTimerTask}"`,
                            points: 3
                          };
                          onAwardPoints(student.id, logObj, 3);
                        });
                        addSystemNotification(`🎯 Otorgado +3 Karma a los ${activeStudents.length} estudiantes activos del aula`, "success");
                      }}
                      className="w-full text-center px-4 py-2.5 bg-bauhaus-blue hover:bg-blue-600 text-white font-mono text-[10px] uppercase font-bold neo-border-thin cursor-pointer"
                    >
                      Premiar Alumnos Presentes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* DEFAULT MODAL FOR POMODORO */
            <div className="bg-white neo-border p-6 neo-shadow space-y-8">
              {/* Proyector control on top corner of standard view */}
              <div className="flex justify-end -mb-6 relative z-10">
                <button
                  id="btn-projector-pomodoro"
                  onClick={() => {
                    setProjectorModeActive(true);
                    addSystemNotification("Modo proyector activado para Pomodoro.", "info");
                  }}
                  className="neo-btn bg-bauhaus-blue text-white hover:bg-blue-600 py-1.5 px-3 neo-border-thin font-mono text-[10px] uppercase font-black cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Monitor className="w-3.5 h-3.5" /> PROYECTAR EN GRANDE
                </button>
              </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-bauhaus-red animate-pulse" />
              <div>
                <h3 className="text-lg font-black uppercase">Temporizador Pomodoro para el Aula</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase">
                  Fomente sesiones de concentración profunda alternando con descansos estructurados en el aula de clase.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 neo-border-thin font-mono text-[10px] uppercase font-bold">
              Ciclos Completados hoy: <span className="bg-bauhaus-blue text-white px-2 py-0.5 rounded-sm">{pomodoroCycles} 🍅</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side: Beautiful Huge Timer */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-amber-50/40 neo-border relative overflow-hidden">
              {/* Subtle top indicator bar */}
              <div className={`absolute top-0 left-0 right-0 h-2 transition-colors ${
                pomodoroMode === "trabajo" ? "bg-bauhaus-red" : pomodoroMode === "corto" ? "bg-bauhaus-green" : "bg-bauhaus-blue"
              }`} />

              <div className="text-center space-y-4 w-full">
                {/* Active Mode Badge */}
                <div className="inline-flex gap-1.5">
                  <span className={`px-4 py-1.5 neo-border-thin font-mono text-xs font-black uppercase tracking-wider ${
                    pomodoroMode === "trabajo" 
                      ? "bg-red-100 text-red-800" 
                      : pomodoroMode === "corto" 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-blue-100 text-blue-800"
                  }`}>
                    {pomodoroMode === "trabajo" ? "🎒 modo de trabajo" : pomodoroMode === "corto" ? "☕ descanso corto" : "🛋️ descanso largo"}
                  </span>
                </div>

                {/* Focus input field */}
                <div className="max-w-md mx-auto">
                  <label className="block text-[9 px] font-mono font-black text-gray-500 uppercase mb-1">
                    Tema o Tarea de Enfoque Activo
                  </label>
                  <input
                    type="text"
                    id="pomodoro-task-input"
                    value={pomodoroTask}
                    onChange={(e) => setPomodoroTask(e.target.value)}
                    placeholder="Ej: Lectura silenciosa, Trabajo práctico, Resolución nº1..."
                    className="w-full text-center bg-white neo-border-thin p-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400"
                  />
                </div>

                {/* Huge Counter */}
                <div className="py-6 select-none">
                  <h1 className="text-7xl md:text-8xl font-black font-mono tracking-tighter text-[#1A1A1A] drop-shadow-sm transition-all animate-none">
                    {(() => {
                      const mins = Math.floor(pomodoroTime / 60);
                      const secs = pomodoroTime % 60;
                      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    })()}
                  </h1>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto bg-gray-200 neo-border-thin h-4 overflow-hidden p-0.5">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      pomodoroMode === "trabajo" ? "bg-bauhaus-red" : pomodoroMode === "corto" ? "bg-bauhaus-green" : "bg-bauhaus-blue"
                    }`}
                    style={{ 
                      width: `${Math.min(100, (pomodoroTime / ((pomodoroMode === "trabajo" ? customWorkMin : pomodoroMode === "corto" ? customShortMin : customLongMin) * 60)) * 100)}%` 
                    }}
                  />
                </div>

                {/* Main Action Controllers */}
                <div className="flex flex-wrap justify-center items-center gap-3 pt-4">
                  <button
                    id="btn-pomodoro-toggle"
                    onClick={() => setPomodoroActive(!pomodoroActive)}
                    className={`neo-btn py-2.5 px-6 neo-border neo-shadow text-xs font-black uppercase flex items-center gap-2 cursor-pointer transition-all ${
                      pomodoroActive 
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200" 
                        : "bg-[#1A1A1A] text-white hover:bg-gray-800"
                    }`}
                  >
                    {pomodoroActive ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Iniciar</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-pomodoro-reset"
                    onClick={() => {
                      setPomodoroActive(false);
                      setPomodoroTime((pomodoroMode === "trabajo" ? customWorkMin : pomodoroMode === "corto" ? customShortMin : customLongMin) * 60);
                      addSystemNotification("Contador restablecido", "info");
                    }}
                    className="neo-btn bg-white hover:bg-gray-100 text-gray-800 py-2.5 px-4 neo-border neo-shadow text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reiniciar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Presets & Configurations */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Presets Card */}
              <div className="bg-white neo-border p-4 space-y-4">
                <h4 className="font-mono text-xs font-black uppercase border-b border-black pb-2 text-[#1A1A1A]">
                  Selección de Intervalos Rápidos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
                  <button
                    id="btn-preset-trabajo"
                    onClick={() => {
                      setFixedMode("trabajo");
                      addSystemNotification("Cambiado a modo de Trabajo Encoado", "info");
                    }}
                    className={`p-3 neo-border-thin font-mono text-xs text-left flex items-center justify-between cursor-pointer transition-all ${
                      pomodoroMode === "trabajo" ? "bg-red-50 border-bauhaus-red outline outline-2 outline-bauhaus-red font-bold" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span>🍅 Trabajo Enfocado</span>
                    <span className="font-bold text-gray-500">{customWorkMin} min</span>
                  </button>

                  <button
                    id="btn-preset-corto"
                    onClick={() => {
                      setFixedMode("corto");
                      addSystemNotification("Cambiado a Descanso Corto", "info");
                    }}
                    className={`p-3 neo-border-thin font-mono text-xs text-left flex items-center justify-between cursor-pointer transition-all ${
                      pomodoroMode === "corto" ? "bg-emerald-50 border-bauhaus-green outline outline-2 outline-bauhaus-green font-bold" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span>☕ Descanso Corto</span>
                    <span className="font-bold text-gray-500">{customShortMin} min</span>
                  </button>

                  <button
                    id="btn-preset-largo"
                    onClick={() => {
                      setFixedMode("largo");
                      addSystemNotification("Cambiado a Descanso Largo", "info");
                    }}
                    className={`p-3 neo-border-thin font-mono text-xs text-left flex items-center justify-between cursor-pointer transition-all ${
                      pomodoroMode === "largo" ? "bg-blue-50 border-bauhaus-blue outline outline-2 outline-bauhaus-blue font-bold" : "hover:bg-zinc-50"
                    }`}
                  >
                    <span>🛋️ Descanso Largo</span>
                    <span className="font-bold text-gray-500">{customLongMin} min</span>
                  </button>
                </div>
              </div>

              {/* Adjust Durations Fields */}
              <div className="bg-[#F5F5F0] neo-border-thin p-4 space-y-4">
                <h4 className="font-mono text-[11px] font-black uppercase text-gray-700 border-b border-gray-300 pb-2">
                  Personalizar Tiempos (Minutos)
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase">Trabajo</label>
                    <input
                      type="number"
                      id="input-work-min"
                      value={customWorkMin}
                      onChange={(e) => handleUpdateDuration("trabajo", parseInt(e.target.value) || 25)}
                      className="w-full bg-white neo-border-thin p-1.5 font-mono text-xs text-center focus:outline-none"
                      min={1}
                      max={180}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase">D. Corto</label>
                    <input
                      type="number"
                      id="input-short-min"
                      value={customShortMin}
                      onChange={(e) => handleUpdateDuration("corto", parseInt(e.target.value) || 5)}
                      className="w-full bg-white neo-border-thin p-1.5 font-mono text-xs text-center focus:outline-none"
                      min={1}
                      max={180}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-mono font-bold text-gray-500 uppercase">D. Largo</label>
                    <input
                      type="number"
                      id="input-long-min"
                      value={customLongMin}
                      onChange={(e) => handleUpdateDuration("largo", parseInt(e.target.value) || 15)}
                      className="w-full bg-white neo-border-thin p-1.5 font-mono text-xs text-center focus:outline-none"
                      min={1}
                      max={180}
                    />
                  </div>
                </div>
              </div>

              {/* Reward whole class button */}
              <div className="bg-amber-50 neo-border p-4 space-y-3">
                <div className="space-y-1">
                  <h4 className="font-mono text-xs font-black uppercase text-amber-800 flex items-center gap-1">
                    <span>🎁 Recompensar Aula por Concentración</span>
                  </h4>
                  <p className="font-mono text-[9px] text-gray-500 uppercase leading-normal">
                    Si el grupo se mantiene concentrado y cumple con el bloque de trabajo, puede premiar a todos los alumnos activos otorgándoles puntos de karma rápidamente:
                  </p>
                </div>
                <button
                  id="btn-pomodoro-award-group"
                  onClick={handleAwardClassPomodoroBonus}
                  className="w-full neo-btn bg-amber-400 hover:bg-amber-500 text-black py-2.5 px-3 neo-border-thin font-mono text-[10px] uppercase font-black cursor-pointer shadow-sm transition-colors"
                >
                  ★ Otorgar +5 Karma a toda la clase
                </button>
              </div>
            </div>
          </div>
        </div>
        )
        }
      </div>
      )}

      {/* Full screen Projector Mode Overlay */}
      <AnimatePresence>
        {projectorModeActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col justify-between p-8 md:p-14 select-none ${
              projectorTheme === "dark" 
                ? "bg-[#111111] text-[#FFD214]" 
                : projectorTheme === "bauhaus"
                  ? "bg-[#FFE0B2] text-[#D84315] border-8 border-[#3E2723]"
                  : "bg-white text-black border-8 border-[#1A1A1A]"
            }`}
          >
            {/* Top Bar info */}
            <div className="flex items-center justify-between border-b border-current pb-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 shrink-0 animate-pulse" />
                <div>
                  <h2 className="text-xs md:text-sm font-mono tracking-widest uppercase font-black font-extrabold pb-0.5">
                    MODO PROYECTADO - EN ENFOQUE
                  </h2>
                  <p className="text-[10px] uppercase font-bold opacity-80 font-mono">
                    {activeTimerTool === "pomodoro" ? "Método Pomodoro Escolar" : "Temporizador de Dinámica Activa"}
                  </p>
                </div>
              </div>

              {/* Theme pickers & close buttons */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono uppercase font-black opacity-60 hidden sm:inline">Tema:</span>
                <div className="flex items-center gap-1 border border-current p-1 bg-transparent">
                  {(["dark", "light", "bauhaus"] as const).map((themeName) => (
                    <button
                      key={themeName}
                      onClick={() => setProjectorTheme(themeName)}
                      className={`px-2 py-0.5 font-mono text-[8px] uppercase font-bold border ${
                        projectorTheme === themeName ? "bg-red-500 text-white border-red-500" : "hover:opacity-80"
                      }`}
                    >
                      {themeName === "dark" ? "Oscuro" : themeName === "light" ? "Claro" : "Retro"}
                    </button>
                  ))}
                </div>

                <button
                  id="btn-projector-close"
                  onClick={() => setProjectorModeActive(false)}
                  className="px-3 py-1 font-mono text-[10px] font-black border-2 border-current bg-transparent hover:opacity-80 cursor-pointer uppercase transition-all"
                >
                  ✖ Salir Proyección
                </button>
              </div>
            </div>

            {/* Giant display of active timer */}
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 md:space-y-8 my-4">
              <div className="space-y-2 max-w-4xl px-4">
                <h3 className="text-xl md:text-4xl font-mono uppercase font-black tracking-wider leading-tight">
                  {activeTimerTool === "pomodoro" 
                    ? (pomodoroTask ? `"${pomodoroTask}"` : "ENFOQUE Y COMPORTAMIENTO")
                    : (classroomTimerTask ? `"${classroomTimerTask}"` : "ACTIVIDAD EN PROGRESO")
                  }
                </h3>
                {activeTimerTool === "pomodoro" && (
                  <span className="inline-block px-4 py-1 border border-current text-xs font-mono uppercase font-extrabold tracking-widest">
                    {pomodoroMode === "trabajo" ? "🎒 MOMENTO TRABAJO" : pomodoroMode === "corto" ? "☕ DESCANSO CORTO" : "🛋️ DESCANSO LARGO"}
                  </span>
                )}
                {activeTimerTool === "classroom_timer" && (
                  <span className="inline-block px-4 py-1 border border-current text-xs font-mono uppercase font-extrabold tracking-widest">
                    {classroomTimerType === "countdown" ? "⏱️ TIEMPO EN CUENTA ATRÁS" : "⏱️ CRONÓMETRO DE SEGUIMIENTO"}
                  </span>
                )}
              </div>

              {/* Giant countdown text */}
              <div className="relative">
                <h1 className={`text-[19vw] leading-none font-mono font-black tracking-tighter cursor-default transition-all ${
                  activeTimerTool === "pomodoro"
                    ? (pomodoroTime < 60 && pomodoroActive && pomodoroMode === "trabajo" ? "animate-pulse text-red-650 font-extrabold" : "")
                    : (classroomTimerSeconds < 60 && classroomTimerActive && classroomTimerType === "countdown" ? "animate-pulse text-red-650 font-extrabold" : "")
                }`}>
                  {activeTimerTool === "pomodoro" ? (
                    (() => {
                      const mins = Math.floor(pomodoroTime / 60);
                      const secs = pomodoroTime % 60;
                      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    })()
                  ) : (
                    (() => {
                      const mins = Math.floor(classroomTimerSeconds / 60);
                      const secs = classroomTimerSeconds % 60;
                      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
                    })()
                  )}
                </h1>
                {/* Visual warning for final minutes */}
                {(((activeTimerTool === "pomodoro" && pomodoroTime < 60 && pomodoroActive && pomodoroMode === "trabajo") ||
                  (activeTimerTool === "classroom_timer" && classroomTimerSeconds < 60 && classroomTimerActive && classroomTimerType === "countdown"))) && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 font-mono text-[9px] uppercase font-black tracking-widest animate-bounce">
                    ⚠️ ¡ÚLTIMO MINUTO! ⚠️
                  </div>
                )}
              </div>
            </div>

            {/* Bottom mini actions for board control */}
            <div className="border-t border-current pt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                {activeTimerTool === "pomodoro" ? (
                  <button
                    onClick={() => {
                      setPomodoroActive(false);
                      setPomodoroTime((pomodoroMode === "trabajo" ? customWorkMin : pomodoroMode === "corto" ? customShortMin : customLongMin) * 60);
                    }}
                    className="px-4 py-2 border border-current text-[10px] font-mono font-black uppercase hover:bg-current hover:text-current-inverse cursor-pointer"
                  >
                    Restablecer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setClassroomTimerActive(false);
                      setClassroomTimerSeconds(classroomTimerType === "countdown" ? classroomTimerInputMin * 60 : 0);
                    }}
                    className="px-4 py-2 border border-current text-[10px] font-mono font-black uppercase hover:bg-current hover:text-current-inverse cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>

              {/* Giant Play/Pause button */}
              <div>
                {activeTimerTool === "pomodoro" ? (
                  <button
                    onClick={() => setPomodoroActive(!pomodoroActive)}
                    className="px-10 py-3.5 border-2 border-current font-mono text-xs font-black uppercase hover:opacity-85 transition-all text-center"
                  >
                    {pomodoroActive ? "⏸ PAUSAR" : "▶ INICIAR"}
                  </button>
                ) : (
                  <button
                    onClick={() => setClassroomTimerActive(!classroomTimerActive)}
                    className="px-10 py-3.5 border-2 border-current font-mono text-xs font-black uppercase hover:opacity-85 transition-all text-center"
                  >
                    {classroomTimerActive ? "⏸ PAUSAR" : "▶ INICIAR"}
                  </button>
                )}
              </div>

              <div className="text-right font-mono text-[9px] opacity-75 uppercase">
                {activeTimerTool === "pomodoro" ? `Ciclos: ${pomodoroCycles} 🍅` : `${classroomTimerType === "countdown" ? "TEMPORIZADOR" : "CRONÓMETRO"}`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
