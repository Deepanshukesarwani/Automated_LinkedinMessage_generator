import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Power, PowerOff } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  leads: string[];
  accountIDs: string[];
}

interface LinkedInProfile {
  name: string;
  job_title: string;
  company: string;
  location: string;
  summary: string;
}

function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<LinkedInProfile>({
    name: '',
    job_title: '',
    company: '',
    location: '',
    summary: ''
  });
  const [generatedMessage, setGeneratedMessage] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('https://automated-linkedinmessage-generator.onrender.com/api/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
  
    try {
      const isEditingCampaign = Boolean(selectedCampaign._id);
      const url = isEditingCampaign
        ? `https://automated-linkedinmessage-generator.onrender.com/api/campaigns/${selectedCampaign._id}`
        : 'https://automated-linkedinmessage-generator.onrender.com/api/campaigns';
  
      const method = isEditingCampaign ? 'PUT' : 'POST';
  
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selectedCampaign._id
            ? selectedCampaign
            : {
                name: selectedCampaign.name,
                description: selectedCampaign.description,
                status: selectedCampaign.status,
                leads: selectedCampaign.leads,
                accountIDs: selectedCampaign.accountIDs
              }
        ),
      });
  
      if (response.ok) {
        fetchCampaigns();
        setSelectedCampaign(null);
        setIsEditing(false);
      } else {
        const errData = await response.json();
        console.error('Error from server:', errData);
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };
  

  const handleDelete = async (id: string) => {
    try {
      await fetch(`https://automated-linkedinmessage-generator.onrender.com/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleStatusToggle = async (campaign: Campaign) => {
    try {
      const newStatus = campaign.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await fetch(`https://automated-linkedinmessage-generator.onrender.com/api/campaigns/${campaign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campaign, status: newStatus }),
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    }
  };

  const generateMessage = async () => {
    try {
      const response = await fetch('https://automated-linkedinmessage-generator.onrender.com/api/personalized-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await response.json();
      setGeneratedMessage(data.message);
    } catch (error) {
      console.error('Failed to generate message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Campaign Management Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Campaigns</h2>
              <button
                onClick={() => {
                  setSelectedCampaign({
                    _id: '',
                    name: '',
                    description: '',
                    status: 'INACTIVE',
                    leads: [],
                    accountIDs: []
                  });
                  setIsEditing(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <PlusCircle size={20} />
                New Campaign
              </button>
            </div>

            <div className="space-y-4 " >
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{campaign.name}</h3>
                      <p className="text-gray-600">{campaign.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusToggle(campaign)}
                        className={`p-2 rounded-full ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {campaign.status === 'ACTIVE' ? <Power size={20} /> : <PowerOff size={20} />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setIsEditing(true);
                        }}
                        className="p-2 rounded-full bg-blue-100 text-blue-600"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="p-2 rounded-full bg-red-100 text-red-600"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Generator Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">LinkedIn Message Generator</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={profile.job_title}
                  onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Summary</label>
                <textarea
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <button
                onClick={generateMessage}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Generate Message
              </button>
              {generatedMessage && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Generated Message:</h3>
                  <p className="text-gray-700">{generatedMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Edit Modal */}
      {isEditing && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">
              {selectedCampaign._id ? 'Edit Campaign' : 'New Campaign'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={selectedCampaign.name}
                  onChange={(e) =>
                    setSelectedCampaign({ ...selectedCampaign, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={selectedCampaign.description}
                  onChange={(e) =>
                    setSelectedCampaign({ ...selectedCampaign, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">LinkedIn URLs</label>
                <textarea
                  value={selectedCampaign.leads.join('\n')}
                  onChange={(e) =>
                    setSelectedCampaign({
                      ...selectedCampaign,
                      leads: e.target.value.split('\n').filter(Boolean)
                    })
                  }
                  placeholder="Enter LinkedIn URLs (one per line)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampaign(null);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;