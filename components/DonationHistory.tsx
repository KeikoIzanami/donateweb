'use client'

interface DonationHistoryProps {
  donations: Array<{
    id: string
    donor_name: string
    message: string | null
    amount: number
    created_at: string
  }>
}

export default function DonationHistory({ donations }: DonationHistoryProps) {
  if (!donations || donations.length === 0) {
    return (
      <p className="text-gray-400 text-sm">Chưa có donate nào</p>
    )
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {donations.map((d) => (
        <div
          key={d.id}
          className="flex items-start gap-3 p-3 bg-white/5 rounded-lg"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {d.donor_name[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white truncate">{d.donor_name}</span>
              <span className="text-green-400 font-semibold text-sm">
                +{Number(d.amount).toLocaleString('vi-VN')}đ
              </span>
            </div>
            {d.message && (
              <p className="text-gray-400 text-sm truncate">{d.message}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {new Date(d.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
