'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Copy, ExternalLink, TestTube, Upload, X, Play, Pause, Image, Music } from 'lucide-react'

interface OverlaySettings {
  id?: string
  user_id?: string
  bg_color: string
  text_color: string
  accent_color: string
  font_size: number
  duration: number
  sound_enabled: boolean
  sound_url: string | null
  alert_image_url: string | null
  min_amount: number
}

interface OverlaySettingsFormProps {
  userId: string
  initialSettings: OverlaySettings | null
  overlayUrl: string
}

const defaultSettings: OverlaySettings = {
  bg_color: '#1a1a2e',
  text_color: '#ffffff',
  accent_color: '#e94560',
  font_size: 24,
  duration: 5,
  sound_enabled: true,
  sound_url: null,
  alert_image_url: null,
  min_amount: 1000,
}

export default function OverlaySettingsForm({ userId, initialSettings, overlayUrl }: OverlaySettingsFormProps) {
  const [settings, setSettings] = useState<OverlaySettings>(
    initialSettings ? { ...defaultSettings, ...initialSettings } : defaultSettings
  )
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from('overlay_settings')
      .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const handleTestDonate = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/test-donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error('Test failed')
    } catch (err) {
      console.error(err)
    } finally {
      setTesting(false)
    }
  }

  const uploadFile = async (
    file: File,
    folder: 'images' | 'audio',
    setter: (url: string | null) => void,
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${folder}/${userId}-${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('overlay-assets')
      .upload(path, file, { upsert: true })

    if (error) {
      alert('Upload thất bại: ' + error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('overlay-assets').getPublicUrl(path)
    setter(data.publicUrl)
    setUploading(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      alert('Chỉ hỗ trợ PNG, JPG, GIF, WEBP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File tối đa 5MB')
      return
    }
    uploadFile(file, 'images', (url) => update('alert_image_url', url), setUploadingImage)
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
    if (!allowed.includes(file.type)) {
      alert('Chỉ hỗ trợ MP3, WAV, OGG')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File tối đa 10MB')
      return
    }
    uploadFile(file, 'audio', (url) => update('sound_url', url), setUploadingAudio)
  }

  const toggleAudioPreview = () => {
    if (!settings.sound_url) return
    if (!audioRef.current) {
      audioRef.current = new Audio(settings.sound_url)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    } else {
      audioRef.current.src = settings.sound_url
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const update = (key: keyof OverlaySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Form */}
      <div className="space-y-4">
        {/* Overlay URL */}
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Link Overlay OBS</h2>
          <div className="bg-black/30 p-3 rounded-lg flex items-center gap-2">
            <code className="flex-1 text-purple-400 font-mono text-xs truncate">{overlayUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(overlayUrl)} className="p-1.5 hover:bg-white/10 rounded-lg" title="Copy">
              <Copy size={14} className="text-gray-400" />
            </button>
            <a href={overlayUrl} target="_blank" className="p-1.5 hover:bg-white/10 rounded-lg" title="Mở">
              <ExternalLink size={14} className="text-gray-400" />
            </a>
          </div>
          <p className="text-xs text-gray-600 mt-2">Thêm URL này vào OBS: Add Source → Browser → URL</p>
        </div>

        {/* Alert Image */}
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Ảnh / GIF Alert</h2>
          <p className="text-xs text-gray-600 mb-4">Hiển thị bên trái khi có donate. PNG, JPG, GIF, WEBP — tối đa 5MB</p>

          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageUpload} className="hidden" />

          {settings.alert_image_url ? (
            <div className="flex items-start gap-4">
              <div className="relative">
                <img src={settings.alert_image_url} alt="Alert image" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                <button onClick={() => update('alert_image_url', null)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center">
                  <X size={12} />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2 truncate">{settings.alert_image_url.split('/').pop()}</p>
                <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                  className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm transition-colors disabled:opacity-50">
                  <Upload size={14} />
                  {uploadingImage ? 'Đang upload...' : 'Đổi ảnh'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
              className="w-full border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50">
              {uploadingImage ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              ) : (
                <>
                  <Image size={28} className="text-gray-600" />
                  <span className="text-sm text-gray-500">Click để upload ảnh / GIF</span>
                  <span className="text-xs text-gray-600">PNG, JPG, GIF, WEBP — tối đa 5MB</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Audio */}
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-1">Âm thanh Alert</h2>
          <p className="text-xs text-gray-600 mb-4">Phát khi có donate. MP3, WAV, OGG — tối đa 10MB</p>

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={settings.sound_enabled} onChange={(e) => update('sound_enabled', e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-gray-400 text-sm">Bật âm thanh khi có donate</span>
          </label>

          {settings.sound_enabled && (
            <>
              <input ref={audioInputRef} type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm" onChange={handleAudioUpload} className="hidden" />

              {settings.sound_url ? (
                <div className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
                  <button onClick={toggleAudioPreview} className="w-9 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center flex-shrink-0 transition-colors">
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-300 truncate">{settings.sound_url.split('/').pop()?.split('?')[0] || 'audio file'}</p>
                    <p className="text-xs text-gray-600">Click ▶ để nghe thử</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-500 transition-colors disabled:opacity-50" title="Đổi file"><Upload size={12} /></button>
                    <button onClick={() => { update('sound_url', null); setIsPlaying(false) }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors" title="Xóa"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => audioInputRef.current?.click()} disabled={uploadingAudio}
                  className="w-full border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-xl p-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50">
                  {uploadingAudio ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  ) : (
                    <>
                      <Music size={28} className="text-gray-600" />
                      <span className="text-sm text-gray-500">Click để upload âm thanh</span>
                      <span className="text-xs text-gray-600">MP3, WAV, OGG — tối đa 10MB</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Colors */}
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Màu sắc</h2>
          <div className="grid grid-cols-3 gap-3">
            {([['bg_color', 'Nền'], ['text_color', 'Chữ'], ['accent_color', 'Nhấn']] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings[key]} onChange={(e) => update(key, e.target.value)} className="w-9 h-9 rounded cursor-pointer border border-white/10" />
                  <input type="text" value={settings[key]} onChange={(e) => update(key, e.target.value)} className="flex-1 px-2 py-1 bg-black/30 border border-white/10 rounded text-xs font-mono text-gray-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography & Timing */}
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Chữ & Thời gian</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cỡ chữ: {settings.font_size}px</label>
              <input type="range" min="16" max="48" value={settings.font_size} onChange={(e) => update('font_size', parseInt(e.target.value))} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thời gian hiển thị: {settings.duration}s</label>
              <input type="range" min="3" max="15" value={settings.duration} onChange={(e) => update('duration', parseInt(e.target.value))} className="w-full accent-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Donate tối thiểu: {settings.min_amount.toLocaleString('vi-VN')}đ</label>
              <input type="number" value={settings.min_amount} onChange={(e) => update('min_amount', parseInt(e.target.value))} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-300" min="0" step="1000" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
            {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cài đặt'}
          </button>
          <button onClick={handleTestDonate} disabled={testing} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
            <TestTube size={14} />
            {testing ? 'Đang test...' : 'Test Donate'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <div className="bg-[#18181f] p-5 rounded-xl border border-white/5 sticky top-8">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Preview</h2>
          <div className="relative rounded-xl overflow-hidden" style={{ background: '#1a1a1a', minHeight: '200px' }}>
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">Stream của bạn</div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-4">
              <div style={{ background: settings.bg_color, border: `2px solid ${settings.accent_color}`, borderRadius: '14px', overflow: 'hidden' }}>
                {/* Alert image banner - separate from avatar */}
                {settings.alert_image_url && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 12px 0' }}>
                    <img src={settings.alert_image_url} alt="Alert" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                  </div>
                )}
                {/* Donor row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: settings.accent_color, color: settings.text_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>K</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: settings.accent_color, fontSize: `${settings.font_size}px`, fontWeight: 'bold' }}>KhoaiTay</span>
                      <span style={{ color: '#4ade80', fontSize: `${settings.font_size * 0.85}px`, fontWeight: '600' }}>+50,000đ</span>
                    </div>
                    <p style={{ color: settings.text_color, fontSize: `${settings.font_size * 0.75}px`, marginTop: '1px' }}>Cày game thôi bro!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            {settings.alert_image_url ? 'Ảnh/GIF hiển thị phía trên, avatar bên dưới' : 'Upload ảnh/GIF để xem preview đầy đủ'}
          </p>
        </div>
      </div>
    </div>
  )
}
