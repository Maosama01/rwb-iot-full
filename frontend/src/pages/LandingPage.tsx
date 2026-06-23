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
  Smartphone,
} from 'lucide-react';

const LandingPage: React.FC = () => {

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-compost-900 selection:bg-leaf-100 selection:text-leaf-900 scroll-smooth">
      {/* Navigation */}
      <header className="fixed w-full bg-cream-50/80 backdrop-blur-md z-50 border-b border-border">
        <nav aria-label="Main Navigation" className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-leaf-600 p-2.5 rounded-2xl text-white shadow-organic-sm">
              <Leaf size={24} strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="text-3xl font-serif font-bold tracking-tight">Rawbin</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              to="/login"
              className="px-4 py-2.5 text-compost-700 hover:text-leaf-600 font-medium transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link 
              to="/login"
              className="bg-leaf-600 hover:bg-leaf-900 text-white px-5 sm:px-6 py-2.5 rounded-full font-medium shadow-organic-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(140,186,133,0.15)_0%,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(140,186,133,0.1)_0%,transparent_50%)] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-leaf-100 border border-leaf-400 text-leaf-900 text-sm font-medium shadow-sm">
              <Sprout size={16} aria-hidden="true" />
              <span>Smart composting is here</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif font-bold tracking-tight text-compost-900 leading-[1.1]">
              Composting,<br />
              <span className="text-leaf-600">made effortless.</span>
            </h1>
            <p className="text-xl text-compost-700 leading-relaxed max-w-2xl font-medium">
              Turn your kitchen waste into nutrient-rich soil right in your home. 
              Rawbin handles the mess, the smell, and the science, so you can focus on the planet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/login"
                className="bg-leaf-600 hover:bg-leaf-900 text-white px-8 py-4 rounded-full font-semibold shadow-organic-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg group"
              >
                Start Composting
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <a 
                href="#features"
                className="px-8 py-4 rounded-full font-semibold text-compost-900 bg-white border border-border hover:border-leaf-400 hover:bg-leaf-100 transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="flex-1 relative w-full flex justify-center">
            {/* Soft UI Hardware Mockup */}
            <div className="relative w-full max-w-lg aspect-auto sm:aspect-square bg-cream-100 rounded-[3rem] shadow-organic-lg border border-border p-6 sm:p-8 flex flex-col justify-between overflow-hidden group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-leaf-400 blur-[50px] rounded-full opacity-30 group-hover:opacity-60 transition-opacity duration-700"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h3 className="text-3xl font-serif font-bold text-compost-900 tracking-tight">Kitchen Bin</h3>
                  <div className="flex items-center gap-2 text-leaf-900 mt-2 bg-leaf-100 w-fit px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-leaf-600 animate-pulse"></div>
                    <span className="text-sm font-bold uppercase tracking-wider">Active Cycle</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-full bg-leaf-600 text-white flex items-center justify-center shadow-organic-sm">
                  <ShieldCheck size={28} aria-hidden="true" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm">
                  <div className="text-compost-500 text-sm font-bold uppercase tracking-wider mb-2">Temperature</div>
                  <div className="text-4xl font-black text-compost-900 mb-1">Warm</div>
                  <div className="text-sm font-medium text-leaf-600 flex items-center gap-1">
                    <Activity size={14} /> Perfect for soil
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 border border-border shadow-sm">
                  <div className="text-compost-500 text-sm font-bold uppercase tracking-wider mb-2">Moisture</div>
                  <div className="text-4xl font-black text-compost-900 mb-1">Good</div>
                  <div className="text-sm font-medium text-leaf-600 flex items-center gap-1">
                    <Activity size={14} /> Breaking down
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="bg-white py-24 border-y border-border relative overflow-hidden scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-serif font-bold mb-4">Everything you need to compost perfectly.</h2>
            <p className="text-compost-500 text-lg font-medium">Remove the guesswork from composting. Our ecosystem handles the science, so you can focus on sustainability.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Odorless Process",
                desc: "Our carbon filtration and continuous aeration system means your kitchen always smells fresh.",
                icon: <Activity size={24} aria-hidden="true" />
              },
              {
                title: "Friendly Reminders",
                desc: "Get a soft nudge when your compost needs a bit more dry material or when it's ready to use.",
                icon: <BellRing size={24} aria-hidden="true" />
              },
              {
                title: "Ask Rawbin",
                desc: "Not sure if you can compost avocado pits? Just ask our built-in AI assistant anytime.",
                icon: <Sprout size={24} aria-hidden="true" />
              },
              {
                title: "Quiet Operation",
                desc: "The grinding and aeration fans run so quietly, you'll forget Rawbin is even there.",
                icon: <Cpu size={24} aria-hidden="true" />
              },
              {
                title: "Beautiful App",
                desc: "Track your environmental impact right from your phone with our simple, warm interface.",
                icon: <Smartphone size={24} aria-hidden="true" />
              },
              {
                title: "Family Sharing",
                desc: "Everyone in the house can add to the bin and see how much waste they're saving.",
                icon: <ShieldCheck size={24} aria-hidden="true" />
              }
            ].map((feature) => (
              <div key={feature.title} className="bg-cream-50 rounded-[2rem] p-8 border border-border/50 hover:shadow-organic-sm transition-shadow">
                <div className="w-12 h-12 bg-leaf-100 text-leaf-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-compost-700 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cream-100 py-12 border-t border-border mt-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-compost-900">
            <div className="bg-leaf-600 p-1.5 rounded-full text-white">
              <Leaf size={16} aria-hidden="true" />
            </div>
            <span className="font-serif font-bold text-lg">Rawbin Ecosystem</span>
          </div>
          <div className="text-sm font-medium text-compost-500">
            © 2026 Rawbin. Built for a greener world.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
