import React, { useMemo } from "react";
import Particles from "@tsparticles/react";
import type { ISourceOptions } from "@tsparticles/engine";

const ConfettiOverlay: React.FC = () => {
  const options = useMemo((): ISourceOptions => ({
    fullScreen: { enable: true, zIndex: 5 },
    particles: {
      number: {
        value: 60,
      },
      color: {
        value: ["#ffca3a", "#8ac926", "#1982c4", "#ff595e", "#6a4c93"],
      },
      shape: {
        type: ["circle", "square"],
      },
      opacity: {
        value: 1,
      },
      size: {
        value: { min: 2, max: 4 },
      },
      move: {
        enable: true,
        direction: "bottom",
        speed: { min: 3, max: 6 },
        straight: false,
        outModes: {
          default: "out",
        },
      },
      rotate: {
        value: { min: 0, max: 360 },
        direction: "random",
        animation: {
          enable: true,
          speed: 10,
        },
      },
      tilt: {
        direction: "random",
        enable: true,
        value: { min: 0, max: 360 },
        animation: {
          enable: true,
          speed: 10,
        },
      },
      roll: {
        darken: 20,
        enable: true,
        speed: 10,
      },
      wobble: {
        distance: 10,
        enable: true,
        speed: 5,
      },
    },
    detectRetina: true,
  }), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Particles id="confetti-particles" options={options} />
    </div>
  );
};

export default React.memo(ConfettiOverlay);