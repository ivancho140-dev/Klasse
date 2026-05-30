import React, { useState, useMemo } from "react";
import { Student, Classroom, GradeActivity } from "../types";
import { 
  Award, 
  Percent, 
  Check, 
  HelpCircle, 
  Plus, 
  Minus, 
  ChevronRight, 
  FileText, 
  Save, 
  AlertTriangle,
  RefreshCw,
  Sliders,
  Filter,
  UserCheck,
  Star,
  Trash2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GradesManagementProps {
  students: Student[];
  onUpdateStudentGrades: (studentId: string, updatedGrades: Student["grades"]) => void;
  onUpdateStudent: (studentId: string, updatedFields: Partial<Student>) => void;
  activeClassroom: Classroom;
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
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  requestConfirm?: (title: string, message: string) => Promise<boolean>;
}

export default function GradesManagement({
  students,
  onUpdateStudentGrades,
  onUpdateStudent,
  activeClassroom,
  onUpdateClassroom,
  addSystemNotification,
  requestConfirm
}: GradesManagementProps) {

  // Classroom grading settings local states
  const [minLabel, setMinLabel] = useState(0); // usually 0
  const [maxGradeVal, setMaxGradeVal] = useState(activeClassroom.maxGrade || 10);
  const [passGradeVal, setPassGradeVal] = useState(activeClassroom.passingGrade || 6);

  // Custom dynamic activities
  const [syllabusActivities, setSyllabusActivities] = useState<GradeActivity[]>([]);

  const [isEditingSyllabus, setIsEditingSyllabus] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "approved" | "atRisk">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const totalWeight = syllabusActivities.reduce((sum, act) => sum + act.weight, 0);

  // Sync state with active classroom when it transitions
  React.useEffect(() => {
    setMaxGradeVal(activeClassroom.maxGrade || 10);
    setPassGradeVal(activeClassroom.passingGrade || 6);
    
    setSyllabusActivities(activeClassroom.activities ? [...activeClassroom.activities] : [
      { id: "exam1", name: "Examen 1", weight: 30 },
      { id: "homework1", name: "Tarea 1", weight: 20 },
      { id: "exam2", name: "Examen 2", weight: 30 },
      { id: "project", name: "Proyecto", weight: 20 }
    ]);
  }, [activeClassroom]);

  const handleAddSyllabusActivity = () => {
    const newId = `act-${Date.now()}`;
    setSyllabusActivities(prev => [
      ...prev,
      { id: newId, name: `Nueva Actividad ${prev.length + 1}`, weight: 10 }
    ]);
  };

  const handleRemoveSyllabusActivity = (id: string) => {
    setSyllabusActivities(prev => {
      if (prev.length <= 1) {
        addSystemNotification("Debe existir al menos una actividad evaluada en el acuerdo sobre notas", "warning");
        return prev;
      }
      return prev.filter(act => act.id !== id);
    });
  };

  const handleUpdateActivityField = (id: string, field: "name" | "weight", val: string | number) => {
    setSyllabusActivities(prev => prev.map(act => {
      if (act.id === id) {
        return {
          ...act,
          [field]: field === "weight" ? (Math.max(0, parseInt(val as string) || 0)) : val
        };
      }
      return act;
    }));
  };

  // Handle saving the syllabus/grade parameters
  const handleSaveSyllabus = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      addSystemNotification(`La suma de los porcentajes de acuerdo debe ser exactamente 100%. Actualmente es: ${totalWeight}%`, "warning");
      return;
    }
    if (passGradeVal > maxGradeVal || passGradeVal < 0) {
      addSystemNotification("La nota mínima aprobatoria debe ser menor o igual a la nota máxima del curso", "warning");
      return;
    }

    onUpdateClassroom(
      activeClassroom.id,
      activeClassroom.name,
      activeClassroom.institution,
      activeClassroom.schedule,
      0, // min is always 0
      maxGradeVal,
      passGradeVal,
      syllabusActivities,
      activeClassroom.periodType || "trimestre",
      activeClassroom.periodName || "Trimestre 1 Escolar"
    );
    setIsEditingSyllabus(false);
  };

  // Helper formula to compute weighted score dynamically based on customizable activities
  const calculateWeightedAverage = (student: Student) => {
    const activities = activeClassroom.activities || [];
    let sumPoints = 0;
    let sumWeights = 0;

    activities.forEach(act => {
      const score = student.grades[act.id] ?? 0;
      sumPoints += (score * act.weight);
      sumWeights += act.weight;
    });

    const result = sumWeights > 0 ? (sumPoints / sumWeights) : 0;
    return Number(result.toFixed(2));
  };

  // Inline inputs state management to ensure immediate correctable feedback
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [inlineGrades, setInlineGrades] = useState<Student["grades"] | null>(null);
  const [rawInputGrades, setRawInputGrades] = useState<Record<string, string>>({});

  const startEditingGrades = (student: Student) => {
    setEditingStudentId(student.id);
    setInlineGrades({ ...student.grades });

    const initialRaw: Record<string, string> = {};
    const activities = activeClassroom.activities || [];
    activities.forEach(act => {
      initialRaw[act.id] = (student.grades[act.id] !== undefined ? student.grades[act.id] : 0).toString();
    });
    // Fallbacks
    ["exam1", "homework1", "exam2", "project"].forEach(k => {
      if (initialRaw[k] === undefined) {
        initialRaw[k] = (student.grades[k] ?? 0).toString();
      }
    });
    setRawInputGrades(initialRaw);
  };

  const handleInlineGradeChange = (key: string, valueStr: string) => {
    // Preserve string exactly as written to allow typing "2." and backspacing everything
    setRawInputGrades(prev => ({
      ...prev,
      [key]: valueStr
    }));

    let numeric = parseFloat(valueStr);
    if (isNaN(numeric)) {
      numeric = 0;
    }
    if (inlineGrades) {
      setInlineGrades({
        ...inlineGrades,
        [key]: numeric
      });
    }
  };

  const saveInlineGrades = (studentId: string) => {
    if (!inlineGrades || !rawInputGrades) return;

    const max = activeClassroom.maxGrade || 10;
    const nextGrades = { ...inlineGrades };
    const activities = activeClassroom.activities || [];

    // Parse latest inputs from raw strings
    activities.forEach(act => {
      let val = parseFloat(rawInputGrades[act.id] || "0");
      if (isNaN(val)) val = 0;
      nextGrades[act.id] = val;
    });

    // Validate ranges
    for (const act of activities) {
      const val = nextGrades[act.id];
      if (val < 0 || val > max) {
        addSystemNotification(`Cada nota ingresada debe estar comprendida dentro del rango establecido (0.0 - ${max})`, "warning");
        return;
      }
    }

    onUpdateStudentGrades(studentId, nextGrades);
    setEditingStudentId(null);
    setInlineGrades(null);
    setRawInputGrades({});
    addSystemNotification("Calificaciones actualizadas de manera segura", "success");
  };

  // Quick helper to increment / decrement plain Extra points (Karma) sequentially
  const handleModifyKarmaPoints = (student: Student, delta: number) => {
    const current = student.points || 0;
    const nextPoints = Math.max(0, current + delta);
    onUpdateStudent(student.id, { points: nextPoints });
    addSystemNotification(`Puntos extra de ${student.name.split(",")[0]} reajustados a: ${nextPoints}`, "success");
  };

  // Filter & sort list on search / stats risk
  const processedList = useMemo(() => {
    let result = students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      const avg = calculateWeightedAverage(s);
      const isApproved = avg >= (activeClassroom.passingGrade || 6);

      if (filterMode === "approved") {
        return matchesSearch && s.status === "Activo" && isApproved;
      }
      if (filterMode === "atRisk") {
        return matchesSearch && s.status === "Activo" && !isApproved;
      }
      return matchesSearch && s.status === "Activo";
    });

    // Default school grid order is alphabetical
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchQuery, filterMode, activeClassroom]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 animate-fade-in"
    >
      {/* Tab Switch Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2 tracking-tight">
            <Award className="w-8 h-8 text-bauhaus-blue" />
            CALIFICACIONES Y SYLLABUS
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Gestión de evaluaciones y visualizaciones del acuerdo escolar. Clase: <strong className="text-bauhaus-blue">{activeClassroom.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditingSyllabus(!isEditingSyllabus)}
            className="neo-btn bg-white hover:bg-zinc-100 text-xs font-black uppercase px-4 py-2 border-2 border-black neo-shadow font-mono flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-bauhaus-blue" />
            {isEditingSyllabus ? "Ocultar Acuerdo" : "Editar Acuerdo sobre Notas"}
          </button>
        </div>
      </div>

      {/* SYLLABUS AGREEMENT CONFIGURATION PANEL */}
      <AnimatePresence>
        {isEditingSyllabus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white neo-border p-6 neo-shadow space-y-6 overflow-hidden"
          >
            <div className="border-b-2 border-black pb-2 flex justify-between items-center">
              <h3 className="text-md font-black uppercase flex items-center gap-2 text-[#1A1A1A]">
                <Percent className="w-5 h-5 text-bauhaus-blue" /> Configuración de Rango y Syllabus
              </h3>
              <span className="font-mono text-[10px] font-bold bg-[#1A1A1A] text-white px-2 py-0.5">
                PARÁMETROS DEL CURSO
              </span>
            </div>

            <form onSubmit={handleSaveSyllabus} className="space-y-6">
              
              {/* Grading Ranges Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#F5F5F0] p-4 font-mono select-none border-2 border-black">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
                    Nota Mínima (Fijo)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={0}
                    className="w-full bg-gray-200 border border-gray-400 p-2 text-xs font-mono select-none"
                  />
                  <p className="text-[9px] text-gray-500 mt-1">El valor mínimo estándar es cero (0.0)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
                    Nota Máxima del Curso
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="1"
                    max="100"
                    placeholder="Ej. 10.0, 5.0 o 7.0"
                    value={maxGradeVal}
                    onChange={(e) => setMaxGradeVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white neo-border-thin p-2 text-xs font-mono outline-none"
                  />
                  <p className="text-[9px] text-gray-500 mt-1">Límite superior (ej. 5.0 en Colombia, 7.0 en Chile, 10.0 en MX)</p>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-700 mb-1">
                    Nota Mínima Aprobatoria o de Aprobación
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="1"
                    max="100"
                    placeholder="Ej. 6.0, 3.0"
                    value={passGradeVal}
                    onChange={(e) => setPassGradeVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white neo-border-thin p-2 text-xs font-mono outline-none"
                  />
                  <p className="text-[9px] text-gray-500 mt-1">Mínimo para pasar la materia (ej. 3.0 o 6.0)</p>
                </div>
              </div>

              {/* Custom Activity Weights */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-mono text-[#1A1A1A] uppercase font-black">
                    Configuración de Actividades del Acuerdo y Porcentajes de Ponderación:
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSyllabusActivity}
                    className="px-3 py-1 bg-bauhaus-blue text-white hover:bg-blue-700 font-mono text-[11px] font-black uppercase rounded-sm border border-[#1A1A1A] flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Añadir Actividad
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {syllabusActivities.map((act, idx) => (
                    <div key={act.id} className="bg-[#FAF8F5] p-3 border-2 border-[#1A1A1A] space-y-2.5 shadow-sm relative">
                      <div className="flex justify-between items-center bg-[#F5F5F0] -mx-3 -mt-3 p-1.5 px-3 border-b-2 border-black mb-1">
                        <span className="text-[10px] font-mono font-black text-bauhaus-blue uppercase">
                          Actividad #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSyllabusActivity(act.id)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 p-1 rounded-sm transition-colors cursor-pointer"
                          title="Eliminar Actividad"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono">Nombre de la Actividad</label>
                        <input 
                          type="text" 
                          required
                          value={act.name}
                          onChange={(e) => handleUpdateActivityField(act.id, "name", e.target.value)}
                          placeholder="Ej. Taller Inicial"
                          className="w-full bg-white border border-gray-400 p-1.5 text-xs font-mono focus:bg-amber-50 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono">Ponderación (%)</label>
                        <div className="flex items-center gap-2 border border-gray-400 bg-white p-1 px-2">
                          <input 
                            type="number" 
                            required
                            min="0"
                            max="100"
                            value={act.weight ?? 0}
                            onChange={(e) => handleUpdateActivityField(act.id, "weight", e.target.value)}
                            className="w-full bg-transparent p-0 text-xs font-mono text-left outline-none border-none focus:ring-0"
                          />
                          <span className="text-xs font-mono font-bold text-[#1A1A1A]">%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit panel indicator info */}
              <div className="flex items-center justify-between pt-4 border-t border-black/10">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className={`px-2 py-0.5 font-bold uppercase ${totalWeight === 100 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                    Suma total de pesos: {totalWeight}%
                  </span>
                  {totalWeight !== 100 && (
                    <span className="text-red-700 font-extrabold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> ¡Debe sumar exactamente 100%!
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={totalWeight !== 100}
                  className={`neo-btn py-3 px-6 text-xs uppercase font-black cursor-pointer ${
                    totalWeight === 100 ? "bg-bauhaus-yellow text-black border-2 border-black neo-shadow" : "bg-gray-200 text-gray-400 border-gray-300 opacity-60"
                  }`}
                >
                  Confirmar Acuerdo y Guardar Cambios
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYLLABUS WEIGHT AGREEMENT DISPLAY HEADSUP BAR */}
      <div className="bg-[#1A1A1A] text-white p-4 font-mono text-[10px] uppercase flex flex-col md:flex-row gap-4 items-center justify-between rounded-sm">
        <div className="flex items-center gap-2">
          <span className="bg-bauhaus-blue rounded-full px-2 py-0.5 font-black text-[9px]">Syllabus Definido:</span>
          <span>
            {(activeClassroom.activities || []).map(act => `${act.name} (${act.weight}%)`).join(" • ")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Rango de Nota: <strong>0.0 a {activeClassroom.maxGrade || 10}</strong></span>
          <span className="border-l border-white/20 pl-3">Nota Aprobación: <strong className="text-emerald-400">{activeClassroom.passingGrade || 6}</strong></span>
        </div>
      </div>

      {/* CONTROLS FILTERS */}
      <div className="bg-[#FAF8F5] neo-border p-4 neo-shadow flex flex-col md:flex-row gap-4 items-center justify-between select-none">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Filtrar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white neo-border-thin p-2 text-xs font-mono focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase neo-border-thin cursor-pointer ${
                filterMode === "all" ? "bg-[#1A1A1A] text-white" : "bg-white text-[#1A1A1A] hover:bg-zinc-100"
              }`}
            >
              Todos ({students.filter(s => s.status === "Activo").length})
            </button>
            <button
              onClick={() => setFilterMode("approved")}
              className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase neo-border-thin cursor-pointer focus:outline-none ${
                filterMode === "approved" ? "bg-emerald-700 text-white" : "bg-white text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              Aprobados ({students.filter(s => s.status === "Activo" && calculateWeightedAverage(s) >= (activeClassroom.passingGrade || 6)).length})
            </button>
            <button
              onClick={() => setFilterMode("atRisk")}
              className={`px-3 py-1.5 font-mono text-[10px] font-black uppercase neo-border-thin cursor-pointer ${
                filterMode === "atRisk" ? "bg-rose-700 text-white" : "bg-white text-rose-800 hover:bg-rose-50"
              }`}
            >
              Por debajo del Mínimo ({students.filter(s => s.status === "Activo" && calculateWeightedAverage(s) < (activeClassroom.passingGrade || 6)).length})
            </button>
          </div>
          
          <button
            onClick={() => { window.focus(); window.print(); }}
            className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-1.5 px-3 neo-border-thin flex items-center gap-1 text-[10px] font-mono cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-bauhaus-blue font-bold" /> IMPRIMIR PLANILLA
          </button>
        </div>
      </div>

      {/* EDITABLE GRID SHEET */}
      <div className="bg-white neo-border neo-shadow overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-wider select-none">
              <th className="p-3 border-r border-gray-700 w-12 text-center bg-zinc-800 font-bold">N°</th>
              <th className="p-3 border-r border-gray-700 w-64 text-left font-bold">Estudiante (Apellido, Nombre)</th>
              
              {/* Dynamic Activities headers as defined in syllabus agreement */}
              {(activeClassroom.activities || []).map((act) => (
                <th key={act.id} className="p-3 border-r border-gray-700 text-center text-blue-300 min-w-[110px] font-black uppercase font-mono">
                  {act.name}
                  <span className="block text-[8px] font-mono opacity-75">({act.weight}%)</span>
                </th>
              ))}

              <th className="p-3 border-r border-gray-700 text-center w-28 bg-[#2A2A2A] font-extrabold">Parcial</th>
              <th className="p-3 border-r border-gray-700 text-center w-32 text-bauhaus-yellow font-extrabold">Puntos Karma</th>
              <th className="p-3 text-center w-28 font-bold">Acción</th>
            </tr>
          </thead>
          <tbody>
            {processedList.map((std, rIdx) => {
              const pAverage = calculateWeightedAverage(std);
              const minimum = activeClassroom.passingGrade || 6;
              const isApproved = pAverage >= minimum;
              const isCurrentlyEditing = editingStudentId === std.id;

              return (
                <tr key={std.id} className="border-b border-[#1A1A1A] hover:bg-orange-50/20 transition-all font-mono">
                  {/* Number count tag */}
                  <td className="p-3 border-r border-gray-300 text-center text-gray-500 bg-[#F5F5F0] font-black select-none">
                    {rIdx + 1}
                  </td>

                  {/* Name field */}
                  <td className="p-3 border-r border-gray-300 font-extrabold text-black uppercase">
                    {std.name}
                  </td>

                  {/* Dynamic activity grade cells */}
                  {(activeClassroom.activities || []).map((act) => {
                    const score = std.grades[act.id] !== undefined ? std.grades[act.id] : 0;
                    return (
                      <td key={act.id} className="p-2 border-r border-gray-300 text-center font-bold">
                        {isCurrentlyEditing ? (
                          <input
                            type="text"
                            value={rawInputGrades[act.id] ?? ""}
                            onChange={(e) => handleInlineGradeChange(act.id, e.target.value)}
                            className="w-16 bg-[#F5F5F0] border-2 border-black text-center p-1 font-mono text-xs focus:ring-0 outline-none"
                          />
                        ) : (
                          <span className="text-gray-800 text-sm">{(score).toFixed(1)}</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Calculated weighted score */}
                  <td className="p-3 border-r border-gray-300 text-center font-black text-[#1A1A1A] bg-[#FAF8F5]">
                    <span className={`px-2 py-0.5 rounded-sm block font-mono text-sm leading-6 border ${
                      isApproved 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                        : "bg-rose-50 text-rose-800 border-rose-300 animate-pulse font-extrabold"
                    }`}>
                      {pAverage.toFixed(2)}
                    </span>
                  </td>

                  {/* Puntos Extra direct adjuster */}
                  <td className="p-2 border-r border-gray-300 text-center bg-yellow-50/20 select-none">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleModifyKarmaPoints(std, -1)}
                        className="w-5 h-5 bg-white border border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold hover:bg-red-50 hover:text-red-700 cursor-pointer"
                        title="Descontar 1 Punto"
                      >
                        -
                      </button>
                      <span className="font-extrabold text-[#1A1A1A] text-xs">
                        ★ {std.points || 0}
                      </span>
                      <button
                        onClick={() => handleModifyKarmaPoints(std, 1)}
                        className="w-5 h-5 bg-white border border-[#1A1A1A] flex items-center justify-center text-[10px] font-bold hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer"
                        title="Otorgar 1 Punto Extra"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* Action inline save/edit clickers */}
                  <td className="p-2 text-center">
                    {isCurrentlyEditing ? (
                      <button
                        onClick={() => saveInlineGrades(std.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold px-3 py-1.5 text-[10px] uppercase flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditingGrades(std)}
                        className="bg-white border border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white font-mono text-[9px] font-bold py-1 px-2.5 uppercase transition-colors inline-block cursor-pointer"
                      >
                        Corregir
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {processedList.length === 0 && (
          <div className="p-12 text-center text-gray-500 font-mono uppercase bg-[#FAF8F5]">
            No se identificaron alumnos en el listado activo.
          </div>
        )}
      </div>
    </motion.div>
  );
}
