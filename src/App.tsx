import { useState } from 'react'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8 border-b pb-6">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
            BrandPortal AI
          </h1>
          <p className="text-gray-600 text-lg">Enterprise Edition</p>
        </div>
        
        {/* Demo Company Info */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Company Dashboard</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Company Name</p>
              <p className="font-semibold text-gray-800">Demo Company</p>
            </div>
            <div>
              <p className="text-gray-500">Industry</p>
              <p className="font-semibold text-gray-800">Technology</p>
            </div>
            <div>
              <p className="text-gray-500">Size</p>
              <p className="font-semibold text-gray-800">Medium</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold text-green-600">✓ Active</p>
            </div>
          </div>
        </div>
        
        {/* Counter Demo */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Interactive Demo</h3>
          <div className="text-center">
            <p className="text-4xl font-bold text-indigo-600 mb-4">{count}</p>
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 shadow-lg hover:shadow-xl"
            >
              Click to Increment
            </button>
            {count > 0 && (
              <button 
                onClick={() => setCount(0)}
                className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        
        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl mb-2">⚛️</p>
            <p className="font-semibold text-gray-700">React</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl mb-2">⚡</p>
            <p className="font-semibold text-gray-700">Vite</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-2xl mb-2">🎨</p>
            <p className="font-semibold text-gray-700">Tailwind</p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t text-sm text-gray-500">
          <p>✅ Build Successful • Ready for Production</p>
        </div>
      </div>
    </div>
  )
}

export default App
