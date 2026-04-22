import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createClient } from '@/utils/supabase/server'

export async function middleware(request: NextRequest) {
  // 1. Rafraîchir la session Supabase (essentiel pour les cookies)
  const response = await updateSession(request)
  
  // 2. Vérifier si l'utilisateur est connecté pour les routes protégées
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/settings')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

  // Redirection : Pas de session -> Page de connexion
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirection : Déjà connecté -> Pas besoin de repasser par le Login
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Matcher pour toutes les routes sauf fichiers statiques et assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
