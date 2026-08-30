import Link from 'next/link';

const jurisdictions = [
  {
    id: 'uae',
    name: 'United Arab Emirates',
    flagUrl: 'https://flagcdn.com/ae.svg',
    price: '$1,500',
    tax: '9% / 0% Foreign',
    timeline: '~30 days',
    popular: true,
  },
  {
    id: 'bahrain',
    name: 'Bahrain',
    flagUrl: 'https://flagcdn.com/bh.svg',
    price: '$1,500',
    tax: '0% Corporate',
    timeline: '~30 days',
    popular: false,
  },
  {
    id: 'hong-kong',
    name: 'Hong Kong',
    flagUrl: 'https://flagcdn.com/hk.svg',
    price: '$2,000',
    tax: '0% on Foreign',
    timeline: '17–18 days',
    popular: false,
  },
  {
    id: 'singapore',
    name: 'Singapore',
    flagUrl: 'https://flagcdn.com/sg.svg',
    price: '$2,000',
    tax: '5% Corporate',
    timeline: '17–18 days',
    popular: false,
  },
  {
    id: 'ireland',
    name: 'Ireland',
    flagUrl: 'https://flagcdn.com/ie.svg',
    price: '$1,500',
    tax: '12.5% Corporate',
    timeline: '2–3 days',
    popular: false,
  },
  {
    id: 'bvi',
    name: 'BVI & Cayman',
    flagUrl: 'https://flagcdn.com/ky.svg',
    price: 'Custom quote',
    tax: '0% Corporate',
    timeline: 'Varies',
    popular: false,
  },
];

export default function ServicesCatalog() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24">
      <header className="mb-8 mt-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Setup a Company</h1>
        <p className="text-gray-500 mt-2 font-medium">Select a jurisdiction to view full details and start incorporation.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {jurisdictions.map((j) => (
          <Link 
            key={j.id} 
            href={`/services/${j.id}`} 
            className="relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-orange-500 hover:shadow-md transition-all group flex flex-col"
          >
            {j.popular && (
              <span className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={j.flagUrl} 
                alt={`${j.name} Flag`} 
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <h3 className="text-lg font-bold text-gray-900">{j.name}</h3>
            </div>
            
            <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-2 gap-y-2 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium text-xs">Starting from</span>
                <span className="font-bold text-gray-900">{j.price}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 font-medium text-xs">Tax Rate</span>
                <span className="font-bold text-gray-900">{j.tax}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-gray-400 font-medium text-xs">Timeline</span>
                <span className="font-semibold text-gray-700">{j.timeline}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
