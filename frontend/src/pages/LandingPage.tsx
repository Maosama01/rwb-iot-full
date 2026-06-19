import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  Cpu, 
  Activity, 
  BellRing, 
  Leaf, 
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background font-sans text-text-primary selection:bg-emerald/20 selection:text-emerald-dark">
      {/* Navigation */}
      <header className="fixed w-full bg-surface/80 backdrop-blur-md z-50 border-b border-border">
        <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-emerald/10 p-2.5 rounded-xl text-emerald">
              <Leaf size={24} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Rawbin</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="px-5 py-2.5 text-text-secondary hover:text-emerald font-medium transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/login"
              className="bg-emerald hover:bg-emerald-dark text-white px-6 py-2.5 rounded-2xl font-medium shadow-organic transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 overflow-hidden relative">
        {/* Abstract Background Elements - Replaced GPU-heavy blurs with CSS radial gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(16,185,129,0.05)_0%,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.08)_0%,transparent_50%)] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-sm font-medium">
              <Sprout size={16} aria-hidden="true" />
              <span>Smart composting is here</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-text-primary leading-[1.1]">
              Composting,<br />
              <span className="text-emerald">made intelligent.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl">
              Turn your kitchen waste into nutrient-rich soil faster and safer. 
              Rawbin's IoT sensors monitor temperature, humidity, and CO₂ in real-time, 
              alerting you exactly when your compost needs attention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/login"
                className="bg-emerald hover:bg-emerald-dark text-white px-8 py-4 rounded-2xl font-semibold shadow-organic transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg group"
              >
                Start Composting
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <a 
                href="#features"
                className="px-8 py-4 rounded-2xl font-semibold text-text-primary bg-surface border border-border hover:border-emerald/30 hover:bg-emerald/5 transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="flex-1 relative w-full flex justify-center">
            {/* Soft UI Hardware Mockup */}
            <div className="relative w-full max-w-lg aspect-auto sm:aspect-square bg-surface rounded-[3rem] shadow-organic border border-white p-6 sm:p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">Kitchen Bin</h3>
                  <div className="flex items-center gap-2 text-emerald mt-1">
                    <Activity size={16} aria-hidden="true" />
                    <span className="text-sm font-medium">Active Cycle</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-emerald/10 flex items-center justify-center text-emerald">
                  <ShieldCheck size={32} aria-hidden="true" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-background rounded-3xl p-6 border border-border/50">
                  <div className="text-text-muted text-sm font-medium mb-1">Temperature</div>
                  <div className="text-3xl font-bold text-text-primary">62.5°C</div>
                  <div className="text-xs text-emerald font-medium mt-2">Optimal</div>
                </div>
                <div className="bg-background rounded-3xl p-6 border border-border/50">
                  <div className="text-text-muted text-sm font-medium mb-1">Humidity</div>
                  <div className="text-3xl font-bold text-text-primary">55%</div>
                  <div className="text-xs text-emerald font-medium mt-2">Perfect</div>
                </div>
              </div>
              <div className="w-full bg-background h-24 rounded-3xl mt-4 border border-border/50 p-4 flex items-end gap-2 overflow-hidden">
                <div className="w-1/6 bg-emerald/20 h-[30%] rounded-t-lg"></div>
                <div className="w-1/6 bg-emerald/30 h-[45%] rounded-t-lg"></div>
                <div className="w-1/6 bg-emerald/50 h-[60%] rounded-t-lg"></div>
                <div className="w-1/6 bg-emerald/70 h-[80%] rounded-t-lg"></div>
                <div className="w-1/6 bg-emerald h-full rounded-t-lg"></div>
                <div className="w-1/6 bg-emerald h-[90%] rounded-t-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="bg-surface py-24 border-y border-border relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need to compost perfectly.</h2>
            <p className="text-text-secondary text-lg">Remove the guesswork from composting. Our ecosystem handles the science, so you can focus on sustainability.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Real-time Telemetry",
                desc: "Monitor temperature, moisture, and aeration levels via our beautiful dashboard from anywhere.",
                icon: <Activity size={24} aria-hidden="true" />
              },
              {
                title: "Instant Alerts",
                desc: "Get notified immediately if your pile runs too hot, too dry, or needs turning.",
                icon: <BellRing size={24} aria-hidden="true" />
              },
              {
                title: "Cycle Tracking",
                desc: "Log your greens and browns. Rawbin calculates your optimal C:N ratio automatically.",
                icon: <Sprout size={24} aria-hidden="true" />
              },
              {
                title: "IoT Connected",
                desc: "Secure MQTT WebSocket pipeline ensures your data is delivered with zero latency.",
                icon: <Cpu size={24} aria-hidden="true" />
              },
              {
                title: "Mobile Ready",
                desc: "Built with a responsive, app-like interface. Access your dashboard right from your phone.",
                icon: <Smartphone size={24} aria-hidden="true" />
              },
              {
                title: "Multi-User Sharing",
                desc: "Share your composter securely with roommates or family members with a single click.",
                icon: <ShieldCheck size={24} aria-hidden="true" />
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-background rounded-[2rem] p-8 border border-border/50 hover:shadow-organic-sm transition-shadow">
                <div className="w-12 h-12 bg-emerald/10 text-emerald rounded-2xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-text-primary">
            <Leaf size={20} className="text-emerald" aria-hidden="true" />
            <span className="font-bold">Rawbin Smart Composter</span>
          </div>
          <div className="text-sm text-text-muted">
            © 2026 Rawbin Ecosystem. Designed locally.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
