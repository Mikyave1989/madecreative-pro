export default function PortalDashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back — here is your performance overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Leads This Month", value: "—", sub: "vs last month" },
            { label: "Website Visits", value: "—", sub: "all time" },
            { label: "Hours Saved", value: "—", sub: "by automation" },
            { label: "Revenue Attributed", value: "€—", sub: "estimated" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Website Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Website</h2>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div>
                <p className="text-sm font-medium text-gray-700">Building...</p>
                <p className="text-xs text-gray-500">Your website is being prepared</p>
              </div>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>
            <p className="text-sm text-gray-500 text-center py-4">
              No leads yet — your website is being built
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
