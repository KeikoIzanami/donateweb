'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Copy, ExternalLink, Layers, QrCode, TrendingUp } from 'lucide-react'

interface Profile {
  username: string
  display_name: string | null
}

interface Donation {
  amount: number
  status: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const supabase = createClient()

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const { data: donationsData } = await supabase.from('donations').select('amount, status').eq('streamer_id', user.id).eq('status', 'confirmed')

      setProfile(profileData)
      setDonations(donationsData || [])
      setLoading(false)
    }
    getUserData()
  }, [])

  const totalDonations = donations.reduce((sum, d) => sum + Number(d.amount), 0)
  const totalCount = donations.length
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const donateUrl = profile?.username ? `${appUrl}/${profile.username}` : ''
  const overlayUrl = profile?.username ? `${appUrl}/overlay/${profile.username}` : ''

  const copy = (text: string) => navigator.clipboard.writeText(text)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Tổng quan</h1>
      <p className="text-gray-500 mb-8">Chào mừng {profile?.display_name || profile?.username || 'streamer'}!</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Tổng tiền donate', value: `${totalDonations.toLocaleString('vi-VN')}đ` },
          { icon: QrCode, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Số lượng donate', value: totalCount.toString() },
          { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Trạng thái', value: profile?.username ? 'Đang hoạt động' : 'Chưa cài đặt' },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} className="bg-[#18181f] border border-white/5 p-5 rounded-xl">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={color} size={22} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { title: 'Trang donate của bạn', url: donateUrl, desc: 'Chia link này cho khán giả để họ donate' },
          { title: 'Link Overlay cho OBS', url: overlayUrl, desc: 'Add Source → Browser → URL trong OBS' },
        ].map(({ title, url, desc }) => (
          <div key={title} className="bg-[#18181f] border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-gray-300 mb-3">{title}</h2>
            <div className="flex items-center gap-2 bg-black/30 px-3 py-2.5 rounded-lg mb-3">
              <code className="flex-1 text-purple-400 font-mono text-xs truncate">{url || '—'}</code>
              <button onClick={() => copy(url)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Copy">
                <Copy size={14} className="text-gray-400" />
              </button>
              <Link href={url || '#'} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" title="Mở">
                <ExternalLink size={14} className="text-gray-400" />
              </Link>
            </div>
            <p className="text-xs text-gray-600">{desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Thao tác nhanh</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/dashboard/overlay', label: 'Cài đặt Overlay', cls: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20' },
            { href: '/dashboard/sepay', label: 'Cài đặt Sepay', cls: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20' },
            { href: '/dashboard/settings', label: 'Chỉnh sửa hồ sơ', cls: 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10' },
          ].map(({ href, label, cls }) => (
            <Link key={href} href={href} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${cls}`}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
