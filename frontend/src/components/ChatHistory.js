import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  Bot,
  Search,
  Filter,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import axios from 'axios';

const ChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterModel, setFilterModel] = useState('all');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const viewSession = async (sessionId) => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      setSelectedSession(response.data);
    } catch (error) {
      console.error('Error fetching session details:', error);
      toast.error('Failed to load session details');
    }
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModel = filterModel === 'all' || session.model === filterModel;
    return matchesSearch && matchesModel;
  });

  const uniqueModels = [...new Set(sessions.map(session => session.model))];

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Unknown date';
    }
  };

  const getMessageCount = (session) => {
    return session.messages?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">Chat History</h2>
                <History className="w-5 h-5 text-primary-600" />
              </div>

              {/* Search and Filter */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>

                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <select
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                    className="input-field pl-10"
                  >
                    <option value="all">All Models</option>
                    {uniqueModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sessions List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                    <p className="text-secondary-600">
                      {searchTerm || filterModel !== 'all' 
                        ? 'No sessions match your search' 
                        : 'No chat sessions yet'
                      }
                    </p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedSession?.id === session.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                      onClick={() => viewSession(session.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-secondary-900 truncate">
                            {session.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1 text-sm text-secondary-600">
                            <Bot className="w-3 h-3" />
                            <span>{session.model}</span>
                            <span>•</span>
                            <MessageSquare className="w-3 h-3" />
                            <span>{getMessageCount(session)} messages</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1 text-xs text-secondary-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className="p-1 text-secondary-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            <div className="card h-full">
              {selectedSession ? (
                <div className="h-full flex flex-col">
                  {/* Session Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-200">
                    <div>
                      <h2 className="text-xl font-semibold text-secondary-900">
                        {selectedSession.title}
                      </h2>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-secondary-600">
                        <div className="flex items-center space-x-1">
                          <Bot className="w-4 h-4" />
                          <span>{selectedSession.model}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-4 h-4" />
                          <span>{getMessageCount(selectedSession)} messages</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(selectedSession.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-secondary-600">
                      <div>Provider: {selectedSession.provider.replace('g4f.Provider.', '')}</div>
                      <div>Updated: {formatDate(selectedSession.updated_at)}</div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4">
                    {selectedSession.messages?.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                        <p className="text-secondary-600">No messages in this session</p>
                      </div>
                    ) : (
                      selectedSession.messages?.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                            <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user' 
                                  ? 'bg-primary-500' 
                                  : 'bg-gradient-to-r from-accent-500 to-primary-500'
                              }`}>
                                {message.role === 'user' ? (
                                  <User className="w-4 h-4 text-white" />
                                ) : (
                                  <Bot className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                                <div className={`inline-block p-3 rounded-2xl ${
                                  message.role === 'user'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-secondary-100 text-secondary-900'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                <div className={`flex items-center space-x-2 mt-1 text-xs text-secondary-500 ${
                                  message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>{formatDate(message.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-secondary-600 mb-2">
                    Select a session
                  </h3>
                  <p className="text-secondary-500">
                    Choose a chat session from the list to view its details
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatHistory;
