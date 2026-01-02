import React, { useRef } from "react";

// Animated Diwali greeting page — attractive visuals, no share form.

export default function Diwali() {
	// fireworks controller refs
	const canvasRef = useRef(null);
	const fireworksRunning = useRef(false);

	function startFireworks() {
	if (!canvasRef.current || fireworksRunning.current) return;
	fireworksRunning.current = true;
	const el = canvasRef.current;
	const ctx = el.getContext('2d');
	const W = (el.width = el.offsetWidth * devicePixelRatio);
	const H = (el.height = el.offsetHeight * devicePixelRatio);
	ctx.scale(devicePixelRatio, devicePixelRatio);

		const particles = [];

		function rand(min, max) { return Math.random() * (max - min) + min; }

		function createBurst(x, y) {
			const hue = rand(0, 360);
			const count = 20 + Math.floor(rand(8, 30));
			for (let i = 0; i < count; i++) {
				const angle = Math.random() * Math.PI * 2;
				const speed = rand(1, 4);
				particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: rand(40, 70), hue, r: rand(1.5, 3.5) });
			}
		}

		// create a few initial bursts
	for (let i = 0; i < 4; i++) createBurst(rand(40, el.offsetWidth - 40), rand(40, el.offsetHeight - 40));

		let frame = 0;
		function tick() {
			frame++;
				ctx.clearRect(0, 0, el.width, el.height);
			// draw particles
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy += 0.02; // gravity
				p.vx *= 0.99;
				p.vy *= 0.99;
				p.life -= 1;
				const alpha = Math.max(0, p.life / 70);
				ctx.beginPath();
				ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fill();
				if (p.life <= 0) particles.splice(i, 1);
			}

			// occasional bursts
			if (frame % 30 === 0 && Math.random() > 0.3) createBurst(rand(40, el.offsetWidth - 40), rand(40, el.offsetHeight - 40));

			if (particles.length > 0) requestAnimationFrame(tick);
			else {
				fireworksRunning.current = false;
				// clear canvas after short delay
				setTimeout(() => ctx.clearRect(0, 0, el.width, el.height), 300);
			}
		}

		tick();
	}

	function onCelebrateClick() {
		// trigger bursts and small UI pulse
		const card = document.querySelector('.diwali-card');
		if (card) {
			card.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
		}
		startFireworks();
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-amber-900 to-slate-800 p-6">
			<div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl diwali-card">
				{/* Background glow and bokeh */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />

				<div className="relative z-10 p-8 md:p-12 bg-gradient-to-b from-amber-50/5 via-transparent to-transparent">
					<div className="flex flex-col md:flex-row items-center gap-6">
						<div className="flex-1 text-center md:text-left">
							<h1 className="text-4xl md:text-6xl font-extrabold text-amber-300 drop-shadow-lg neon-heading">Happy Diwali</h1>
							<p className="mt-3 text-lg text-amber-100/90">From the Tastyaana & NexisparkX family — may your life be illuminated with joy, health and abundance.</p>

								<div className="mt-6 flex items-center gap-4 justify-center md:justify-start">
									<button onClick={onCelebrateClick} className="px-6 py-3 rounded-full bg-amber-400/90 text-slate-900 font-semibold transform hover:-translate-y-1 transition">Celebrate</button>
								</div>
						</div>

									<div className="flex-1 flex items-center justify-center">
										<div className="relative w-40 h-40 md:w-56 md:h-56">
											<Diya />
											<Lanterns />
											<Confetti />
										</div>
									</div>
					</div>
				</div>

				<footer className="relative z-10 p-4 text-center text-sm text-amber-100/80 bg-amber-900/10">Wishing you a sparkling Diwali — from Tastyaana & NexisparkX</footer>
			</div>

			{/* Fireworks canvas overlay */}
			<canvas ref={canvasRef} style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 60 }} />

			{/* Styles scoped to this file (simple CSS-in-JS via style tag) */}
			<style>{`
				.neon-heading {
					text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 18px rgba(255,190,50,0.25);
					animation: glow 2.8s ease-in-out infinite;
				}

				@keyframes glow {
					0% { text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(255,190,50,0.12); }
					50% { text-shadow: 0 4px 18px rgba(0,0,0,0.6), 0 0 30px rgba(255,190,50,0.6); }
					100% { text-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 6px rgba(255,190,50,0.12); }
				}


				/* Diya SVG and flame animations */
				.diya-svg { width: 100%; height: 100%; display: block; }
				.diya-base-path { fill: url(#diyaGradient); filter: drop-shadow(0 6px 18px rgba(0,0,0,0.18)); }
				.flame-path { transform-origin: 50% 70%; animation: flame-flicker 1000ms infinite ease-in-out; opacity: 0.98; }

				@keyframes flame-flicker {
					0% { transform: translateY(0) scaleY(1); opacity: 1; filter: blur(0.2px); }
					50% { transform: translateY(-2px) scaleY(0.96); opacity: 0.9; filter: blur(0.4px); }
					100% { transform: translateY(0) scaleY(1); opacity: 1; filter: blur(0.2px); }
				}


				/* floating lanterns */
				.lantern { position: absolute; }
				.lantern .body { width: 18px; height: 26px; background: linear-gradient(180deg,#ffedd5,#fb923c); border-radius: 8px; box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
				.lantern .rope { width: 2px; height: 10px; background: rgba(0,0,0,0.15); margin: 0 auto; }

				@keyframes floatUp {
					0% { transform: translateY(30px) translateX(0) rotate(-6deg); opacity: 0; }
					20% { opacity: 1; }
					100% { transform: translateY(-90px) translateX(12px) rotate(8deg); opacity: 0.9; }
				}


				/* confetti */
				.confetti-piece { position: absolute; width: 8px; height: 12px; opacity: 0.95; transform-origin: center; animation: confetti-fall linear infinite; }

				@keyframes confetti-fall {
					0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
					100% { transform: translateY(120px) rotate(360deg); opacity: 0.7; }
				}

				/* Responsive tweaks */
				@media (max-width: 640px) {
					.neon-heading { font-size: 2rem; }
					.p-8 { padding: 1.25rem; }
					.footer-small { font-size: 12px; }
					/* reduce confetti and lantern motion on small screens */
					.confetti-piece { display: none; }
					.lantern { display: none; }
				}
			`}</style>
		</div>
	);
}

function Diya() {
	return (
		<div className="absolute inset-0 flex items-end justify-center" aria-hidden>
			<svg className="diya-svg" viewBox="0 0 200 140" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="diyaGradient" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor="#ffd166" />
						<stop offset="100%" stopColor="#b45309" />
					</linearGradient>
					<radialGradient id="flameGrad" cx="50%" cy="30%" r="60%">
						<stop offset="0%" stopColor="#fffbe6" />
						<stop offset="45%" stopColor="#ffd05b" />
						<stop offset="100%" stopColor="#ff6b00" />
					</radialGradient>
				</defs>

				{/* Diya base */}
				<g transform="translate(0,14)">
					<path className="diya-base-path" d="M20 80 C40 40, 160 40, 180 80 L150 100 C120 80, 80 80, 50 100 Z" />

					{/* Decorative rim */}
					<path d="M30 76 C55 52, 145 52, 170 76" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
				</g>

				{/* Flame */}
				<g transform="translate(100,36)">
					<path className="flame-path" d="M0 0 C 8 -18, 18 -18, 18 -32 C 18 -48, 0 -44, 0 -60 C -12 -44, -18 -28, 0 0 Z" fill="url(#flameGrad)" />
					<path className="flame-path" d="M2 -8 C 6 -16, 12 -16, 12 -22 C 12 -30, 2 -28, 2 -36 C -4 -28, -6 -20, 2 -8 Z" fill="#fff7d6" opacity="0.6" style={{ transformOrigin: '50% 70%', animation: 'flame-flicker 900ms infinite ease-in-out' }} />
				</g>
			</svg>
		</div>
	);
}

function Lanterns() {
	return (
		<>
			<div className="lantern" style={{ left: '8%', top: '8%', animation: 'floatUp 6s ease-in-out infinite' }}>
				<div className="rope" />
				<div className="body" />
			</div>
			<div className="lantern" style={{ left: '75%', top: '18%', animation: 'floatUp 7s ease-in-out 1s infinite' }}>
				<div className="rope" />
				<div className="body" style={{ background: 'linear-gradient(180deg,#fef3c7,#fb7185)' }} />
			</div>
		</>
	);
}

function Confetti() {
	const pieces = Array.from({ length: 10 }).map((_, i) => {
		const left = 15 + i * 6;
		const delay = (i % 3) * 0.4;
		const color = ['#FFD166', '#EF476F', '#06D6A0', '#118AB2'][i % 4];
		return (
			<div
				key={i}
				className="confetti-piece"
				style={{ left: `${left}%`, top: `${10 + (i % 3) * 4}%`, background: color, animationDuration: `${2 + (i % 3)}s`, animationDelay: `${delay}s` }}
			/>
		);
	});
	return <>{pieces}</>;
}

