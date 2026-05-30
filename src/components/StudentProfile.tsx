import React, { useState, useMemo } from "react";
import { Student, BehaviorLog, Classroom } from "../types";
import { 
  ArrowLeft, 
  TrendingUp, 
  Terminal, 
  BookOpen, 
  Trash2, 
  Save, 
  Plus
} from "lucide-react";
import { motion } from "motion/react";

interface StudentProfileProps {
  student: Student;
  activeClassroom: Classroom;
  onClose: () => void;
  onUpdateStudentGrades: (studentId: string, updatedGrades: Student["grades"]) => void;
  onAddBehaviorLog: (studentId: string, log: BehaviorLog, pointsChange: number) => void;
  onRemoveBehaviorLog: (studentId: string, logId: string, pointsRefund: number) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  requestConfirm?: (title: string, message: string) => Promise<boolean>;
}

export default function StudentProfile({
  student,
  activeClassroom,
  onClose,
  onUpdateStudentGrades,
  onAddBehaviorLog,
  onRemoveBehaviorLog,
  addSystemNotification,
  requestConfirm
}: StudentProfileProps) {

  // Local state for dynamic activities grades
  const [localGrades, setLocalGrades] = useState<{ [activityId: string]: number }>({});

  // Sync state if student or classroom changes
  React.useEffect(() => {
    const initialGrades: { [activityId: string]: number } = {};
    const activities = activeClassroom.activities || [];
    activities.forEach(act => {
      // Look up inside student.grades
      initialGrades[act.id] = student.grades[act.id] ?? student.grades[act.id.toLowerCase()] ?? 0;
    });
    // Fill classic keys as fallback in case they are referenced
    initialGrades.exam1 = student.grades.exam1 ?? 0;
    initialGrades.homework1 = student.grades.homework1 ?? 0;
    initialGrades.exam2 = student.grades.exam2 ?? 0;
    initialGrades.project = student.grades.project ?? 0;

    setLocalGrades(initialGrades);
  }, [student, activeClassroom]);

  // Qualitative micro-log state
  const [newLogTag, setNewLogTag] = useState("Observación");
  const [newLogPoints, setNewLogPoints] = useState(2);
  const [newLogDesc, setNewLogDesc] = useState("");
  const [newLogType, setNewLogType] = useState<"positivo" | "critico" | "academico">("positivo");

  // Calculate stats on the fly matching syllabus weights
  const average = useMemo(() => {
    const activities = activeClassroom.activities || [];
    if (activities.length === 0) return 0;
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    activities.forEach(act => {
      const g = localGrades[act.id] ?? 0;
      weightedSum += g * (act.weight || 0);
      totalWeight += act.weight || 0;
    });
    
    if (totalWeight === 0) {
      let sum = 0;
      activities.forEach(act => {
        sum += localGrades[act.id] ?? 0;
      });
      return Number((sum / activities.length).toFixed(2));
    }
    
    return Number((weightedSum / totalWeight).toFixed(2));
  }, [localGrades, activeClassroom]);

  // Decode student initial dynamically
  const studentInitial = useMemo(() => {
    if (student.name.includes(",")) {
      const parts = student.name.split(",");
      const firstNamePart = parts[1]?.trim() || "";
      return firstNamePart[0]?.toUpperCase() || student.name[0]?.toUpperCase() || "?";
    }
    return student.name[0]?.toUpperCase() || "?";
  }, [student.name]);

  const handleUpdateGrades = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudentGrades(student.id, {
      ...student.grades,
      ...localGrades
    });
    addSystemNotification(`Boletín de calificaciones actualizado para ${student.name}`, "success");
  };

  const handleCreateObsLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDesc.trim()) return;

    const points = newLogType === "critico" ? -Math.abs(newLogPoints) : Math.abs(newLogPoints);

    const log: BehaviorLog = {
      id: `profile-log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      date: new Date().toISOString().split("T")[0],
      type: newLogType,
      tag: newLogTag,
      points,
      description: newLogDesc.trim()
    };

    onAddBehaviorLog(student.id, log, points);
    setNewLogDesc("");
    addSystemNotification("Observación cualitativa ingresada de inmediato", "success");
  };

  const handleDeleteObsLog = async (logId: string, points: number) => {
    const confirmed = requestConfirm 
      ? await requestConfirm("Eliminar Entrada", "¿Desea borrar esta entrada cualitativa del expediente docente?")
      : window.confirm("¿Desea borrar esta entrada cualitativa del expediente docente?");
    if (confirmed) {
      onRemoveBehaviorLog(student.id, logId, points);
      addSystemNotification("Incidencia removida de la bitácora", "info");
    }
  };

  // SVG trend lines calculation
  const trendPoints = useMemo(() => {
    const activities = activeClassroom.activities || [];
    if (activities.length === 0) return [];
    
    return activities.map((act, idx) => {
      const v = localGrades[act.id] ?? 0;
      const xDistance = activities.length > 1 ? 90 / (activities.length - 1) : 0;
      return {
        x: idx * xDistance + 10,
        y: Math.min(35, Math.max(5, 40 - (v * 3.5))) // map 0-10 on height grid
      };
    });
  }, [activeClassroom, localGrades]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Return button and full name wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-4">
        <button 
          id="btn-close-profile"
          onClick={onClose}
          className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-2 px-4 neo-border neo-shadow text-xs font-black uppercase flex items-center gap-2 cursor-pointer max-w-[200px]"
        >
          <ArrowLeft className="w-4 h-4 text-[#1A1A1A]" /> VOLVER AL DIRECTORIO
        </button>

        <div className="text-right font-mono text-[10px] uppercase font-bold text-gray-500">
          MATRÍCULA ID: {student.id}
        </div>
      </div>

      {/* Main Student details banner card */}
      <div className="bg-[#FAF8F5] neo-border p-6 neo-shadow relative flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-20 h-20 bg-bauhaus-blue text-white flex items-center justify-center font-black text-3xl neo-border rounded-sm select-none">
          {studentInitial}
        </div>
        
        <div className="flex-1 text-center md:text-left min-w-0">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
            <span className={`neo-border-thin px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
              student.status === "Activo" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-gray-100 text-gray-500 border-gray-300"
            }`}>
              {student.status}
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black mt-2 text-[#1A1A1A] uppercase">{student.name}</h2>
          <p className="text-xs font-mono text-gray-500">{student.email}</p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 font-mono text-xs">
            <div className="bg-white text-black neo-border-thin py-1 px-3">
              PROMEDIO GENERAL: <strong className="text-bauhaus-blue">{average}</strong>
            </div>
            <div className="bg-white text-[#D97706] font-bold neo-border-thin py-1 px-3">
              ★ {student.points} KARMA
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Score edit form (Col 5) */}
        <form onSubmit={handleUpdateGrades} className="lg:col-span-4 bg-white neo-border p-6 neo-shadow flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-black uppercase border-b-2 border-black pb-2 flex items-center gap-2 text-bauhaus-blue">
              <BookOpen className="w-5 h-5 text-bauhaus-blue" /> CALIFICACIONES CON SYLLABUS
            </h3>
            
            <p className="text-[11px] font-mono text-gray-500">
              Modifica directamente las notas registradas para este alumno según el acuerdo de evaluación del curso.
            </p>

            <div className="space-y-3 font-mono text-xs">
              {(activeClassroom.activities || []).map((act) => {
                const val = localGrades[act.id] ?? 0;
                return (
                  <div key={act.id}>
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-[var(--text-main)]">{act.name} ({act.weight}%):</span>
                      <span className="text-bauhaus-blue font-black">{val}</span>
                    </div>
                    <input 
                      type="number" 
                      min={activeClassroom.minGrade ?? 0} 
                      max={activeClassroom.maxGrade ?? 10} 
                      step="0.1" 
                      value={val} 
                      onChange={(e) => {
                        const parsed = parseFloat(e.target.value) || 0;
                        setLocalGrades(prev => ({
                          ...prev,
                          [act.id]: parsed
                        }));
                      }}
                      className="w-full bg-[var(--bg-input)] text-[var(--text-main)] border border-black p-2 outline-none focus:bg-amber-50"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t-2 border-dashed border-[#1A1A1A]">
            <button 
              id="btn-update-grades"
              type="submit"
              className="w-full neo-btn bg-bauhaus-blue text-white py-3 border-2 border-black neo-shadow text-center font-black uppercase text-xs hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-white" /> ACTUALIZAR CALIFICACIONES
            </button>
          </div>
        </form>

        {/* Right Side: Charts + qualitative log (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Performance Trend SVG */}
          <div className="bg-white neo-border p-6 neo-shadow space-y-4">
            <h4 className="font-extrabold uppercase text-xs flex items-center gap-1 border-b border-gray-200 pb-1.5 text-black">
              <TrendingUp className="w-4 h-4 text-bauhaus-blue" /> CURVA DE DESEMPEÑO ACADÉMICO
            </h4>
            <p className="text-[10px] font-mono text-gray-500">Trazado visual de su evolución docente según las actividades del syllabus actual:</p>
            
            <div className="bg-[#FAF8F5] neo-border-thin p-4 h-32 relative flex items-center justify-center">
              {trendPoints.length > 0 ? (
                <svg viewBox="0 0 110 40" className="w-full h-full overflow-visible">
                  {/* Grid Lines scale */}
                  <line x1="0" y1="5" x2="110" y2="5" stroke="#ccc" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="110" y2="20" stroke="#ccc" strokeDasharray="2" strokeWidth="0.5" />
                  <line x1="0" y1="35" x2="110" y2="35" stroke="#ccc" strokeDasharray="2" strokeWidth="0.5" />
                  
                  {/* Performance curve */}
                  <polyline
                    fill="none"
                    stroke="#0055FF"
                    strokeWidth="2.5"
                    points={trendPoints.map(p => `${p.x},${p.y}`).join(" ")}
                  />
                  {/* Point circles dot */}
                  {trendPoints.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r="2.5"
                      fill="#FFD700"
                      stroke="#1A1A1A"
                      strokeWidth="1.2"
                    />
                  ))}
                </svg>
              ) : (
                <span className="font-mono text-xs text-gray-400">Sin actividades para graficar</span>
              )}
            </div>
          </div>

          {/* Qualitative Observation Chronology Logs */}
          <div className="bg-[#1A1A1A] text-gray-200 neo-border p-6 neo-shadow space-y-4">
            <h3 className="text-md font-black uppercase text-white flex items-center gap-2 border-b border-gray-700 pb-3">
              <Terminal className="w-5 h-5 text-bauhaus-yellow" />
              CONSOLA DE EXPEDIENTE Y BITÁCORA DEL ESTUDIANTE
            </h3>

            {/* Terminal qualitative stream */}
            <div className="space-y-3 font-mono text-xs max-h-[200px] overflow-y-auto pr-1">
              {student.behaviorLogs.map((log) => (
                <div key={log.id} className="bg-zinc-900 border border-zinc-700 p-2.5 rounded relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#FFD700] font-bold tracking-widest">{log.date}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                        log.type === "positivo" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : log.type === "academico" ? "bg-blue-950 text-blue-400 border border-blue-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}>
                        {log.tag}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`font-extrabold ${log.points > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {log.points > 0 ? `+${log.points}` : log.points} Karma
                      </span>
                      {/* Delete Log */}
                      <button 
                        onClick={() => handleDeleteObsLog(log.id, log.points)}
                        className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Borrar entrada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    {log.description}
                  </p>
                </div>
              ))}

              {student.behaviorLogs.length === 0 && (
                <p className="text-gray-500 italic text-center py-4">No existen observaciones registradas en este curso.</p>
              )}
            </div>

            {/* Micro qualitative logs writer form */}
            <form onSubmit={handleCreateObsLog} className="pt-3 border-t border-zinc-800 space-y-3">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Añadir nueva observación cualitativa:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="block text-[9px] text-gray-400 uppercase mb-0.5">Tipo Bitácora</label>
                  <select 
                    id="profile-obs-type"
                    value={newLogType} 
                    onChange={(e) => setNewLogType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-white focus:outline-none cursor-pointer"
                  >
                    <option value="positivo">Positivo (+)</option>
                    <option value="critico">Crítico (-)</option>
                    <option value="academico">Académico (*)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[9px] text-gray-400 uppercase mb-0.5">Categoría / Tag</label>
                  <input 
                    type="text" 
                    id="profile-obs-tag"
                    value={newLogTag}
                    onChange={(e) => setNewLogTag(e.target.value)}
                    placeholder="Ej: Liderazgo"
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] text-gray-400 uppercase mb-0.5">Karma</label>
                  <input 
                    type="number" 
                    id="profile-obs-points"
                    value={newLogPoints}
                    onChange={(e) => setNewLogPoints(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-white focus:outline-none"
                    min="1" max="5"
                  />
                </div>

                <div className="md:col-span-4 flex gap-2">
                  <input 
                    type="text" 
                    id="profile-obs-desc"
                    value={newLogDesc}
                    onChange={(e) => setNewLogDesc(e.target.value)}
                    placeholder="Escribe el suceso presenciado..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-white focus:outline-none"
                    required
                  />
                  <button 
                    id="btn-add-profile-obs"
                    type="submit"
                    className="bg-bauhaus-yellow text-black hover:bg-yellow-400 font-bold px-3 neo-border-thin text-xs cursor-pointer flex items-center justify-center"
                    title="Insertar"
                  >
                    <Plus className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
