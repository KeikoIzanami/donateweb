import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="text-2xl font-bold text-white">
          Donate<span className="text-purple-400">Web</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-6 max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-6">
          Nền tảng donate cho streamer Việt Nam
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Nhận donate từ{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            khán giả
          </span>{' '}
          của bạn
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Tạo trang donate cá nhân, tích hợp overlay OBS realtime và nhận tiền qua Sepay.
          Miễn phí, dễ dùng, không cần kỹ thuật.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl text-lg transition-all shadow-lg shadow-purple-500/25"
          >
            Tạo trang ngay — Miễn phí
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Mọi thứ bạn cần để nhận donate
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🔗',
              title: 'Link cá nhân',
              desc: 'Tạo trang donate với URL riêng như site.com/username. Chia sẻ với khán giả dễ dàng.',
            },
            {
              icon: '🎬',
              title: 'Overlay OBS',
              desc: 'Thêm URL overlay vào OBS browser source. Hiển thị alert đẹp mắt khi có donate.',
            },
            {
              icon: '💳',
              title: 'Tích hợp Sepay',
              desc: 'Nhận tiền qua QR code hoặc API Sepay tự động. Hỗ trợ tất cả ngân hàng Việt Nam.',
            },
            {
              icon: '⚡',
              title: 'Realtime',
              desc: 'Overlay cập nhật ngay lập tức khi có donate. Không cần refresh hay chờ đợi.',
            },
            {
              icon: '🎨',
              title: 'Tùy chỉnh overlay',
              desc: 'Chỉnh màu sắc, font chữ, animation và âm thanh theo phong cách của bạn.',
            },
            {
              icon: '🧪',
              title: 'Test donate',
              desc: 'Nút test donate để kiểm tra overlay trước khi stream. Không cần chuyển tiền thật.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto p-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-gray-300 mb-8">
            Tạo trang donate trong 2 phút. Hoàn toàn miễn phí.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl text-lg transition-all"
          >
            Tạo tài khoản miễn phí
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 border-t border-white/10">
        <p>© 2025 DonateWeb. Dành cho streamer Việt Nam.</p>
      </footer>
    </div>
  )
}
