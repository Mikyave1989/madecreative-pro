export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>

        {/* Metrics Grid Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Active Clients", value: "—", change: "+0%", color: "blue" },
            { label: "MRR", value: "€—", change: "+0%", color: "green" },
            { label: "Total Prospects", value: "—", change: "+0", color: "purple" },
            { label: "Agent Jobs Today", value: "—", change: "0 failed", color: "orange" },
          ].map((metric) => (
            <div
              key={metric.label}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-gray-500">{metric.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
              <p className="text-sm text-gray-400 mt-1">{metric.change}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "View Prospects", href: "/prospects", icon: "👥" },
              { label: "View Clients", href: "/clients", icon: "🏢" },
              { label: "Agent Jobs", href: "/agents", icon: "🤖" },
              { label: "Platform Metrics", href: "/metrics", icon: "📊" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-center"
              >
                <span className="text-2xl mb-2">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {action.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
