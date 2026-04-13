import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { apiClient } from '~/lib/api/client';
import { useStore } from '@nanostores/react';
import { authUser, setAuth, type McUser } from '~/lib/stores/auth';
import { toast } from 'react-toastify';

interface DomainInfo {
  domain: string | null;
  verified: boolean;
  dnsRecords: { type: string; name: string; value: string }[];
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useStore(authUser);
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient<DomainInfo>('/portal/settings/domain').then((res) => {
      if (res.success && res.data) setDomainInfo(res.data);
    });
  }, []);

  const saveDomain = async () => {
    if (!customDomain.trim()) return;

    setLoading(true);

    const res = await apiClient<DomainInfo>('/portal/settings/domain', {
      method: 'POST',
      body: JSON.stringify({ domain: customDomain }),
    });

    if (res.success && res.data) {
      setDomainInfo(res.data);
      toast.success('Domain added! Configure DNS records below.');
    } else {
      toast.error(res.error || 'Failed to add domain');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      {/* Header */}
      <div className="border-b border-bolt-elements-borderColor px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary">
            <div className="i-ph:arrow-left text-xl" />
          </button>
          <h1 className="text-xl font-semibold text-bolt-elements-textPrimary">Settings</h1>
        </div>
        <a href="/" className="text-sm text-indigo-400 hover:text-indigo-300">Back to Editor</a>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Profile */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Profile</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-bolt-elements-textSecondary">Name</span>
              <span className="text-sm text-bolt-elements-textPrimary">{user?.contactName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bolt-elements-textSecondary">Email</span>
              <span className="text-sm text-bolt-elements-textPrimary">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bolt-elements-textSecondary">Company</span>
              <span className="text-sm text-bolt-elements-textPrimary">{user?.companyName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-bolt-elements-textSecondary">Plan</span>
              <span className="text-sm font-medium text-indigo-400">{user?.plan}</span>
            </div>
          </div>
        </div>

        {/* Custom Domain */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Custom Domain</h2>

          {domainInfo?.domain ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-bolt-elements-textPrimary">{domainInfo.domain}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${domainInfo.verified ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                  {domainInfo.verified ? 'Verified' : 'Pending DNS'}
                </span>
              </div>

              {!domainInfo.verified && domainInfo.dnsRecords.length > 0 && (
                <div className="bg-bolt-elements-background-depth-3 rounded-lg p-4">
                  <p className="text-xs text-bolt-elements-textTertiary mb-3">Add these DNS records to your domain:</p>
                  <div className="space-y-2">
                    {domainInfo.dnsRecords.map((rec, i) => (
                      <div key={i} className="flex items-center gap-4 text-xs">
                        <span className="text-bolt-elements-textSecondary w-12">{rec.type}</span>
                        <span className="text-bolt-elements-textPrimary flex-1 font-mono">{rec.name}</span>
                        <span className="text-bolt-elements-textPrimary flex-1 font-mono">{rec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="www.yourdomain.com"
                className="flex-1 px-4 py-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={saveDomain}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Domain'}
              </button>
            </div>
          )}
        </div>

        {/* Language */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-bolt-elements-borderColor">
          <h2 className="text-lg font-semibold text-bolt-elements-textPrimary mb-4">Language</h2>
          <select
            value={user?.language || 'en'}
            onChange={(e) => {
              if (user) setAuth({ ...user, language: e.target.value });
            }}
            className="w-full px-4 py-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="fr">Francais</option>
            <option value="es">Espanol</option>
            <option value="pt">Portugues</option>
            <option value="nl">Nederlands</option>
          </select>
        </div>

        {/* Danger Zone */}
        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-6 border border-red-500/30">
          <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-bolt-elements-textPrimary">Cancel Subscription</p>
              <p className="text-xs text-bolt-elements-textTertiary">Your sites will remain active until the end of the billing period</p>
            </div>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  const res = await apiClient('/portal/billing/cancel', { method: 'POST' });
                  if (res.success) {
                    toast.success('Subscription cancelled. Active until period end.');
                  } else {
                    toast.error(res.error || 'Failed to cancel');
                  }
                }
              }}
              className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
