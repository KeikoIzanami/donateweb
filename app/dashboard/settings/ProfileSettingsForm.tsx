'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
}

interface ProfileSettingsFormProps {
  userId: string
  initialProfile: Profile | null
}

export default function ProfileSettingsForm({ userId, initialProfile }: ProfileSettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '')
  const [bio, setBio] = useState(initialProfile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError('')
    const { error } = await supabase.from('profiles').update({ display_name: displayName || null, bio: bio || null }).eq('id', userId)
    setSaving(false)
    if (error) { setError(error.message) } else { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  return (
    <div className="max-w-lg">
      <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">{error}</div>}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
            <div className="px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-gray-500 text-sm">
              {initialProfile?.username || 'Chưa có username'}
            </div>
            <p className="text-xs text-gray-600 mt-1">Username không thể thay đổi</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tên hiển thị</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500"
              placeholder="Tên hiển thị trên trang donate" maxLength={50} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Giới thiệu</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500 resize-none"
              placeholder="Giới thiệu ngắn về bạn..." rows={3} maxLength={200} />
            <p className="text-xs text-gray-600 mt-1 text-right">{bio.length}/200</p>
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
            {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  )
}
