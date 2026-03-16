import { createClient } from '@/lib/supabase/server'
import ProfileSettingsForm from './ProfileSettingsForm'

export default async function ProfileSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Hồ sơ</h1>
      <p className="text-gray-500 text-sm mb-6">Cập nhật thông tin trang donate của bạn</p>

      <ProfileSettingsForm userId={user.id} initialProfile={profile} />
    </div>
  )
}
