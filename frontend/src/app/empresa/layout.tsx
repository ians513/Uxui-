export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-20 min-h-screen bg-surface">
      {children}
    </div>
  )
}
