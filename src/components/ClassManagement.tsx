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
  Volume2
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

  // Sub-tabs: attendance, randomWheel, groupGenerator, rewardsPanel
  const [activeSubTab, setActiveSubTab] = useState<"attendance" | "wheel" | "groups" | "behaviors">("attendance");

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
      id: `log-wheel-${Date.now()}`,
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
      id: `log-direct-${Date.now()}`,
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
            { id: "behaviors", label: "★ HISTORIAL Y CONDUCTAS", icon: Zap }
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
            
            {/* Date Picker Input */}
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
          <div className="flex items-center gap-2 border-b-2 border-black pb-3">
            <Dices className="w-5 h-5 text-bauhaus-blue animate-bounce" />
            <h3 className="text-lg font-black uppercase">Generador de Equipos de Aprendizaje</h3>
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
    </motion.div>
  );
}
