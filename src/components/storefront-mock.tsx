'use client'

const PRODUCTS = [
  { name: 'Wireless Headphones', price: '$79.99', image: '\u{1F3A7}' },
  { name: 'Smart Watch', price: '$199.99', image: '\u{231A}' },
  { name: 'Laptop Stand', price: '$49.99', image: '\u{1F4BB}' },
  { name: 'USB-C Hub', price: '$39.99', image: '\u{1F50C}' },
  { name: 'Mechanical Keyboard', price: '$129.99', image: '\u{2328}\u{FE0F}' },
  { name: 'Monitor Light Bar', price: '$59.99', image: '\u{1F4A1}' },
]

export function StorefrontMock() {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">Featured Products</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {PRODUCTS.map(product => (
          <div key={product.name} className="rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md">
            <div className="mb-3 text-center text-4xl">{product.image}</div>
            <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
            <p className="mt-1 text-sm font-bold text-gray-700">{product.price}</p>
            <button className="mt-3 w-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800">
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
