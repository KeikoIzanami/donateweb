'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  settings: {
    bank_name: string | null
    account_number: string | null
    account_name: string | null
    use_api: boolean
  } | null
}

export default function QRCodeDisplay({ settings }: QRCodeDisplayProps) {
  if (!settings?.bank_name || !settings?.account_number) {
    return (
      <p className="text-gray-400 text-sm">Chưa cài đặt thông tin thanh toán</p>
    )
  }

  // VietQR format: https://img.vietqr.io/image/{bank}-{account}-{template}.png
  const vietQRUrl = `https://img.vietqr.io/image/${settings.bank_name}-${settings.account_number}-compact2.png?accountName=${encodeURIComponent(settings.account_name || '')}`

  return (
    <div className="text-center">
      <div className="bg-white p-4 rounded-xl inline-block mb-4">
        <img
          src={vietQRUrl}
          alt="QR Code thanh toán"
          className="w-48 h-48 object-contain"
          onError={(e) => {
            // Fallback to QRCodeSVG if VietQR fails
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <div className="text-sm text-gray-300 space-y-1">
        <p className="font-medium">{settings.bank_name?.toUpperCase()}</p>
        <p className="font-mono">{settings.account_number}</p>
        {settings.account_name && (
          <p className="text-gray-400">{settings.account_name}</p>
        )}
      </div>
    </div>
  )
}
