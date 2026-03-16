import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, Settings, Layers, CreditCard, LogOut } from 'lucide-react'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const navLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
    { href: '/dashboard/overlay', icon: Layers, label: 'Cài đặt Overlay' },
    { href: '/dashboard/sepay', icon: CreditCard, label: 'Cài đặt Sepay' },
    { href: '/dashboard/settings', icon: Settings, label: 'Hồ sơ' },
  ]

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#18181f] border-r border-white/5 p-4 flex flex-col">
        <div className="mb-8 px-2">
          <Link href="/" className="text-2xl font-bold text-white">
            Donate<span className="text-purple-400">Web</span>
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          {navLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl mb-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {(profile?.display_name || profile?.username || 'S')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">
                {profile?.display_name || profile?.username || 'Streamer'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {profile?.username ? `/${profile.username}` : 'Chưa có username'}
              </p>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
