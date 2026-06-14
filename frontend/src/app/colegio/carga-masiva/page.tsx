'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BackButton } from '@/components/ui/BackButton'
import { api } from '@/lib/api-client'

// ── Types ──────────────────────────────────────────────────────────────────────
interface CsvRow {
  firstName: string
  lastName:  string
  email:     string
  specialty: string
  year:      number
  // validation
  error?: string
}

interface ImportResult {
  row: CsvRow
  success: boolean
  tempPassword?: string
  error?: string
}

interface CreatedStudent {
  userId: string; email: string; firstName: string; lastName: string; tempPassword: string
}

// ── CSV template ───────────────────────────────────────────────────────────────
const CSV_HEADERS = 'nombre,apellido,email,especialidad,año'
const CSV_EXAMPLE = [
  'Ana,Pérez,aperez@colegio.cl,Informática,3',
  'Bruno,Soto,bsoto@colegio.cl,Redes,2',
  'Camila,Torres,ctorres@colegio.cl,Electrónica,4',
].join('\n')

function downloadTemplate() {
  const content = `${CSV_HEADERS}\n${CSV_EXAMPLE}`
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = 'plantilla_estudiantes.csv'
  document.body.appendChild(link); link.click()
  document.body.removeChild(link); URL.revokeObjectURL(url)
}

// ── CSV parser ─────────────────────────────────────────────────────────────────
function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  // Skip header row
  return lines.slice(1).map((line, idx) => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    const [firstName = '', lastName = '', email = '', specialty = '', yearStr = ''] = cols
    const year = parseInt(yearStr) || 1
    const row: CsvRow = { firstName, lastName, email, specialty, year }
    if (!firstName) row.error = `Fila ${idx + 2}: falta el nombre`
    else if (!lastName) row.error = `Fila ${idx + 2}: falta el apellido`
    else if (!email || !email.includes('@')) row.error = `Fila ${idx + 2}: email inválido`
    return row
  })
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CargaMasivaPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  // CSV import flow
  const [csvRows,    setCsvRows]    = useState<CsvRow[]>([])
  const [importing,  setImporting]  = useState(false)
  const [results,    setResults]    = useState<ImportResult[]>([])
  const [showDone,   setShowDone]   = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  // Individual creation form
  const [form, setForm]           = useState({ firstName: '', lastName: '', email: '', specialty: '', year: '1' })
  const [creating, setCreating]   = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createdStudents, setCreatedStudents] = useState<CreatedStudent[]>([])

  // ── File handling ────────────────────────────────────────────────────────────
  const processFile = (file: File) => {
    setParseError(null); setCsvRows([]); setResults([]); setShowDone(false)
    const isCSV  = file.name.endsWith('.csv')
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isCSV && !isXLSX) {
      setParseError('Solo se aceptan archivos .CSV o .XLSX.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setParseError('El archivo supera el límite de 5MB.')
      return
    }

    const applyRows = (rows: CsvRow[]) => {
      if (rows.length === 0) { setParseError('El archivo no contiene datos válidos.'); return }
      if (rows.length > 500) { setParseError('El archivo supera el límite de 500 estudiantes.'); return }
      setCsvRows(rows)
    }

    if (isCSV) {
      const reader = new FileReader()
      reader.onload = e => applyRows(parseCSV(e.target?.result as string))
      reader.readAsText(file, 'utf-8')
    } else {
      // XLSX / XLS — use SheetJS
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data     = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheet    = workbook.Sheets[workbook.SheetNames[0]]
          // header: 1 → returns raw arrays; first row is assumed to be the header
          const raw = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
          if (raw.length < 2) { setParseError('El archivo no contiene datos válidos.'); return }
          // Build a fake CSV text and re-use the same parser (skips first row as header)
          const csvText = raw.map(row => row.join(',')).join('\n')
          applyRows(parseCSV(csvText))
        } catch {
          setParseError('No se pudo leer el archivo XLSX. Verifica que sea un archivo Excel válido.')
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Import rows ──────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = csvRows.filter(r => !r.error)
    if (!validRows.length) return
    setImporting(true)
    const res: ImportResult[] = []
    for (const row of csvRows) {
      if (row.error) { res.push({ row, success: false, error: row.error }); continue }
      try {
        const created = await api.post<CreatedStudent>('/schools/me/students', {
          email: row.email, firstName: row.firstName,
          lastName: row.lastName, specialty: row.specialty || undefined,
          year: row.year,
        })
        res.push({ row, success: true, tempPassword: created.tempPassword })
      } catch (err: any) {
        res.push({ row, success: false, error: err?.message ?? 'Error al crear' })
      }
    }
    setResults(res)
    setImporting(false)
    setShowDone(true)
  }

  // ── Individual create ────────────────────────────────────────────────────────
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true); setCreateError(null)
    try {
      const result = await api.post<CreatedStudent>('/schools/me/students', {
        email: form.email, firstName: form.firstName,
        lastName: form.lastName, specialty: form.specialty || undefined,
        year: parseInt(form.year) || 1,
      })
      setCreatedStudents(prev => [result, ...prev])
      setForm({ firstName: '', lastName: '', email: '', specialty: '', year: '1' })
    } catch (err: any) {
      setCreateError(err?.message ?? 'Error al crear el estudiante')
    } finally { setCreating(false) }
  }

  const successCount = results.filter(r => r.success).length
  const errorCount   = results.filter(r => !r.success).length
  const validCount   = csvRows.filter(r => !r.error).length
  const errorRows    = csvRows.filter(r => r.error)

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <BackButton href="/colegio/estudiantes" label="Volver a estudiantes" className="mb-6 block" />

      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold text-on-surface">Gestión de Estudiantes</h1>
        <p className="text-on-surface-variant mt-1">Agrega estudiantes individualmente o importa desde un archivo CSV o XLSX.</p>
      </div>

      {/* ── Individual form ──────────────────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <h2 className="font-headline font-bold text-on-surface mb-1">Agregar estudiante individual</h2>
        <p className="text-sm text-on-surface-variant mb-5">
          Crea una cuenta vinculada a tu institución. Se genera una contraseña temporal para compartir con el estudiante.
        </p>
        <form onSubmit={handleCreateStudent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nombre" value={form.firstName}
            onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
          <Input label="Apellido" value={form.lastName}
            onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
          <Input label="Correo electrónico" type="email" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Especialidad" value={form.specialty}
            onChange={e => setForm(p => ({ ...p, specialty: e.target.value }))}
            placeholder="Ej: Informática" />
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1.5">Año</label>
            <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {[1,2,3,4,5,6,7].map(y => <option key={y} value={y}>{y}° año</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" icon="person_add" loading={creating} className="w-full">Crear estudiante</Button>
          </div>
        </form>
        {createError && <p className="mt-3 text-sm text-error font-semibold">{createError}</p>}
      </div>

      {/* Created this session */}
      {createdStudents.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-headline font-bold text-on-surface mb-4">Creados esta sesión</h2>
          <div className="space-y-3">
            {createdStudents.map(s => (
              <div key={s.userId} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-on-surface">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-on-surface-variant">{s.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-outline mb-0.5">Contraseña temporal</p>
                  <code className="text-sm font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded">{s.tempPassword}</code>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-outline mt-3">⚠ Comparte las contraseñas con los estudiantes. Deben cambiarlas al iniciar sesión.</p>
        </div>
      )}

      {/* ── CSV import ───────────────────────────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-headline font-bold text-on-surface">Importación masiva</h2>
            <p className="text-sm text-on-surface-variant mt-0.5">Sube un archivo CSV o XLSX con los estudiantes a registrar.</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Descargar plantilla
          </button>
        </div>

        {/* Format reference */}
        <div className="bg-surface-container-low rounded-xl p-4 mb-5 font-mono text-xs text-on-surface-variant overflow-x-auto">
          <p className="text-[11px] font-sans font-bold text-outline mb-1.5 uppercase tracking-wider">Formato esperado (CSV)</p>
          <p className="text-primary">{CSV_HEADERS}</p>
          {CSV_EXAMPLE.split('\n').map((l, i) => <p key={i}>{l}</p>)}
        </div>

        {/* Drop zone */}
        {!csvRows.length && !showDone && (
          <>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFilePick} />
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-12 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary bg-primary-fixed/20'
                  : 'border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-low'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-[28px]">upload_file</span>
              </div>
              <p className="font-bold text-on-surface text-sm">Arrastra tu archivo aquí</p>
              <p className="text-xs text-on-surface-variant mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-outline mt-2">.CSV o .XLSX · Máximo 5MB · Hasta 500 filas</p>
            </div>
            {parseError && (
              <div className="mt-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">error</span>
                <p className="text-sm text-error font-semibold">{parseError}</p>
              </div>
            )}
          </>
        )}

        {/* Preview */}
        {csvRows.length > 0 && !showDone && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-on-surface">{csvRows.length} filas encontradas</span>
                {errorRows.length > 0
                  ? <span className="text-xs font-bold text-error bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">{errorRows.length} con errores</span>
                  : <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] icon-filled">check_circle</span>
                      Sin errores
                    </span>
                }
              </div>
              <button onClick={() => { setCsvRows([]); setParseError(null) }}
                className="text-xs font-semibold text-outline hover:text-error transition-colors">
                Cancelar
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/15 mb-5">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['#', 'Nombre', 'Apellido', 'Email', 'Especialidad', 'Año', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-outline whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {csvRows.map((row, i) => (
                    <tr key={i} className={`hover:bg-surface-container-low transition-colors ${row.error ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-3 text-sm text-outline">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface">{row.firstName || <span className="text-error">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{row.lastName || <span className="text-error">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{row.email || <span className="text-error">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{row.specialty || <span className="text-outline">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-center text-on-surface-variant">{row.year}°</td>
                      <td className="px-4 py-3">
                        {row.error
                          ? <span className="text-xs text-error font-semibold">{row.error}</span>
                          : <span className="material-symbols-outlined text-green-600 text-[16px] icon-filled">check_circle</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-on-surface-variant">
                Se importarán <strong>{validCount}</strong> estudiantes válidos
                {errorRows.length > 0 && <span className="text-error"> · {errorRows.length} se omitirán por errores</span>}
              </p>
              <Button
                icon="group_add"
                loading={importing}
                onClick={handleImport}
                disabled={validCount === 0}
              >
                Importar {validCount} estudiantes
              </Button>
            </div>
          </div>
        )}

        {/* Done state */}
        {showDone && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[32px] text-green-500 icon-filled">task_alt</span>
              </div>
              <div>
                <h3 className="font-headline font-bold text-on-surface text-lg">Importación completada</h3>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  <span className="text-green-700 font-bold">{successCount} importados correctamente</span>
                  {errorCount > 0 && <span className="text-error font-bold"> · {errorCount} fallaron</span>}
                </p>
              </div>
            </div>

            {/* Results table */}
            <div className="overflow-x-auto rounded-xl border border-outline-variant/15 mb-5">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['Estudiante', 'Email', 'Estado', 'Contraseña temporal'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-widest text-outline">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {results.map((r, i) => (
                    <tr key={i} className={r.success ? '' : 'bg-red-50/50'}>
                      <td className="px-4 py-3 text-sm font-semibold text-on-surface">{r.row.firstName} {r.row.lastName}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">{r.row.email}</td>
                      <td className="px-4 py-3">
                        {r.success
                          ? <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✓ Creado</span>
                          : <span className="text-xs font-bold text-error bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">✗ Error</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {r.tempPassword
                          ? <code className="text-sm font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded">{r.tempPassword}</code>
                          : <span className="text-xs text-error">{r.error}</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-outline mb-5">⚠ Comparte las contraseñas temporales con cada estudiante. Deben cambiarlas al iniciar sesión.</p>

            <Button variant="secondary" icon="upload_file" onClick={() => { setCsvRows([]); setResults([]); setShowDone(false) }}>
              Importar otro archivo
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
