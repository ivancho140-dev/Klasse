import React, { useState } from "react";
import { AppSettings } from "../types";
import { 
  Settings, 
  Cloud, 
  CloudLightning,
  RefreshCw, 
  Trash2, 
  Lock, 
  ToggleLeft, 
  ToggleRight, 
  ShieldAlert, 
  Check, 
  Info,
  Layers
} from "lucide-react";
import { motion } from "motion/react";

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onResetDatabase: () => void;
  addSystemNotification: (msg: string, type: "info" | "success" | "warning") => void;
  googleUser: any;
  onGoogleLogin: () => void;
  onGoogleLogout: () => void;
  isSyncing: boolean;
  syncLogs: string[];
  onManualBackup: () => void;
  onManualRestore: () => void;
  requestConfirm?: (title: string, message: string) => Promise<boolean>;
}

export default function SettingsComponent({
  settings,
  onUpdateSettings,
  onResetDatabase,
  addSystemNotification,
  googleUser,
  onGoogleLogin,
  onGoogleLogout,
  isSyncing,
  syncLogs,
  onManualBackup,
  onManualRestore,
  requestConfirm
}: SettingsProps) {

  // Double lock danger zone local state
  const [isDangerUnlocked, setIsDangerUnlocked] = useState(false);

  const handleToggleSyncSetting = () => {
    if (!googleUser) {
      addSystemNotification("Debe iniciar sesión con Google antes de habilitar los respaldos en la nube", "warning");
      return;
    }

    const nextVal = !settings.googleDriveSynced;
    onUpdateSettings({
      ...settings,
      googleDriveSynced: nextVal,
      lastSyncDate: nextVal ? new Date().toLocaleString() : null
    });
    
    if (nextVal) {
      addSystemNotification("Sincronización automatizada con Google Drive activada", "info");
      onManualBackup(); // initial backup trigger
    } else {
      addSystemNotification("Se desactivó la sincronización persistente", "warning");
    }
  };

  const handleResetClick = async () => {
    if (!isDangerUnlocked) {
      addSystemNotification("Debe deslizar el interruptor de seguridad de la Zona Crítica primero", "warning");
      return;
    }

    const confirmed = requestConfirm 
      ? await requestConfirm("Restablecer Portal", "🔴 ATENCIÓN: Esta acción purgará de forma definitiva TODAS las modificaciones de notas, asistencias e incidentes registrados hoy. Se restablecerán los estudiantes predeterminados de fábrica. ¿Desea proceder?")
      : window.confirm("🔴 ATENCIÓN: Esta acción purgará de forma definitiva TODAS las modificaciones de notas, asistencias e incidentes registrados hoy. Se restablecerán los estudiantes predeterminados de fábrica. ¿Desea proceder?");

    if (confirmed) {
      onResetDatabase();
      setIsDangerUnlocked(false);
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
            <Settings className="w-8 h-8 text-bauhaus-blue" />
            AJUSTES DEL PORTAL
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 uppercase">
            Sincronización con workspace, parámetros operativos de aula y restablecimiento de seguridad.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Cloud Sync REAL Portal (Col 7) */}
        <div className="lg:col-span-7 bg-white neo-border p-6 neo-shadow space-y-6 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h3 className="text-lg font-black uppercase flex items-center gap-2">
                <Cloud className="w-6 h-6 text-bauhaus-blue animate-pulse" /> Sincronización en la Nube
              </h3>
              <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold text-white ${
                googleUser && settings.googleDriveSynced ? "bg-bauhaus-green" : "bg-bauhaus-red"
              }`}>
                {googleUser && settings.googleDriveSynced ? "CONECTADO G-WORKSPACE" : "TRABAJANDO EN LOCAL"}
              </span>
            </div>

            <p className="text-xs font-mono text-gray-500 leading-relaxed">
              Enlaza tu portal KLASSE de forma federada con tu cuenta de Google Workspace para respaldar las fichas de los alumnos y asistencias directamente en Google Drive de forma automática y transparente.
            </p>

            {/* If NOT Google authenticated */}
            {!googleUser ? (
              <div className="bg-red-50 border-2 border-dashed border-red-300 p-5 text-center space-y-4">
                <p className="font-mono text-xs font-bold text-red-800 uppercase">
                  🔑 NO SE HA INICIADO SESIÓN EDUCATIVA
                </p>
                <p className="font-mono text-[10px] text-gray-600 max-w-md mx-auto">
                  Necesitas autorizar el acceso único a Google Drive mediante autenticación delegada para poder guardar y recuperar backups.
                </p>
                <button
                  type="button"
                  onClick={onGoogleLogin}
                  className="neo-btn bg-bauhaus-yellow text-black font-black uppercase text-xs px-6 py-3 neo-border neo-shadow cursor-pointer hover:bg-amber-400 inline-flex items-center gap-2"
                >
                  <img referrerPolicy="no-referrer" src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                  VINCULAR CUENTA DE GOOGLE
                </button>
              </div>
            ) : (
              /* If Google Authenticated */
              <div className="space-y-5">
                <div className="bg-emerald-50 border-2 border-black p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {googleUser.photoURL ? (
                      <img 
                        referrerPolicy="no-referrer"
                        src={googleUser.photoURL} 
                        alt="Google avatar" 
                        className="w-10 h-10 rounded-full border-2 border-black" 
                      />
                    ) : (
                      <div className="w-10 h-10 bg-bauhaus-blue text-white font-black neo-border-thin flex items-center justify-center font-mono">
                        G
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-xs font-black uppercase text-black">
                        {googleUser.displayName || "Docente Federado"}
                      </p>
                      <p className="font-mono text-[9px] text-gray-500 lowercase">
                        {googleUser.email}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = requestConfirm 
                        ? await requestConfirm("Desvincular Cuenta", "¿Está seguro que desea desvincular su cuenta de Google Workspace? Se desactivarán los respaldos automatizados en la nube hasta que vuelva a iniciar sesión.")
                        : window.confirm("¿Está seguro que desea desvincular su cuenta de Google Workspace? Se desactivarán los respaldos automatizados en la nube hasta que vuelva a iniciar sesión.");
                      if (confirmed) {
                        onGoogleLogout();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-bauhaus-red text-white font-black font-mono text-[10px] uppercase rounded-sm border-2 border-black shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-red-700 cursor-pointer active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
                  >
                    🚪 DESVINCULAR CUENTA
                  </button>
                </div>

                {/* Toggle switch sync line */}
                <div 
                  className="bg-[#F5F5F0] neo-border-thin p-4 flex items-center justify-between cursor-pointer hover:bg-[#FAF6F0] transition-all duration-150" 
                  onClick={handleToggleSyncSetting}
                >
                  <div className="pr-4 select-none">
                    <p className="font-mono text-xs font-black uppercase text-[#1A1A1A]">Habilitar Respaldo Automatizado en Drive</p>
                    <p className="font-mono text-[9px] text-gray-500 mt-1 uppercase">Carga incremental de archivos al registrar estudiantes o modificar notas de forma silenciosa</p>
                  </div>

                  {settings.googleDriveSynced ? (
                    <ToggleRight className="w-12 h-12 text-[#1A1A1A]" />
                  ) : (
                    <ToggleLeft className="w-12 h-12 text-gray-400" />
                  )}
                </div>
              </div>
            )}

            {/* Sync now logs & metadata */}
            <div className="space-y-3 font-mono text-xs p-4 bg-gray-50 neo-border-thin">
              <div className="flex justify-between">
                <span>Estado de Sincronización:</span>
                <strong className={googleUser && settings.googleDriveSynced ? "text-bauhaus-green" : "text-bauhaus-red"}>
                  {googleUser && settings.googleDriveSynced ? "✓ Vinculado y Activo" : "⚠ Pendiente vincular o activar"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Último Respaldo Registrado:</span>
                <strong>{settings.lastSyncDate || "Sin sincronización de respaldo previa"}</strong>
              </div>
              
              {/* Spinning sync console output */}
              {isSyncing || syncLogs.length > 0 ? (
                <div className="bg-[#1A1A1A] text-gray-300 p-3 neo-border-thin text-[10px] space-y-1 mt-3 rounded max-h-[140px] overflow-y-auto">
                  <p className="text-gray-500">// REGISTRO DE EVENTOS GOOGLE WORKSPACE DRIVE</p>
                  {syncLogs.map((log, lIdx) => (
                    <p key={lIdx}>{log}</p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Backup Action Bar */}
          {googleUser && (
            <div className="pt-6 border-t-2 border-dashed border-[#1A1A1A] grid grid-cols-2 gap-4">
              <button 
                id="btn-cloud-sync-now"
                onClick={onManualBackup}
                disabled={isSyncing}
                className={`neo-btn py-4 neo-border text-center font-black uppercase text-xs block cursor-pointer transition-all ${
                  isSyncing 
                    ? "bg-gray-100 text-gray-400 border-gray-300 opacity-60 pointer-events-none" 
                    : "bg-bauhaus-yellow text-black neo-shadow hover:bg-amber-400"
                }`}
              >
                {isSyncing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> SUBIENDO...
                  </span>
                ) : (
                  "⚡ RESPALDAR EN DRIVE"
                )}
              </button>

              <button 
                id="btn-cloud-restore-now"
                onClick={onManualRestore}
                disabled={isSyncing}
                className={`neo-btn py-4 neo-border text-center font-black uppercase text-xs block cursor-pointer transition-all ${
                  isSyncing 
                    ? "bg-gray-100 text-gray-400 border-gray-300 opacity-60 pointer-events-none" 
                    : "bg-white text-black neo-shadow hover:bg-gray-100"
                }`}
              >
                {isSyncing ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" /> DESCARGANDO...
                  </span>
                ) : (
                  "📥 RESTAURAR DESDE DRIVE"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Operational Controls & Danger reset lock (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* General parameters */}
          <div className="bg-white neo-border p-6 neo-shadow space-y-4">
            <h3 className="text-md font-black uppercase flex items-center gap-2 border-b-2 border-black pb-2">
              <Layers className="w-5 h-5 text-bauhaus-blue" />
              Parámetros Operativos
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black text-gray-700 uppercase mb-1">Nombre Completo del Docente:</label>
                <input 
                  type="text"
                  required
                  value={settings.teacherName || ""}
                  onChange={(e) => onUpdateSettings({ ...settings, teacherName: e.target.value })}
                  placeholder="Ej. Iván Solarte"
                  className="w-full bg-white neo-border-thin p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black text-gray-700 uppercase mb-1">Tema y Estética del Portal:</label>
                <select 
                  value={settings.theme || "bauhaus"}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    onUpdateSettings({ ...settings, theme: chosen });
                    addSystemNotification(`Fórmula estética configurada: ${chosen.toUpperCase()}`, "success");
                  }}
                  className="w-full bg-white neo-border-thin p-2 focus:outline-none cursor-pointer"
                >
                  <option value="bauhaus">🎨 Bauhaus Classic (Claro)</option>
                  <option value="dark">🌑 Klasse Brutalist (Oscuro)</option>
                  <option value="slate-dark">⚙️ Industrial Slate Gray</option>
                  <option value="cyberpunk">⚡ Cyberpunk Neon (Eléctrico)</option>
                  <option value="editorial">📜 warm Editorial / Retro</option>
                </select>
              </div>

              <div>
                <label className="block font-black text-gray-700 uppercase mb-1">Año Académico, Periodo o Ciclo:</label>
                <input 
                  type="text"
                  id="settings-academic-year"
                  required
                  value={settings.academicYear || ""}
                  onChange={(e) => onUpdateSettings({ ...settings, academicYear: e.target.value })}
                  placeholder="Ej. Semestre 1 - 2026 o Año Lectivo 25-26"
                  className="w-full bg-white neo-border-thin p-2 focus:outline-none"
                />
              </div>

              {/* Toggles item checks block */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="settings-offline-mode-checkbox"
                    checked={settings.offlineMode}
                    onChange={(e) => {
                      onUpdateSettings({ ...settings, offlineMode: e.target.checked });
                      addSystemNotification(e.target.checked ? "Soporte de Caché Offline activado" : "Caché Offline desactivado", "info");
                    }}
                    className="w-4 h-4 accent-[#1A1A1A] neo-border-thin"
                  />
                  <span>Habilitar Soporte de Caché Offline</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="settings-notifications-checkbox"
                    checked={settings.notificationsEnabled}
                    onChange={(e) => {
                      onUpdateSettings({ ...settings, notificationsEnabled: e.target.checked });
                      addSystemNotification(e.target.checked ? "Mensajería emergente del aula activada" : "Mensajería desactivada", "info");
                    }}
                    className="w-4 h-4 accent-[#1A1A1A] neo-border-thin"
                  />
                  <span>Habilitar Alertas Visuales Acumuladas</span>
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white border-4 border-bauhaus-red p-6 neo-shadow-yellow flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-md font-black uppercase text-bauhaus-red flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 animate-pulse" /> ZONA DE PELIGRO CRÍTICO
              </h3>
              
              <p className="text-[11px] font-mono text-gray-500 leading-relaxed">
                El restablecimiento purgará toda la base de datos de calificaciones locales y reestablecerá los 8 alumnos iniciales de KLASSE de fábrica. Esta acción no se puede revertir.
              </p>
            </div>

            {/* Locker slider */}
            <div className="bg-red-50 p-3 neo-border-thin flex items-center justify-between font-mono text-xs">
              <span className="font-bold text-red-800">Desbloquear Gatillo De Seguridad:</span>
              <input 
                type="checkbox" 
                id="settings-danger-zone-checkbox"
                checked={isDangerUnlocked}
                onChange={(e) => {
                  setIsDangerUnlocked(e.target.checked);
                  if (e.target.checked) {
                    addSystemNotification("Gatillo Zona de Peligro desbloqueado. Proceda con precaución", "warning");
                  }
                }}
                className="w-5 h-5 accent-red-600 cursor-pointer"
              />
            </div>

            <div>
              <button 
                id="btn-factory-reset"
                onClick={handleResetClick}
                disabled={!isDangerUnlocked}
                className={`w-full py-3 px-4 text-xs font-black uppercase text-center border-2 transition-all block cursor-pointer ${
                  isDangerUnlocked 
                    ? "bg-bauhaus-red text-white border-black shadow-[4px_4px_0px_0px_#1A1A1A] hover:bg-rose-700 hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 hover:shadow-none" 
                    : "bg-gray-100 text-gray-400 border-gray-300 opacity-60 cursor-not-allowed"
                }`}
              >
                🚨 RESTABLECER PORTAL DE FÁBRICA
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
