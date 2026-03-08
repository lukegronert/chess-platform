import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <span className="text-3xl">♟</span>
          <span className="font-bold text-xl">Chess School</span>
        </div>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Sign in
        </Link>
      </nav>

      <main className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="text-7xl mb-6">♟</div>
        <h1 className="text-5xl font-bold mb-4 max-w-2xl">
          A modern platform for chess education
        </h1>
        <p className="text-slate-300 text-lg max-w-xl mb-8">
          Live games, lessons, messaging, and classroom tools — everything your chess school needs in one place.
        </p>
        <Link
          href="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-colors"
        >
          Get started →
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full text-left">
          {[
            { icon: '♟', title: 'Live Chess Games', desc: 'Play real-time games with in-game chat, move history, and replay.' },
            { icon: '📚', title: 'Curriculum & PDFs', desc: 'Teachers upload lessons, annotated games, and homework assignments.' },
            { icon: '💬', title: 'Messaging', desc: 'Direct messages, class discussion boards, and announcements.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/10 rounded-2xl p-6 backdrop-blur">
              <div className="text-3xl mb-3">{icon}</div>
              <h3 className="font-semibold text-lg mb-2">{title}</h3>
              <p className="text-slate-300 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
