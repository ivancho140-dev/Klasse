import React, { useState, useMemo } from "react";
import { Student } from "../types";
import { 
  BookOpen, 
  Search, 
  Trash2, 
  ChevronRight, 
  ExternalLink,
  ArrowUpDown,
  SlidersHorizontal,
  Mail,
  Printer
} from "lucide-react";
import { motion } from "motion/react";

interface StudentDirectoryProps {
  students: Student[];
  onSelectStudent: (id: string) => void;
  onRemoveStudent: (id: string) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  requestConfirm?: (title: string, message: string) => Promise<boolean>;
}

export default function StudentDirectory({ 
  students, 
  onSelectStudent, 
  onRemoveStudent,
  addSystemNotification,
  requestConfirm
}: StudentDirectoryProps) {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [sortBy, setSortBy] = useState<"alphabetical" | "grades_desc" | "grades_asc" | "absences_desc" | "karma_desc">("alphabetical");

  // Status option filters
  const statuses = ["Todos", "Activo", "Inactivo"];

  // Utility to calculate average on the fly
  const getAverage = (student: Student) => {
    if (!student.grades) return 0;
    const { exam1, exam2, homework1, project } = student.grades;
    return Number(((exam1 + exam2 + homework1 + project) / 4).toFixed(2));
  };

  // Utility to count total unexcused absences
  const getAbsencesCount = (student: Student) => {
    if (!student.attendance) return 0;
    return student.attendance.filter(a => a.status === "ausente").length;
  };

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === "Todos" || student.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, selectedStatus]);

  // Sort students customized criteria dynamically
  const sortedAndFilteredStudents = useMemo(() => {
    const list = [...filteredStudents];
    if (sortBy === "alphabetical") {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "grades_desc") {
      return list.sort((a, b) => getAverage(b) - getAverage(a));
    } else if (sortBy === "grades_asc") {
      return list.sort((a, b) => getAverage(a) - getAverage(b));
    } else if (sortBy === "absences_desc") {
      return list.sort((a, b) => getAbsencesCount(b) - getAbsencesCount(a));
    } else if (sortBy === "karma_desc") {
      return list.sort((a, b) => (b.points || 0) - (a.points || 0));
    }
    return list;
  }, [filteredStudents, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("Todos");
    setSortBy("alphabetical");
    addSystemNotification("Búsquedas, ordenamientos y filtros restablecidos", "info");
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Avoid selecting student details
    const confirmed = requestConfirm 
      ? await requestConfirm("Eliminar Estudiante", `¿Está seguro de que desea eliminar permanentemente al estudiante "${name}"?`)
      : window.confirm(`¿Está seguro de que desea eliminar permanentemente al estudiante "${name}"?`);
    if (confirmed) {
      onRemoveStudent(id);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-bauhaus-blue" />
            LISTADO DE CLASE
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Libro de calificaciones oficial y registro de asistencia centralizado. Cambia el criterio de ordenamiento según tu necesidad.
          </p>
        </div>
        
        {/* Count Roster Info Badge + Print */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { window.focus(); window.print(); }}
            className="neo-btn bg-white hover:bg-[#F5F5F0] text-[#1A1A1A] py-1 px-3 neo-border-thin font-mono text-[10px] uppercase font-black cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-bauhaus-blue" /> Imprimir Lista
          </button>
          <div className="bg-[#1A1A1A] text-white py-1 px-3 neo-border-thin font-mono text-[10px] uppercase font-black">
            Total Alumnos: {students.length}
          </div>
        </div>
      </div>

      {/* Control Filters bar with sorting */}
      <div className="bg-[#F5F5F0] neo-border p-4 neo-shadow flex flex-col lg:flex-row gap-4 items-center justify-between">
        
        {/* Left Search input */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            id="search-input"
            placeholder="Buscar por apellidos o nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white neo-border-thin p-2.5 pl-10 text-xs font-mono focus:outline-none focus:bg-amber-50 shadow-sm"
          />
        </div>

        {/* Filters and Sorting controls side */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Sorter Selector */}
          <div className="flex items-center bg-white neo-border-thin shadow-sm">
            <div className="bg-[#1A1A1A] text-white py-2 px-2.5 font-mono text-[9px] uppercase font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar por
            </div>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white p-2 text-xs font-mono focus:outline-none cursor-pointer"
            >
              <option value="alphabetical">Alfabetico A-Z</option>
              <option value="grades_desc">Notas (Mayor a Menor)</option>
              <option value="grades_asc">Notas (Menor a Mayor)</option>
              <option value="absences_desc">Ausencias (Mayor a Menor)</option>
              <option value="karma_desc">Puntos Extra (Mayor a Menor)</option>
            </select>
          </div>

          {/* Status filtering dropdown */}
          <div className="flex items-center bg-white neo-border-thin shadow-sm">
            <div className="bg-[#1A1A1A] text-white py-2 px-2.5 font-mono text-[9px] uppercase font-bold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Estado
            </div>
            <select 
              id="estado-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white p-2 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Reset Clean controls */}
          {(searchQuery || selectedStatus !== "Todos" || sortBy !== "alphabetical") && (
            <button 
              id="btn-clear-filters"
              onClick={handleClearFilters}
              className="neo-border-thin px-3 py-1.5 font-black uppercase text-[10px] font-mono bg-white hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Restablecer ×
            </button>
          )}
        </div>
      </div>

      {/* Classic School Roster List Table View */}
      <div className="bg-white neo-border neo-shadow overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-[#1A1A1A] text-white text-xs uppercase tracking-wider">
              <th className="p-3 border-r border-gray-700 w-12 text-center">N°</th>
              <th className="p-3 border-r border-gray-700">Apellidos y Nombres</th>
              <th className="p-3 border-r border-gray-700">Correo Institucional</th>
              <th className="p-3 border-r border-gray-700 w-24 text-center">Promedio</th>
              <th className="p-3 border-r border-gray-700 w-24 text-center">Faltas</th>
              <th className="p-3 border-r border-gray-700 w-20 text-center">Extras</th>
              <th className="p-3 border-r border-gray-700 w-28 text-center">Estado</th>
              <th className="p-3 text-center w-36 bg-zinc-800">Evaluación</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredStudents.map((student, renderIdx) => {
              const avg = getAverage(student);
              const presentCount = student.attendance ? student.attendance.filter(a => a.status === "presente").length : 0;
              const totalSessions = student.attendance ? student.attendance.length : 0;
              const attendancePerc = totalSessions > 0 ? ((presentCount / totalSessions) * 100).toFixed(0) : "100";
              const totalAbsences = getAbsencesCount(student);

              return (
                <tr 
                  key={student.id} 
                  id={`student-row-${student.id}`}
                  className="border-b-2 border-[#1A1A1A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  onClick={() => onSelectStudent(student.id)}
                >
                  {/* List Number Badge */}
                  <td className="p-3 border-r border-gray-300 text-center font-bold text-gray-500 bg-[#F5F5F0]">
                    {renderIdx + 1}
                  </td>
                  
                  {/* Full Name grouped logically */}
                  <td className="p-3 border-r border-gray-300">
                    <div className="font-extrabold text-[#1A1A1A] text-sm uppercase">
                      {student.name}
                    </div>
                  </td>

                  {/* Institution Email */}
                  <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500 text-[10px]">
                    {student.email}
                  </td>

                  {/* Numeric Average GPA */}
                  <td className="p-3 border-r border-gray-300 text-center font-bold text-sm">
                    <span className={`px-2 py-0.5 rounded-sm inline-block ${
                      avg >= 8.5 ? "text-emerald-700 bg-emerald-50 border border-emerald-300" : avg < 6.0 ? "text-rose-700 bg-rose-50 border border-rose-300" : "text-black bg-amber-50"
                    }`}>
                      {avg.toFixed(1)}
                    </span>
                  </td>

                  {/* Total unexcused Absences count */}
                  <td className="p-3 border-r border-gray-300 text-center font-mono">
                    <div className="flex flex-col items-center">
                      <span className={`font-bold ${totalAbsences > 2 ? "text-rose-600 bg-rose-50 px-1.5 py-0.5 border border-rose-300 rounded-sm" : "text-gray-700"}`}>
                        {totalAbsences}
                      </span>
                    </div>
                  </td>

                  {/* Extras / Extra/Karma Points */}
                  <td className="p-3 border-r border-gray-300 text-center text-bauhaus-yellow-600 font-bold text-sm">
                    ★ {student.points || 0} pts
                  </td>

                  {/* Matriculate Status */}
                  <td className="p-3 border-r border-gray-300 text-center">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase neo-border-thin inline-block rounded-sm ${
                      student.status === "Activo" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-gray-50 text-gray-400 border-gray-200"
                    }`}>
                      {student.status}
                    </span>
                  </td>

                  {/* Student file controls actions */}
                  <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        id={`action-ficha-row-${student.id}`}
                        onClick={() => onSelectStudent(student.id)}
                        className="bg-white hover:bg-bauhaus-blue hover:text-white text-[#1A1A1A] neo-border-thin px-2.5 py-1 font-bold uppercase transition-colors text-[9px] cursor-pointer"
                      >
                        Expediente
                      </button>
                      <button 
                        id={`action-delete-row-${student.id}`}
                        onClick={(e) => handleDeleteClick(e, student.id, student.name)}
                        className="bg-white hover:bg-bauhaus-red hover:text-white text-gray-500 neo-border-thin p-1 transition-colors cursor-pointer"
                        title="Eliminar Estudiante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedAndFilteredStudents.length === 0 && (
          <div className="p-12 text-center text-gray-500 font-mono uppercase">
            No se identificaron estudiantes con los criterios de filtrado actuales.
          </div>
        )}
      </div>
    </motion.div>
  );
}
