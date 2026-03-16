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

export default function OverlayAlert({ streamerId, settings }: OverlayAlertProps) {
  const [currentAlert, setCurrentAlert] = useState<DonationAlert | null>(null)
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
    playSound()
    setTimeout(() => {
      setCurrentAlert(null)
      processingRef.current = false
      processQueue()
    }, settings.duration * 1000)
  }

  const shownIdsRef = useRef<Set<string>>(new Set())

  const addToQueue = (donation: DonationAlert) => {
    if (shownIdsRef.current.has(donation.id)) return
    shownIdsRef.current.add(donation.id)
    queueRef.current.push(donation)
    if (!processingRef.current) processQueue()
  }

  // Polling fallback for OBS (every 2s)
  useEffect(() => {
    const poll = async () => {
      try {
        const since = new Date(Date.now() - 10000).toISOString() // last 10s
        const { data } = await supabase
          .from('donations')
          .select('*')
          .eq('streamer_id', streamerId)
          .in('status', ['confirmed', 'test'])
          .gte('created_at', since)
          .order('created_at', { ascending: true })
        data?.forEach(d => addToQueue({ id: d.id, donor_name: d.donor_name, message: d.message, amount: d.amount }))
      } catch {}
    }
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [streamerId])

  // Realtime subscription
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

  // Always render (even when no alert) so OBS can see it
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '520px',
      pointerEvents: 'none',
      zIndex: 9999,
      background: 'transparent',
    }}>
      {currentAlert && (
        <div style={{
          background: settings.bg_color,
          border: `2px solid ${settings.accent_color}`,
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: settings.accent_color, color: settings.text_color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 'bold',
            }}>
              {currentAlert.donor_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: settings.accent_color }}>
                {currentAlert.donor_name}
              </div>
              <div style={{ fontSize: '16px', color: '#4ade80', fontWeight: '600' }}>
                +{Number(currentAlert.amount).toLocaleString('vi-VN')}đ
              </div>
              {currentAlert.message && (
                <div style={{ fontSize: '14px', color: settings.text_color, marginTop: '4px', opacity: 0.8 }}>
                  {currentAlert.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
