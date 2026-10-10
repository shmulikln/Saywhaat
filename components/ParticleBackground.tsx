
import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

export interface ParticleBackgroundProps {
  isChaosActive?: boolean;
}

let particlesEngineInitialized = false;

const ParticlesCanvas = React.memo<{ isChaosActive: boolean }>(({ isChaosActive }) => {
  const particleOptions = useMemo((): ISourceOptions => ({
    fpsLimit: 60,
    particles: {
      number: {
        value: isChaosActive ? 140 : 65,
        density: { enable: true, area: 700 },
      },
      color: {
        value: isChaosActive 
          ? ["#FF0000", "#00FF00", "#FF00FF", "#FFFF00"] 
          : ["#FFFFFF", "#F3E8FF", "#E9D5FF", "#DDD6FE"],
      },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.25, max: 0.75 },
        animation: {
          enable: true,
          speed: isChaosActive ? 2 : 0.8,
          minimumValue: 0.15,
          sync: false,
        },
      },
      size: { value: { min: 2, max: isChaosActive ? 7 : 4.5 } },
      move: {
        enable: true,
        speed: isChaosActive ? 3.5 : 0.8,
        direction: "top",
        random: true,
        straight: false,
        outModes: { default: "out" },
      },
    },
    interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } },
    detectRetina: true,
    background: { color: 'transparent' },
    fullScreen: { enable: false },
  }), [isChaosActive]);

  return (
    <Particles
      id="tsparticles"
      options={particleOptions}
      className="w-full h-full"
    />
  );
}, (prev, next) => prev.isChaosActive === next.isChaosActive);

const ParticleBackground: React.FC<ParticleBackgroundProps> = React.memo(({ isChaosActive = false }) => {
  const [init, setInit] = useState(particlesEngineInitialized);

  useEffect(() => {
    if (particlesEngineInitialized) {
      setInit(true);
      return;
    }
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      particlesEngineInitialized = true;
      setInit(true);
    });
  }, []);

  const bgGradient = isChaosActive
    ? "bg-gradient-to-br from-black via-red-900 to-purple-900"
    : "bg-gradient-to-b from-[#3824c6] via-[#661f9d] to-[#9c177c]";

  return (
    <div
      className={`fixed inset-0 z-0 transition-all duration-700 ease-in-out ${bgGradient} pointer-events-none`}
      aria-hidden="true"
    >
      {init && <ParticlesCanvas isChaosActive={isChaosActive} />}
    </div>
  );
}, (prev, next) => !!prev.isChaosActive === !!next.isChaosActive);

export default ParticleBackground;
