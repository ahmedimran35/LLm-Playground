import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Copy, 
  Trash2, 
  Save,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Settings,
  MessageSquare
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import axios from 'axios';

const Playground = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [imageMessages, setImageMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState({});
  const [imageModels, setImageModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('microsoft/phi-4');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [isImageMode, setIsImageMode] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState('flux');
  const [imageWidth, setImageWidth] = useState(1024);
  const [imageHeight, setImageHeight] = useState(1024);
  const [imageQuality, setImageQuality] = useState('standard');
  const [imageStyle, setImageStyle] = useState('vivid');
  const [capabilities, setCapabilities] = useState({ chat: true, image_generation: true });
  const messagesEndRef = useRef(null);

  const currentMessages = isImageMode ? imageMessages : chatMessages;
  const setCurrentMessages = isImageMode ? setImageMessages : setChatMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, imageMessages]);

  useEffect(() => {
    fetchCapabilities();
    fetchModels();
    fetchChatSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCapabilities = async () => {
    try {
      const response = await axios.get('/api/capabilities');
      setCapabilities(response.data);
    } catch (error) {
      // ignore; image availability inferred from /api/models
    }
  };

  const fetchModels = async () => {
    try {
      const response = await axios.get('/api/models');
      setModels(response.data.models);
      const imgs = Array.isArray(response.data.image_models) ? response.data.image_models : [];
      setImageModels(imgs);
      if (response.data.models[selectedModel]) {
        setSelectedProvider(response.data.models[selectedModel][0]);
      }
      if (imgs.length > 0) {
        setSelectedImageModel(imgs[0]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      toast.error('Failed to load models');
    }
  };

  const fetchChatSessions = async () => {
    try {
      await axios.get('/api/sessions');
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    if (isImageMode) {
      await handleImageGeneration();
    } else {
      await handleChatMessage();
    }
  };

  const handleChatMessage = async () => {
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        messages: [...chatMessages, userMessage],
        model: selectedModel,
        provider: selectedProvider,
        temperature: temperature,
        max_tokens: maxTokens
      }, {
        timeout: 65000
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: response.data.timestamp,
        model: response.data.model,
        provider: response.data.provider
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.response) {
        if (error.response.status === 408) {
          errorMessage = 'Request timeout - the AI model took too long to respond. Please try again.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.detail || 'Server error. Please try again.';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageGeneration = async () => {
    const userMessage = {
      role: 'user',
      content: `Generate image: ${inputMessage}`,
      timestamp: new Date().toISOString()
    };

    setImageMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/generate-image', {
        prompt: inputMessage,
        model: selectedImageModel
      }, {
        timeout: 125000
      });

      const assistantMessage = {
        role: 'assistant',
        content: `![Generated Image](${response.data.image_url})`,
        timestamp: response.data.timestamp,
        model: response.data.model,
        provider: response.data.provider,
        isImage: true,
        imageUrl: response.data.image_url
      };

      setImageMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating image:', error);
      let errorMessage = 'Failed to generate image. Please try again.';
      if (error.response) {
        if (error.response.status === 408) {
          errorMessage = 'Request timeout - image generation took too long. Please try again.';
        } else if (error.response.status === 501) {
          errorMessage = 'Image generation is not supported by the server. Switched to Chat mode.';
          setIsImageMode(false);
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.detail || 'Server error. Please try again.';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try again.';
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard!');
  };

  const clearChat = () => {
    if (isImageMode) {
      setImageMessages([]);
      toast.success('Image chat cleared!');
    } else {
      setChatMessages([]);
      toast.success('Chat cleared!');
    }
  };

  const saveChat = async () => {
    const msgs = chatMessages;
    if (!msgs || msgs.length === 0) {
      toast.error('No messages to save');
      return;
    }

    const title = msgs[0]?.content.slice(0, 50) + '...' || 'New Chat';
    
    try {
      await axios.post('/api/sessions', null, {
        params: {
          title: title,
          model: selectedModel,
          provider: selectedProvider
        }
      });
      for (const message of msgs) {
        await axios.post(`/api/sessions/${title}/messages`, message);
      }
      toast.success('Chat saved successfully!');
      fetchChatSessions();
    } catch (error) {
      console.error('Error saving chat:', error);
      toast.error('Failed to save chat');
    }
  };

  const CodeBlock = ({ children, className }) => {
    const language = className?.replace('language-', '') || 'text';
    return (
      <SyntaxHighlighter
        style={tomorrow}
        language={language}
        PreTag="div"
        className="rounded-lg"
      >
        {children}
      </SyntaxHighlighter>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]"
        >
          {/* Model Selection Panel */}
          <div className="lg:col-span-1">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-secondary-900">AI Models</h2>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="mb-6">
                <div className="flex bg-secondary-100 rounded-lg p-1">
                  <button
                    onClick={() => setIsImageMode(false)}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      !isImageMode 
                        ? 'bg-white text-secondary-900 shadow-sm' 
                        : 'text-secondary-600 hover:text-secondary-900'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    Chat
                  </button>
                  {imageModels.length > 0 && (
                    <button
                      onClick={() => setIsImageMode(true)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        isImageMode 
                          ? 'bg-white text-secondary-900 shadow-sm' 
                          : 'text-secondary-600 hover:text-secondary-900'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 inline mr-2" />
                      Image
                    </button>
                  )}
                </div>
                {imageModels.length === 0 && (
                  <p className="mt-2 text-xs text-secondary-500">No image models are available on this server.</p>
                )}
              </div>

              {/* Model Selection */}
              <div className="space-y-4">
                {!isImageMode ? (
                  <>
                    {/* Quick Model Presets */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setSelectedModel('microsoft/phi-4');
                            setSelectedProvider('g4f.Provider.DeepInfra');
                          }}
                          className={`text-xs py-2 px-3 rounded-md border transition-colors ${
                            selectedModel === 'microsoft/phi-4' 
                              ? 'bg-primary-100 border-primary-300 text-primary-700' 
                              : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                          }`}
                        >
                          Phi-4
                        </button>
                        <button
                          onClick={() => {
                            setSelectedModel('google/gemma-3-4b-it');
                            setSelectedProvider('g4f.Provider.DeepInfra');
                          }}
                          className={`text-xs py-2 px-3 rounded-md border transition-colors ${
                            selectedModel === 'google/gemma-3-4b-it' 
                              ? 'bg-primary-100 border-primary-300 text-primary-700' 
                              : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                          }`}
                        >
                          Gemma
                        </button>
                        <button
                          onClick={() => {
                          setSelectedModel('anthropic/claude-4-sonnet');
                          setSelectedProvider('g4f.Provider.DeepInfra');
                          }}
                          className={`text-xs py-2 px-3 rounded-md border transition-colors ${
                            selectedModel === 'anthropic/claude-4-sonnet' 
                              ? 'bg-primary-100 border-primary-300 text-primary-700' 
                              : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                          }`}
                        >
                          Claude
                        </button>
                        <button
                          onClick={() => {
                            setSelectedModel('deepseek-ai/DeepSeek-V3.1');
                            setSelectedProvider('g4f.Provider.DeepInfra');
                          }}
                          className={`text-xs py-2 px-3 rounded-md border transition-colors ${
                            selectedModel === 'deepseek-ai/DeepSeek-V3.1' 
                              ? 'bg-primary-100 border-primary-300 text-primary-700' 
                              : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                          }`}
                        >
                          DeepSeek
                        </button>
                      </div>
                    </div>

                    {/* Chat Model Selection */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Chat Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => {
                          setSelectedModel(e.target.value);
                          if (models[e.target.value]) {
                            setSelectedProvider(models[e.target.value][0]);
                          }
                        }}
                        className="input-field"
                      >
                        {Object.keys(models).map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Provider Selection */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Provider
                      </label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="input-field"
                      >
                        {models[selectedModel]?.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider.replace('g4f.Provider.', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quick Image Model Presets (providerless) */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Quick Select
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {imageModels.map((model) => (
                          <button
                            key={model}
                            onClick={() => setSelectedImageModel(model)}
                            className={`text-xs py-2 px-3 rounded-md border transition-colors ${
                              selectedImageModel === model
                                ? 'bg-primary-100 border-primary-300 text-primary-700'
                                : 'bg-white border-secondary-200 text-secondary-700 hover:bg-secondary-50'
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Model Selection (providerless) */}
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Image Model
                      </label>
                      <select
                        value={selectedImageModel}
                        onChange={(e) => setSelectedImageModel(e.target.value)}
                        className="input-field"
                      >
                        {imageModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Image Settings (kept for future compatibility) */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Size: {imageWidth}x{imageHeight}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={imageWidth}
                            onChange={(e) => setImageWidth(parseInt(e.target.value))}
                            className="input-field text-sm"
                            placeholder="Width"
                            min="256"
                            max="2048"
                            step="64"
                          />
                          <input
                            type="number"
                            value={imageHeight}
                            onChange={(e) => setImageHeight(parseInt(e.target.value))}
                            className="input-field text-sm"
                            placeholder="Height"
                            min="256"
                            max="2048"
                            step="64"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Quality
                        </label>
                        <select
                          value={imageQuality}
                          onChange={(e) => setImageQuality(e.target.value)}
                          className="input-field"
                        >
                          <option value="standard">Standard</option>
                          <option value="hd">HD</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                          Style
                        </label>
                        <select
                          value={imageStyle}
                          onChange={(e) => setImageStyle(e.target.value)}
                          className="input-field"
                        >
                          <option value="vivid">Vivid</option>
                          <option value="natural">Natural</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Advanced Settings */}
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-4 border-t border-secondary-200"
                  >
                    {!isImageMode && (
                      <>
                        {/* Temperature */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Temperature: {temperature}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>

                        {/* Max Tokens */}
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-2">
                            Max Tokens: {maxTokens}
                          </label>
                          <input
                            type="range"
                            min="100"
                            max="4000"
                            step="100"
                            value={maxTokens}
                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={saveChat}
                        className="w-full btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Chat</span>
                      </button>
                      <button
                        onClick={clearChat}
                        className="w-full btn-secondary flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear {isImageMode ? 'Image Chat' : 'Chat'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="card h-full flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-secondary-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                    {isImageMode ? (
                      <ImageIcon className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-secondary-900">
                      {isImageMode ? 'AI Image Generation' : 'AI Chat'}
                    </h2>
                    <p className="text-sm text-secondary-600">
                      {isImageMode ? selectedImageModel : selectedModel} • {isImageMode ? 'g4f-client' : selectedProvider.replace('g4f.Provider.', '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-accent-500" />
                  <span className="text-sm text-secondary-600">GPT4Free</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-12">
                    {isImageMode ? (
                      <ImageIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    ) : (
                      <Bot className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
                    )}
                    <h3 className="text-xl font-semibold text-secondary-600 mb-2">
                      {isImageMode ? 'Start generating images' : 'Start a conversation'}
                    </h3>
                    <p className="text-secondary-500">
                      {isImageMode 
                        ? 'Choose an image model, then describe the output you want to generate!' 
                        : 'Choose your model and provider, then start chatting with AI!'}
                    </p>
                  </div>
                ) : (
                  currentMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-primary-500' 
                              : 'bg-gradient-to-r from-accent-500 to-primary-500'
                          }`}>
                            {message.role === 'user' ? (
                              <User className="w-4 h-4 text-white" />
                            ) : message.isImage ? (
                              <ImageIcon className="w-4 h-4 text-white" />
                            ) : (
                              <Bot className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block p-4 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-primary-500 text-white'
                                : 'bg-secondary-100 text-secondary-900'
                            }`}>
                              {message.isImage && message.imageUrl ? (
                                <div className="space-y-2">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="AI output" 
                                    className="rounded-lg max-w-full h-auto"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'block';
                                    }}
                                  />
                                  <div className="hidden text-sm text-secondary-600">
                                    Image generation completed. URL: {message.imageUrl}
                                  </div>
                                </div>
                              ) : (
                                <ReactMarkdown
                                  components={{
                                    code: ({ node, inline, className, children, ...props }) => {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline && match ? (
                                        <CodeBlock className={className} {...props}>
                                          {children}
                                        </CodeBlock>
                                      ) : (
                                        <code className={className} {...props}>
                                          {children}
                                        </code>
                                      );
                                    }
                                  }}
                                  className="markdown-content"
                                >
                                  {message.content}
                                </ReactMarkdown>
                              )}
                            </div>
                            <div className={`flex items-center space-x-2 mt-2 text-xs text-secondary-500 ${
                              message.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}>
                              <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                              {message.role === 'assistant' && (
                                <>
                                  <span>•</span>
                                  <span>{message.model}</span>
                                  <span>•</span>
                                  <span>{isImageMode ? 'g4f-client' : selectedProvider.replace('g4f.Provider.', '')}</span>
                                  <button
                                    onClick={() => copyMessage(message.content)}
                                    className="hover:text-primary-600 transition-colors"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-3xl">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full flex items-center justify-center">
                          {isImageMode ? (
                            <ImageIcon className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="bg-secondary-100 p-4 rounded-2xl">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-secondary-600" />
                            <span className="text-secondary-600">
                              {isImageMode ? 'Generating image...' : 'AI is thinking...'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-secondary-200 pt-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isImageMode 
                        ? "Describe the output you want to generate... (Shift + Enter for new line)" 
                        : "Type your message here... (Shift + Enter for new line)"
                      }
                      className="input-field resize-none h-12 min-h-[3rem] max-h-32"
                      rows="1"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isImageMode ? (
                      <ImageIcon className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{isImageMode ? 'Generate' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Playground;
