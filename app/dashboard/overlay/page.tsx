import { createClient } from '@/lib/supabase/server'
import OverlaySettingsForm from './OverlaySettingsForm'

export default async function OverlaySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const { data: settings } = await supabase
    .from('overlay_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const overlayUrl = profile?.username ? `${appUrl}/overlay/${profile.username}` : ''

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Cài đặt Overlay</h1>
      <p className="text-gray-500 text-sm mb-6">Tùy chỉnh giao diện alert donate trên stream của bạn</p>

      <OverlaySettingsForm
        userId={user.id}
        initialSettings={settings}
        overlayUrl={overlayUrl}
      />
    </div>
  )
}
