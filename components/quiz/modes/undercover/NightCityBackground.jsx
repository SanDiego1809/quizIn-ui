"use client";

import { useEffect, useRef } from "react";
import classes from "./NightCityBackground.module.css";

export const NIGHT_CITY_SRC = "/undercover/night-city.jpg";

const rand = (min, max) => Math.random() * (max - min) + min;

/**
 * Night city photo background with animated rain / window droplets on top.
 */
export default function NightCityBackground({
  className = "",
  intensity = "full",
}) {
  const mountRef = useRef(null);
  const canvasRef = useRef(null);
  const playMode = intensity === "play";

  useEffect(() => {
    const mount = mountRef.current;
    const canvas = canvasRef.current;
    if (!mount || !canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let rain = [];
    let drops = [];
    let rafId = 0;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const rainCount = playMode ? 70 : 160;
    const dropCount = playMode ? 18 : 36;

    function createWeather() {
      rain = [];
      drops = [];
      for (let i = 0; i < rainCount; i += 1) {
        rain.push({
          x: rand(0, w),
          y: rand(0, h),
          length: rand(10, 28),
          speed: rand(4, 11),
          opacity: rand(0.1, 0.38),
          drift: rand(-1.1, -0.25),
        });
      }
      for (let i = 0; i < dropCount; i += 1) {
        drops.push({
          x: rand(0, w),
          y: rand(0, h),
          radius: rand(1.2, 3.4),
          speed: rand(0.12, 0.55),
          opacity: rand(0.1, 0.32),
        });
      }
    }

    function resize() {
      const rect = mount.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createWeather();
    }

    function drawRain() {
      rain.forEach((r) => {
        ctx.strokeStyle = `rgba(210, 230, 235, ${r.opacity})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.drift, r.y + r.length);
        ctx.stroke();
        r.y += r.speed;
        r.x += r.drift;
        if (r.y > h) {
          r.y = -r.length;
          r.x = rand(0, w);
        }
      });
    }

    function drawWindowDrops() {
      drops.forEach((d) => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(185, 213, 220, ${d.opacity * 0.4})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          d.x - d.radius * 0.3,
          d.y - d.radius * 0.35,
          d.radius * 0.35,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(240, 250, 255, ${d.opacity})`;
        ctx.fill();
        d.y += d.speed;
        if (d.y > h) {
          d.y = -5;
          d.x = rand(0, w);
        }
      });
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      if (!reducedMotion) {
        drawRain();
        drawWindowDrops();
        rafId = requestAnimationFrame(frame);
      } else {
        // One static sprinkle of droplets for reduced motion.
        drops.slice(0, 24).forEach((d) => {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(185, 213, 220, ${d.opacity * 0.5})`;
          ctx.fill();
        });
      }
    }

    resize();
    rafId = requestAnimationFrame(frame);

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    ro?.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
    };
  }, [playMode]);

  return (
    <div
      ref={mountRef}
      className={`${classes.root}${playMode ? ` ${classes.rootPlay}` : ""}${
        className ? ` ${className}` : ""
      }`}
      aria-hidden="true"
    >
      <img
        className={classes.photo}
        src={NIGHT_CITY_SRC}
        alt=""
        draggable={false}
      />
      <div className={classes.grade} />
      <canvas ref={canvasRef} className={classes.canvas} />
      <div className={classes.vignette} />
    </div>
  );
}
