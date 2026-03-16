import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DonateForm from '@/components/DonateForm'
import DonationHistory from '@/components/DonationHistory'
import QRCodeDisplay from '@/components/QRCodeDisplay'
import Link from 'next/link'

export default async function StreamerPage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Get streamer settings
  const { data: sepaySettings } = await supabase
    .from('sepay_settings')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  // Get recent donations
  const { data: donations } = await supabase
    .from('donations')
    .select('*')
    .eq('streamer_id', profile.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white">
            {profile.display_name?.[0]?.toUpperCase() || profile.username[0].toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {profile.display_name || profile.username}
          </h1>
          {profile.bio && (
            <p className="text-gray-400 max-w-md mx-auto">{profile.bio}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Donate Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Gửi donate</h2>
            <DonateForm streamerId={profile.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {(sepaySettings?.bank_name || sepaySettings?.use_api) && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Quét QR</h2>
                <QRCodeDisplay settings={sepaySettings} />
              </div>
            )}

            {/* Recent Donations */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Donate gần đây</h2>
              <DonationHistory donations={donations || []} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Powered by{' '}
            <Link href="/" className="text-purple-400 hover:text-purple-300">
              DonateWeb
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
