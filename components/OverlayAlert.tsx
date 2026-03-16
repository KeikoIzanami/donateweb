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
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  // Keep processQueue ref to avoid stale closure
  const processQueueRef = useRef<() => void>(() => {})

  // Preload audio on mount so it's ready to play instantly
  useEffect(() => {
    console.log('[Overlay] Audio effect, sound_enabled:', settings.sound_enabled, 'sound_url:', settings.sound_url)
    if (settings.sound_enabled && settings.sound_url) {
      audioRef.current = new Audio(settings.sound_url)
      audioRef.current.preload = 'auto'
      audioRef.current.load()
    }
  }, [settings.sound_url, settings.sound_enabled])

  const playSound = useCallback(() => {
    console.log('[Overlay] playSound called, enabled:', settings.sound_enabled, 'url:', settings.sound_url)
    if (!settings.sound_enabled || !settings.sound_url) return
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          const a = new Audio(settings.sound_url!)
          a.play().catch(() => {})
        })
      }
    } catch {}
  }, [settings.sound_enabled, settings.sound_url])

  const processQueue = useCallback(() => {
    console.log('[Overlay] processQueue called, queue:', queueRef.current.length, 'processing:', processingRef.current)
    if (processingRef.current || queueRef.current.length === 0) {
      console.log('[Overlay] processQueue SKIPPED - processing:', processingRef.current, 'queue:', queueRef.current.length)
      return
    }

    processingRef.current = true
    const next = queueRef.current.shift()!
    console.log('[Overlay] SHOWING alert:', next.donor_name, next.amount)

    setCurrentAlert(next)
    setVisible(true)
    playSound()

    const duration = settingsRef.current.duration
    console.log('[Overlay] Setting timeout for:', duration, 'seconds')

    setTimeout(() => {
      console.log('[Overlay] Timeout reached, hiding...')
      setVisible(false)
      setTimeout(() => {
        console.log('[Overlay] Clearing alert, calling processQueue')
        setCurrentAlert(null)
        processingRef.current = false
        processQueueRef.current()
      }, 700)
    }, duration * 1000)
  }, [playSound])

  // Update ref whenever processQueue changes
  useEffect(() => {
    processQueueRef.current = processQueue
  }, [processQueue])

  const addToQueue = useCallback((donation: DonationAlert) => {
    console.log('[Overlay] addToQueue called with:', donation.donor_name, donation.amount)
    queueRef.current.push(donation)
    console.log('[Overlay] Queue now has:', queueRef.current.length, 'items')
    // Call directly instead of through ref to ensure it works
    if (queueRef.current.length === 1 && !processingRef.current) {
      processQueue()
    }
  }, [processQueue])

  useEffect(() => {
    console.log('[Overlay] Setting up realtime for streamer:', streamerId)

    // Use ref for addToQueue to avoid dependency cycle
    const addToQueueRef = useRef(addToQueue)
    addToQueueRef.current = addToQueue

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
          console.log('[Overlay] Received payload:', payload)
          const donation = payload.new as any
          console.log('[Overlay] Donation status:', donation.status)
          if (donation.status === 'confirmed' || donation.status === 'test') {
            console.log('[Overlay] Calling addToQueueRef')
            addToQueueRef.current({
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
  }, [streamerId])

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
