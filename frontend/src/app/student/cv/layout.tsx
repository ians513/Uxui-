// Override parent student layout: CV page gets its own full-page layout
// The parent StudentNav is still rendered above this, but the page handles its own spacing.
export default function CVLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
