import Link from 'next/link';

export default function WelcomeScreen() {
  return (
    <main id="main-content" className="flex flex-col h-[100dvh] max-h-[100dvh] items-center justify-between p-6 bg-gray-50 overflow-hidden select-none">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="text-primary">GCC</span>{' '}
          <span className="text-secondary">Startup</span>
        </h1>
        <p className="mt-4 text-base sm:text-xl text-gray-600 font-medium max-w-sm">
          Everything you need to go global — under one roof.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto pb-6">
        <Link
          href="/welcome"
          className="block w-full text-center bg-primary hover:bg-primary-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-md transition duration-200 text-base"
        >
          Launch Your Business
        </Link>
      </div>
    </main>
  );
}
