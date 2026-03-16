'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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

export default function OverlayAlert({ streamerId, settings }: OverlayAlertProps) {
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null)
  const [visible, setVisible] = useState(false)
  const queueRef = useRef<DonationAlert[]>([])
  const processingRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = useMemo(() => createClient(), [])

  // Preload audio on mount so it's ready to play instantly
  useEffect(() => {
    if (settings.sound_enabled && settings.sound_url) {
      audioRef.current = new Audio(settings.sound_url)
      audioRef.current.preload = 'auto'
      audioRef.current.load()
    }
  }, [settings.sound_url, settings.sound_enabled])

  const playSound = useCallback(() => {
    if (!settings.sound_enabled || !settings.sound_url) return
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          // Retry with new instance if preloaded one fails
          const a = new Audio(settings.sound_url!)
          a.play().catch(() => {})
        })
      }
    } catch {}
  }, [settings.sound_enabled, settings.sound_url])

  const processQueue = useCallback(() => {
    console.log('[Overlay] processQueue called, queue length:', queueRef.current.length, 'processing:', processingRef.current)
    if (processingRef.current || queueRef.current.length === 0) return

    processingRef.current = true
    const next = queueRef.current.shift()!
    console.log('[Overlay] Processing alert:', next.donor_name, next.amount)

    setCurrentAlert(next)
    setVisible(true)
    playSound()

    setTimeout(() => {
      console.log('[Overlay] Hiding alert')
      setVisible(false)
      setTimeout(() => {
        console.log('[Overlay] Clearing alert')
        setCurrentAlert(null)
        processingRef.current = false
        processQueue()
      }, 700)
    }, settings.duration * 1000)
  }, [settings.duration, playSound])

  const addToQueue = useCallback((donation: DonationAlert) => {
    queueRef.current.push(donation)
    processQueue()
  }, [processQueue])

  useEffect(() => {
    console.log('[Overlay] Setting up realtime for streamer:', streamerId)

    const channel = supabase
      .channel(`overlay:${streamerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload) => {
          console.log('[Overlay] Received donation:', payload)
          const donation = payload.new as any
          if (donation.status === 'confirmed' || donation.status === 'test') {
            console.log('[Overlay] Adding to queue:', donation)
            addToQueue({
              id: donation.id,
              donor_name: donation.donor_name,
              message: donation.message,
              amount: donation.amount,
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Overlay] Subscription status:', status)
      })

    return () => {
      console.log('[Overlay] Cleaning up channel')
      supabase.removeChannel(channel)
    }
  }, [streamerId, addToQueue])

  if (!currentAlert) return (
    <style>{`html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }`}</style>
  )

  return (
    <>
      {/* Inject transparent body style */}
      <style>{`
        html, body { background: transparent !important; margin: 0; padding: 0; overflow: hidden; }
      `}</style>

      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${visible ? '0' : '24px'})`,
          opacity: visible ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          width: '100%',
          maxWidth: '520px',
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            background: settings.bg_color,
            border: `2px solid ${settings.accent_color}`,
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${settings.accent_color}22`,
          }}
        >
          {/* Alert image banner (separate from avatar) */}
          {settings.alert_image_url && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 16px 0' }}>
              <img
                src={settings.alert_image_url}
                alt="Alert"
                style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
          )}

          {/* Donor info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
            {/* Avatar - always shows donor initial */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: settings.accent_color,
                color: settings.text_color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {currentAlert.donor_name[0].toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: settings.accent_color, fontSize: `${settings.font_size}px`, fontWeight: 'bold', lineHeight: 1.2 }}>
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
    </>
  )
}
