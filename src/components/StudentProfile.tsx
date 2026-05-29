import React, { useState, useMemo } from "react";
import { Student, BehaviorLog, Group, Subject } from "../types";
import { 
  ArrowLeft, 
  User, 
  TrendingUp, 
  Map, 
  Terminal, 
  Award, 
  Trash2, 
  Save, 
  BookOpen, 
  Activity,
  Plus
} from "lucide-react";
import { motion } from "motion/react";

interface StudentProfileProps {
  student: Student;
  onClose: () => void;
  onUpdateStudentGrades: (studentId: string, updatedGrades: Student["grades"]) => void;
  onAddBehaviorLog: (studentId: string, log: BehaviorLog, pointsChange: number) => void;
  onRemoveBehaviorLog: (studentId: string, logId: string, pointsRefund: number) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
}

export default function StudentProfile({
  student,
  onClose,
  onUpdateStudentGrades,
  onAddBehaviorLog,
  onRemoveBehaviorLog,
  addSystemNotification
}: StudentProfileProps) {

  // Local Form state for modifying grades directly in the profile
  const [exam1, setExam1] = useState(student.grades.exam1);
  const [homework1, setHomework1] = useState(student.grades.homework1);
  const [exam2, setExam2] = useState(student.grades.exam2);
  const [project, setProject] = useState(student.grades.project);

  // Sync state if student changes
  React.useEffect(() => {
    setExam1(student.grades.exam1);
    setHomework1(student.grades.homework1);
    setExam2(student.grades.exam2);
    setProject(student.grades.project);
  }, [student]);

  // Qualitative micro-log state
  const [newLogTag, setNewLogTag] = useState("Observación");
  const [newLogPoints, setNewLogPoints] = useState(2);
  const [newLogDesc, setNewLogDesc] = useState("");
  const [newLogType, setNewLogType] = useState<"positivo" | "critico" | "academico">("positivo");

  // Calculate stats on the fly
  const average = useMemo(() => {
    return Number(((exam1 + exam2 + homework1 + project) / 4).toFixed(2));
  }, [exam1, exam2, homework1, project]);

  // Decode standard student initial dynamically (Surnames, Name -> Initial of Name)
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
      exam1,
      homework1,
      exam2,
      project
    });
    addSystemNotification(`Boletín de calificaciones actualizado para ${student.name}`, "success");
  };

  const handleCreateObsLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogDesc.trim()) return;

    const points = newLogType === "critico" ? -Math.abs(newLogPoints) : Math.abs(newLogPoints);

    const log: BehaviorLog = {
      id: `profile-log-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      type: newLogType,
      tag: newLogTag,
      points,
      description: newLogDesc.trim()
    };

    onAddBehaviorLog(student.id, log, points);
    addSystemNotification("Observación cualitativa ingresada de inmediato", "success");
    setNewLogDesc("");
  };

  const handleDeleteObsLog = (logId: string, points: number) => {
    if (window.confirm("¿Desea borrar esta entrada cualitativa del expediente docente?")) {
      onRemoveBehaviorLog(student.id, logId, points);
      addSystemNotification("Incidencia removida de la bitácora", "info");
    }
  };

  // SVG trend lines calculation
  const trendPoints = useMemo(() => {
    const values = [student.grades.exam1, student.grades.homework1, student.grades.exam2, student.grades.project];
    // Scale 1 to 10 mapped inside a 100x40 viewport
    return values.map((v, idx) => ({
      x: idx * 30 + 10,
      y: 40 - (v * 3.5) // map 0-10 on height grid
    }));
  }, [student, exam1, exam2, homework1, project]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Return button and full name wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <button 
          id="btn-close-profile"
          onClick={onClose}
          className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-2 px-4 neo-border neo-shadow text-xs font-black uppercase flex items-center gap-2 cursor-pointer max-w-[150px]"
        >
          <ArrowLeft className="w-4 h-4" /> VOLVER AL DIRECTORIO
        </button>

        <div className="text-right font-mono text-[10px] uppercase font-bold text-gray-500">
          MATRÍCULA ID: {student.id}
        </div>
      </div>

      {/* Main Student details banner card */}
      <div className="bg-[#F5F5F0] neo-border p-6 neo-shadow relative flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Typographical Initial badge in substitute of profile pictures */}
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
            <div className="bg-white neo-border-thin py-1 px-3">
              PROMEDIO: <strong className="text-bauhaus-blue">{average}</strong>
            </div>
            <div className="bg-white neo-border-thin py-1 px-3 text-bauhaus-yellow-600 font-bold">
              ★ {student.points} KARMA
            </div>
            <div className="bg-white neo-border-thin py-1 px-3">
              LÓGICA: <strong className="text-black">{student.cognitiveSkills.logica}%</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Score edit form (Col 5) */}
        <form onSubmit={handleUpdateGrades} className="lg:col-span-4 bg-white neo-border p-6 neo-shadow flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-md font-black uppercase border-b-2 border-black pb-2 flex items-center gap-2 text-bauhaus-blue">
              <BookOpen className="w-5 h-5" /> Calificaciones Académicas
            </h3>
            
            <p className="text-[11px] font-mono text-gray-500">
              Modifica directamente las notas registradas para este alumno dentro del trimestre de clases.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Examen Parcial 1:</span>
                  <span className="text-bauhaus-blue">{exam1}</span>
                </div>
                <input 
                  type="number" min="1" max="10" step="0.1" 
                  value={exam1} 
                  onChange={(e) => setExam1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white neo-border-thin p-1.5 focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Bitácora / Tareas 1:</span>
                  <span className="text-bauhaus-blue">{homework1}</span>
                </div>
                <input 
                  type="number" min="1" max="10" step="0.1" 
                  value={homework1} 
                  onChange={(e) => setHomework1(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white neo-border-thin p-1.5 focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Examen Parcial 2:</span>
                  <span className="text-bauhaus-blue">{exam2}</span>
                </div>
                <input 
                  type="number" min="1" max="10" step="0.1" 
                  value={exam2} 
                  onChange={(e) => setExam2(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white neo-border-thin p-1.5 focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Proyecto Grupal Final:</span>
                  <span className="text-bauhaus-blue">{project}</span>
                </div>
                <input 
                  type="number" min="1" max="10" step="0.1" 
                  value={project} 
                  onChange={(e) => setProject(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white neo-border-thin p-1.5 focus:outline-none focus:bg-amber-50"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t-2 border-dashed border-[#1A1A1A]">
            <button 
              id="btn-update-grades"
              type="submit"
              className="w-full neo-btn bg-bauhaus-blue text-white py-3 neo-border neo-shadow text-center font-black uppercase text-xs hover:bg-blue-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> RE-CALCULAR BOLETÍN
            </button>
          </div>
        </form>

        {/* Right Side: Charts + qualitative log (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Performance Trend SVG & Cognitive Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white neo-border p-6 neo-shadow">
            
            {/* SVG Trend */}
            <div className="space-y-4">
              <h4 className="font-extrabold uppercase text-xs flex items-center gap-1 border-b border-gray-200 pb-1.5">
                <TrendingUp className="w-4 h-4 text-bauhaus-blue" /> Desempeño
              </h4>
              <p className="text-[10px] font-mono text-gray-500">Curva de trayectoria académica de evaluaciones parciales y proyectos:</p>
              
              <div className="bg-[#F5F5F0] neo-border-thin p-2 h-28 relative flex items-center justify-center">
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
                      r="2"
                      fill="#FFD700"
                      stroke="#1A1A1A"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Labels index text */}
                  <text x="10" y="39" fontSize="3" fontFamily="monospace" fill="#777">Ex1</text>
                  <text x="40" y="39" fontSize="3" fontFamily="monospace" fill="#777">Tar</text>
                  <text x="70" y="39" fontSize="3" fontFamily="monospace" fill="#777">Ex2</text>
                  <text x="100" y="39" fontSize="3" fontFamily="monospace" fill="#777">Proj</text>
                </svg>
              </div>
            </div>

            {/* Cognitive bars */}
            <div className="space-y-2">
              <h4 className="font-extrabold uppercase text-xs flex items-center gap-1 border-b border-gray-200 pb-1.5">
                <Map className="w-4 h-4 text-bauhaus-yellow-600" /> Mapa Cognitivo
              </h4>
              <p className="text-[10px] font-mono text-gray-500">Porcentajes de aptitudes operativas:</p>
              
              <div className="space-y-1.5 font-mono text-[9px]">
                {[
                  { label: "Lógica / Análisis", val: student.cognitiveSkills.logica, color: "bg-bauhaus-blue" },
                  { label: "Creatividad / Alternativas", val: student.cognitiveSkills.creatividad, color: "bg-bauhaus-yellow" },
                  { label: "Colaboración", val: student.cognitiveSkills.colaboracion, color: "bg-bauhaus-green" },
                  { label: "Liderazgo / Iniciativa", val: student.cognitiveSkills.liderazgo, color: "bg-bauhaus-red" }
                ].map((sk) => (
                  <div key={sk.label} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{sk.label}</span>
                      <span>{sk.val}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 neo-border-thin">
                      <div className={`${sk.color} h-full`} style={{ width: `${sk.val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Qualitative Observation Chronology Logs */}
          <div className="bg-[#1A1A1A] text-gray-200 neo-border p-6 neo-shadow space-y-4">
            <h3 className="text-md font-black uppercase text-white flex items-center gap-2 border-b border-gray-700 pb-3">
              <Terminal className="w-5 h-5 text-bauhaus-yellow" />
              Consola de Bitácora Cualitativa Analógica
            </h3>

            {/* Terminal qualitative stream */}
            <div className="space-y-3 font-mono text-xs max-h-[160px] overflow-y-auto pr-1">
              {student.behaviorLogs.map((log) => (
                <div key={log.id} className="bg-zinc-900 border border-zinc-700 p-2.5 rounded relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-[#FFD700] font-bold tracking-widest">{log.date}</span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                        log.type === "positivo" ? "bg-emerald-950 text-emerald-400" : log.type === "academico" ? "bg-blue-950 text-blue-400" : "bg-rose-950 text-rose-400"
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
                <p className="text-gray-500 italic text-center py-4">No existen incidentes registrados en el periodo escolar.</p>
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
                    className="w-full bg-zinc-900 border border-zinc-700 p-2 text-xs font-mono text-white focus:outline-none"
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
                  <label className="block text-[9px] text-gray-400 uppercase mb-0.5">Puntos Karma</label>
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
                    <Plus className="w-4 h-4" />
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
