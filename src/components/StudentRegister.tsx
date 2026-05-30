import React, { useState, useRef, useMemo } from "react";
import { Student, Subject, Group, Classroom, CognitiveSkills } from "../types";
import { 
  UserPlus, 
  FileText, 
  UploadCloud, 
  Trash2, 
  Check, 
  HelpCircle,
  Sparkles,
  Clipboard,
  Camera,
  RefreshCw,
  Table
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentRegisterProps {
  onAddStudent: (student: Student) => void;
  onAddBatchStudents: (students: Student[]) => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  activeClassroom: Classroom;
}

export default function StudentRegister({ 
  onAddStudent, 
  onAddBatchStudents,
  addSystemNotification,
  activeClassroom
}: StudentRegisterProps) {
  
  // Tabs: manual vs bulk import
  const [activeSubTab, setActiveSubTab] = useState<"manual" | "import">("manual");

  // ==========================================
  // Manual Registration States (Strictly Requested Symmetrical Fields)
  // ==========================================
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      addSystemNotification("El primer nombre y el primer apellido son obligatorios", "warning");
      return;
    }
    
    // Format: "Apellido1 Apellido2, Nombre1 Nombre2" which is the standard list representation
    const formattedName = `${lastName.trim()}${secondLastName.trim() ? " " + secondLastName.trim() : ""}, ${firstName.trim()}${middleName.trim() ? " " + middleName.trim() : ""}`;

    // Auto-generate standard clean email
    const cleanFirst = firstName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    const cleanLast = lastName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    const generatedEmail = `${cleanFirst}.${cleanLast}@klasse-edu.com`;

    const newStudent: Student = {
      id: `est-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: formattedName,
      email: generatedEmail,
      avatar: "", 
      group: "A", // Default group
      subject: activeClassroom.name as Subject, // Bound to active classroom subject
      status: "Activo",
      points: 0, // Starting extra points are 0 as requested! (no automatic welcome incentives)
      grades: {
        exam1: 0, 
        homework1: 0,
        exam2: 0,
        project: 0
      },
      cognitiveSkills: {
        logica: 80,
        creatividad: 80,
        colaboracion: 80,
        liderazgo: 80,
        comunicacion: 80
      },
      behaviorLogs: [], // No mock behavior logs upon registry to stay serious
      attendance: []
    };

    onAddStudent(newStudent);
    addSystemNotification(`Estudiante "${lastName}, ${firstName}" registrado correctamente`, "success");
    
    // Reset manual form fields
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSecondLastName("");
  };

  // ==========================================
  // Elegant Bulk Import / Roster Parser States
  // ==========================================
  const [importText, setImportText] = useState("");
  const [parserFormat, setParserFormat] = useState<"standard" | "comma" | "tabs">("comma");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Real Photography Vision AI Scanner states
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const [photoScanProgress, setPhotoScanProgress] = useState(0);
  const [photoLogs, setPhotoLogs] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // File drop/upload parsing
  const handleTextFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".txt") && !file.name.endsWith(".csv")) {
      addSystemNotification("Formato de archivo no soportado. Suba un archivo .txt o .csv", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setImportText(text);
        addSystemNotification(`Archivo ${file.name} cargado con éxito`, "success");
        // Automatically detect if it has tabs/commas
        if (text.includes("\t")) {
          setParserFormat("tabs");
        } else if (text.includes(",")) {
          setParserFormat("comma");
        } else {
          setParserFormat("standard");
        }
      }
    };
    reader.readAsText(file);
  };

  // Capture list photo using backend
  const handleCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPhotoScanning(true);
    setPhotoScanProgress(10);
    setPhotoLogs([
      "📸 Capturando imagen de planilla...",
      `📁 Archivo recibido: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`
    ]);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        setPhotoScanProgress(30);
        setPhotoLogs(prev => [...prev, "🧠 Transmitiendo a la Consola de Visión de Gemini AI..."]);

        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type || "image/jpeg"
          })
        });

        setPhotoScanProgress(70);

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Falla de red con la IA.");
        }

        const data = await res.json();
        if (data && data.students && Array.isArray(data.students)) {
          setPhotoScanProgress(100);
          setPhotoLogs(prev => [
            ...prev,
            "✓ Reconocimiento óptico completado.",
            `📋 Se aislaron ${data.students.length} nombres de alumnos.`
          ]);

          // Import as lines
          const nameLines = data.students.map((s: any) => s.name).join("\n");
          setImportText(nameLines);
          setParserFormat("comma"); // Defaults to school roster rule layout
          addSystemNotification(`Lector IA completado con éxito: ${data.students.length} estudiantes detectados`, "success");
        } else {
          throw new Error("No se detectaron estudiantes en el formato esperado.");
        }
      } catch (err: any) {
        console.error(err);
        setPhotoLogs(prev => [...prev, `❌ ERROR IA: ${err.message || err}`]);
        addSystemNotification("No se pudo escanear la foto. Integre los datos mediante copiado y pegado clásico", "warning");
      } finally {
        setIsPhotoScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick templates filler to avoid names parsed as surnames
  const loadExampleTemplate = (type: "standard" | "comma") => {
    if (type === "comma") {
      setImportText("Alarcón Medina, Sofía Belén\nBastidas Rosales, Mateo\nDurán Oyarzún, Camila Alejandra\nMendoza Prado, Santiago Andrés");
      setParserFormat("comma");
      addSystemNotification("Plantilla de 'Apellidos, Nombres' cargada", "info");
    } else {
      setImportText("Sofía Belén Alarcón Medina\nMateo Bastidas Rosales\nCamila Alejandra Durán Oyarzún\nSantiago Andrés Mendoza Prado");
      setParserFormat("standard");
      addSystemNotification("Plantilla de 'Nombres Apellidos' cargada", "info");
    }
  };

  // Core Parsing Algorithm
  const parsedStudentsList = useMemo(() => {
    if (!importText.trim()) return [];

    const lines = importText.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
    
    return lines.map((line, index) => {
      let pFirst = "";
      let pMiddle = "";
      let pLast = "";
      let pSecondLast = "";

      if (parserFormat === "tabs") {
        // Excel/Sheets format (tabbed columns). Usually: Apellido1 [Apellido2] Nombre1 [Nombre2]
        const columns = line.split("\t").map(c => c.trim());
        if (columns.length >= 4) {
          pLast = columns[0];
          pSecondLast = columns[1];
          pFirst = columns[2];
          pMiddle = columns[3];
        } else if (columns.length === 3) {
          pLast = columns[0];
          pFirst = columns[1];
          pMiddle = columns[2];
        } else if (columns.length === 2) {
          // If 2 columns, column 0 is usually surnames, column 1 is names
          const surs = columns[0].split(/\s+/);
          pLast = surs[0] || "";
          pSecondLast = surs[1] || "";
          
          const nams = columns[1].split(/\s+/);
          pFirst = nams[0] || "";
          pMiddle = nams.slice(1).join(" ");
        } else {
          // Fallback to standard word segmentation
          const words = line.split(/\s+/);
          if (words.length >= 3) {
            pFirst = words[0];
            pLast = words[1];
            pSecondLast = words[2];
          } else {
            pFirst = words[0] || "";
            pLast = words[1] || "";
          }
        }
      } else if (parserFormat === "comma") {
        // Format: "Apellidos, Nombres" E.g., "Alarcón Medina, Sofía Belén"
        const parts = line.split(",");
        const surnamesPart = parts[0]?.trim() || "";
        const namesPart = parts[1]?.trim() || "";

        const surnames = surnamesPart.split(/\s+/);
        pLast = surnames[0] || "";
        pSecondLast = surnames.slice(1).join(" ");

        const names = namesPart.split(/\s+/);
        pFirst = names[0] || "";
        pMiddle = names.slice(1).join(" ");
      } else {
        // Standard Format: "Nombre [SegundoNombre] Apellido [SegundoApellido]"
        const words = line.split(/\s+/);
        if (words.length === 4) {
          pFirst = words[0];
          pMiddle = words[1];
          pLast = words[2];
          pSecondLast = words[3];
        } else if (words.length === 3) {
          // Assume FirstName, Surname1, Surname2 (highly common in spanish)
          pFirst = words[0];
          pLast = words[1];
          pSecondLast = words[2];
        } else if (words.length === 2) {
          pFirst = words[0];
          pLast = words[1];
        } else if (words.length > 4) {
          // Guessing: First two names, then surnames
          pFirst = words[0];
          pMiddle = words[1];
          pLast = words[2];
          pSecondLast = words.slice(3).join(" ");
        } else {
          pFirst = words[0] || "";
          pLast = words[1] || "";
        }
      }

      // Format back to uniform classroom roster name: "Apellido1 Apellido2, Nombre1 Nombre2"
      const cleanLast = `${pLast} ${pSecondLast}`.trim();
      const cleanFirst = `${pFirst} ${pMiddle}`.trim();
      const unifiedName = cleanLast ? `${cleanLast}, ${cleanFirst}` : cleanFirst;

      return {
        key: `parsed-${index}-${line}`,
        originalLine: line,
        pFirst: pFirst.trim(),
        pMiddle: pMiddle.trim(),
        pLast: pLast.trim(),
        pSecondLast: pSecondLast.trim(),
        unifiedName
      };
    });
  }, [importText, parserFormat]);

  const handleBulkImportConfirm = () => {
    if (parsedStudentsList.length === 0) return;

    const batchStudents: Student[] = parsedStudentsList.map((item, idx) => {
      const finalFirst = item.pFirst || "Alumno";
      const finalLast = item.pLast || "SinApellido";

      const cleanFirst = finalFirst.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
      const cleanLast = finalLast.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
      const generatedEmail = `${cleanFirst}.${cleanLast}@klasse-edu.com`;

      return {
        id: `est-bulk-${Date.now()}-${idx}`,
        name: item.unifiedName,
        email: generatedEmail,
        avatar: "", 
        group: "A",
        subject: activeClassroom.name as Subject, // Bound to active class
        status: "Activo",
        points: 0, // start with 0
        grades: {
          exam1: 0,
          homework1: 0,
          exam2: 0,
          project: 0
        },
        cognitiveSkills: {
          logica: 80,
          creatividad: 80,
          colaboracion: 80,
          liderazgo: 80,
          comunicacion: 80
        },
        behaviorLogs: [],
        attendance: []
      };
    });

    onAddBatchStudents(batchStudents);
    addSystemNotification(`Se han importado perfectamente ${batchStudents.length} estudiantes a la asignación de ${activeClassroom.name}`, "success");
    
    // Clear State
    setImportText("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Tab Switch Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#1A1A1A] pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase flex items-center gap-2">
            <UserPlus className="w-8 h-8 text-bauhaus-blue" />
            REGISTRO DE ALUMNOS
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Inscribe nuevos estudiantes en la clase activa: <strong className="text-bauhaus-blue">{activeClassroom.name}</strong>
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 neo-border">
          <button 
            id="tab-manual-entry"
            onClick={() => setActiveSubTab("manual")}
            className={`px-4 py-2 text-xs font-mono font-black uppercase cursor-pointer transition-all ${
              activeSubTab === "manual" 
                ? "bg-bauhaus-blue text-white neo-shadow-inset" 
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Matrícula Manual
          </button>
          <button 
            id="tab-import-list"
            onClick={() => setActiveSubTab("import")}
            className={`px-4 py-2 text-xs font-mono font-black uppercase cursor-pointer transition-all ${
              activeSubTab === "import" 
                ? "bg-bauhaus-blue text-white neo-shadow-inset" 
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            Importar Listas
          </button>
        </div>
      </div>

      {activeSubTab === "manual" ? (
        /* MANUAL FORM - SIMPLE SYMMETRICAL FIELD CONFIG */
        <div className="max-w-2xl mx-auto bg-white neo-border p-6 neo-shadow space-y-6">
          <div className="border-b-2 border-black pb-3">
            <h3 className="text-lg font-black uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-bauhaus-yellow-600" /> Ficha de Registro de Alumno
            </h3>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5 uppercase">
              Ingresa el nombre del estudiante para incorporarlo al libro de clases de inmediato.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  Primer Nombre *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Sofía" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  Segundo Nombre
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Belén" 
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  Primer Apellido *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej: Alarcón" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-black uppercase text-gray-700 mb-1">
                  Segundo Apellido
                </label>
                <input 
                  type="text" 
                  placeholder="Ej: Medina" 
                  value={secondLastName}
                  onChange={(e) => setSecondLastName(e.target.value)}
                  className="w-full bg-white neo-border-thin p-3 text-xs font-mono focus:outline-none focus:bg-amber-50"
                />
              </div>
            </div>

            <div className="bg-zinc-50 p-4 border border-zinc-300 font-mono text-[10px] text-gray-700 leading-relaxed uppercase rounded-sm">
              <p className="font-bold mb-1">📌 Parámetros de Registro:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Clase Destino: <strong>{activeClassroom.name}</strong></li>
                <li>Puntos Extra Iniciales: <strong>0 Puntos</strong></li>
                <li>Estructura del Listado: <strong>Se ubicará por apellido automáticamente (A-Z)</strong></li>
              </ul>
            </div>

            <div className="pt-2">
              <button 
                type="submit"
                className="w-full neo-btn bg-[#1A1A1A] text-white py-4 border-2 border-black font-black uppercase text-xs hover:bg-zinc-800 cursor-pointer"
              >
                💾 GUARDAR REGISTRO E INSCRIBIR
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* FUNCTIONAL BULK IMPORT / TEXT PARSER - MULTIPURPOSE SOURCE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Inputs Panel - Columns 5 */}
          <div className="lg:col-span-5 bg-white neo-border p-6 neo-shadow space-y-6">
            <div className="border-b-2 border-black pb-2">
              <h3 className="text-lg font-black uppercase flex items-center gap-2">
                <FileText className="w-5 h-5 text-bauhaus-blue" /> Cargador de Listas
              </h3>
              <p className="text-[10px] font-mono text-gray-500 mt-0.5 uppercase">
                Pega directamente tus listas escolares o asiste la importación con plantillas ejemplo.
              </p>
            </div>

            <div className="space-y-4">
              {/* Quick Template Fillers Buttons */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-black uppercase text-gray-700">
                  Ayuda: Cargar Plantillas de Ejemplo rápido
                </label>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => loadExampleTemplate("comma")}
                    className="p-2 border border-[#1A1A1A] bg-zinc-100 hover:bg-white text-[#1A1A1A] font-bold uppercase text-center cursor-pointer"
                  >
                    📝 Apellidos, Nombres
                  </button>
                  <button
                    type="button"
                    onClick={() => loadExampleTemplate("standard")}
                    className="p-2 border border-[#1A1A1A] bg-zinc-100 hover:bg-white text-[#1A1A1A] font-bold uppercase text-center cursor-pointer"
                  >
                    📝 Nombres Apellidos
                  </button>
                </div>
              </div>

              {/* Option Bar for parser preferences */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-black uppercase text-gray-700">
                  Formato del Texto a Procesar:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-[#F5F5F0] p-1 neo-border-thin font-mono text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setParserFormat("standard")}
                    className={`py-1.5 uppercase text-center rounded-sm cursor-pointer ${
                      parserFormat === "standard" ? "bg-bauhaus-blue text-white" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Nombres Apellidos
                  </button>
                  <button
                    type="button"
                    onClick={() => setParserFormat("comma")}
                    className={`py-1.5 uppercase text-center rounded-sm cursor-pointer ${
                      parserFormat === "comma" ? "bg-bauhaus-blue text-white" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Apellidos, Nombres
                  </button>
                  <button
                    type="button"
                    onClick={() => setParserFormat("tabs")}
                    className={`py-1.5 uppercase text-center rounded-sm cursor-pointer ${
                      parserFormat === "tabs" ? "bg-bauhaus-blue text-white" : "text-gray-600 hover:bg-white"
                    }`}
                  >
                    Tabulado Excel
                  </button>
                </div>
              </div>

              {/* Text Area copy paste input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-mono font-black uppercase text-gray-700">
                    Pegar Estudiantes (1 por línea)
                  </label>
                  <span className="text-[10px] font-mono font-bold bg-[#1A1A1A] text-white px-1.5 py-0.5 uppercase">
                    {importText.split("\n").filter(l => l.trim()).length} Filas
                  </span>
                </div>
                <textarea 
                  rows={9}
                  className="w-full bg-[#1A1A1A] text-[#10B981] p-4 font-mono text-xs neo-border-thin focus:ring-0 focus:outline-none"
                  placeholder={
                    parserFormat === "comma"
                      ? "Alarcón Medina, Sofía Belén\nBastidas Rosales, Mateo\nDurán Oyarzún, Camila Alejandra"
                      : "Sofía Belén Alarcón Medina\nMateo Bastidas Rosales\nCamila Alejandra Durán Oyarzún"
                  }
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
              </div>

              {/* Subir archivo .txt / .csv */}
              <div className="pt-2 border-t border-[#1A1A1A]/10">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleTextFileChange} 
                  accept=".txt,.csv" 
                  className="hidden" 
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-white hover:bg-amber-50 text-[10px] font-black uppercase neo-border-thin font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <UploadCloud className="w-4 h-4 text-bauhaus-blue" /> Cargar Archivo (.txt / .csv)
                </button>
              </div>

              {/* Real Photograph List Scanning */}
              <div className="pt-4 border-t-2 border-dashed border-[#1A1A1A]/30">
                <input 
                  type="file" 
                  ref={cameraInputRef} 
                  onChange={handleCameraCapture} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={isPhotoScanning}
                  onClick={() => cameraInputRef.current?.click()}
                  className={`w-full py-2.5 bg-bauhaus-yellow/10 hover:bg-bauhaus-yellow text-[10px] font-black uppercase neo-border text-black font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                    isPhotoScanning ? "opacity-60" : ""
                  }`}
                >
                  <Camera className="w-4 h-4 text-[#1A1A1A]" /> Escanear Planilla con IA
                </button>

                {isPhotoScanning && (
                  <div className="mt-3 bg-[#1A1A1A] text-white p-3 font-mono text-[9px] uppercase space-y-1 neo-border-thin">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-yellow-400 font-extrabold animate-pulse">⚙ Procesando Roster...</span>
                      <span>{photoScanProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 mb-2">
                      <div className="bg-bauhaus-blue h-full transition-all duration-300" style={{ width: `${photoScanProgress}%` }}></div>
                    </div>
                    {photoLogs.map((log, li) => (
                      <p key={li} className="truncate">{log}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results Preview Panel */}
          <div className="lg:col-span-7 bg-white neo-border p-6 neo-shadow flex flex-col justify-between min-h-[480px]">
            <div className="space-y-6">
              <div className="border-b-2 border-black pb-2 flex justify-between items-center">
                <h3 className="text-lg font-black uppercase flex items-center gap-2">
                  <Table className="w-5 h-5 text-bauhaus-yellow-600" /> Pre-visualización del listado procesado
                </h3>
                <span className="bg-bauhaus-blue text-white px-2 py-0.5 text-[9px] font-mono uppercase font-black">
                  Lector de Estructuras
                </span>
              </div>

              {parsedStudentsList.length === 0 ? (
                <div className="bg-[#F5F5F0] neo-border p-12 text-center text-gray-500 font-mono text-xs uppercase space-y-2 flex flex-col items-center justify-center">
                  <Clipboard className="w-8 h-8 opacity-40 mb-1" />
                  <p className="font-extrabold text-[#1A1A1A]">No hay listado estructurado</p>
                  <p className="text-[10px] lowercase text-gray-500 max-w-sm leading-relaxed">
                    Pega una lista de estudiantes o presiona "Cargar plantilla ejemplo" arriba para ensayar el procesador.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-50 neo-border-thin p-3 text-[10px] font-mono text-emerald-800 leading-relaxed uppercase">
                    ✓ Se estructuró un listado con <strong>{parsedStudentsList.length}</strong> estudiantes. 
                    Verifique que nombres y apellidos encajen según las columnas de abajo:
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border-2 border-black">
                    <table className="w-full text-left font-mono text-[10px] border-collapse bg-white">
                      <thead>
                        <tr className="bg-[#1A1A1A] text-white">
                          <th className="p-2 border-r border-gray-700 w-8 text-center bg-zinc-800">#</th>
                          <th className="p-2 border-r border-gray-700">Primer Apellido (1°)</th>
                          <th className="p-2 border-r border-gray-700">Segundo Apellido</th>
                          <th className="p-2 border-r border-gray-700">Primer Nombre</th>
                          <th className="p-2 border-r border-gray-700">Segundo Nombre</th>
                          <th className="p-2 text-bauhaus-blue font-black bg-zinc-900">Estructura Final</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedStudentsList.map((itm, iX) => (
                           <tr key={itm.key} className="border-b border-gray-300 hover:bg-orange-50/40">
                            <td className="p-2 border-r border-gray-300 text-center text-gray-500 font-bold bg-[#F5F5F0]">
                              {iX + 1}
                            </td>
                            <td className="p-2 border-r border-gray-300 font-extrabold text-black">
                              {itm.pLast || <span className="text-red-400 italic">vacío*</span>}
                            </td>
                            <td className="p-2 border-r border-gray-300 text-gray-600">
                              {itm.pSecondLast || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="p-2 border-r border-gray-300 font-extrabold text-black">
                              {itm.pFirst || <span className="text-red-400 italic">vacío*</span>}
                            </td>
                            <td className="p-2 border-r border-gray-300 text-gray-600">
                              {itm.pMiddle || <span className="text-gray-300">—</span>}
                            </td>
                            <td className="p-2 font-black text-bauhaus-blue bg-zinc-50 whitespace-nowrap">
                              {itm.unifiedName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t-2 border-dashed border-[#1A1A1A] mt-6">
              <button 
                id="btn-integrate-ocr"
                onClick={handleBulkImportConfirm}
                disabled={parsedStudentsList.length === 0}
                className={`w-full neo-btn py-4 neo-border text-center font-black uppercase text-xs block cursor-pointer transition-all ${
                  parsedStudentsList.length > 0
                    ? "bg-[#1A1A1A] text-white neo-shadow hover:bg-zinc-800 border-2 border-black" 
                    : "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60"
                }`}
              >
                📥 ADHERIR {parsedStudentsList.length > 0 ? parsedStudentsList.length : ""} ALUMNOS AL CURSO
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
