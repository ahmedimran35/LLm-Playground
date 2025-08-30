import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  MessageSquare, 
  Cpu, 
  Shield, 
  Globe, 
  ArrowRight,
  Sparkles,
  Code,
  Brain
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Cpu,
      title: "Multiple AI Models",
      description: "Access GPT-4, Claude, Gemini, DeepSeek, and many more cutting-edge AI models in one place."
    },
    {
      icon: Globe,
      title: "Multiple Providers",
      description: "Choose from various providers including DeepInfra, DeepSeek, OpenAI, and more for optimal performance."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your conversations stay private with no data collection or storage of personal information."
    },
    {
      icon: MessageSquare,
      title: "Real-time Chat",
      description: "Experience smooth, real-time conversations with instant responses and streaming capabilities."
    },
    {
      icon: Code,
      title: "Code Support",
      description: "Perfect for developers with syntax highlighting and code generation capabilities."
    },
    {
      icon: Brain,
      title: "Advanced Features",
      description: "Temperature control, token limits, and advanced parameters for fine-tuned responses."
    }
  ];

  const stats = [
    { number: "20+", label: "AI Models" },
    { number: "10+", label: "Providers" },
    { number: "∞", label: "Free Usage" },
    { number: "100%", label: "Open Source" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-primary-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Powered by AI Nexus</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-secondary-900 mb-6">
                Experience the Future of
                <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"> AI Chat</span>
              </h1>
              <p className="text-xl text-secondary-600 max-w-3xl mx-auto mb-8 leading-relaxed">
                Access multiple AI models and providers through a beautiful, intuitive interface. 
                Chat with GPT-4, Claude, Gemini, and more - all completely free and open source.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/playground"
                  className="btn-primary text-lg px-8 py-4 flex items-center justify-center space-x-2 group"
                >
                  <span>Start Chatting</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="https://github.com/xtekky/gpt4free"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-lg px-8 py-4 flex items-center justify-center space-x-2"
                >
                  <span>View on GitHub</span>
                  <Zap className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-secondary-900 mb-4">
              Why Choose AI Nexus?
            </h2>
            <p className="text-xl text-secondary-600 max-w-2xl mx-auto">
              Discover the features that make our platform the ultimate choice for AI interactions.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Your AI Journey?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of users who are already experiencing the power of free AI chat.
            </p>
            <Link
              to="/playground"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:bg-primary-50 transition-colors duration-200"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">GPT4Free</span>
            </div>
            <p className="text-secondary-400 mb-6">
              Built with ❤️ by the open source community
            </p>
            <div className="flex justify-center space-x-6 text-sm text-secondary-400">
              <a href="https://github.com/xtekky/gpt4free" className="hover:text-white transition-colors">
                GitHub
              </a>
              <a href="https://g4f.dev" className="hover:text-white transition-colors">
                Documentation
              </a>
              <a href="https://t.me/g4f_channel" className="hover:text-white transition-colors">
                Telegram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
