import { motion, type MotionProps } from 'framer-motion';
import type { HTMLAttributes, FC } from 'react';
import { FileText, Merge, Split, FileDown, FileType, PenTool, Shield, CheckCircle } from 'lucide-react';

type MotionDivProps = HTMLAttributes<HTMLDivElement> & MotionProps;
const MotionDiv: FC<MotionDivProps> = motion.div as unknown as FC<MotionDivProps>;

const AnimatedWorkflow = () => {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center overflow-hidden">
      {/* Central Hub */}
      <MotionDiv
        className="absolute z-20 flex flex-col items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative">
          {/* Glowing ring */}
          <MotionDiv
            className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          
          {/* Main circle */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <div className="text-center text-primary-foreground">
              <MotionDiv
                className="text-3xl md:text-4xl font-bold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                70+
              </MotionDiv>
              <div className="text-xs md:text-sm font-medium opacity-90">PDF TOOLS</div>
            </div>
          </div>
        </div>
      </MotionDiv>

      {/* Orbiting Tool Icons */}
      {[
        { icon: Merge, label: 'Merge', angle: 0, delay: 0 },
        { icon: Split, label: 'Split', angle: 45, delay: 0.1 },
        { icon: FileDown, label: 'Compress', angle: 90, delay: 0.2 },
        { icon: FileType, label: 'Convert', angle: 135, delay: 0.3 },
        { icon: PenTool, label: 'Edit', angle: 180, delay: 0.4 },
        { icon: Shield, label: 'Protect', angle: 225, delay: 0.5 },
        { icon: FileText, label: 'OCR', angle: 270, delay: 0.6 },
        { icon: CheckCircle, label: 'Verify', angle: 315, delay: 0.7 },
      ].map((item, index) => {
        const Icon = item.icon;
        const radius = 140;
        const x = Math.cos((item.angle * Math.PI) / 180) * radius;
        const y = Math.sin((item.angle * Math.PI) / 180) * radius;

        return (
          <MotionDiv
            key={index}
            className="absolute z-10 bg-[#F7F3EE] rounded-xl bgColor"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: [x, x + 5, x],
              y: [y, y - 5, y]
            }}
            transition={{ 
              opacity: { delay: item.delay + 0.5, duration: 0.4 },
              scale: { delay: item.delay + 0.5, duration: 0.4 },
              x: { delay: 1, duration: 4, repeat: Infinity, ease: "easeInOut" },
              y: { delay: 1, duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <MotionDiv
              className="glass-card p-3 md:p-4 rounded-xl cursor-pointer group"
              whileHover={{ scale: 1.1, boxShadow: "0 20px 40px -10px hsla(239, 84%, 67%, 0.3)" }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#084bdc] group-hover:text-accent transition-colors text-white" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {item.label}
              </span>
            </MotionDiv>
          </MotionDiv>
        );
      })}

      {/* Floating PDF Documents */}
      {[
        { x: -180, y: -120, rotation: -15, delay: 0.2 },
        { x: 180, y: -100, rotation: 10, delay: 0.4 },
        { x: -160, y: 120, rotation: 12, delay: 0.6 },
        { x: 170, y: 130, rotation: -8, delay: 0.8 },
      ].map((pos, index) => (
        <MotionDiv
          key={`pdf-${index}`}
          className="absolute"
          style={{ x: pos.x, y: pos.y }}
          initial={{ opacity: 0, scale: 0.5, rotate: pos.rotation }}
          animate={{ 
            opacity: [0.6, 0.9, 0.6],
            y: [pos.y, pos.y - 15, pos.y]
          }}
          transition={{ 
            opacity: { delay: pos.delay + 1, duration: 4, repeat: Infinity },
            y: { delay: pos.delay + 1, duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <div className="w-10 h-14 md:w-12 md:h-16 bg-[#084bdc3b] rounded-lg border border-[#084bdc3b]/30 flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
        </MotionDiv>
      ))}

      {/* Connection Lines (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(239 84% 67%)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(217 91% 60%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(239 84% 67%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        {/* Orbital ring */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="140"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="1"
          strokeDasharray="10 5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{ 
            opacity: { delay: 0.5, duration: 0.5 },
            rotate: { duration: 60, repeat: Infinity, ease: "linear" }
          }}
          style={{ transformOrigin: "50% 50%" }}
        />
      </svg>
    </div>
  );
};

export default AnimatedWorkflow;
