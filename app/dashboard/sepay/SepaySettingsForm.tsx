'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, Info } from 'lucide-react'

interface SepaySettings {
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  sepay_api_key: string | null
  sepay_webhook_secret: string | null
  use_api: boolean
}

interface SepaySettingsFormProps {
  userId: string
  initialSettings: SepaySettings | null
  webhookUrl: string
}

const BANKS = [
  { code: 'vcb', name: 'Vietcombank' },
  { code: 'tcb', name: 'Techcombank' },
  { code: 'mb', name: 'MB Bank' },
  { code: 'acb', name: 'ACB' },
  { code: 'bidv', name: 'BIDV' },
  { code: 'agribank', name: 'Agribank' },
  { code: 'tpb', name: 'TPBank' },
  { code: 'vpb', name: 'VPBank' },
  { code: 'ocb', name: 'OCB' },
  { code: 'msb', name: 'MSB' },
  { code: 'shb', name: 'SHB' },
  { code: 'vib', name: 'VIB' },
  { code: 'hdbank', name: 'HDBank' },
  { code: 'scb', name: 'SCB' },
  { code: 'seabank', name: 'SeABank' },
  { code: 'pvcombank', name: 'PVcomBank' },
  { code: 'momo', name: 'MoMo' },
  { code: 'zalopay', name: 'ZaloPay' },
]

export default function SepaySettingsForm({ userId, initialSettings, webhookUrl }: SepaySettingsFormProps) {
  const [activeTab, setActiveTab] = useState<'qr' | 'api'>('qr')
  const [settings, setSettings] = useState<SepaySettings>({
    bank_name: initialSettings?.bank_name || null,
    account_number: initialSettings?.account_number || null,
    account_name: initialSettings?.account_name || null,
    sepay_api_key: initialSettings?.sepay_api_key || null,
    sepay_webhook_secret: initialSettings?.sepay_webhook_secret || null,
    use_api: initialSettings?.use_api || false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase.from('sepay_settings').upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    setSaving(false)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const update = (key: keyof SepaySettings, value: any) => setSettings((prev) => ({ ...prev, [key]: value || null }))

  return (
    <div className="max-w-2xl space-y-4">
      {/* Tab Switcher */}
      <div className="flex bg-[#18181f] rounded-xl p-1 border border-white/5">
        {(['qr', 'api'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {tab === 'qr' ? 'QR Code thủ công' : 'API Sepay tự động'}
          </button>
        ))}
      </div>

      {/* QR Tab */}
      {activeTab === 'qr' && (
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg">
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300/80">Nhập thông tin ngân hàng để hiển thị QR code. Khán giả quét QR để chuyển khoản.</p>
          </div>
          {([
            ['bank_name', 'Ngân hàng', 'select'] as const,
            ['account_number', 'Số tài khoản', 'text'] as const,
            ['account_name', 'Tên chủ tài khoản', 'text'] as const
          ]).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
              {type === 'select' ? (
                <select value={settings[key] || ''} onChange={(e) => update(key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-purple-500">
                  <option value="">Chọn ngân hàng</option>
                  {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              ) : (
                <input type={type} value={settings[key] || ''} onChange={(e) => update(key, e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500" placeholder={label} />
              )}
            </div>
          ))}
          {settings.bank_name && settings.account_number && (
            <div className="p-3 bg-black/30 rounded-lg text-center">
              <p className="text-xs text-gray-500 mb-2">Preview QR Code</p>
              <img src={`https://img.vietqr.io/image/${settings.bank_name}-${settings.account_number}-compact2.png?accountName=${encodeURIComponent(settings.account_name || '')}`}
                alt="QR Preview" className="w-32 h-32 object-contain mx-auto bg-white p-2 rounded-lg" />
            </div>
          )}
        </div>
      )}

      {/* API Tab */}
      {activeTab === 'api' && (
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
            <Info size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-green-300/80">
              <p className="font-medium text-green-400 mb-1">Tích hợp API Sepay tự động</p>
              <p>Khi có chuyển khoản, overlay sẽ hiển thị ngay lập tức.</p>
            </div>
          </div>
          {([
            ['sepay_api_key', 'Sepay API Key', 'password'] as const,
            ['sepay_webhook_secret', 'Webhook Secret', 'password'] as const
          ]).map(([key, label, type]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
              <input type={type} value={settings[key] || ''} onChange={(e) => update(key, e.target.value)}
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-purple-500" placeholder={label} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Webhook URL</label>
            <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg">
              <code className="flex-1 text-purple-400 font-mono text-xs truncate">{webhookUrl}</code>
              <button onClick={() => navigator.clipboard.writeText(webhookUrl)} className="p-1.5 hover:bg-white/10 rounded-lg"><Copy size={14} className="text-gray-500" /></button>
            </div>
            <p className="text-xs text-gray-600 mt-1">Dán URL này vào Sepay dashboard</p>
          </div>
          <div className="p-3 bg-black/30 rounded-lg">
            <p className="text-xs font-medium text-gray-400 mb-2">Hướng dẫn:</p>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>Đăng nhập <a href="https://sepay.vn" target="_blank" className="text-purple-400 hover:underline">sepay.vn</a></li>
              <li>Vào API & Webhook → Tạo API key → Copy vào ô trên</li>
              <li>Thêm Webhook URL vào danh sách webhook</li>
              <li>Copy Webhook Secret và dán vào ô trên</li>
            </ol>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.use_api} onChange={(e) => update('use_api', e.target.checked)} className="w-4 h-4 rounded accent-purple-500" />
            <span className="text-sm text-gray-400">Bật tích hợp API Sepay</span>
          </label>
        </div>
      )}

      <button onClick={handleSave} disabled={saving} className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
        {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cài đặt'}
      </button>
    </div>
  )
}
