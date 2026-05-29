import { Student, BehaviorLog, CognitiveSkills, Subject, Group } from "../types";

export const BEHAVIOR_CATALOG = [
  { text: "Gran Deducción Científica", type: "positivo", tag: "Lógica", points: 3, icon: "💡" },
  { text: "Participación Destacada", type: "positivo", tag: "Comunicación", points: 2, icon: "🗣️" },
  { text: "Colaboración Solidaria", type: "positivo", tag: "Colaboración", points: 2, icon: "🤝" },
  { text: "Liderazgo en Proyecto", type: "positivo", tag: "Liderazgo", points: 3, icon: "👑" },
  { text: "Solución Creativa", type: "positivo", tag: "Creatividad", points: 2, icon: "🎨" },
  { text: "Sin Material Escolar", type: "critico", tag: "Responsabilidad", points: -1, icon: "🎒" },
  { text: "Charla Excesiva / Distracción", type: "critico", tag: "Conducta", points: -1, icon: "💬" },
  { text: "Impuntualidad", type: "critico", tag: "Puntualidad", points: -1, icon: "⏰" },
  { text: "Inasistencia Injustificada", type: "critico", tag: "Asistencia", points: -2, icon: "❌" },
  { text: "Entrega Sobresaliente", type: "academico", tag: "Académico", points: 3, icon: "📝" },
  { text: "Mejora Notable", type: "academico", tag: "Académico", points: 2, icon: "📈" }
];

export const OCR_TEMPLATES = [
  {
    title: "Lista de Examen - Matemáticas 2ºA",
    rawText: `CALIFICACIONES PARCIALES - MATEMÁTICAS II
GRUPO A - 2026/05/20
--------------------------------------------
01. Sofía Alarcón: EXAMEN 9.5 | PROYECTO 10
02. Mateo Bastidas: EXAMEN 6.2 | PROYECTO 8.0
03. Camila Durán: EXAMEN 8.0 | PROYECTO 9.0
04. Valeria Espejo: EXAMEN 10 | PROYECTO 9.5
05. Nicolás Vargas: EXAMEN 5.5 | PROYECTO 7.0
--------------------------------------------
Docente: Prof. Ramírez`,
    parsedStudents: [
      { name: "Sofía Alarcón", exam: 9.5, project: 10 },
      { name: "Mateo Bastidas", exam: 6.2, project: 8.0 },
      { name: "Camila Durán", exam: 8.0, project: 9.0 },
      { name: "Valeria Espejo", exam: 10, project: 9.5 },
      { name: "Nicolás Vargas", exam: 5.5, project: 7.0 }
    ]
  },
  {
    title: "Ficha de Campo - Biología / Ciencias",
    rawText: `REGISTRO ACADÉMICO - PROYECTO CIENCIAS
--------------------------------------------
* Santiago Mendoza - Proyecto: 9.2 (Excelente diseño experimental)
* Isabela Gutiérrez - Proyecto: 8.5 (Falta conclusiones más claras)
* Tomás Riquelme - Proyecto: 7.0 (Entrega tardía de bitácora)
* Lucía Domínguez - Proyecto: 10 (Sobresaliente, modelo 3D funcional)`,
    parsedStudents: [
      { name: "Santiago Mendoza", exam: 8.5, project: 9.2 },
      { name: "Isabela Gutiérrez", exam: 9.0, project: 8.5 },
      { name: "Tomás Riquelme", exam: 6.0, project: 7.0 },
      { name: "Lucía Domínguez", exam: 9.5, project: 10 }
    ]
  },
  {
    title: "Notas Trimestrales - Literatura & Cuentos",
    rawText: `EVALUACIÓN CUENTO ORIGINAL - GRUPO B
- Julieta Ortiz: Redacción: 9.8 / Ortografía: Excelente
- Bruno Castillo: Redacción: 7.5 / Ortografía: Media
- Helena Ponce: Redacción: 8.2 / Ortografía: Buena`,
    parsedStudents: [
      { name: "Julieta Ortiz", exam: 10, project: 9.8 },
      { name: "Bruno Castillo", exam: 8.0, project: 7.5 },
      { name: "Helena Ponce", exam: 8.5, project: 8.2 }
    ]
  }
];

export const initialStudents: Student[] = [
  {
    id: "est-1",
    name: "Alarcón Medina, Sofía",
    email: "sofia.alarcon@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    group: "A",
    subject: "Matemáticas",
    status: "Activo",
    points: 15,
    grades: {
      exam1: 9.5,
      homework1: 10.0,
      exam2: 8.8,
      project: 9.6
    },
    cognitiveSkills: {
      logica: 95,
      creatividad: 75,
      colaboracion: 80,
      liderazgo: 85,
      comunicacion: 88
    },
    behaviorLogs: [
      {
        id: "log-1a",
        date: "2026-05-10",
        type: "positivo",
        tag: "Lógica",
        points: 3,
        description: "Encontró un camino alternativo para resolver un sistema complejo de ecuaciones matriciales."
      },
      {
        id: "log-1b",
        date: "2026-05-18",
        type: "academico",
        tag: "Académico",
        points: 3,
        description: "Entrega perfecta de la bitácora de álgebra y cálculo avanzado."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "presente" }
    ]
  },
  {
    id: "est-2",
    name: "Bastidas Rosales, Mateo",
    email: "mateo.bastidas@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    group: "A",
    subject: "Matemáticas",
    status: "Activo",
    points: 8,
    grades: {
      exam1: 6.2,
      homework1: 8.0,
      exam2: 7.0,
      project: 8.5
    },
    cognitiveSkills: {
      logica: 70,
      creatividad: 85,
      colaboracion: 90,
      liderazgo: 70,
      comunicacion: 92
    },
    behaviorLogs: [
      {
        id: "log-2a",
        date: "12-05-2026",
        type: "positivo",
        tag: "Colaboración",
        points: 2,
        description: "Ayudó proactivamente a tres compañeros del grupo rezagados a entender la regla de Cramer."
      },
      {
        id: "log-2b",
        date: "24-05-2026",
        type: "critico",
        tag: "Conducta",
        points: -1,
        description: "Uso indebido del smartphone en clase distrayendo a la mesa de trabajo."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "tarde" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "ausente" }
    ]
  },
  {
    id: "est-3",
    name: "Durán Oyarzún, Camila",
    email: "camila.duran@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    group: "B",
    subject: "Literatura",
    status: "Activo",
    points: 12,
    grades: {
      exam1: 8.0,
      homework1: 9.0,
      exam2: 8.5,
      project: 9.2
    },
    cognitiveSkills: {
      logica: 65,
      creatividad: 95,
      colaboracion: 85,
      liderazgo: 80,
      comunicacion: 90
    },
    behaviorLogs: [
      {
        id: "log-3a",
        date: "15-05-2026",
        type: "positivo",
        tag: "Creatividad",
        points: 2,
        description: "Escribió un ensayo brillante relacionando el cubismo literario con la vanguardia latinoamericana."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "presente" }
    ]
  },
  {
    id: "est-4",
    name: "Mendoza Prado, Santiago",
    email: "santiago.mendoza@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    group: "C",
    subject: "Ciencias",
    status: "Activo",
    points: 18,
    grades: {
      exam1: 8.8,
      homework1: 9.5,
      exam2: 9.2,
      project: 9.0
    },
    cognitiveSkills: {
      logica: 90,
      creatividad: 80,
      colaboracion: 75,
      liderazgo: 88,
      comunicacion: 82
    },
    behaviorLogs: [
      {
        id: "log-4a",
        date: "14-05-2026",
        type: "positivo",
        tag: "Liderazgo",
        points: 3,
        description: "Coordinó la calibración y el muestreo ecológico grupal en el huerto escolar."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "tarde" },
      { date: "2026-05-28", status: "presente" }
    ]
  },
  {
    id: "est-5",
    name: "Gutiérrez Ruiz, Isabela",
    email: "isabela.rut@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    group: "C",
    subject: "Ciencias",
    status: "Activo",
    points: 5,
    grades: {
      exam1: 7.5,
      homework1: 7.0,
      exam2: 6.8,
      project: 8.0
    },
    cognitiveSkills: {
      logica: 74,
      creatividad: 68,
      colaboracion: 92,
      liderazgo: 60,
      comunicacion: 78
    },
    behaviorLogs: [
      {
        id: "log-5a",
        date: "11-05-2026",
        type: "critico",
        tag: "Responsabilidad",
        points: -1,
        description: "Olvidó la bitácora física de laboratorio para el reporte de destilación."
      },
      {
        id: "log-5b",
        date: "2026-05-22",
        type: "positivo",
        tag: "Colaboración",
        points: 2,
        description: "Colaboró activamente en la limpieza de la estación de centrifugado."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "ausente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "presente" }
    ]
  },
  {
    id: "est-6",
    name: "Riquelme Flores, Tomás",
    email: "tomas.riquelme@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
    group: "B",
    subject: "Literatura",
    status: "Inactivo",
    points: 0,
    grades: {
      exam1: 5.0,
      homework1: 6.0,
      exam2: 4.8,
      project: 6.2
    },
    cognitiveSkills: {
      logica: 55,
      creatividad: 70,
      colaboracion: 65,
      liderazgo: 45,
      comunicacion: 60
    },
    behaviorLogs: [
      {
        id: "log-6a",
        date: "08-05-2026",
        type: "critico",
        tag: "Puntualidad",
        points: -1,
        description: "Llegó 30 minutos tarde a la lectura poética asignada."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "ausente" },
      { date: "2026-05-26", status: "ausente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "ausente" }
    ]
  },
  {
    id: "est-7",
    name: "Espejo Soler, Valeria",
    email: "valeria.espejo@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    group: "A",
    subject: "Matemáticas",
    status: "Activo",
    points: 22,
    grades: {
      exam1: 10.0,
      homework1: 10.0,
      exam2: 9.8,
      project: 10.0
    },
    cognitiveSkills: {
      logica: 98,
      creatividad: 90,
      colaboracion: 92,
      liderazgo: 95,
      comunicacion: 96
    },
    behaviorLogs: [
      {
        id: "log-7a",
        date: "2026-05-02",
        type: "positivo",
        tag: "Liderazgo",
        points: 3,
        description: "Lideró la resolución cooperativa del problema del mes publicado en la cartelera departamental."
      },
      {
        id: "log-7b",
        date: "2026-05-15",
        type: "positivo",
        tag: "Creatividad",
        points: 2,
        description: "Propuso una hermosa analogía musical para ilustrar las funciones sinusoidales trigonométricas."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "presente" }
    ]
  },
  {
    id: "est-8",
    name: "Ponce Miranda, Helena",
    email: "helena.ponce@klasse-edu.com",
    avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200",
    group: "B",
    subject: "Historia",
    status: "Activo",
    points: 10,
    grades: {
      exam1: 8.5,
      homework1: 8.0,
      exam2: 8.9,
      project: 9.1
    },
    cognitiveSkills: {
      logica: 80,
      creatividad: 82,
      colaboracion: 78,
      liderazgo: 70,
      comunicacion: 85
    },
    behaviorLogs: [
      {
        id: "log-8a",
        date: "2026-05-12",
        type: "positivo",
        tag: "Comunicación",
        points: 2,
        description: "Excelente estructuración argumentativa durante el debate sobre las causas de la Revolución Francesa."
      }
    ],
    attendance: [
      { date: "2026-05-25", status: "presente" },
      { date: "2026-05-26", status: "presente" },
      { date: "2026-05-27", status: "presente" },
      { date: "2026-05-28", status: "presente" }
    ]
  }
];
