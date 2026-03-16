export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export interface OverlaySettings {
  id: string
  user_id: string
  theme: string
  bg_color: string
  text_color: string
  accent_color: string
  font_size: number
  duration: number
  sound_enabled: boolean
  sound_url: string | null
  alert_image_url: string | null
  min_amount: number
  updated_at: string
}

export interface SepaySettings {
  id: string
  user_id: string
  bank_name: string | null
  account_number: string | null
  account_name: string | null
  sepay_api_key: string | null
  sepay_webhook_secret: string | null
  use_api: boolean
  updated_at: string
}

export interface Donation {
  id: string
  streamer_id: string
  donor_name: string
  message: string | null
  amount: number
  status: 'pending' | 'confirmed' | 'test'
  transaction_id: string | null
  created_at: string
}
