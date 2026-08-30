import Link from 'next/link';

export default function WelcomeScreen() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-between p-8 bg-gray-50">
      <div className="flex-grow flex flex-col items-center justify-center text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          <span className="text-primary">GCC</span>{' '}
          <span className="text-secondary">Startup</span>
        </h1>
        <p className="mt-6 text-xl md:text-2xl text-gray-600 font-medium max-w-2xl">
          Everything you need to go global — under one roof.
        </p>
      </div>

      <div className="w-full max-w-md pb-8">
        <Link
          href="/welcome"
          className="block w-full text-center bg-primary hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-xl shadow-md transition duration-200 text-lg"
        >
          Launch Your Business
        </Link>
      </div>
    </div>
  );
}
