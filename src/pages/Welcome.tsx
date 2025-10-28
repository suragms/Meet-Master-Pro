import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Beef, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState('');
  const [showContent, setShowContent] = useState(false);
  const fullText = 'MeatMaster Pro';

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { sessionDB } = await import('@/lib/database');
      if (sessionDB.isAuthenticated()) {
        navigate('/dashboard');
      }
    };
    checkAuth();

    // Text typing animation
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setShowContent(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full animate-fade-in">
        {/* Logo Container with 3D Animation */}
        <div className="flex justify-center mb-8">
          <div className="relative w-48 h-48 perspective-1000">
            {/* Glowing Background Circle */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent rounded-full opacity-30 blur-2xl animate-pulse" />
            
            {/* Main Logo Container with 3D Transform */}
            <div className="relative w-full h-full flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl logo-3d">
              {/* Inner Glow Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
              
              {/* Logo Icon */}
              <Beef className="h-32 w-32 text-white relative z-10 drop-shadow-2xl" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent shine-effect" />
            </div>

            {/* Floating Particles */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-primary rounded-full"
                style={{
                  left: `${50 + Math.cos((i * 2 * Math.PI) / 6) * 60}%`,
                  top: `${50 + Math.sin((i * 2 * Math.PI) / 6) * 60}%`,
                }}
              >
                <div className="w-2 h-2 bg-primary rounded-full particle-float" style={{ animationDelay: `${i * 0.3}s` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            {displayText}
            <span className="inline-block ml-1 cursor-blink">
              |
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground subtitle-fade">
            Your Complete Meat Business Management Solution
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { title: 'Inventory', desc: 'Track stock levels' },
            { title: 'Sales', desc: 'Manage invoices & billing' },
            { title: 'Analytics', desc: 'Monitor performance' },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="p-4 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:scale-105 hover:-translate-y-1 cursor-pointer"
              style={{ animation: `fadeInUp 0.5s ease-out ${1.8 + index * 0.1}s both` }}
            >
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="group relative overflow-hidden"
            onClick={() => navigate('/login')}
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/signup')}
          >
            Create Account
          </Button>
        </div>

        {/* Scroll Indicator */}
        {showContent && (
          <div className="flex flex-col items-center mt-12 gap-2 animate-fade-in">
            <p className="text-sm text-muted-foreground">
              Get started
            </p>
            <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center">
              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 scroll-indicator" />
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS Animations */}
      <style>{`
        .logo-3d {
          animation: logoRotate 8s linear infinite, logoScale 2s ease-in-out infinite;
        }
        
        .shine-effect {
          animation: shine 2s infinite;
        }
        
        .particle-float {
          animation: floatParticle 2s ease-in-out infinite;
        }
        
        .cursor-blink {
          animation: blink 1s infinite;
        }
        
        .subtitle-fade {
          animation: fadeIn 0.5s ease-in 1.5s both;
        }
        
        .scroll-indicator {
          animation: scrollIndicator 1.5s ease-in-out infinite;
        }
        
        @keyframes logoRotate {
          from { transform: rotateY(0deg) scale(1); }
          to { transform: rotateY(360deg) scale(1); }
        }
        
        @keyframes logoScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(0.8); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 1; }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scrollIndicator {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(15px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
