// Redirects to /cv which renders without the student navbar.
import { redirect } from 'next/navigation'

export default function CVPageRedirect() {
  redirect('/cv')
}
