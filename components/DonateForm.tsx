'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DonateFormProps {
  streamerId: string
}

export default function DonateForm({ streamerId }: DonateFormProps) {
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const numAmount = parseInt(amount)
    if (isNaN(numAmount) || numAmount < 1000) {
      setError('Số tiền tối thiểu là 1,000đ')
      setLoading(false)
      return
    }

    try {
      const { data, error: insertError } = await supabase
        .from('donations')
        .insert({
          streamer_id: streamerId,
          donor_name: donorName || 'Anonymous',
          message: message || null,
          amount: numAmount,
          status: 'pending',
        })
        .select()
        .single()

      if (insertError) throw insertError

      setSuccess(true)
      setDonorName('')
      setMessage('')
      setAmount('')

      // Show instructions for payment
      alert('Tạo donate thành công! Vui lòng chuyển khoản để hoàn tất.')
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [5000, 10000, 20000, 50000, 100000]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
          Tạo donate thành công! Vui lòng chuyển khoản theo hướng dẫn.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-300 mb-1">Tên hiển thị</label>
        <input
          type="text"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Tên của bạn (tùy chọn)"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Số tiền (VNĐ)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Nhập số tiền"
          min="1000"
          required
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(a.toString())}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm transition-colors"
            >
              {a.toLocaleString('vi-VN')}đ
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1">Lời nhắn</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="Lời nhắn cho streamer (tùy chọn)"
          rows={3}
          maxLength={500}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
      >
        {loading ? 'Đang xử lý...' : 'Tạo donate'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Bạn sẽ được chuyển đến trang thanh toán sau khi tạo donate
      </p>
    </form>
  )
}
