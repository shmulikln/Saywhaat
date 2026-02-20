
import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";
import { useGame } from "../contexts/GameSessionContext";

const ParticleBackground: React.FC = () => {
  const [init, setInit] = useState(false);
  const { gameSession } = useGame();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const isChaosActive = !!(gameSession?.activeChaosEvent || gameSession?.activeTurnChaos);

  const particleOptions = useMemo((): ISourceOptions => ({
    fpsLimit: 60,
    particles: {
      number: {
        value: isChaosActive ? 150 : 80,
        density: { enable: true, area: 800 },
      },
      color: {
        value: isChaosActive ? ["#FF0000", "#00FF00", "#FF00FF", "#FFFF00"] : ["#FFFFFFBB", "#FFFFFF99", "#FFFFFF77"],
      },
      shape: { type: "circle" },
      opacity: {
        value: { min: 0.2, max: 0.6 },
        animation: {
          enable: true,
          speed: isChaosActive ? 2 : 0.8,
          minimumValue: 0.1,
          sync: false,
        },
      },
      size: { value: { min: 1, max: isChaosActive ? 6 : 4 } },
      move: {
        enable: true,
        speed: isChaosActive ? 4 : 0.6,
        direction: "none",
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

  const bgGradient = isChaosActive
    ? "bg-gradient-to-br from-black via-red-900 to-purple-900"
    : "bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700";

  return (
    <div
      className={`fixed inset-0 z-0 transition-[background] duration-[50ms] ${bgGradient}`}
      aria-hidden="true"
    >
      {init && (
        <Particles
          id="tsparticles"
          options={particleOptions}
          className="w-full h-full"
        />
      )}
      {isChaosActive && <div className="absolute inset-0 static-noise pointer-events-none"></div>}
    </div>
  );
};

export default ParticleBackground;
