
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart,
  Book,
  Calendar,
  Construction,
  Headphones,
  Zap,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Header from "@/components/Header";

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [animatedText, setAnimatedText] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    
    // Animation text cycle
    const interval = setInterval(() => {
      setAnimatedText(prev => (prev + 1) % 3);
    }, 3000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(interval);
    };
  }, [scrolled]);

  const subheadlines = [
    "Answering your calls. Optimizing your routes. Chasing your invoices.",
    "All without hiring another human.",
    "Let AI handle the repetitive tasks while you focus on growth."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0118] to-[#120c25] text-white font-inter overflow-x-hidden">
      {/* Use the Header component */}
      <Header />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden pt-16">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black/40 to-black/80"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiM4YjVjZjYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=')]"></div>
        </div>
        <div className="container mx-auto z-10 text-center space-y-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-100 to-purple-300">
              Lisa Isn't a Tool.
            </span>
            <br />
            <span className="text-white">
              She's an AI Workforce.
            </span>
          </h1>
          <div className="h-16 mb-8">
            <p className="text-xl md:text-2xl text-purple-100/90 transition-all duration-500 animate-fade-in">
              {subheadlines[animatedText]}
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button asChild className="rounded-full bg-white text-purple-900 hover:bg-purple-50 px-8 py-6 text-lg group transition-all duration-300">
              <Link to="/voice/login">
                <span>Explore Lisa's Brain</span>
                <div className="ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-transparent border border-purple-400 text-white hover:bg-purple-900/30 px-8 py-6 text-lg group transition-all duration-300">
              <Link to="/voice/login">
                <span>Log In</span>
                <ArrowRight className="h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Clarity Section */}
      <section className="py-24 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4 overflow-hidden">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
              Why Your Team Feels Overworked
            </span>
            <span className="text-white"> (and It's Not Their Fault)</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Missed Calls", icon: <Headphones className="w-10 h-10 text-purple-400" /> },
              { title: "Late Invoices", icon: <BarChart className="w-10 h-10 text-purple-400" /> },
              { title: "Unassigned Jobs", icon: <Construction className="w-10 h-10 text-purple-400" /> },
              { title: "Missed Follow-ups", icon: <Calendar className="w-10 h-10 text-purple-400" /> },
              { title: "Inspection Chaos", icon: <Zap className="w-10 h-10 text-purple-400" /> },
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-xl hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden group">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-6 transform transition-all duration-300 group-hover:scale-110">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-purple-200/70">
                    Your team struggles with {item.title.toLowerCase()} daily, causing revenue leaks and customer dissatisfaction.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Revenue Loss Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-purple-900/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-400">
              Revenue Loss
            </span>
            <span className="text-white"> from Manual Processes</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { metric: "$4,500", title: "Lost Monthly Per Missed Call", icon: <Headphones /> },
              { metric: "32%", title: "Late Payments Impact Cash Flow", icon: <BarChart /> },
              { metric: "12hrs", title: "Weekly Admin Time", icon: <Calendar /> },
              { metric: "28%", title: "Profit Margin Reduction", icon: <Zap /> },
            ].map((item, i) => (
              <div key={i} className="bg-gradient-to-br from-black/60 to-purple-900/30 backdrop-blur-lg p-6 rounded-xl border border-purple-500/20 flex flex-col items-center text-center transform transition-all hover:translate-y-[-5px] hover:shadow-lg hover:shadow-purple-500/10 duration-300">
                <div className="mb-4 p-3 rounded-full bg-purple-500/20">
                  {item.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-2">{item.metric}</div>
                <div className="text-purple-200/70">{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modular Product Suite */}
      <section className="py-24 bg-gradient-to-t from-purple-900/10 to-black/40 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Modular Product Suite
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: "AI Calling", 
                description: "Lisa handles all your calls and never misses a lead", 
                icon: <Headphones className="w-8 h-8" /> 
              },
              { 
                title: "Smart Scheduling", 
                description: "Optimize technician routes and appointment slots", 
                icon: <Calendar className="w-8 h-8" /> 
              },
              { 
                title: "Invoice Management", 
                description: "Automated invoice follow-ups and payment tracking", 
                icon: <BarChart className="w-8 h-8" /> 
              },
              { 
                title: "Field Operations", 
                description: "Real-time job tracking and technician coordination", 
                icon: <Construction className="w-8 h-8" /> 
              },
              { 
                title: "Data Analytics", 
                description: "Actionable insights to grow your business", 
                icon: <Zap className="w-8 h-8" /> 
              },
              { 
                title: "AI Integration", 
                description: "Seamless connection with your existing tools", 
                icon: <Bot className="w-8 h-8" /> 
              },
            ].map((item, i) => (
              <Card 
                key={i} 
                className="glass-morphism bg-black/20 backdrop-blur-lg border border-purple-500/20 rounded-xl overflow-hidden group hover:bg-purple-900/10 transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-purple-500/20 p-3 rounded-lg mr-4 group-hover:bg-purple-500/30 transition-all duration-300">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-purple-100/70 mb-6">{item.description}</p>
                  <Button asChild className="text-purple-400 group-hover:text-purple-300 transition-all duration-300">
                    <Link to="/voice/login" className="flex items-center">
                      <span className="mr-2 font-medium">Learn more</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How Lisa Thinks Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJkb3RzIiB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjOGI1Y2Y2IiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==')]" style={{ opacity: 0.4 }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            <span className="text-white">This is </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
              Lisa's Brain
            </span>
            <span className="text-white"> on Ops</span>
          </h2>
          
          <div className="relative py-10 max-w-4xl mx-auto">
            {/* Flow line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600/80 to-purple-900/40 transform -translate-x-1/2"></div>
            
            {[
              { 
                title: "Lead Generation", 
                description: "Lisa identifies and qualifies leads through AI-driven conversations", 
                icon: <Book className="w-6 h-6" /> 
              },
              { 
                title: "AI Calling", 
                description: "Lisa handles calls, qualifying leads and scheduling appointments", 
                icon: <Headphones className="w-6 h-6" /> 
              },
              { 
                title: "Smart Scheduling", 
                description: "Optimizing technician routes and appointment slots based on location and urgency", 
                icon: <Calendar className="w-6 h-6" /> 
              },
              { 
                title: "Field Operations", 
                description: "Real-time coordination and adaptive scheduling for technicians", 
                icon: <Construction className="w-6 h-6" /> 
              },
              { 
                title: "Revenue Optimization", 
                description: "Streamlined invoice processing and follow-ups to improve cash flow", 
                icon: <BarChart className="w-6 h-6" /> 
              },
            ].map((item, i) => (
              <div key={i} className="relative ml-10 md:ml-0 md:grid md:grid-cols-5 mb-16 last:mb-0">
                <div className={`hidden md:flex md:col-span-2 ${i % 2 === 0 ? 'justify-end md:pr-12' : 'md:order-2 justify-start md:pl-12'}`}>
                  <div className={`relative flex items-center ${i % 2 === 0 ? 'justify-end text-right' : 'justify-start text-left'}`}>
                    <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6 max-w-xs">
                      <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                      <p className="text-purple-200/70">{item.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="absolute md:relative md:col-span-1 flex justify-center">
                  <div className="absolute md:relative bg-purple-500 rounded-full w-4 h-4 left-[-32px] md:left-auto transform md:transform-none md:translate-x-0 top-7 md:top-12">
                    <div className="absolute w-10 h-10 bg-purple-500/30 rounded-full -left-3 -top-3 animate-pulse"></div>
                  </div>
                </div>

                {/* Mobile only content */}
                <div className="md:hidden bg-purple-900/20 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-purple-200/70">{item.description}</p>
                </div>
                
                <div className={`hidden md:block md:col-span-2 ${i % 2 === 1 ? 'md:order-1 md:pr-12' : 'md:pl-12'}`}>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack + Reassurance */}
      <section className="py-24 bg-gradient-to-b from-black/60 to-purple-900/5 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Real AI. Real Operations.
            </span>
            <span className="text-white"> No Fluff.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { 
                title: "Built on GPT + proprietary ops engine", 
                description: "Lisa combines advanced language models with specialized operations logic for field service businesses.",
                icon: <Bot className="w-8 h-8 text-purple-400" />
              },
              { 
                title: "Integrates with your existing tools", 
                description: "Seamless connections with Salesforce, ServiceTitan, and other field service management platforms.", 
                icon: <Zap className="w-8 h-8 text-purple-400" />
              },
              { 
                title: "Privacy-first, SOC2-ready", 
                description: "Enterprise-grade security with full compliance and data protection built into every interaction.",
                icon: <Construction className="w-8 h-8 text-purple-400" />
              },
              { 
                title: "AI learns from your workflows", 
                description: "Lisa adapts to your specific business processes and improves over time with each interaction.",
                icon: <Book className="w-8 h-8 text-purple-400" />
              },
            ].map((item, i) => (
              <div key={i} className="flex border border-purple-500/20 rounded-xl bg-black/20 backdrop-blur-sm p-6">
                <div className="mr-4 mt-1">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-purple-200/80">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 w-[80vh] h-[80vh] bg-purple-600/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-white">Hire Your First </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-purple-600">
              AI Team Member
            </span>
          </h2>
          <p className="text-xl text-purple-200/90 mb-10 max-w-2xl mx-auto">
            Start offloading your repetitive tasks and watch your business grow
          </p>
          <Button 
            asChild
            className="rounded-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white px-10 py-6 text-lg group transition-all duration-300"
          >
            <Link to="/voice/login">
              <span>Get Started with Lisa</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-purple-300/60 mt-6">Setup in days. Cancel anytime. No pressure.</p>
        </div>
      </section>

      {/* Simplified Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-purple-500/20 py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center mb-4">
              <Headphones className="h-6 w-6 mr-2 text-purple-400" />
              <span className="text-2xl font-bold text-white">Lisa AI</span>
            </div>
            <p className="text-purple-200/70 max-w-md mb-6">
              Lisa is built for the doers. The fixers. The ones who don't have time for admin.
              We're building AI that works as hard as you do.
            </p>
            <p className="text-purple-200/50 text-sm">
              © 2025 Lisa AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
