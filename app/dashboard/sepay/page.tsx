import { createClient } from '@/lib/supabase/server'
import SepaySettingsForm from './SepaySettingsForm'

export default async function SepaySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: settings } = await supabase
    .from('sepay_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const webhookUrl = `${appUrl}/api/sepay/webhook`

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-1">Cài đặt Sepay</h1>
      <p className="text-gray-500 text-sm mb-6">Cấu hình nhận tiền qua Sepay và ngân hàng</p>

      <SepaySettingsForm
        userId={user.id}
        initialSettings={settings}
        webhookUrl={webhookUrl}
      />
    </div>
  )
}
