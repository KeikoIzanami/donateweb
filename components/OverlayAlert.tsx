'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OverlaySettings {
  bg_color: string
  text_color: string
  accent_color: string
  font_size: number
  duration: number
  sound_enabled: boolean
  sound_url?: string | null
  alert_image_url?: string | null
}

interface DonationAlert {
  id: string
  donor_name: string
  message: string | null
  amount: number
}

interface OverlayAlertProps {
  streamerId: string
  settings: OverlaySettings
}

const TRANSPARENT_STYLE = 'html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }'

export default function OverlayAlert({ streamerId, settings }: OverlayAlertProps) {
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null)
  const [visible, setVisible] = useState(false)
  const queueRef = useRef<DonationAlert[]>([])
  const processingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (settings.sound_enabled && settings.sound_url) {
      audioRef.current = new Audio(settings.sound_url)
      audioRef.current.preload = 'auto'
    }
  }, [])

  const playSound = () => {
    if (!settings.sound_enabled || !settings.sound_url || !audioRef.current) return
    try {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    } catch {}
  }

  const processQueue = () => {
    if (processingRef.current || queueRef.current.length === 0) return
    processingRef.current = true
    const next = queueRef.current.shift()!
    setCurrentAlert(next)
    setVisible(true)
    playSound()
    setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentAlert(null)
        processingRef.current = false
        processQueue()
      }, 700)
    }, settings.duration * 1000)
  }

  const addToQueue = (donation: DonationAlert) => {
    queueRef.current.push(donation)
    if (!processingRef.current) processQueue()
  }

  useEffect(() => {
    const channel = supabase
      .channel(`overlay:${streamerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `streamer_id=eq.${streamerId}`,
      }, (payload) => {
        const d = payload.new as any
        if (d.status === 'confirmed' || d.status === 'test') {
          addToQueue({ id: d.id, donor_name: d.donor_name, message: d.message, amount: d.amount })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [streamerId])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TRANSPARENT_STYLE }} />
      {currentAlert && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${visible ? '0' : '30px'})`,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          width: '90%',
          maxWidth: '520px',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          <div style={{
            background: settings.bg_color,
            border: `2px solid ${settings.accent_color}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          }}>
            {settings.alert_image_url && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 16px 0' }}>
                <img src={settings.alert_image_url} alt="Alert"
                  style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: settings.accent_color, color: settings.text_color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 'bold', flexShrink: 0,
              }}>
                {currentAlert.donor_name[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: settings.accent_color, fontSize: `${settings.font_size}px`, fontWeight: 'bold' }}>
                    {currentAlert.donor_name}
                  </span>
                  <span style={{ color: '#4ade80', fontSize: `${settings.font_size * 0.85}px`, fontWeight: '600' }}>
                    +{Number(currentAlert.amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                {currentAlert.message && (
                  <p style={{ color: settings.text_color, fontSize: `${settings.font_size * 0.75}px`, marginTop: '2px', opacity: 0.9 }}>
                    {currentAlert.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
