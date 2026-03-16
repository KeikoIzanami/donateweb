import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OverlayAlert from '@/components/OverlayAlert'

export default async function OverlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Get streamer profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', slug)
    .single()

  if (!profile) {
    notFound()
  }

  // Get overlay settings
  const { data: settings } = await supabase
    .from('overlay_settings')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  const defaultSettings = {
    bg_color: '#1a1a2e',
    text_color: '#ffffff',
    accent_color: '#e94560',
    font_size: 24,
    duration: 5,
    sound_enabled: true,
  }

  const overlaySettings = { ...defaultSettings, ...settings }

  return (
    <OverlayAlert
      streamerId={profile.id}
      settings={overlaySettings}
    />
  )
}
