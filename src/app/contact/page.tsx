import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600">
            Get in touch with the PlayfulProcess team
          </p>
        </div>

        {/* Contact Cards */}
        <div className="space-y-6">
          {/* Email */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">📧</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Email</h2>
            </div>
            <p className="text-gray-600 mb-3">
              For collaborations, support, or general inquiries
            </p>
            <a 
              href="mailto:pp@playfulprocess.com"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              pp@playfulprocess.com
            </a>
          </div>

          {/* Website */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">🌐</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Website</h2>
            </div>
            <p className="text-gray-600 mb-3">
              Learn more about PlayfulProcess and our mission
            </p>
            <a 
              href="https://www.playfulprocess.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              www.playfulprocess.com
            </a>
          </div>

          {/* GitHub */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl">🐙</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">GitHub</h2>
            </div>
            <p className="text-gray-600 mb-3">
              Contribute to our open source projects and tools
            </p>
            <a 
              href="https://github.com/PlayfulProcess"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium underline"
            >
              github.com/PlayfulProcess
            </a>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            💚 Our Mission
          </h3>
          <p className="text-gray-700 leading-relaxed">
            We believe in building gateways, not gatekeepers. Our community-driven platform 
            welcomes tools that help people grow, heal, and connect—whether through traditional 
            therapy techniques, creative expression, or innovative approaches to wellness.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/#community-tools"
            className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
          >
            🌱 Browse Community Tools
          </Link>
          <Link
            href="/tools/best-possible-self"
            className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors text-center font-medium"
          >
            ✍️ Try Featured Tool
          </Link>
        </div>
      </div>
    </div>
  );
}