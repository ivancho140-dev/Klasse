import React, { useState, useMemo } from "react";
import { Student, Subject, Group, Classroom } from "../types";
import { 
  FileSpreadsheet, 
  FileDown, 
  Filter, 
  TrendingUp, 
  Cpu, 
  Award, 
  BarChart4, 
  Download,
  Percent,
  Sparkles,
  HelpCircle,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReportsProps {
  students: Student[];
  activeClassroom: Classroom;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
}

export default function Reports({ students, activeClassroom, addSystemNotification }: ReportsProps) {

  // Advanced dynamic filters
  const [selectedActivity, setSelectedActivity] = useState<string>("Todos");
  const [selectedPerformance, setSelectedPerformance] = useState<string>("Todos");

  const filterActivitiesList = useMemo(() => {
    const list = [{ id: "Todos", name: "🏆 Promedio Ponderado" }];
    if (activeClassroom && activeClassroom.activities) {
      activeClassroom.activities.forEach(act => {
        list.push({ id: act.id, name: `📝 ${act.name} (${act.weight}%)` });
      });
    }
    return list;
  }, [activeClassroom]);

  // Export progress animation states
  const [exportType, setExportType] = useState<"pdf" | "excel" | null>(null);
  const [exportProgress, setExportProgress] = useState(0);

  const passingThreshold = activeClassroom?.passingGrade ?? 6.0;
  const maxGradeScale = activeClassroom?.maxGrade ?? 10.0;

  // Helper to compute student grade based on selected filter
  const getStudentScore = (s: Student) => {
    if (selectedActivity === "Todos") {
      const activities = activeClassroom?.activities || [];
      let sumPoints = 0;
      let sumWeights = 0;
      activities.forEach(act => {
        const score = s.grades[act.id] ?? 0;
        sumPoints += (score * act.weight);
        sumWeights += act.weight;
      });
      return sumWeights > 0 ? Number((sumPoints / sumWeights).toFixed(2)) : 0;
    } else {
      return s.grades[selectedActivity] ?? 0;
    }
  };

  // Filter students based on selection
  const targetStudents = useMemo(() => {
    return students.filter(s => {
      const score = getStudentScore(s);
      let matchPerf = true;
      if (selectedPerformance === "aprobado") {
        matchPerf = score >= passingThreshold;
      } else if (selectedPerformance === "reprobado") {
        matchPerf = score < passingThreshold;
      }
      
      return matchPerf;
    });
  }, [students, selectedActivity, selectedPerformance, activeClassroom]);

  // Calculations
  const metrics = useMemo(() => {
    if (targetStudents.length === 0) return { avg: 0, highest: 0, lowest: 0, passingPct: 0 };
    
    let sum = 0;
    let highest = 0;
    let lowest = maxGradeScale;
    let passingCount = 0;

    targetStudents.forEach(s => {
      const score = getStudentScore(s);
      sum += score;
      
      if (score > highest) highest = score;
      if (score < lowest) lowest = score;
      if (score >= passingThreshold) passingCount++;
    });

    return {
      avg: Number((sum / targetStudents.length).toFixed(2)),
      highest: Number(highest.toFixed(2)),
      lowest: Number(lowest.toFixed(2)),
      passingPct: Number(((passingCount / targetStudents.length) * 100).toFixed(0))
    };
  }, [targetStudents, selectedActivity, activeClassroom]);

  // Distribution chart categories calculation
  const distribution = useMemo(() => {
    let sob = 0; // Sobresaliente: >= 90%
    let apr = 0; // Aprobado: >= passingThreshold and < 90%
    let suf = 0; // Suficiente: >= 60% of scale and < passingThreshold
    let ins = 0; // Insuficiente: < 60% of scale or < passingThreshold depending on setting

    targetStudents.forEach(s => {
      const score = getStudentScore(s);
      const sobThreshold = maxGradeScale * 0.9;
      const sufThreshold = maxGradeScale * 0.6;
      
      if (score >= sobThreshold) {
        sob++;
      } else if (score >= passingThreshold) {
        apr++;
      } else if (score >= sufThreshold) {
        suf++;
      } else {
        ins++;
      }
    });

    const total = Math.max(1, targetStudents.length);
    const labelSob = `Excelente (≥ ${(maxGradeScale * 0.9).toFixed(1)})`;
    const labelApr = `Aprobado (≥ ${passingThreshold.toFixed(1)})`;
    const labelSuf = `Suficiente (≥ ${(maxGradeScale * 0.6).toFixed(1)})`;
    const labelIns = `Por Mejorar (< ${(maxGradeScale * 0.6).toFixed(1)})`;

    return [
      { label: labelSob, count: sob, percentage: Math.round((sob / total) * 100), color: "bg-bauhaus-blue" },
      { label: labelApr, count: apr, percentage: Math.round((apr / total) * 100), color: "bg-bauhaus-green" },
      { label: labelSuf, count: suf, percentage: Math.round((suf / total) * 100), color: "bg-bauhaus-yellow" },
      { label: labelIns, count: ins, percentage: Math.round((ins / total) * 100), color: "bg-bauhaus-red" }
    ];
  }, [targetStudents, selectedActivity, activeClassroom]);

  // Ranking Board (sorted by high average)
  const rankingList = useMemo(() => {
    return targetStudents.map(s => {
      const avg = getStudentScore(s);
      return { student: s, avg };
    })
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 4);
  }, [targetStudents, selectedActivity]);

  // Predictive Tool student selected
  const [predictStudentId, setPredictStudentId] = useState<string>(students[0]?.id || "");

  // Predictor Calculation Output
  const predictorOutput = useMemo(() => {
    const std = students.find(s => s.id === predictStudentId);
    if (!std) return null;

    const currentAvg = getStudentScore(std);
    // Let's weights: current grades (70%), attendance rate (20%), gamification points karma (10%)
    const attendanceRate = std.attendance ? (std.attendance.filter(a => a.status === "presente").length / Math.max(1, std.attendance.length)) : 1.0;
    const karmaBonus = Math.min(1.0, (std.points || 0) / 30); // max +1.0 grade bonus

    const predictedGrade = Number((currentAvg * 0.7 + (attendanceRate * maxGradeScale) * 0.2 + karmaBonus).toFixed(2));
    
    let confidence = "Alta";
    const totalSessions = std.attendance ? std.attendance.length : 0;
    if (totalSessions < 3) confidence = "Media-Baja (Pocos Datos Asistencia)";
    else {
      const gradedCount = Object.values(std.grades).filter(g => g > 0).length;
      if (gradedCount < 2) confidence = "Media (Pocas Evaluaciones)";
    }

    let advice = "Estudiante estable con excelente ritmo de asimilación.";
    if (predictedGrade < passingThreshold) {
      advice = "Riesgo académico detectado. Se sugiere mentoría complementaria inmediata.";
    } else if (predictedGrade >= (maxGradeScale * 0.9)) {
      advice = "Potencial sobresaliente. Candidato ideal para programa de alumnos destacados.";
    } else if (std.attendance && std.attendance.filter(a => a.status === "ausente").length > 1) {
      advice = "El comportamiento asiduo indica que mejorar la asistencia elevará sustancialmente la nota.";
    }

    return {
      currentAvg: Number(currentAvg.toFixed(2)),
      predictedGrade: Math.min(maxGradeScale, predictedGrade),
      confidence,
      advice
    };
  }, [predictStudentId, students, selectedActivity, activeClassroom]);

  const exportToExcelReal = () => {
    try {
      const headers = [
        "Estudiante",
        "Grupo",
        "Asistencia (%)",
        "Puntos Extra (Karmas)",
        "Estado",
        ...((activeClassroom.activities || []).map(a => a.name)),
        "Nota Final"
      ];

      const rows = targetStudents.map(s => {
        const presentCount = s.attendance ? s.attendance.filter(a => a.status === "presente").length : 0;
        const totalAttendance = s.attendance ? s.attendance.length : 0;
        const attendancePct = totalAttendance > 0 ? ((presentCount / totalAttendance) * 100).toFixed(0) : "100";
        
        const activityScores = (activeClassroom.activities || []).map(act => s.grades[act.id] ?? 0);
        const finalScore = getStudentScore(s);

        return [
          s.name,
          s.group,
          `${attendancePct}%`,
          s.points || 0,
          s.status,
          ...activityScores,
          finalScore
        ];
      });

      const csvContent = "\uFEFF" + [
        headers.join(","),
        ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte_Calificaciones_${activeClassroom.name.replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      addSystemNotification("Ocurrió un error al intentar generar la exportación de Excel.", "warning");
    }
  };

  // Handles export button clicks
  const triggerSimulationExport = (type: "pdf" | "excel") => {
    setExportType(type);
    setExportProgress(0);

    let progressVal = 0;
    const intv = setInterval(() => {
      progressVal += 20;
      if (progressVal >= 100) {
        clearInterval(intv);
        setExportProgress(100);
        setTimeout(() => {
          setExportType(null);
          window.focus();
          if (type === "excel") {
            exportToExcelReal();
            addSystemNotification("Se ha descargado la matriz de calificaciones CSV con éxito.", "success");
          } else if (type === "pdf") {
            window.print();
            addSystemNotification("Planilla de impresión enviada al sistema de impresión nativo.", "success");
          }
        }, 300);
      } else {
        setExportProgress(progressVal);
      }
    }, 150);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <BarChart4 className="w-8 h-8 text-bauhaus-blue" />
            INFORMES Y METRICAS GLOBAL
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Estadísticas analíticas de rendimiento grupal, cuadro de honor y predicciones estadísticas.
          </p>
        </div>

        {/* Global Action Export Mocks */}
        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button 
            id="btn-report-export-pdf"
            onClick={() => triggerSimulationExport("pdf")}
            disabled={exportType !== null}
            className="neo-btn bg-[#1A1A1A] text-white py-2 px-3 neo-border-thin flex items-center gap-1.5 hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
          >
            <FileDown className="w-4 h-4" /> EXPORTAR PDF
          </button>
          <button 
            id="btn-report-export-excel"
            onClick={() => triggerSimulationExport("excel")}
            disabled={exportType !== null}
            className="neo-btn bg-white hover:bg-gray-100 text-[#1A1A1A] py-2 px-3 neo-border-thin flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> EXPORTAR EXCEL
          </button>
          <button 
            id="btn-report-print"
            onClick={() => { window.focus(); window.print(); }}
            className="neo-btn bg-[#FFD214] hover:bg-amber-400 text-black py-2 px-3 neo-border-thin flex items-center gap-1.5 cursor-pointer font-bold"
          >
            <Printer className="w-4 h-4" /> IMPRIMIR INFORME
          </button>
        </div>
      </div>

      {/* Progress dialog overlay */}
      <AnimatePresence>
        {exportType !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bauhaus-yellow/15 neo-border p-4 neo-shadow font-mono text-xs text-[#1A1A1A] flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-bold uppercase">📥 COMPILANDO REPORTE DIGITAL INDIZADO...</p>
              <p className="text-gray-500 text-[10px]">Generando descriptores para {targetStudents.length} estudiantes...</p>
            </div>
            
            {/* ProgressBar */}
            <div className="flex-1 max-w-xs bg-gray-200 h-4 neo-border-thin relative">
              <div className="bg-[#1A1A1A] h-full transition-all duration-300" style={{ width: `${exportProgress}%` }}></div>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white mix-blend-difference">
                {exportProgress}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Filtering bar Row */}
      <div className="bg-[#F5F5F0] neo-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-mono text-xs font-black uppercase text-gray-700">Filtros de Análisis:</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Activity / Criterio Filter */}
          <div className="flex items-center bg-white neo-border-thin">
            <span className="bg-[#1A1A1A] text-white px-2 py-1 font-mono text-[9px] uppercase font-bold">Criterio</span>
            <select 
              id="report-activity-select"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="p-1 px-2 font-mono text-xs bg-white focus:outline-none"
            >
              {filterActivitiesList.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
            </select>
          </div>

          {/* Performance Filter */}
          <div className="flex items-center bg-white neo-border-thin">
            <span className="bg-[#1A1A1A] text-white px-2 py-1 font-mono text-[9px] uppercase font-bold">Rendimiento</span>
            <select 
              id="report-performance-select"
              value={selectedPerformance}
              onChange={(e) => setSelectedPerformance(e.target.value)}
              className="p-1 px-2 font-mono text-xs bg-white focus:outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="aprobado">Aprobados (≥ {passingThreshold})</option>
              <option value="reprobado">Riesgo / Alerta ({"<"} {passingThreshold})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main telemetry cards analytics layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Analytics Distribution bars Left 7 */}
        <div className="lg:col-span-7 bg-white neo-border p-6 neo-shadow space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h3 className="font-extrabold uppercase text-sm flex items-center gap-2">
              <BarChart4 className="w-5 h-5 text-bauhaus-blue" />
              Densidad de Distribución de Calificaciones
            </h3>
            <span className="font-mono text-[10px] text-gray-500">Muestras: {targetStudents.length}</span>
          </div>

          {/* Core values block */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
            <div className="bg-[#F5F5F0] p-3 neo-border-thin">
              <p className="text-gray-500 uppercase text-[9px] font-bold">Promedio Grupo</p>
              <p className="text-xl font-black text-bauhaus-blue mt-1">{metrics.avg}</p>
            </div>
            <div className="bg-[#F5F5F0] p-3 neo-border-thin">
              <p className="text-gray-500 uppercase text-[9px] font-bold">Nota Más Alta</p>
              <p className="text-xl font-black text-bauhaus-green mt-1">{metrics.highest}</p>
            </div>
            <div className="bg-[#F5F5F0] p-3 neo-border-thin">
              <p className="text-gray-500 uppercase text-[9px] font-bold">Nota Más Baja</p>
              <p className="text-xl font-black text-bauhaus-red mt-1">{metrics.lowest}</p>
            </div>
            <div className="bg-[#F5F5F0] p-3 neo-border-thin">
              <p className="text-gray-500 uppercase text-[9px] font-bold">Tasa Aprobación</p>
              <p className="text-xl font-black mt-1">{metrics.passingPct}%</p>
            </div>
          </div>

          {/* Interactive Custom SVG/Bulky Bar distribution layout */}
          <div className="space-y-4">
            <p className="font-mono text-xs text-gray-500">Estratificación en escala del 1.0 a 10.0:</p>
            
            <div className="space-y-3 font-mono text-xs">
              {distribution.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>{item.label}</span>
                    <span>
                      {item.count} alumnos ({item.percentage}%)
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div className="w-full bg-gray-100 h-5 neo-border-thin relative">
                    <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${Math.max(1, item.percentage)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top student list - Right 5 */}
        <div className="lg:col-span-5 bg-white neo-border p-6 neo-shadow space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <Award className="w-5 h-5 text-bauhaus-yellow-600 animate-bounce" />
              <h3 className="text-sm font-black uppercase">Cuadro de Honor (Máximo Rendimiento)</h3>
            </div>

            <p className="text-xs font-mono text-gray-500 mb-4">
              Nomina a los estudiantes con mejores promedios en base a las materias y filtros elegidos.
            </p>

            <div className="space-y-3">
              {rankingList.map(({ student, avg }, index) => (
                <div key={student.id} className="bg-[#F5F5F0] neo-border-thin p-3 flex items-center justify-between relative group hover:bg-white transition-all cursor-crosshair">
                  <div className="absolute top-0 right-0 bg-[#1A1A1A] text-white font-mono text-[9px] font-bold px-2.5 py-0.5">
                    Nº {index + 1}
                  </div>

                  <div className="flex items-center gap-3">
                    {student.avatar && student.avatar.startsWith("http") ? (
                      <img 
                        src={student.avatar} 
                        alt={student.name} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover neo-border-thin rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextElementSibling as HTMLDivElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    {(!student.avatar || !student.avatar.startsWith("http")) ? (
                      <div className="w-10 h-10 bg-bauhaus-blue text-white flex items-center justify-center font-mono font-black text-xs neo-border-thin rounded-full select-none">
                        {student.name[0]?.toUpperCase() || "?"}
                      </div>
                    ) : (
                      <div style={{ display: 'none' }} className="w-10 h-10 bg-bauhaus-blue text-white flex items-center justify-center font-mono font-black text-xs neo-border-thin rounded-full select-none">
                        {student.name[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-[#1A1A1A] truncate pr-8">{student.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Asistencia: {student.attendance && student.attendance.length > 0 ? ((student.attendance.filter(a => a.status === "presente").length / student.attendance.length) * 100).toFixed(0) : "100"}%
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs pr-2 font-black text-bauhaus-blue">
                    {avg}
                  </div>
                </div>
              ))}

              {rankingList.length === 0 && (
                <div className="bg-[#F5F5F0] neo-border-thin p-8 text-center text-gray-500 font-mono text-xs">
                  No hay estudiantes que califiquen en esta segmentación.
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 p-3 neo-border-thin text-[10px] font-mono text-center text-gray-600">
            ★ Premiación acumulativa docente vinculada directamente al sistema de Karma.
          </div>
        </div>
      </div>

      {/* NEW PREDICITIVE forecast panel */}
      <div className="bg-white neo-border p-6 neo-shadow">
        <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
          <Cpu className="w-6 h-6 text-bauhaus-blue" />
          <h3 className="font-extrabold uppercase text-lg">Predictor Estadístico de Desempeño Trimestral</h3>
        </div>

        <p className="text-xs font-mono text-gray-500 leading-relaxed mb-4">
          Nuestra matriz heurística analiza de forma ponderada (70% promedio corriente, 20% porcentaje asistencia, 10% puntos motivacionales de Karma) para proyectar el promedio final probable de cada alumno a fin de ciclo académico.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          
          {/* Selector block */}
          <div className="bg-[#F5F5F0] p-4 neo-border-thin space-y-3">
            <h4 className="font-black text-gray-700 uppercase">Elegir Alumno a Simular:</h4>
            
            <select 
              id="predict-student-select"
              value={predictStudentId}
              onChange={(e) => setPredictStudentId(e.target.value)}
              className="w-full bg-white neo-border-thin p-2 focus:outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.subject})</option>
              ))}
            </select>
          </div>

          {/* Results meters blocks */}
          {predictorOutput && (
            <>
              <div className="bg-[#F5F5F0] p-4 neo-border-thin flex flex-col justify-between text-black">
                <div>
                  <h4 className="font-black text-gray-700 uppercase mb-2">Desglose Predictivo:</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span>Promedio Actual:</span>
                      <strong>{predictorOutput.currentAvg}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Proyección Ponderada:</span>
                      <strong className="text-bauhaus-blue">{predictorOutput.predictedGrade}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Nivel Confianza:</span>
                      <strong className="text-amber-600 bg-amber-100 px-1 py-0.5 rounded text-[10px]">
                        {predictorOutput.confidence}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-dashed border-gray-300">
                  <span className={`font-black uppercase text-[10px] py-1 px-3 text-white inline-block ${
                    predictorOutput.predictedGrade >= 7.0 ? "bg-bauhaus-green" : "bg-bauhaus-red"
                  }`}>
                    {predictorOutput.predictedGrade >= 7.0 ? "✓ Aprueba Seguro" : "⚠ Alerta Crítica"}
                  </span>
                </div>
              </div>

              {/* Advice diagnostic block */}
              <div className="bg-white border-2 border-[#1A1A1A] p-4 neo-shadow-yellow flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-black uppercase mb-1 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-bauhaus-yellow-600" /> Diagnóstico Recomendado
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-[11px] pt-1.5">
                    "{predictorOutput.advice}"
                  </p>
                </div>

                <div className="text-[10px] text-gray-400 mt-4 pt-1">
                  * Algoritmo heurístico local referencial KLASSE-CORE.
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </motion.div>
  );
}
