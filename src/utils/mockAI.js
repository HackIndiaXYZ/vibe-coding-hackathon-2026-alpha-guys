/* ================================================================
   Smart Semester AI — Offline Mock AI Engine  v2
   Topic-aware, keyword-driven academic assistant.
   Works 100% offline — no API keys, no network calls.

   Call types handled:
     assistant   → topic-specific academic Q&A (Physics, Math,
                    Electronics, CS, SE, Chemistry, Study Skills)
     insight     → personalised GPA dashboard tip
     planner     → algorithmic weekly schedule JSON
     summary     → extractive text summarisation
     keypoints   → key-sentence extraction
     flashcards  → Q&A pair generation → JSON
     quiz        → 5-question MCQ generation → JSON
   ================================================================ */

// ─── CALL-TYPE DETECTOR ─────────────────────────────────────────
export function detectCallType(messages, systemPrompt = '') {
  const last = (messages[messages.length - 1]?.content || '').slice(0, 120);
  const sys  = systemPrompt.slice(0, 200);
  if (sys.includes('study schedule expert'))             return 'planner';
  if (last.startsWith('Summarize the following'))        return 'summary';
  if (last.startsWith('Extract 6-10 key concepts'))      return 'keypoints';
  if (last.startsWith('Generate 8-10 study flashcards')) return 'flashcards';
  if (last.startsWith('Create a 6-question'))            return 'quiz';
  if (last.includes('study tip') || last.includes('motivating daily')) return 'insight';
  return 'assistant';
}

// ─── MAIN ENTRY POINT ───────────────────────────────────────────
export async function getMockResponse(messages, systemPrompt = '') {
  const type = detectCallType(messages, systemPrompt);
  const content = messages[messages.length - 1]?.content || '';
  await delay(500 + Math.random() * 700);
  switch (type) {
    case 'planner':    return mockPlanner(content, systemPrompt);
    case 'summary':    return mockSummary(extractNotes(content));
    case 'keypoints':  return mockKeyPoints(extractNotes(content));
    case 'flashcards': return mockFlashcards(extractNotes(content));
    case 'quiz':       return mockQuiz(extractNotes(content));
    case 'insight':    return mockInsight(content);
    default:           return mockAssistant(messages, systemPrompt);
  }
}

// ─── HELPERS ────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));

function extractNotes(prompt) {
  const marker = prompt.indexOf('\n\nNotes:\n');
  if (marker !== -1) return prompt.slice(marker + 9).trim();
  const firstBlank = prompt.indexOf('\n\n');
  if (firstBlank !== -1) return prompt.slice(firstBlank + 2).trim();
  return prompt.trim();
}
function sentences(text) {
  return text.replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/)
    .map(s => s.trim()).filter(s => s.length > 20 && s.split(' ').length >= 4);
}
function pick(arr, n) {
  const out = [], step = Math.max(1, Math.floor(arr.length / n));
  for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
  return out;
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = (i * 7 + 3) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ═══════════════════════════════════════════════════════════════
// ─── 1.  AI STUDY ASSISTANT ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════

/* ── TOPIC KNOWLEDGE BASE ──────────────────────────────────────
   Each key is a lowercase phrase.  The matcher checks whether the
   cleaned user query INCLUDES the key.  Longer keys are checked
   first so "kirchhoff's voltage law" wins over "kirchhoff".
   ──────────────────────────────────────────────────────────── */
const KB = {

  // ══════════════ PHYSICS ══════════════
  "ohm's law": `**Ohm's Law**

Ohm's Law describes the relationship between voltage, current, and resistance in a conductor at constant temperature.

**Formula:**  V = I × R

| Symbol | Quantity | Unit |
|--------|----------|------|
| V | Voltage (potential difference) | Volt (V) |
| I | Current | Ampere (A) |
| R | Resistance | Ohm (Ω) |

**Derived forms:**
- Current:    I = V / R
- Resistance: R = V / I

**Power relationships:**
- P = V × I = I²R = V²/R

**Worked example:** A 12 V battery drives current through a 4 Ω resistor.
  I = 12 / 4 = **3 A**,   P = 3² × 4 = **36 W**

**Limitations:** Ohm's Law applies only to *ohmic* (linear) conductors.  Diodes, transistors, and LEDs are non-ohmic — their V-I graph is not a straight line.`,

  "kirchhoff's voltage law": `**Kirchhoff's Voltage Law (KVL)**

KVL states: *The algebraic sum of all voltages around any closed loop in a circuit equals zero.*

**Formula:** Σ V = 0   (around any closed loop)

**Why it works:** Energy is conserved — the energy gained by a charge moving through a source equals the energy lost across the resistors.

**Sign convention:**
- Voltage **rise** (through a source from − to +): positive
- Voltage **drop** (through a resistor in direction of current): negative

**Example — simple loop:**
  Battery 10 V, R₁ = 3 Ω, R₂ = 2 Ω  → I = 10/(3+2) = 2 A
  KVL check:  +10 − 2×3 − 2×2 = 10 − 6 − 4 = 0 ✓

**Use KVL when:** You have voltage sources or need to find unknown voltages in a mesh.`,

  "kirchhoff's current law": `**Kirchhoff's Current Law (KCL)**

KCL states: *The algebraic sum of all currents entering a node equals zero.*  (Current in = Current out)

**Formula:** Σ I_in = Σ I_out   at any node

**Why it works:** Charge cannot accumulate at a node — conservation of charge.

**Example:**
  Node A: I₁ = 3 A entering, I₂ = 1 A leaving, I₃ = ?
  KCL:  3 = 1 + I₃   →   I₃ = **2 A** (leaving)

**Use KCL when:** Analysing parallel circuits or finding branch currents in complex networks.

**Together KVL + KCL** let you solve any linear circuit using mesh analysis or nodal analysis.`,

  "kirchhoff": `**Kirchhoff's Laws — Summary**

**KCL (Current Law):** At any node, Σ currents entering = Σ currents leaving.
  *Σ I = 0*   — based on conservation of charge.

**KVL (Voltage Law):** Around any closed loop, Σ voltage drops = Σ voltage rises.
  *Σ V = 0*   — based on conservation of energy.

**Application steps:**
1. Label all unknown currents (assume directions — a negative answer means direction is reversed)
2. Apply KCL at each node to get current equations
3. Apply KVL around each independent loop to get voltage equations
4. Solve the simultaneous equations

Both laws are the foundation of all circuit analysis — mesh analysis and nodal analysis both derive from them.`,

  "newton's first law": `**Newton's First Law — Law of Inertia**

*"An object remains at rest, or in uniform motion in a straight line, unless acted upon by a net external force."*

**Key concept — Inertia:** The tendency of an object to resist changes in its state of motion. Heavier (more massive) objects have more inertia.

**Implications:**
- A stationary book stays still until you push it.
- A moving hockey puck continues in a straight line until friction or a collision stops it.
- In space (no friction), a spacecraft keeps its velocity forever without engine thrust.

**Inertial reference frame:** Newton's first law defines what an inertial frame is — one where this law holds true. Rotating frames are non-inertial.`,

  "newton's second law": `**Newton's Second Law — Law of Acceleration**

*"The net force on an object equals its mass times its acceleration."*

**Formula:**  **F = m × a**

| Symbol | Quantity | Unit |
|--------|----------|------|
| F | Net force | Newton (N) |
| m | Mass | Kilogram (kg) |
| a | Acceleration | m/s² |

**Derived forms:**
- a = F / m   (larger force or smaller mass → greater acceleration)
- m = F / a

**Worked example:** A 5 kg block is pushed with 20 N.
  a = 20 / 5 = **4 m/s²**

**Impulse-momentum form:**  F = Δp / Δt  where p = mv (momentum)

**Important:** F is the *net* (resultant) force — the vector sum of ALL forces acting.`,

  "newton's third law": `**Newton's Third Law — Law of Action-Reaction**

*"For every action, there is an equal and opposite reaction."*

**Statement:** When object A exerts a force on object B, object B simultaneously exerts an equal and opposite force on object A.

**Key point:** The two forces act on *different objects* — they never cancel each other.

**Examples:**
- 🚀 **Rocket thrust:** Hot gases pushed backward → rocket pushed forward.
- 🏊 **Swimming:** Hand pushes water backward → water pushes swimmer forward.
- 🔫 **Gun recoil:** Bullet pushed forward → gun pushed backward.
- 🧱 **Standing on the floor:** Your weight pushes the floor down → floor's normal force pushes you up.

**Common misconception:** "Action-reaction pairs cancel out." They don't — they act on different bodies. The net force on *each body individually* depends only on forces acting *on that body*.`,

  "newton's law": `**Newton's Three Laws of Motion — Complete Summary**

**1st Law (Inertia):** An object stays at rest or in uniform motion unless a net external force acts on it.

**2nd Law (F = ma):**  Net force = mass × acceleration
  F = ma   →   a = F/m   →   Units: 1 N = 1 kg·m/s²

**3rd Law (Action-Reaction):** Every action has an equal and opposite reaction — acting on *different* objects.

**Newton's Law of Gravitation (bonus):**
  F = G·m₁·m₂ / r²
  G = 6.674 × 10⁻¹¹ N·m²/kg²

**On Earth:** g = 9.8 m/s²  → Weight W = mg

**How they connect:**
- 1st Law is a special case of 2nd Law when F_net = 0 (a = 0, constant velocity)
- 3rd Law explains *why* Newton's 2nd Law needs net force — paired reaction forces act on other bodies`,

  "coulomb's law": `**Coulomb's Law**

Coulomb's Law gives the electrostatic force between two point charges.

**Formula:**  F = k × |q₁ × q₂| / r²

| Symbol | Meaning | Value/Unit |
|--------|---------|------------|
| F | Electrostatic force | Newton (N) |
| k | Coulomb's constant | 8.99 × 10⁹ N·m²/C² |
| q₁, q₂ | Magnitudes of charges | Coulombs (C) |
| r | Distance between charges | metres (m) |

**Key facts:**
- Like charges (++ or −−) → repulsive force
- Unlike charges (+−) → attractive force
- Force is along the line joining the two charges (central force)
- Inverse-square law: double the distance → force drops to ¼

**Comparison with gravity:** Both are inverse-square laws, but electrostatic force can be attractive *or* repulsive, and is ~10³⁶ times stronger.`,

  "faraday's law": `**Faraday's Law of Electromagnetic Induction**

*"The induced EMF in a closed loop is equal to the negative rate of change of magnetic flux through the loop."*

**Formula:**  EMF = −N × ΔΦ / Δt

| Symbol | Meaning |
|--------|---------|
| EMF | Induced electromotive force (volts) |
| N | Number of turns in coil |
| ΔΦ | Change in magnetic flux (Wb = T·m²) |
| Δt | Time interval (s) |

**Lenz's Law (the negative sign):** The induced current opposes the change in flux that caused it — a consequence of energy conservation.

**Applications:**
- 🔌 Electrical generators (rotating coil in magnetic field)
- 🔄 Transformers (changing flux in primary induces EMF in secondary)
- 💳 Credit card readers (magnetic stripe read by changing flux)
- 🎸 Electric guitar pickups

**Magnetic flux:**  Φ = B × A × cos(θ)   where θ is angle between B and normal to area A`,

  "gauss's law": `**Gauss's Law**

*"The total electric flux through any closed surface equals the enclosed charge divided by ε₀."*

**Formula:**  Φ_E = Q_enclosed / ε₀

Where ε₀ = 8.85 × 10⁻¹² C²/(N·m²) is the permittivity of free space.

**Electric flux:** Φ_E = ∮ E · dA  (surface integral of E over a closed surface)

**Uses of Gauss's Law:**
- Find **E** for symmetric charge distributions (sphere, cylinder, infinite plane)
- For a point charge:  E = kq / r²  (recovering Coulomb's law)
- Inside a conductor: E = 0 (all charge resides on the surface)

**Gaussian surfaces:** Imaginary surfaces chosen for symmetry (sphere for point/spherical charges, cylinder for line charges, pillbox for planes).`,

  "ampere's law": `**Ampere's Law**

*"The line integral of the magnetic field around any closed path equals μ₀ times the total current enclosed."*

**Formula:**  ∮ B · dl = μ₀ × I_enclosed

μ₀ = 4π × 10⁻⁷ T·m/A  (permeability of free space)

**Extended (Maxwell's correction):**  ∮ B · dl = μ₀(I + ε₀ × dΦ_E/dt)
The extra term accounts for displacement current — crucial for electromagnetic waves.

**Applications:**
- Magnetic field of an infinite straight wire: B = μ₀I / (2πr)
- Field inside a solenoid: B = μ₀nI  (n = turns per metre)
- Field of a toroid: B = μ₀NI / (2πr)`,

  "hooke's law": `**Hooke's Law**

*"The force needed to extend or compress a spring is proportional to the displacement, provided the elastic limit is not exceeded."*

**Formula:**  F = −k × x

| Symbol | Meaning | Unit |
|--------|---------|------|
| F | Restoring force | Newton (N) |
| k | Spring constant (stiffness) | N/m |
| x | Displacement from equilibrium | metre (m) |

The negative sign shows the force opposes displacement (restoring force).

**Elastic potential energy:**  PE = ½kx²

**Simple Harmonic Motion (SHM):** Hooke's Law leads directly to SHM.
  Period:  T = 2π√(m/k)
  Frequency:  f = 1/(2π) × √(k/m)

**Elastic limit:** Hooke's Law only holds up to the elastic limit. Beyond it, the material undergoes plastic deformation and won't return to its original shape.`,

  "snell's law": `**Snell's Law (Law of Refraction)**

*"When light passes from one medium to another, the ratio of the sine of the angles of incidence and refraction equals the inverse ratio of the refractive indices."*

**Formula:**  n₁ sin(θ₁) = n₂ sin(θ₂)

| Symbol | Meaning |
|--------|---------|
| n₁, n₂ | Refractive indices of medium 1 and 2 |
| θ₁ | Angle of incidence (from normal) |
| θ₂ | Angle of refraction (from normal) |

**Refractive index:**  n = c / v  (speed of light in vacuum / speed in medium)
Air ≈ 1.0,  Water ≈ 1.33,  Glass ≈ 1.5,  Diamond ≈ 2.42

**Total Internal Reflection:** Occurs when light travels from denser to less dense medium and θ₁ > critical angle θ_c.
  sin(θ_c) = n₂/n₁

**Applications:** Optical fibres, lenses, prisms, mirages.`,

  "boyle's law": `**Boyle's Law**

*"At constant temperature, the pressure of a fixed amount of gas is inversely proportional to its volume."*

**Formula:**  P₁V₁ = P₂V₂   (at constant T and n)

Or:  P ∝ 1/V   →   PV = constant

**Example:** Gas at 2 atm occupies 3 L. If pressure doubles to 4 atm, new volume = (2 × 3)/4 = **1.5 L**

**Combined with Charles's Law →** Ideal Gas Law:  PV = nRT

R = 8.314 J/(mol·K),  n = moles,  T = temperature in Kelvin`,

  "ideal gas law": `**Ideal Gas Law**

**Formula:**  PV = nRT

| Symbol | Quantity | Unit |
|--------|----------|------|
| P | Pressure | Pascal (Pa) or atm |
| V | Volume | m³ or L |
| n | Amount of gas | moles (mol) |
| R | Universal gas constant | 8.314 J/(mol·K) |
| T | Absolute temperature | Kelvin (K) |

**Constituent laws it combines:**
- Boyle's Law: PV = const (constant T, n)
- Charles's Law: V/T = const (constant P, n)
- Avogadro's Law: V ∝ n (constant P, T)

**Standard conditions:** STP → T = 273 K (0°C), P = 1 atm → 1 mol occupies 22.4 L

**Real gases** deviate from ideal behaviour at high pressures and low temperatures — use van der Waals equation for corrections.`,

  "thermodynamics": `**Laws of Thermodynamics — Overview**

**Zeroth Law:** If A is in thermal equilibrium with B, and B with C, then A is in equilibrium with C. (Defines temperature.)

**First Law (Energy Conservation):**
  ΔU = Q − W
  Change in internal energy = Heat added to system − Work done by system

**Second Law (Entropy):**
  Entropy of an isolated system never decreases.  ΔS ≥ 0
  Heat flows spontaneously from hot to cold, never the reverse.
  No heat engine can be 100% efficient.

**Third Law:**
  As T → 0 K, entropy of a perfect crystal → 0.
  Absolute zero (0 K) is unattainable.

**Carnot Efficiency (maximum):**  η = 1 − T_cold / T_hot   (temperatures in Kelvin)

**State functions:** U (internal energy), H (enthalpy = U + PV), S (entropy), G (Gibbs free energy = H − TS)`,

  "entropy": `**Entropy (S)**

Entropy is a measure of the disorder or randomness of a system.

**Thermodynamic definition:**  dS = dQ_rev / T   (reversible heat transfer / temperature)
Units: J/K

**Statistical definition (Boltzmann):**  S = k_B × ln(W)
  k_B = 1.38 × 10⁻²³ J/K,   W = number of microstates

**Key principles:**
- Second Law: In any spontaneous process, total entropy of universe increases (ΔS_universe > 0)
- Reversible processes: ΔS_universe = 0
- Irreversible processes: ΔS_universe > 0

**Practical meaning:**
- Ice melting → more disorder → entropy increases
- Gas expanding into a vacuum → more microstates → entropy increases
- Mixing two gases → entropy increases

**Gibbs Free Energy:**  ΔG = ΔH − TΔS
  ΔG < 0 → reaction is spontaneous`,

  "momentum": `**Momentum and Impulse**

**Linear Momentum:**  p = m × v
Units: kg·m/s   (vector — same direction as velocity)

**Newton's 2nd Law in momentum form:**
  F_net = Δp / Δt   →   impulse = F × Δt = Δp

**Conservation of Momentum:**
In a closed system (no external forces): p_total = constant
  m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'

**Types of collisions:**
| Type | Momentum | Kinetic Energy |
|------|----------|----------------|
| Elastic | Conserved | Conserved |
| Inelastic | Conserved | NOT conserved |
| Perfectly inelastic | Conserved | Max KE lost (objects stick) |

**Angular momentum:**  L = I × ω   (conserved when net torque = 0)
  Example: figure skater pulling arms in → ω increases to keep L constant`,

  "kinetic energy": `**Kinetic Energy**

**Formula:**  KE = ½ × m × v²

Units: Joule (J) — scalar quantity

**Work-Energy Theorem:**  Net work done on an object = Change in KE
  W_net = ΔKE = ½mv₂² − ½mv₁²

**Relativistic KE (at high speeds):**  KE = (γ − 1)mc²
  γ = 1/√(1 − v²/c²)   (Lorentz factor)

**Rotational KE:**  KE_rot = ½Iω²
  I = moment of inertia,  ω = angular velocity`,

  "potential energy": `**Potential Energy (PE)**

**Gravitational PE:**  PE = mgh
  m = mass (kg),  g = 9.8 m/s²,  h = height above reference (m)

**Elastic PE (spring):**  PE = ½kx²
  k = spring constant,  x = compression/extension

**Conservation of Mechanical Energy** (no friction):
  KE + PE = constant
  ½mv₁² + mgh₁ = ½mv₂² + mgh₂

**Example — ball dropped from height h:**
  At top: PE = mgh, KE = 0
  At bottom: PE = 0, KE = mgh → v = √(2gh)`,

  "waves": `**Waves — Fundamentals**

**Types:**
- **Transverse:** Displacement ⊥ direction of propagation (light, water surface)
- **Longitudinal:** Displacement ∥ direction of propagation (sound, P-seismic waves)

**Key quantities:**
| Symbol | Quantity | Unit |
|--------|----------|------|
| λ (lambda) | Wavelength | metre (m) |
| f | Frequency | Hertz (Hz) |
| T | Period | second (s) |
| v | Wave speed | m/s |
| A | Amplitude | metre (m) |

**Wave equation:**  v = f × λ   and   T = 1/f

**Wave equation (PDE):**  ∂²y/∂t² = v² × ∂²y/∂x²

**Interference:**
- Constructive: path difference = nλ   → amplitude doubles
- Destructive: path difference = (n + ½)λ   → cancellation

**Sound speed in air:** ≈ 343 m/s at 20°C`,

  "quantum": `**Quantum Mechanics — Key Concepts**

**Wave-particle duality:** Light and matter exhibit both wave and particle properties.

**de Broglie wavelength:**  λ = h / (mv)   (h = 6.626 × 10⁻³⁴ J·s)

**Heisenberg Uncertainty Principle:**  Δx × Δp ≥ ℏ/2
  Cannot simultaneously know exact position and momentum.

**Photoelectric effect (Einstein):**  E = hf − φ
  φ = work function (minimum energy to eject electron)

**Energy levels in hydrogen:**  E_n = −13.6 / n²   eV   (n = 1, 2, 3, …)
  Photon emitted when electron drops:  E_photon = E_i − E_f

**Schrödinger equation:**  HΨ = EΨ
  Ψ = wave function,  |Ψ|² = probability density

**Spin:** Electrons have intrinsic angular momentum s = ½ ℏ
  Pauli Exclusion: no two electrons in the same quantum state`,

  // ══════════════ MATHEMATICS ══════════════
  "derivative": `**Derivatives (Differentiation)**

The derivative of f(x) gives the instantaneous rate of change, or slope of the tangent at any point.

**Definition:**  f'(x) = lim(h→0) [f(x+h) − f(x)] / h

**Key rules:**

| Rule | Formula |
|------|---------|
| Power rule | d/dx [xⁿ] = n·xⁿ⁻¹ |
| Constant | d/dx [c] = 0 |
| Sum | d/dx [f ± g] = f' ± g' |
| Product | d/dx [fg] = f'g + fg' |
| Quotient | d/dx [f/g] = (f'g − fg') / g² |
| Chain rule | d/dx [f(g(x))] = f'(g(x)) · g'(x) |

**Common derivatives:**
- d/dx [sin x] = cos x
- d/dx [cos x] = −sin x
- d/dx [eˣ] = eˣ
- d/dx [ln x] = 1/x
- d/dx [aˣ] = aˣ ln a

**Applications:** Finding maxima/minima (f'(x) = 0), velocity (dx/dt), acceleration (d²x/dt²).`,

  "differentiation": `**Differentiation — Complete Guide**

Differentiation finds the rate of change of a function.

**Standard derivatives:**
- xⁿ → nxⁿ⁻¹
- eˣ → eˣ
- ln x → 1/x
- sin x → cos x,  cos x → −sin x,  tan x → sec²x
- aˣ → aˣ ln a

**Product rule:**  (uv)' = u'v + uv'
**Quotient rule:**  (u/v)' = (u'v − uv') / v²
**Chain rule:**  dy/dx = dy/du × du/dx

**Implicit differentiation:** Differentiate both sides w.r.t. x, treating y as a function of x.

**Higher order derivatives:** f''(x) = d²f/dx² (second derivative → concavity, acceleration)

**Critical points:** f'(x) = 0 → potential max/min. Use f''(x) to classify:
  f'' > 0 → local minimum;  f'' < 0 → local maximum.`,

  "integration": `**Integration (Antiderivative & Area)**

Integration is the reverse of differentiation; it also calculates area under a curve.

**Indefinite integral:**  ∫ f(x) dx = F(x) + C   where F'(x) = f(x)

**Standard integrals:**
- ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C  (n ≠ −1)
- ∫ 1/x dx = ln|x| + C
- ∫ eˣ dx = eˣ + C
- ∫ sin x dx = −cos x + C
- ∫ cos x dx = sin x + C

**Definite integral:**  ∫ₐᵇ f(x) dx = F(b) − F(a)   (area between curve and x-axis)

**Techniques:**
- **Substitution:** let u = g(x)
- **Integration by parts:** ∫ u dv = uv − ∫ v du  (choose u = LIATE order)
- **Partial fractions:** for rational functions
- **Trigonometric substitution:** for √(a²−x²) etc.

**Fundamental Theorem of Calculus:** d/dx [∫ₐˣ f(t) dt] = f(x)`,

  "limit": `**Limits**

The limit of f(x) as x→a is the value f(x) approaches (not necessarily equals) as x gets closer to a.

**Notation:**  lim(x→a) f(x) = L

**Key limit laws:**
- lim [f ± g] = lim f ± lim g
- lim [fg] = (lim f)(lim g)
- lim [f/g] = (lim f)/(lim g)  if lim g ≠ 0

**Important limits:**
- lim(x→0) sin(x)/x = 1
- lim(x→∞) (1 + 1/n)ⁿ = e ≈ 2.718
- lim(x→0) (eˣ − 1)/x = 1

**L'Hôpital's Rule** (for 0/0 or ∞/∞ forms):
  lim f(x)/g(x) = lim f'(x)/g'(x)

**Continuity:** f is continuous at a if lim(x→a) f(x) = f(a)

**One-sided limits:** lim(x→a⁺) and lim(x→a⁻) must both equal L for the limit to exist.`,

  "matrix": `**Matrices**

A matrix is a rectangular array of numbers with m rows and n columns (m × n matrix).

**Operations:**
- **Addition/Subtraction:** Element-wise (matrices must be same size)
- **Scalar multiplication:** Multiply every element by the scalar
- **Matrix multiplication:** C = AB where C_ij = Σ A_ik × B_kj
  (A must be m×n, B must be n×p, result is m×p)

**Special matrices:**
- Identity I: diagonal = 1, rest = 0  →  AI = IA = A
- Zero matrix: all elements = 0
- Transpose Aᵀ: rows ↔ columns
- Symmetric: A = Aᵀ

**Determinant (2×2):**  det[a b; c d] = ad − bc
**Inverse (2×2):**  A⁻¹ = (1/det A) × [d −b; −c a]   (only if det A ≠ 0)

**Solving systems Ax = b:**  x = A⁻¹b  (or use Gaussian elimination)

**Rank:** Number of linearly independent rows (= number of linearly independent columns)`,

  "eigenvalue": `**Eigenvalues and Eigenvectors**

For a square matrix A, λ is an eigenvalue with eigenvector v if:
  **Av = λv**   (matrix times vector = scalar times same vector)

**Finding eigenvalues:**
Solve the characteristic equation:  det(A − λI) = 0

**Example (2×2):**
A = [3 1; 1 3]
det(A − λI) = (3−λ)² − 1 = 0  →  λ² − 6λ + 8 = 0  →  **λ = 4 or λ = 2**

**Finding eigenvectors:**
Substitute each λ into (A − λI)v = 0 and solve.

**Applications:**
- Principal Component Analysis (PCA) in ML
- Stability analysis of differential equations
- Quantum mechanics (observables)
- Google PageRank algorithm
- Vibration analysis in engineering

**Diagonalisation:**  A = PDP⁻¹  where D = diagonal matrix of eigenvalues, P = matrix of eigenvectors`,

  "probability": `**Probability — Fundamentals**

**Definition:**  P(A) = (favourable outcomes) / (total outcomes)   for equally likely events
  0 ≤ P(A) ≤ 1

**Complement:**  P(A') = 1 − P(A)

**Addition Rule:**
  P(A ∪ B) = P(A) + P(B) − P(A ∩ B)
  If mutually exclusive: P(A ∪ B) = P(A) + P(B)

**Multiplication Rule:**
  P(A ∩ B) = P(A) × P(B|A)
  If independent: P(A ∩ B) = P(A) × P(B)

**Conditional Probability:**  P(A|B) = P(A ∩ B) / P(B)

**Bayes' Theorem:**  P(A|B) = P(B|A) × P(A) / P(B)

**Distributions:**
- Binomial: discrete, n trials, probability p each  →  P(X=k) = C(n,k) × pᵏ × (1−p)ⁿ⁻ᵏ
- Poisson: rare events  →  P(X=k) = e⁻λ λᵏ / k!
- Normal: continuous, bell curve, characterised by μ and σ`,

  "bayes theorem": `**Bayes' Theorem**

Updates the probability of a hypothesis given new evidence.

**Formula:**  P(H|E) = P(E|H) × P(H) / P(E)

| Term | Meaning |
|------|---------|
| P(H|E) | Posterior — probability of H given evidence E |
| P(E|H) | Likelihood — probability of E if H is true |
| P(H) | Prior — initial probability of H |
| P(E) | Marginal — total probability of evidence |

**Law of total probability:**  P(E) = Σ P(E|Hᵢ) × P(Hᵢ)

**Classic example — Medical test:**
  Disease prevalence = 1% → P(D) = 0.01
  Test sensitivity = 99% → P(+|D) = 0.99
  False positive rate = 5% → P(+|no D) = 0.05

  P(D|+) = (0.99 × 0.01) / (0.99×0.01 + 0.05×0.99) ≈ **16.7%**

Despite 99% sensitivity, a positive test means only 16.7% chance of disease — base rate matters enormously.`,

  "standard deviation": `**Standard Deviation and Variance**

Measures how spread out data is around the mean.

**Population variance:**  σ² = Σ(xᵢ − μ)² / N
**Population SD:**  σ = √(Σ(xᵢ − μ)² / N)

**Sample variance:**  s² = Σ(xᵢ − x̄)² / (n − 1)   (use n−1 for unbiased estimate)
**Sample SD:**  s = √(s²)

**Empirical rule (Normal distribution):**
- μ ± σ contains ~68% of data
- μ ± 2σ contains ~95% of data
- μ ± 3σ contains ~99.7% of data

**Z-score:**  z = (x − μ) / σ   (how many SDs a value is from the mean)

**Coefficient of variation:**  CV = (σ/μ) × 100%   (relative spread)`,

  "trigonometry": `**Trigonometry — Essential Reference**

**SOH-CAH-TOA** (right triangle):
  sin θ = Opposite/Hypotenuse
  cos θ = Adjacent/Hypotenuse
  tan θ = Opposite/Adjacent

**Key identities:**
- sin²θ + cos²θ = 1  (Pythagorean)
- 1 + tan²θ = sec²θ
- 1 + cot²θ = csc²θ
- sin(2θ) = 2 sin θ cos θ
- cos(2θ) = cos²θ − sin²θ = 1 − 2sin²θ

**Values to memorise:**
| θ | 0° | 30° | 45° | 60° | 90° |
|---|----|----|-----|-----|-----|
| sin | 0 | ½ | √2/2 | √3/2 | 1 |
| cos | 1 | √3/2 | √2/2 | ½ | 0 |

**Laws for non-right triangles:**
- Sine rule: a/sin A = b/sin B = c/sin C
- Cosine rule: c² = a² + b² − 2ab cos C`,

  "pythagorean theorem": `**Pythagorean Theorem**

In a right triangle: **a² + b² = c²**
where c is the hypotenuse (longest side, opposite the right angle).

**Pythagorean triples (integer solutions):**
  3, 4, 5  |  5, 12, 13  |  8, 15, 17  |  7, 24, 25

**Proof idea:** Arrange four identical right triangles inside a square — two ways give a² + b² = c².

**Generalisation (Distance formula in 2D):**
  d = √[(x₂−x₁)² + (y₂−y₁)²]

**3D distance:**  d = √[(Δx)² + (Δy)² + (Δz)²]

**Connection to unit circle:**  cos²θ + sin²θ = 1 is the Pythagorean theorem on a circle of radius 1.`,

  "logarithm": `**Logarithms**

log_b(x) = y  means  bʸ = x  (log is the inverse of exponentiation)

**Common bases:**
- log₁₀(x) = log(x)  (common log)
- log_e(x) = ln(x)  (natural log, base e ≈ 2.718)
- log₂(x)  (binary log, used in CS)

**Laws:**
- log(AB) = log A + log B
- log(A/B) = log A − log B
- log(Aⁿ) = n log A
- log_b(b) = 1
- log_b(1) = 0
- Change of base: log_b(x) = ln(x)/ln(b)

**Derivative:**  d/dx [ln x] = 1/x
**Integral:**  ∫ (1/x) dx = ln|x| + C

**Applications:** pH = −log[H⁺], decibels dB = 10 log(P/P₀), Big O analysis.`,

  "fourier": `**Fourier Series and Transform**

**Fourier Series** decomposes a periodic function into sines and cosines:
  f(t) = a₀/2 + Σ [aₙ cos(nωt) + bₙ sin(nωt)]

where  aₙ = (2/T)∫₀ᵀ f(t) cos(nωt) dt,  bₙ = (2/T)∫₀ᵀ f(t) sin(nωt) dt

**Fourier Transform** (non-periodic signals):
  F(ω) = ∫₋∞^∞ f(t) e^{−jωt} dt

**Inverse:**  f(t) = (1/2π) ∫₋∞^∞ F(ω) e^{jωt} dω

**Key properties:**
- Linearity, time-shifting, frequency-shifting
- Convolution in time ↔ multiplication in frequency
- Parseval's theorem: energy is conserved

**Applications:** Signal processing, image compression (JPEG uses DCT), audio, solving PDEs`,

  "differential equation": `**Differential Equations**

A differential equation (DE) relates a function to its derivatives.

**Order:** Highest derivative present (1st, 2nd, …)
**Degree:** Power of the highest derivative

**1st Order ODE — Separable:**
  dy/dx = f(x)g(y)  →  ∫ dy/g(y) = ∫ f(x) dx

**1st Order ODE — Linear:**
  dy/dx + P(x)y = Q(x)
  Integrating factor: μ = e^{∫P dx}

**2nd Order ODE — Homogeneous with constant coefficients:**
  ay'' + by' + cy = 0
  Characteristic equation: ar² + br + c = 0
  - Two real roots r₁, r₂: y = C₁e^{r₁x} + C₂e^{r₂x}
  - Repeated root r: y = (C₁ + C₂x)e^{rx}
  - Complex roots α ± βi: y = e^{αx}(C₁cos βx + C₂sin βx)

**Applications:** Population growth, circuit analysis (RC, RLC), heat equation, wave equation`,

  "permutation": `**Permutations and Combinations**

**Permutation** — ordered arrangements of r items from n:
  P(n, r) = n! / (n−r)!

**Combination** — unordered selections of r items from n:
  C(n, r) = n! / [r!(n−r)!]   also written ⁿCᵣ or (n r)

**Memory trick:** "Permutation = Position matters, Combination = Choice only"

**Examples:**
- Arranging 3 books from 5: P(5,3) = 60
- Choosing a committee of 3 from 5: C(5,3) = 10

**Binomial Theorem:**  (a + b)ⁿ = Σ C(n,k) × aⁿ⁻ᵏ × bᵏ

**Pascal's Triangle:** C(n,k) = C(n−1,k−1) + C(n−1,k)`,

  // ══════════════ ELECTRONICS / BEE ══════════════
  "thevenin": `**Thévenin's Theorem**

*"Any linear two-terminal circuit can be replaced by a single voltage source V_th in series with a single resistance R_th."*

**Steps to find Thévenin equivalent:**
1. **Remove the load** (component across the terminals).
2. **Find V_th (open-circuit voltage):** Calculate the voltage across the open terminals using KVL/KCL/superposition.
3. **Find R_th (Thévenin resistance):**
   - If no dependent sources: deactivate all independent sources (voltage → short, current → open), find equivalent resistance looking into terminals.
   - If dependent sources present: apply a test voltage V_test, find resulting I_test → R_th = V_test/I_test.
4. **Reconnect load** to V_th − R_th series circuit.

**Use case:** Greatly simplifies analysis when multiple load values need to be tested on the same circuit.

**Relationship to Norton:** V_th = I_N × R_th   (Thévenin ↔ Norton by source transformation)`,

  "norton": `**Norton's Theorem**

*"Any linear two-terminal circuit can be replaced by a current source I_N in parallel with a resistance R_N."*

**Steps:**
1. Remove the load.
2. **Find I_N (short-circuit current):** Short the output terminals and find the current through the short.
3. **Find R_N:** Same procedure as R_th — deactivate sources and find equivalent resistance.
4. Reconnect load in parallel with I_N ∥ R_N.

**Relationship to Thévenin:**
  R_N = R_th
  I_N = V_th / R_th

**Source transformation:** Convert between Thévenin and Norton freely to simplify circuit analysis.`,

  "superposition": `**Superposition Theorem**

*"In a linear circuit with multiple independent sources, the response (voltage or current) at any element is the sum of the responses caused by each source acting alone."*

**Procedure:**
1. Consider ONE independent source at a time.
2. **Deactivate** all other sources:
   - Voltage source → replace with **short circuit** (0 V)
   - Current source → replace with **open circuit** (0 A)
3. Calculate the response (V or I) due to that single source.
4. **Algebraically add** all individual responses.

**Important:** Superposition works for linear circuits only — cannot use for power (P = I²R is nonlinear).

**Dependent sources are NEVER deactivated** — they stay active throughout.`,

  "thevenin's theorem": `**Thévenin's Theorem** — see "thevenin" entry above for full details.

Quick reference:
- Replace complex circuit with: **V_th (voltage source) in series with R_th**
- V_th = open-circuit voltage at terminals
- R_th = resistance seen at terminals with all independent sources deactivated`,

  "op-amp": `**Operational Amplifier (Op-Amp)**

An op-amp is a high-gain differential voltage amplifier. Ideal op-amp assumptions:
- Infinite open-loop gain (A → ∞)
- Infinite input impedance (no current into inputs)
- Zero output impedance
- Infinite bandwidth

**Virtual short:** With negative feedback, V⁺ ≈ V⁻ (inverting ≈ non-inverting input)

**Key configurations:**

| Config | Gain | Formula |
|--------|------|---------|
| Inverting | −R_f/R_in | V_out = −(Rf/Rin) × V_in |
| Non-inverting | 1 + Rf/Rin | V_out = (1 + Rf/Rin) × V_in |
| Voltage follower | 1 | V_out = V_in (buffer) |
| Summing amp | − | V_out = −Rf(V₁/R₁ + V₂/R₂ + …) |
| Differentiator | − | V_out = −RC × dV_in/dt |
| Integrator | − | V_out = −(1/RC)∫V_in dt |

**Slew rate:** Maximum rate of output change (V/μs). Limits high-frequency response.`,

  "operational amplifier": `**Operational Amplifier (Op-Amp)** — full details under "op-amp" entry.

Quick summary:
- Differential amplifier with very high gain
- Key rule with feedback: V⁺ = V⁻ (virtual short), I_in ≈ 0
- Inverting amp: Gain = −Rf/Rin
- Non-inverting amp: Gain = 1 + Rf/Rin`,

  "transistor": `**Transistors — BJT and MOSFET**

**BJT (Bipolar Junction Transistor):**
- Types: NPN, PNP
- Three terminals: Base (B), Collector (C), Emitter (E)
- Current-controlled device: I_C = β × I_B   (β = current gain, typically 50–300)
- Operating regions: Cutoff (off), Active (amplifier), Saturation (switch on)

**BJT as switch:**
  Cutoff: V_BE < 0.7 V → transistor OFF
  Saturation: large I_B → transistor fully ON, V_CE ≈ 0.2 V

**MOSFET (Field-Effect Transistor):**
- Types: N-channel, P-channel (enhancement or depletion)
- Three terminals: Gate (G), Drain (D), Source (S)
- Voltage-controlled device: Gate voltage controls drain current
- V_GS > V_th (threshold) → channel forms → current flows

**Advantages of MOSFET over BJT:**
- Much higher input impedance (virtually no gate current)
- Lower power consumption
- Better for digital circuits and high-frequency applications
- Used in all modern CMOS logic`,

  "diode": `**Diode**

A diode is a semiconductor device that allows current to flow in only one direction.

**Symbol:** Anode (A) →|← Cathode (K)   (current flows A to K)

**V-I characteristics:**
- **Forward bias** (V > 0.7 V for Si): conducts, acts as ~0.7 V drop
- **Reverse bias** (V < 0): blocks current (very small leakage)
- **Breakdown** (V < −V_BR): conducts in reverse — destructive for normal diodes

**Types:**
| Type | Use |
|------|-----|
| Rectifier diode | AC to DC conversion |
| Zener diode | Voltage regulation (reverse breakdown) |
| LED | Light emission |
| Schottky diode | Fast switching, low V_f (~0.3 V) |
| Photodiode | Light detection |
| Varactor | Variable capacitor (voltage-tuned) |

**Shockley equation:**  I = I₀(e^{V/nV_T} − 1)   where V_T = kT/q ≈ 26 mV at 25°C`,

  "zener diode": `**Zener Diode**

A Zener diode is designed to operate in reverse breakdown, maintaining a stable voltage across its terminals.

**Symbol:** Same as diode but with bent cathode bar.

**Operation:**
- Forward bias: behaves like normal diode (~0.7 V drop)
- Reverse bias: blocks until reaching V_Z (zener voltage)
- At V_Z: conducts in reverse, maintaining constant V_Z regardless of current

**Voltage regulator circuit:**
  V_in (higher voltage) → R_series → Zener ∥ Load
  V_out = V_Z (regulated)
  R = (V_in − V_Z) / I_total

**Key specs:** V_Z (zener voltage, e.g. 5.1 V), I_Z (operating current), P_Z_max (power rating)

**Applications:** Voltage reference, over-voltage protection, level shifting.`,

  "rectifier": `**Rectifiers — AC to DC Conversion**

**Half-wave rectifier:** One diode — passes only positive half-cycle.
  V_out_avg = V_peak / π ≈ 0.318 × V_peak
  Ripple frequency = supply frequency (50/60 Hz)

**Full-wave rectifier (centre-tap):** Two diodes + centre-tapped transformer.
  V_out_avg = 2V_peak / π ≈ 0.636 × V_peak

**Bridge rectifier (full-wave):** Four diodes in H-bridge — most common.
  V_out_avg = 2V_peak / π   (two diode drops: V_out_peak = V_peak − 1.4 V)
  Ripple frequency = 2 × supply frequency

**Smoothing filter:** Capacitor C in parallel with load reduces ripple.
  Ripple voltage ≈ V_peak / (f × R_L × C)

**Voltage regulator (after rectifier):** Zener diode or IC (LM7805 etc.) to stabilise output.`,

  "capacitor": `**Capacitor**

A capacitor stores energy in an electric field between two conducting plates separated by an insulator (dielectric).

**Capacitance:**  C = Q / V = ε₀εᵣA / d
  Units: Farad (F);  C = ε₀εᵣA/d  (ε₀ = 8.85×10⁻¹² F/m)

**Energy stored:**  E = ½CV²

**Current-voltage relationship:**  i = C × dv/dt   (capacitor opposes sudden voltage change)

**Impedance (AC):**  Z_C = 1/(jωC)   → at DC (ω=0): open circuit; at high f: short circuit

**Charging (RC circuit):**  v(t) = V_s(1 − e^{−t/τ})   τ = RC (time constant)

**Series:**  1/C_total = 1/C₁ + 1/C₂ + …
**Parallel:**  C_total = C₁ + C₂ + …   (capacitances add)

**Types:** Ceramic, electrolytic (polarised), film, tantalum. Electrolytic = large capacitance, must observe polarity.`,

  "inductor": `**Inductor**

An inductor stores energy in a magnetic field. It opposes changes in current.

**Inductance:**  L = NΦ / I   (N = turns, Φ = flux per turn)
  Units: Henry (H)

**Energy stored:**  E = ½LI²

**Voltage-current relationship:**  v = L × di/dt   (opposes sudden current change)

**Impedance (AC):**  Z_L = jωL   → at DC: short circuit; at high f: open circuit

**RL circuit response:**  i(t) = (V/R)(1 − e^{−Rt/L})   τ = L/R

**Series:**  L_total = L₁ + L₂ + …
**Parallel:**  1/L_total = 1/L₁ + 1/L₂ + …

**Resonance (LC/RLC):**  ω₀ = 1/√(LC)   f₀ = 1/(2π√(LC))`,

  "rc circuit": `**RC Circuit Analysis**

An RC circuit contains a resistor (R) and capacitor (C).

**Time constant:**  τ = RC   (units: seconds)

**Charging (capacitor from 0 to V_s):**
  v_C(t) = V_s(1 − e^{−t/RC})
  i(t) = (V_s/R) × e^{−t/RC}
  At t = τ: v_C ≈ 0.632 V_s (63.2% charged)
  At t = 5τ: fully charged (99.3%)

**Discharging (from V₀ to 0):**
  v_C(t) = V₀ × e^{−t/RC}
  At t = τ: v_C ≈ 0.368 V₀ (36.8% remaining)

**AC frequency response:**
  Cutoff frequency: f_c = 1/(2πRC)
  At f_c: output = V_in/√2 (−3 dB point)

**Low-pass filter:** Take output across C → passes low frequencies, blocks high
**High-pass filter:** Take output across R → passes high frequencies, blocks low`,

  "rlc circuit": `**RLC Circuit**

Contains resistance R, inductance L, and capacitance C.

**Resonant frequency:**  ω₀ = 1/√(LC)   →   f₀ = 1/(2π√(LC))

**Quality factor:**  Q = ω₀L/R = 1/(ω₀CR) = (1/R)√(L/C)
  High Q → sharp resonance (selective), Low Q → broad resonance

**Series RLC — impedance:**  Z = R + j(ωL − 1/ωC)
  At resonance: Z = R (purely resistive, minimum impedance in series)

**Parallel RLC:**
  At resonance: maximum impedance

**Damping:**
  α = R/(2L)   (series RLC)
  ω_d = √(ω₀² − α²)   (damped natural frequency)
  - Overdamped: α > ω₀   (slow exponential return)
  - Critically damped: α = ω₀ (fastest return without oscillation)
  - Underdamped: α < ω₀ (oscillatory decay)`,

  "logic gate": `**Logic Gates**

Logic gates are the building blocks of digital circuits.

| Gate | Symbol | Function | Truth table summary |
|------|--------|----------|-------------------|
| AND | A·B | Output 1 only if ALL inputs are 1 | 1·1=1, else 0 |
| OR | A+B | Output 1 if ANY input is 1 | 0+0=0, else 1 |
| NOT | Ā | Inverts input | 0→1, 1→0 |
| NAND | ¬(A·B) | AND then NOT | universal gate |
| NOR | ¬(A+B) | OR then NOT | universal gate |
| XOR | A⊕B | Output 1 if inputs DIFFER | 0⊕1=1, 1⊕1=0 |
| XNOR | ¬(A⊕B) | Output 1 if inputs are SAME | 0⊕0=1, 1⊕0=0 |

**Universal gates:** NAND and NOR can each implement any Boolean function.

**De Morgan's Theorems:**
  ¬(A·B) = Ā + B̄   →   NAND = OR with inverted inputs
  ¬(A+B) = Ā · B̄   →   NOR = AND with inverted inputs`,

  "boolean algebra": `**Boolean Algebra**

Boolean algebra deals with binary variables (0 and 1) using logical operations.

**Basic operations:** AND (·), OR (+), NOT (¯)

**Laws:**
- Identity: A+0=A, A·1=A
- Null: A+1=1, A·0=0
- Idempotent: A+A=A, A·A=A
- Complement: A+Ā=1, A·Ā=0
- Double negation: Ā̄=A
- Commutative: A+B=B+A, A·B=B·A
- Associative: A+(B+C)=(A+B)+C
- Distributive: A·(B+C)=A·B+A·C
- **Absorption:** A+A·B=A, A·(A+B)=A
- **De Morgan's:** ¬(A·B)=Ā+B̄  and  ¬(A+B)=Ā·B̄

**Minimisation methods:**
- **K-map (Karnaugh map):** Visual grouping of 1s to simplify SOP/POS expressions
- **Quine-McCluskey:** Tabular method for more variables`,

  "semiconductor": `**Semiconductors**

Semiconductors have conductivity between conductors and insulators, controllable by doping.

**Intrinsic semiconductors:** Pure Si or Ge — equal electrons and holes.
  n = p = nᵢ   (intrinsic carrier concentration, ~1.5×10¹⁰/cm³ for Si at 300 K)

**Doping:**
- **N-type:** Add pentavalent atoms (P, As, Sb) → excess electrons → electrons are majority carriers
- **P-type:** Add trivalent atoms (B, Al, Ga) → excess holes → holes are majority carriers

**P-N junction:** When P and N regions contact, diffusion creates a depletion region (no free carriers) and built-in potential V_bi ≈ 0.7 V for Si.

**Forward bias:** Reduces barrier → current flows
**Reverse bias:** Increases barrier → very little current (reverse saturation current I₀)

**Applications:** Diodes, transistors, solar cells, LEDs, integrated circuits.`,

  "transformer": `**Transformer**

A transformer transfers AC electrical energy between circuits via electromagnetic induction, changing voltage/current levels.

**Turns ratio:**  N_s/N_p = V_s/V_p = I_p/I_s

**Step-up:** N_s > N_p → higher secondary voltage (lower current)
**Step-down:** N_s < N_p → lower secondary voltage (higher current)

**Ideal transformer (100% efficiency):**
  P_primary = P_secondary   →   V_p × I_p = V_s × I_s

**Example:** 230 V primary, 10:1 step-down, 1 A load.
  V_s = 230/10 = **23 V**,   I_p = 1/10 = **0.1 A**

**Impedance transformation:**  Z_primary = (N_p/N_s)² × Z_load

**Real transformer losses:** Core losses (hysteresis, eddy current) + copper losses (I²R in windings)

**Applications:** Power distribution, phone chargers, audio coupling, isolation.`,

  // ══════════════ CS / PROGRAMMING ══════════════
  "oop": `**Object-Oriented Programming (OOP)**

OOP organises code around *objects* — bundles of data (attributes) and behaviour (methods).

**Four pillars:**

**1. Encapsulation**
Bundle data and methods together; hide internal details.
  Private fields accessible only through public getters/setters. Prevents invalid state.

**2. Inheritance**
A child class inherits attributes and methods from a parent class.
  class Dog extends Animal { … }  →  Dog gets all Animal behaviour + can add/override.

**3. Polymorphism**
The same method name behaves differently for different types.
  method overriding (runtime) vs method overloading (compile-time)
  animal.speak() → Dog says "Woof", Cat says "Meow"

**4. Abstraction**
Expose only essential features; hide implementation complexity.
  Abstract classes and interfaces define contracts.

**Other key concepts:**
- **Class vs Object:** Class = blueprint, Object = instance
- **Constructor:** Special method called on object creation
- **Static members:** Belong to the class, not instances
- **Interface:** Pure contract — defines what, not how`,

  "recursion": `**Recursion**

A function is recursive when it calls itself to solve a smaller version of the same problem.

**Two essential parts:**
1. **Base case:** Condition to stop recursion (prevents infinite loop)
2. **Recursive case:** Problem reduced toward base case

**Classic example — Factorial:**
\`\`\`
factorial(n):
  if n == 0: return 1        // base case
  return n * factorial(n-1)  // recursive case
\`\`\`

**Fibonacci:**
\`\`\`
fib(n):
  if n <= 1: return n
  return fib(n-1) + fib(n-2)
\`\`\`
(Use memoisation to avoid O(2ⁿ) — stores results to avoid re-computation)

**Call stack:** Each recursive call adds a stack frame. Deep recursion → stack overflow.

**Tail recursion:** Recursive call is the last operation → compilers can optimise to use O(1) stack space.

**When to use recursion:** Tree/graph traversal, divide and conquer (merge sort, quick sort), backtracking (N-queens, maze solving), parsing.`,

  "pointer": `**Pointers (C/C++)**

A pointer is a variable that stores the memory address of another variable.

**Declaration:**  int *ptr;   (ptr is a pointer to int)
**Address-of:**  ptr = &x;   (ptr holds the address of x)
**Dereference:**  *ptr       (access the value at the address stored in ptr)

**Example:**
\`\`\`c
int x = 10;
int *ptr = &x;
printf("%d", *ptr);  // prints 10
*ptr = 20;           // x is now 20
\`\`\`

**Pointer arithmetic:**
  ptr++  advances by sizeof(int) bytes, not 1 byte.

**Arrays and pointers:** Array name is a pointer to the first element.
  arr[i]  ≡  *(arr + i)

**Null pointer:**  int *ptr = NULL;  — safe default; dereferencing NULL causes crash.

**Double pointer:**  int **pptr;  — pointer to a pointer (used for 2D arrays, modifying pointers in functions)

**Common bugs:** Dangling pointers (after free), memory leaks (no free), buffer overflows.`,

  "dynamic programming": `**Dynamic Programming (DP)**

DP solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.

**Two hallmarks:**
1. Optimal substructure — optimal solution built from optimal sub-solutions
2. Overlapping subproblems — same subproblem solved multiple times

**Two approaches:**
- **Top-down (memoisation):** Recursive + cache results in hash map
- **Bottom-up (tabulation):** Iterative, fill a DP table in order

**DP template:**
1. Define dp[i] — what does it represent?
2. Base cases (dp[0], dp[1])
3. Recurrence relation
4. Answer location in table

**Classic problems:**
| Problem | Recurrence | Complexity |
|---------|-----------|-----------|
| Fibonacci | dp[n] = dp[n-1] + dp[n-2] | O(n) |
| 0/1 Knapsack | dp[i][w] = max(dp[i-1][w], val[i]+dp[i-1][w-wt[i]]) | O(nW) |
| LCS | dp[i][j] = dp[i-1][j-1]+1 if match, else max(dp[i-1][j],dp[i][j-1]) | O(mn) |
| Coin Change | dp[a] = min(dp[a-coin]+1) for each coin | O(amount×coins) |`,

  "graph algorithm": `**Graph Algorithms**

**BFS (Breadth-First Search)**
- Use: shortest path in unweighted graphs, level-order traversal
- Data structure: Queue | Time: O(V + E)

**DFS (Depth-First Search)**
- Use: cycle detection, topological sort, connected components
- Data structure: Stack/recursion | Time: O(V + E)

**Dijkstra's** — shortest path, non-negative weights
  Priority queue, O((V+E) log V)

**Bellman-Ford** — handles negative weights, detects negative cycles
  O(V × E)

**Floyd-Warshall** — all-pairs shortest path
  O(V³)

**Minimum Spanning Tree:**
- **Prim's:** Greedy, add cheapest edge connecting new vertex — O(E log V)
- **Kruskal's:** Sort edges, add if no cycle (union-find) — O(E log E)

**Topological Sort:** DFS-based, for DAGs — ordering of tasks with dependencies`,

  "sorting algorithm": `**Sorting Algorithms**

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Selection Sort | O(n²) | O(n²) | O(n²) | O(1) | ❌ |
| Insertion Sort | O(n) | O(n²) | O(n²) | O(1) | ✅ |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | ✅ |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | ❌ |
| Heap Sort | O(n log n) | O(n log n) | O(n log n) | O(1) | ❌ |

**When to choose:**
- Nearly sorted → Insertion Sort (O(n) best case)
- Guaranteed O(n log n) worst-case → Merge Sort
- In-place + fast average → Quick Sort (randomised pivot)
- Need O(1) space + O(n log n) → Heap Sort`,

  "operating system": `**Operating System — Key Concepts**

An OS manages hardware resources and provides services to application programs.

**Process vs Thread:**
- Process: independent program with its own memory space
- Thread: lightweight unit within a process, shares memory — faster context switch

**Process states:** New → Ready → Running → Waiting → Terminated

**CPU Scheduling algorithms:**
- FCFS (First-Come First-Served) — simple, convoy effect
- SJF (Shortest Job First) — optimal average waiting time
- Round Robin — preemptive, fair time slices
- Priority scheduling — risk of starvation (use aging)

**Memory management:**
- Paging: divide memory into fixed-size frames
- Segmentation: logical division (code, stack, heap)
- Virtual memory: uses disk as extended RAM; page faults trigger swaps

**Deadlock — 4 conditions (Coffman):**
1. Mutual exclusion  2. Hold & Wait  3. No preemption  4. Circular wait

**Deadlock handling:** Prevention, Avoidance (Banker's algorithm), Detection & Recovery, Ignore (ostrich algorithm)`,

  "deadlock": `**Deadlock**

A deadlock occurs when two or more processes are stuck, each waiting for a resource held by another, creating a cycle.

**Four necessary conditions (all must hold):**
1. **Mutual exclusion:** Resources can't be shared
2. **Hold and wait:** Process holds resource while waiting for another
3. **No preemption:** Resources can't be forcibly taken
4. **Circular wait:** P1 waits for P2, P2 waits for P3, … Pn waits for P1

**Handling strategies:**
- **Prevention:** Eliminate one Coffman condition (e.g., request all resources at once)
- **Avoidance:** Banker's algorithm — only allocate if system stays in safe state
- **Detection + Recovery:** Allow deadlock, detect cycle in resource allocation graph, kill/rollback processes
- **Ignore (Ostrich):** Used in most OSes — deadlocks are rare, easier to reboot

**Resource allocation graph:** Circles = processes, squares = resources. Cycle = deadlock (for single-instance resources).`,

  "process scheduling": `**CPU Process Scheduling**

**Goals:** Maximise CPU utilisation, throughput; minimise waiting time, turnaround time, response time.

**Non-preemptive:** Process runs until it voluntarily yields (I/O or completion).
**Preemptive:** OS can interrupt running process to schedule another.

**Algorithms:**
| Algorithm | Type | Key feature |
|-----------|------|-------------|
| FCFS | Non-preemptive | Simple, convoy effect |
| SJF | Non-preemptive | Min avg waiting, needs burst time prediction |
| SRTF | Preemptive | Shortest remaining time first |
| Round Robin | Preemptive | Time quantum q; good response time |
| Priority | Both | Higher priority runs first; starvation risk |
| Multilevel Queue | — | Separate queues for different process types |

**Metrics:**
- Turnaround time = Completion − Arrival
- Waiting time = Turnaround − Burst
- Response time = First run − Arrival`,

  "virtual memory": `**Virtual Memory**

Virtual memory allows processes to use more memory than physically available by using disk as an extension of RAM.

**Key concepts:**
- **Virtual address space:** Each process sees its own large private address space
- **Physical address:** Actual RAM location
- **MMU (Memory Management Unit):** Translates virtual → physical addresses

**Paging:**
  Memory divided into fixed-size pages (typically 4 KB)
  Page table maps virtual page numbers to physical frame numbers

**Page fault:** Accessing a page not in RAM → OS loads it from disk (swap space)
  Minor page fault: page in memory but not mapped
  Major page fault: page must be read from disk (slow — milliseconds)

**Page replacement algorithms:**
- FIFO: Replace oldest page (simple, Belady's anomaly)
- LRU: Replace least recently used (good approximation of optimal)
- Optimal: Replace page used furthest in future (theoretical best)

**Thrashing:** Excessive page faults — process spends more time swapping than executing. Fix: reduce multiprogramming or increase RAM.`,

  "tcp ip": `**TCP/IP Networking**

**TCP/IP Model (4 layers):**
1. **Application** — HTTP, FTP, DNS, SMTP
2. **Transport** — TCP, UDP
3. **Internet** — IP, ICMP, ARP
4. **Network Access** — Ethernet, Wi-Fi

**TCP vs UDP:**
| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented | Connectionless |
| Reliability | Guaranteed delivery | Best-effort |
| Order | In-order delivery | No ordering |
| Speed | Slower (overhead) | Faster |
| Use case | HTTP, email, file transfer | Video streaming, DNS, gaming |

**IP Addressing:**
- IPv4: 32-bit (e.g. 192.168.1.1), written in dotted decimal
- Subnet mask: defines network vs host portion
- CIDR: 192.168.1.0/24 means 24 bits for network

**TCP 3-way handshake:** SYN → SYN-ACK → ACK

**HTTP status codes:** 200 OK, 301 Redirect, 404 Not Found, 500 Server Error`,

  // ══════════════ SOFTWARE ENGINEERING ══════════════
  "sdlc": `**Software Development Life Cycle (SDLC)**

The SDLC defines the process for planning, creating, testing, and deploying software.

**Phases:**
1. **Requirements** — Gather and document what the software must do (functional & non-functional)
2. **System Design** — Architecture, database schema, UI mockups, technology choices
3. **Implementation** — Actual coding following design specs
4. **Testing** — Unit, integration, system, acceptance testing
5. **Deployment** — Release to production environment
6. **Maintenance** — Bug fixes, updates, enhancements

**Popular SDLC Models:**

| Model | Best for | Key trait |
|-------|----------|-----------|
| Waterfall | Fixed requirements | Sequential, no going back |
| Agile | Changing requirements | Iterative sprints |
| Spiral | High-risk projects | Risk analysis each cycle |
| V-Model | Safety-critical | Testing paired with each phase |
| RAD | Prototyping | Fast delivery |

**Agile Manifesto values:** Individuals > processes | Working software > documentation | Customer collaboration > negotiation | Responding to change > following a plan`,

  "waterfall model": `**Waterfall Model**

The Waterfall model is a sequential SDLC where each phase must complete before the next begins.

**Phases (in order):**
1. Requirements → 2. Design → 3. Implementation → 4. Testing → 5. Deployment → 6. Maintenance

**Advantages:**
- Simple and easy to understand
- Well-documented milestones
- Works well for small, well-defined projects
- Easy to manage due to rigidity

**Disadvantages:**
- No working software until late in the cycle
- Poor for changing requirements
- Testing only after build is complete — late bug discovery is expensive
- High risk if requirements were misunderstood

**When to use:**
- Requirements are fixed and well-understood
- Short-duration projects
- Technology is stable
- Resources available with required expertise

**Compare:** Waterfall is plan-driven; Agile is change-driven. Agile fixes time/resources and adjusts scope; Waterfall fixes scope and adjusts time.`,

  "agile": `**Agile Methodology**

Agile is an iterative approach to software development — deliver working software in short cycles and adapt to change.

**Core values (Agile Manifesto):**
1. Individuals and interactions > processes and tools
2. Working software > comprehensive documentation
3. Customer collaboration > contract negotiation
4. Responding to change > following a plan

**Agile frameworks:**
- **Scrum:** Sprints (1–4 weeks), defined roles, ceremonies
- **Kanban:** Visual workflow, continuous delivery, WIP limits
- **SAFe:** Scaled Agile for enterprises
- **XP (Extreme Programming):** Engineering practices (TDD, pair programming, CI)

**Scrum events:**
- Sprint Planning: define sprint goal and backlog
- Daily Standup: 15-min sync (what I did, what I'll do, blockers)
- Sprint Review: demo to stakeholders
- Retrospective: team reflects and improves process

**Key terms:** User story, backlog, velocity, burndown chart, epic, spike`,

  "software testing": `**Software Testing — Types and Levels**

**Testing levels:**
| Level | What is tested | Who tests |
|-------|---------------|-----------|
| Unit testing | Individual functions/methods | Developer |
| Integration testing | Interaction between modules | Developer/QA |
| System testing | Complete integrated system | QA team |
| Acceptance testing (UAT) | Business requirements | Client/End users |

**Testing types:**
- **Functional:** Does it do what it should? (black-box)
- **Non-functional:** Performance, security, usability, reliability
- **Regression:** Does new code break existing features?
- **Smoke testing:** Basic check — does it start and run?
- **Exploratory:** Unscripted, find unexpected issues

**Black-box vs White-box:**
- Black-box: Test from user perspective, no knowledge of code
- White-box (glass-box): Test internal logic, code paths, branches

**TDD (Test-Driven Development):**
  Write test → See it fail → Write minimal code → Pass test → Refactor
  (Red → Green → Refactor)

**Code coverage:** % of code executed by tests. 80%+ is a common target.`,

  "design pattern": `**Software Design Patterns**

Design patterns are reusable solutions to commonly occurring software design problems.

**Creational Patterns** (object creation)
- **Singleton:** One instance, global access. Use carefully — hidden coupling.
- **Factory Method:** Subclasses decide what to create.
- **Abstract Factory:** Family of related objects without specifying concrete classes.
- **Builder:** Construct complex objects step-by-step.
- **Prototype:** Clone existing objects.

**Structural Patterns** (object composition)
- **Adapter:** Convert interface of a class to what client expects.
- **Decorator:** Add behaviour to objects at runtime without subclassing.
- **Facade:** Simple interface to a complex subsystem.
- **Proxy:** Placeholder for another object (lazy loading, access control).

**Behavioural Patterns** (object interaction)
- **Observer:** Publisher-subscriber; notify all dependents on state change.
- **Strategy:** Swap algorithms at runtime without changing the client.
- **Command:** Encapsulate a request as an object (supports undo/redo).
- **Iterator:** Sequential access to collection without exposing internals.
- **Template Method:** Define skeleton of algorithm in base class, defer steps to subclasses.`,

  "uml": `**UML (Unified Modeling Language)**

UML provides a standard way to visualise software system design.

**Structural diagrams (static view):**
- **Class diagram:** Classes, attributes, methods, and relationships (association, inheritance, composition, aggregation)
- **Component diagram:** High-level modules and their interfaces
- **Deployment diagram:** Physical hardware and software deployment

**Behavioural diagrams (dynamic view):**
- **Use case diagram:** System functionality from user's perspective (actors + use cases)
- **Sequence diagram:** Messages between objects over time (vertical = time, horizontal = objects)
- **Activity diagram:** Workflow, like a flowchart with fork/join for parallel flows
- **State machine diagram:** States an object can be in and transitions between them

**Class diagram relationships:**
- Association: A uses B (solid line)
- Inheritance: A extends B (hollow triangle arrowhead)
- Composition: A owns B, B can't exist without A (filled diamond)
- Aggregation: A has B, B can exist independently (hollow diamond)
- Dependency: A uses B temporarily (dashed arrow)`,

  "solid principles": `**SOLID Principles**

Five design principles for writing maintainable, scalable OOP code.

**S — Single Responsibility Principle**
A class should have only one reason to change — one job, one responsibility.
*Bad:* User class handles authentication, email sending, and database queries.
*Good:* Split into User, AuthService, EmailService, UserRepository.

**O — Open/Closed Principle**
Open for extension, closed for modification. Add new functionality by adding code, not changing existing code.
*Solution:* Use interfaces, abstract classes, inheritance.

**L — Liskov Substitution Principle**
Subclasses must be substitutable for their base classes without breaking the program.
*Bad:* Square overriding Rectangle's setWidth breaks the area contract.

**I — Interface Segregation Principle**
Don't force clients to depend on methods they don't use. Create focused, specific interfaces.
*Bad:* One Fat interface with 20 methods. *Good:* Multiple small interfaces.

**D — Dependency Inversion Principle**
High-level modules should not depend on low-level modules. Both should depend on abstractions.
*Solution:* Depend on interfaces, not concrete classes. Use dependency injection.`,

  // ══════════════ CHEMISTRY ══════════════
  "chemical bonding": `**Chemical Bonding**

Chemical bonds hold atoms together in compounds by sharing or transferring electrons.

**Ionic bonding:**
- Transfer of electrons from metal to non-metal
- Forms positive cation + negative anion
- Electrostatic attraction holds them together
- High melting points, conduct electricity when dissolved/melted
- Example: NaCl (Na⁺ and Cl⁻)

**Covalent bonding:**
- Sharing of electrons between non-metals
- Single bond: 2 electrons shared; Double: 4; Triple: 6
- Can be polar (unequal sharing) or non-polar (equal)
- Example: H₂O (polar), H₂ (non-polar)

**Metallic bonding:**
- Positive metal ions in a "sea of delocalised electrons"
- Explains conductivity, malleability, ductility, lustre

**Bond polarity:** Determined by electronegativity difference.
  Δ > 1.7 → ionic;  0.4–1.7 → polar covalent;  < 0.4 → non-polar covalent`,

  "acid base": `**Acid-Base Chemistry**

**Arrhenius definition:**
- Acid: releases H⁺ in water (e.g., HCl → H⁺ + Cl⁻)
- Base: releases OH⁻ in water (e.g., NaOH → Na⁺ + OH⁻)

**Brønsted-Lowry definition (broader):**
- Acid: proton (H⁺) donor
- Base: proton (H⁺) acceptor
- Conjugate acid-base pairs: HA + B ⇌ A⁻ + BH⁺

**Lewis definition (broadest):**
- Acid: electron pair acceptor
- Base: electron pair donor

**pH scale:**  pH = −log[H⁺]
  pH < 7 → acidic,  pH = 7 → neutral,  pH > 7 → basic
  pOH = −log[OH⁻],  pH + pOH = 14

**Strong vs weak:**
- Strong acid (HCl, HNO₃, H₂SO₄): fully dissociates
- Weak acid (CH₃COOH): partially dissociates, Ka = [H⁺][A⁻]/[HA]

**Neutralisation:** Acid + Base → Salt + Water
  HCl + NaOH → NaCl + H₂O`,

  // ══════════════ ENGINEERING GENERAL ══════════════
  "stress strain": `**Stress and Strain (Mechanics of Materials)**

**Stress (σ):**  σ = F / A   (force / cross-sectional area)
Units: Pa (Pascal) or N/m²   →   1 MPa = 10⁶ N/m²

**Types of stress:** Tensile (+), Compressive (−), Shear (τ = F/A)

**Strain (ε):**  ε = ΔL / L₀   (change in length / original length)
Strain is dimensionless.

**Young's Modulus (E) — Hooke's Law for materials:**
  E = σ / ε   (stress / strain in elastic region)
  Units: Pa or GPa   →   Steel: E ≈ 200 GPa, Aluminium: E ≈ 70 GPa

**Stress-strain curve regions:**
1. Elastic region: linear, Hooke's Law applies, fully recoverable
2. Yield point: permanent deformation begins
3. Plastic region: large deformation, work hardening
4. Ultimate tensile strength (UTS): maximum stress
5. Fracture: material breaks

**Poisson's ratio (ν):**  ν = −εₜᵣₐₙₛᵥₑᵣₛₑ / εₐₓᵢₐₗ   (≈ 0.3 for steel)`,
};

/* ── ASSISTANT ENGINE ──────────────────────────────────────────
   Multi-level lookup:
   1. Extract core subject from the question
   2. Find longest matching key in KB
   3. Legacy pattern matching for common CS idioms
   4. Context-aware academic advice (GPA, assignments, etc.)
   5. Subject-area smart fallback
   ─────────────────────────────────────────────────────────── */

/** Strip question words to get the core subject */
function cleanQuery(q) {
  return q
    .replace(/^(what is|what are|what's|define|definition of|explain|describe|tell me about|can you explain|please explain|i want to know about|how does|how do|how is|what do you mean by|give me an overview of|overview of|introduction to)\s+/i, '')
    .replace(/[?!.]+$/, '')
    .trim();
}

/** Find the longest key in KB that appears in the query */
function kbLookup(q) {
  const subject = cleanQuery(q);
  // Sort descending by key length so longer (more specific) keys match first
  const sorted = Object.keys(KB).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (subject.includes(key) || q.includes(key)) {
      return KB[key];
    }
  }
  return null;
}

/** Detect broad subject area from keywords */
function detectSubjectArea(q) {
  if (/ohm|kirchhoff|faraday|gauss|ampere|electric circuit|capacitor|inductor|diode|transistor|rectifier|op.amp|operational amplifier|thevenin|norton|superposition|logic gate|boolean|flip.flop|mosfet|bjt|semiconductor|transformer|rlc|rc circuit/.test(q)) return 'electronics';
  if (/newton|coulomb|hooke|snell|boyle|ideal gas|thermodynamics|entropy|momentum|kinetic energy|potential energy|quantum|photon|wave|frequency|wavelength|optics|refraction|reflection|magnetic|electric field|voltage|current|resistance|force|velocity|acceleration|power|work|energy|gravity|pressure|temperature|heat/.test(q)) return 'physics';
  if (/derivative|integral|differentiation|integration|limit|matrix|matrices|determinant|eigenvalue|probability|bayes|distribution|mean|median|variance|standard deviation|trigonometry|pythagorean|fourier|laplace|differential equation|permutation|combination|binomial|logarithm|calculus|algebra|geometry|statistics/.test(q)) return 'math';
  if (/algorithm|data structure|binary tree|linked list|hash|stack|queue|recursion|sorting|searching|big.?o|complexity|dynamic programming|graph|bfs|dfs|dijkstra|pointer|oop|object.orient|class|inherit|polymorphism|encapsulation|database|sql|machine learning|neural|deep learning|operating system|process|thread|deadlock|memory|network|tcp|http/.test(q)) return 'cs';
  if (/software engineering|sdlc|waterfall|agile|scrum|design pattern|solid|uml|testing|requirement|architecture|microservice|devops|version control|git/.test(q)) return 'se';
  if (/chemistry|chemical|molecule|atom|element|reaction|compound|acid|base|ph|ionic|covalent|bond/.test(q)) return 'chemistry';
  if (/study|exam|gpa|grade|improve|motivation|procrastinat|time management|note.taking|schedule|pomodoro|spaced repetition|active recall/.test(q)) return 'study';
  return null;
}

const SUBJECT_OVERVIEW = {
  physics: `I can help with Physics! Here are the topics I know in detail:

**Mechanics:** Newton's Laws, Momentum, Kinetic/Potential Energy, Hooke's Law, Stress & Strain
**Electromagnetism:** Ohm's Law, Coulomb's Law, Faraday's Law, Gauss's Law, Ampere's Law, Electric/Magnetic Fields
**Waves & Optics:** Wave fundamentals, Snell's Law, Reflection, Diffraction
**Thermodynamics:** Laws of Thermodynamics, Entropy, Ideal Gas Law, Boyle's Law
**Modern Physics:** Quantum Mechanics basics, Photoelectric effect, de Broglie wavelength

Try asking: *"What is Ohm's Law?"*, *"Explain Newton's Second Law"*, or *"What is Faraday's Law?"*`,

  math: `I can help with Mathematics! Topics I cover in depth:

**Calculus:** Derivatives, Integration, Limits, Differential Equations
**Linear Algebra:** Matrices, Determinants, Eigenvalues
**Statistics & Probability:** Mean/Variance/SD, Distributions, Bayes' Theorem
**Trigonometry:** SOH-CAH-TOA, Identities, Sine/Cosine Rules
**Pure Math:** Logarithms, Permutations, Combinations, Binomial Theorem, Fourier Series

Try asking: *"What is a derivative?"*, *"Explain Bayes' Theorem"*, or *"What is an eigenvalue?"*`,

  electronics: `I can help with Electronics & Electrical Engineering (BEE)! Topics covered:

**Circuit Analysis:** Ohm's Law, KVL, KCL, Thévenin's Theorem, Norton's Theorem, Superposition
**Components:** Resistors, Capacitors, Inductors, Diodes, Transistors (BJT & MOSFET), Op-Amps
**Circuits:** RC, RL, RLC circuits, Rectifiers, Filters, Transformers
**Digital Electronics:** Logic Gates, Boolean Algebra, Flip-Flops, Karnaugh Maps

Try asking: *"Explain Thévenin's Theorem"*, *"What is an op-amp?"*, or *"How does a transistor work?"*`,

  cs: `I can help with Computer Science! Topics covered:

**Data Structures:** Arrays, Linked Lists, Trees, Heaps, Hash Maps, Graphs
**Algorithms:** Sorting, Searching, BFS/DFS, Dijkstra, Dynamic Programming, Big O Analysis
**Programming:** OOP, Recursion, Pointers, Memory Management
**Systems:** Operating Systems, Processes, Threads, Deadlock, Virtual Memory
**Networking:** TCP/IP, HTTP, DNS
**AI/ML:** Machine Learning, Neural Networks, Gradient Descent, Regularisation

Try asking: *"What is dynamic programming?"*, *"Explain recursion"*, or *"What is a deadlock?"*`,

  se: `I can help with Software Engineering! Topics covered:

**Process Models:** SDLC, Waterfall, Agile, Scrum, Spiral
**Design:** SOLID Principles, Design Patterns, UML Diagrams, Software Architecture
**Testing:** Unit Testing, Integration Testing, TDD, Black-box vs White-box
**Tools & Practices:** Git/Version Control, CI/CD, DevOps, Code Review

Try asking: *"Explain Agile methodology"*, *"What are SOLID principles?"*, or *"What is the Waterfall model?"*`,

  chemistry: `I can help with Chemistry! Topics I cover:

**Bonding:** Ionic, Covalent, Metallic Bonding, Polarity
**Thermodynamics:** Ideal Gas Law, Entropy, Gibbs Free Energy
**Acids & Bases:** pH, Strong/Weak Acids, Neutralisation, Buffers

Try asking: *"What is ionic bonding?"*, *"Explain the ideal gas law"*, or *"What is pH?"*`,
};

function mockAssistant(messages, systemPrompt) {
  const rawMsg = messages[messages.length - 1]?.content || '';
  const q = rawMsg.toLowerCase().trim();

  // Parse student name from system prompt
  const nameM  = systemPrompt.match(/Name:\s*(.+)/);
  const name   = nameM ? nameM[1].trim().split(' ')[0] : 'there';
  const courseLines = (systemPrompt.match(/•\s.+/g) || []);

  // ── STEP 1: Knowledge base lookup (topic-specific answers) ──
  const kbAnswer = kbLookup(q);
  if (kbAnswer) return kbAnswer;

  // ── STEP 2: Academic/contextual advice (needs student context) ──
  if (/improve.*grade|raise.*gpa|better grade|low grade/.test(q)) return mockGradeAdvice(systemPrompt, name);
  if (/gpa|weighted average|grade point/.test(q)) return mockGPAExplain(systemPrompt, name);
  if (/assignment|deadline|overdue|submission|submit/.test(q)) return mockAssignmentAdvice(systemPrompt, name);
  if (/weak.*course|struggling|fail.*course|bad.*grade/.test(q)) return mockWeakCourse(systemPrompt, name);
  if (/study plan|weekly plan|how to study this week/.test(q)) return mockStudyPlanAdvice(systemPrompt, name);

  // ── STEP 3: Legacy CS / study-skills pattern matching ──
  if (/dynamic programming|dp problem/.test(q)) return KB['dynamic programming'];
  if (/graph.*algorithm|bfs|dfs|dijkstra|shortest path/.test(q)) return KB['graph algorithm'];
  if (/sorting|bubble sort|merge sort|quick sort/.test(q)) return KB['sorting algorithm'];
  if (/big.?o|time complexity|space complexity/.test(q)) return RESPONSES.bigO;
  if (/linked list|binary tree|heap|hash map/.test(q)) return KB.dataStructures || RESPONSES.dataStructures;
  if (/machine learning|neural network|deep learning/.test(q)) return RESPONSES.machineLearning;
  if (/sql|database|query|join|normalisation/.test(q)) return RESPONSES.databases;
  if (/overfitting|regularisation|dropout|bias.variance/.test(q)) return RESPONSES.mlRegularisation;
  if (/gradient descent|backpropagation|optimizer/.test(q)) return RESPONSES.gradientDescent;
  if (/pomodoro|spaced repetition|active recall|feynman/.test(q)) return RESPONSES.studyTechniques;
  if (/exam|midterm|final|test prep/.test(q)) return RESPONSES.examPrep;
  if (/time management|schedule|balance|overwhelm/.test(q)) return RESPONSES.timeManagement;
  if (/procrastinat|motivat|focus|distract/.test(q)) return RESPONSES.motivation;
  if (/note.?taking|cornell|outline|mindmap/.test(q)) return RESPONSES.noteTaking;

  // ── STEP 4: Subject-area overview ──
  const area = detectSubjectArea(q);
  if (area && SUBJECT_OVERVIEW[area]) {
    return `${SUBJECT_OVERVIEW[area]}`;
  }

  // ── STEP 5: Smart fallback for completely unknown topics ──
  return smartFallback(rawMsg, name);
}

function smartFallback(rawMsg, name) {
  const q = rawMsg.toLowerCase();
  // Detect if it looks like an academic question we just don't have
  const isQuestion = /^(what|how|why|when|where|explain|define|describe|tell me|give me)/i.test(rawMsg.trim());
  const subject = cleanQuery(q);

  return `Good question, ${name}! I don't have a specific pre-built answer for **"${subject.slice(0, 60)}"**, but here's how to work through it:

**Approach for any new concept:**

1. **Start with the definition** — What is it, and what field does it belong to?
2. **Understand the purpose** — Why does it exist? What problem does it solve?
3. **Find the formula or rule** (if applicable) — What's the mathematical or logical relationship?
4. **Work an example** — Apply it to a concrete case to test understanding.
5. **Connect to what you know** — How does it relate to other concepts in the same course?

**Subjects I can help with in detail:**
- 🔬 Physics (Newton's Laws, Ohm's Law, Thermodynamics, Optics, Quantum)
- 📐 Mathematics (Calculus, Linear Algebra, Probability, Statistics, Trigonometry)
- ⚡ Electronics/BEE (KVL, KCL, Thévenin, Op-Amps, Transistors, Logic Gates)
- 💻 Computer Science (DSA, OOP, OS, Networking, Machine Learning)
- 🛠 Software Engineering (SDLC, Agile, Design Patterns, Testing, UML)
- ⚗️ Chemistry (Bonding, Acids/Bases, Gas Laws)

**Try rephrasing:** *"What is [topic]?"* or *"Explain [topic]"* — I might know it under a slightly different keyword.

If you paste your lecture notes into the **Notes & Quiz** tab, I can summarise them and generate quiz questions regardless of the topic!`;
}

function mockGradeAdvice(sys, name) {
  const courses = (sys.match(/•\s(.+?)(?:\n|$)/g) || [])
    .map(l => l.replace(/^•\s/, '').split('—')[0].trim())
    .filter(Boolean);
  const weakM = sys.match(/(\d+)%.*?Target:\s*(\d+)%/);
  const gap = weakM ? parseInt(weakM[2]) - parseInt(weakM[1]) : 10;

  return `Hey ${name}! Here's a targeted plan to lift your grades:

**Diagnose before you fix**
Look at your last 2–3 assessments per course and identify the specific type of question you're losing marks on — concept understanding, calculation errors, or application. Fixing the right thing makes all the difference.

**Active recall over passive reading**
Replace re-reading notes with self-testing. Close your notes and write down everything you remember about a topic from scratch. Research consistently shows this doubles retention compared to highlighting.

**The 20% rule**
${gap > 5 ? `You're looking at a ~${gap}% gap to your target in at least one course. That's achievable — ` : ''}Focus 80% of your study time on the 20% of topics that appear most in assessments (past papers are gold for this).

**Get feedback fast**
Visit office hours or post on the course forum within 24 hours of receiving feedback on any graded work. Instructors remember students who engage — and it signals effort.

Which course are you most concerned about? I can give you a specific topic-by-topic game plan.`;
}

function mockGPAExplain(sys, name) {
  const gpaM = sys.match(/GPA Goal:\s*([\d.]+)/);
  const goal = gpaM ? gpaM[1] : '3.5';
  return `Great question, ${name}! Here's how GPA works and how to hit ${goal}:

**Weighted GPA Calculation**
GPA = Σ (grade_points × credits) ÷ total_credits

Grade points: A = 4.0, A− = 3.7, B+ = 3.3, B = 3.0, B− = 2.7, C+ = 2.3, C = 2.0...

**What moves the needle most**
High-credit courses (4 credits) have more impact than 2-credit electives. A B+ in a 4-credit course hurts more than a B in a 2-credit one — so prioritise accordingly.

**Back-calculating your target**
To hit ${goal}, work backwards: if you have 3 courses at 3 credits each, you need average grade points of ${goal}. That's roughly a B+ average. If one course is already an A, you have more slack in the others.

**Practical tip**
Check your current grade in each course now (don't wait for finals). Even a 2–3% improvement per course compounds significantly across credits. The Analytics page here shows your exact gap to target per course.`;
}

function mockAssignmentAdvice(sys, name) {
  const assignments = (sys.match(/•\s\[.+?\].+?(?:\n|$)/g) || []).slice(0, 3);
  const hasList = assignments.length > 0;
  return `${name}, here's how to tackle your workload efficiently:

**Triage first (5 minutes)**
${hasList
  ? `You have pending assignments with varying deadlines. Do this:\n${assignments.map(a => `- ${a.replace(/^•\s/, '').trim()}`).join('\n')}\nSort by: overdue first → due tomorrow → due this week.`
  : 'List every pending task and sort by: overdue → due tomorrow → due this week → due later.'}

**The "2-minute rule"**
Any task that takes less than 2 minutes — do it immediately. Don't let small things pile up.

**Time-box the hard ones**
For big assignments, set a 90-minute focused session with a clear goal (e.g., "draft the introduction and methodology section"). Then take a genuine 15-minute break.

**Done > perfect**
Submit something good and on-time over something perfect and late. Most instructors prefer timely, solid work.

Is there a specific assignment you're stuck on? Tell me what it's about and I'll help you break it down.`;
}

function mockWeakCourse(sys, name) {
  return `${name}, struggling with a course is completely normal — here's the recovery playbook:

**Step 1 — Find the root cause**
Are you losing marks because of: (a) not understanding concepts, (b) exam technique, or (c) not having enough practice? The fix is totally different for each.

**Step 2 — Past papers are everything**
Find the last 3 exams for the course. Solve them under timed conditions. This reveals exactly what the examiner values — no guessing needed.

**Step 3 — Use the Feynman Technique**
Pick the topic you understand least. Explain it out loud as if teaching a 12-year-old. Where you stumble = the exact gap to fill. Repeat until smooth.

**Step 4 — Get human help**
Don't struggle alone past 20 minutes on a single concept. Use office hours, course forums, or ask me — I know your specific courses.

**Step 5 — Quick wins**
Check if there are any upcoming low-stakes assignments or participation marks you haven't fully captured. They can provide a buffer before finals.

Which course is it? Share the topic list and I'll help you prioritise.`;
}

function mockStudyPlanAdvice(sys, name) {
  const courses = (sys.match(/•\s(.+?)(?:\n|$)/g) || []).map(l => l.replace(/^•\s/, '').split('—')[0].trim()).filter(Boolean);
  return `${name}, here's a practical weekly study framework${courses.length ? ` for your ${courses.length} courses` : ''}:

**Daily structure**
- Morning (2 hrs): Hardest / most urgent subject — your brain is freshest
- Afternoon (1.5 hrs): Medium-difficulty work, problem sets, assignments
- Evening (1 hr): Light review, reading, flashcards

**Weekly rhythm**
Mon/Wed/Fri: Active learning (new material, problem solving)
Tue/Thu: Consolidation (review, practice, past papers)
Saturday: Mock exams / deep work on weakest area
Sunday: Rest + light planning for the week ahead

**The "non-negotiable" rule**
Pick your 3 most important study tasks for the week on Sunday evening. These happen no matter what. Everything else is bonus.

${courses.length > 0 ? `\n**Your courses this semester:**\n${courses.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nWant me to allocate specific hours per course based on your grades and deadlines? Use the Study Planner tab!` : ''}

Would you like a more detailed plan? Tell me your available hours per day and I'll make it specific.`;
}

function mockContextualFallback(q, name, courseLines) {
  const topics = ['data structures', 'algorithms', 'machine learning', 'databases', 'software engineering'];
  const matched = topics.find(t => q.includes(t.split(' ')[0]));

  return `Good question, ${name}! Let me help with that.

${matched ? `For **${matched}**, here's what I'd focus on:\n\n` : ''}**Key principles to keep in mind:**

1. **Understand before memorising** — Always know the "why" behind a concept before drilling it. Understanding once is worth memorising ten times.

2. **Connect to what you know** — Relate new topics to things you already understand. This creates stronger memory pathways and makes exam application much easier.

3. **Practice > re-reading** — For technical subjects especially, doing problems and writing code matters far more than re-reading notes. Aim for a 70/30 practice-to-review ratio.

4. **Explain it back** — After studying a topic for 30 minutes, close your notes and write a one-paragraph explanation from memory. Gaps in your explanation reveal gaps in your understanding.

${courseLines.length > 0 ? `\nBased on your enrolled courses, this likely connects to what you're covering right now. ` : ''}Is there a specific aspect of this topic you'd like me to go deeper on? Feel free to paste a concept, problem statement, or code snippet and I'll walk through it with you.`;
}

// Pre-written deep-dive responses for common CS/academic topics
const RESPONSES = {
  dynamicProgramming: `**Dynamic Programming (DP) — Complete Guide**

DP solves problems by breaking them into overlapping subproblems and storing results to avoid recomputation.

**The two hallmarks of a DP problem:**
1. **Optimal substructure** — optimal solution built from optimal sub-solutions
2. **Overlapping subproblems** — same subproblem solved multiple times

**Two approaches:**
- **Top-down (memoisation):** Recursive + cache. More intuitive, write it like the recursion feels natural.
- **Bottom-up (tabulation):** Iterative, fill a table. Usually faster (no call-stack overhead).

**Step-by-step DP approach:**
1. Identify the recurrence relation
2. Define your dp[] array and what dp[i] means
3. Establish base cases
4. Fill in the table in the right order
5. Identify where the answer is

**Classic problems to master:**
- Fibonacci (basic memoisation)
- 0/1 Knapsack → dp[i][w] = max value with i items, capacity w
- Longest Common Subsequence → dp[i][j] = LCS of first i, j chars
- Coin Change → dp[amount] = min coins
- Matrix Chain Multiplication
- Edit Distance (Levenshtein)

**Mental model:** "What choice do I make at step i, and how does it affect the optimal answer?"

Want me to walk through a specific problem step-by-step?`,

  graphAlgorithms: `**Graph Algorithms — Quick Reference**

**BFS (Breadth-First Search)**
- Use: shortest path in unweighted graphs, level-order traversal
- Data structure: Queue
- Time: O(V + E), Space: O(V)
- Key: visited[] array prevents re-visiting

**DFS (Depth-First Search)**
- Use: cycle detection, topological sort, connected components
- Data structure: Stack (or recursion)
- Time: O(V + E), Space: O(V)

**Dijkstra's Algorithm**
- Use: shortest path in weighted graphs (non-negative weights)
- Data structure: Min-heap (priority queue)
- Time: O((V + E) log V)
- Key: greedy — always expand the closest unvisited node

**Bellman-Ford**
- Use: shortest path with negative weights, detects negative cycles
- Time: O(V × E) — slower than Dijkstra

**Floyd-Warshall**
- Use: all-pairs shortest path
- Time: O(V³), works with negative edges (not negative cycles)

**When to use which:**
- Unweighted shortest path → BFS
- Weighted, no negative edges → Dijkstra
- Negative edges → Bellman-Ford
- All pairs → Floyd-Warshall
- Topological order → DFS (check for cycle first)

Want a worked example of any of these?`,

  sorting: `**Sorting Algorithms — Complexity & When to Use**

| Algorithm     | Best    | Average  | Worst    | Space | Stable |
|---------------|---------|----------|----------|-------|--------|
| Bubble Sort   | O(n)    | O(n²)    | O(n²)    | O(1)  | ✅     |
| Selection Sort| O(n²)   | O(n²)    | O(n²)    | O(1)  | ❌     |
| Insertion Sort| O(n)    | O(n²)    | O(n²)    | O(1)  | ✅     |
| Merge Sort    | O(n log n)| O(n log n)| O(n log n)| O(n)| ✅   |
| Quick Sort    | O(n log n)| O(n log n)| O(n²)  | O(log n)| ❌ |
| Heap Sort     | O(n log n)| O(n log n)| O(n log n)| O(1)| ❌ |

**Interview golden rules:**
- Nearly sorted input → Insertion Sort (O(n) best case)
- Need guaranteed O(n log n) worst case → Merge Sort
- In-place + fast average → Quick Sort (pick pivot carefully)
- Need O(1) space + O(n log n) → Heap Sort

**Quick Sort partition (core idea):**
Pick a pivot, place all smaller elements left, larger right. Recurse on both halves. The pivot is in its final position.

**Merge Sort (core idea):**
Divide array in half recursively until size 1 (trivially sorted). Merge sorted halves by comparing front elements.

Which sorting algorithm are you trying to understand in depth?`,

  bigO: `**Big O Notation — Visual Guide**

**Complexity classes from fastest to slowest:**
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)

**Examples:**
- O(1): Array index access, hash map lookup
- O(log n): Binary search, balanced BST operations
- O(n): Linear scan, single loop
- O(n log n): Merge sort, heap sort
- O(n²): Nested loops, bubble sort
- O(2ⁿ): Recursive Fibonacci (naive), power set generation

**Rules for calculating Big O:**
1. Drop constants: O(3n) → O(n)
2. Drop lower-order terms: O(n² + n) → O(n²)
3. Sequential steps → add them: O(n) + O(m) = O(n + m)
4. Nested steps → multiply: loop inside loop = O(n × m)

**Space complexity** counts extra memory used (not input size):
- Recursive calls add to call stack: O(depth)
- Building a copy of input: O(n)

**Common interview trick:** If you can solve it in O(n²) with nested loops, ask yourself — can I use a hash map to get O(n)?`,

  dataStructures: `**Data Structures — When to Use What**

**Arrays**
- Random access O(1), insert/delete at end O(1) amortised
- Use when: index-based access, known size

**Linked Lists**
- Insert/delete at head O(1), access O(n)
- Use when: frequent insertions/deletions, unknown size

**Hash Map / Hash Table**
- Insert, delete, lookup: O(1) average
- Use when: fast lookup by key, frequency counting, memoisation

**Stack (LIFO)**
- Push/pop O(1)
- Use when: undo operations, DFS, balanced parentheses, function calls

**Queue (FIFO)**
- Enqueue/dequeue O(1)
- Use when: BFS, task scheduling, level-order traversal

**Binary Search Tree**
- Search/insert/delete: O(log n) balanced, O(n) worst
- Balanced variants (AVL, Red-Black): guaranteed O(log n)

**Heap (Priority Queue)**
- Insert O(log n), extract-min/max O(log n), peek O(1)
- Use when: scheduling by priority, Dijkstra, Top-K problems

**Trie**
- Insert/search O(L) where L = word length
- Use when: autocomplete, prefix matching, spell checking

Golden rule: Match the dominant operation needed (search? insert? sort?) to the structure that does it fastest.`,

  machineLearning: `**Machine Learning — Core Concepts**

**Supervised vs Unsupervised vs Reinforcement**
- **Supervised**: labelled data → learn mapping X→Y (classification, regression)
- **Unsupervised**: unlabelled data → find structure (clustering, dimensionality reduction)
- **Reinforcement**: agent learns by reward/penalty in an environment

**Bias-Variance Tradeoff**
- **High bias (underfitting)**: model too simple, misses patterns even in training data
- **High variance (overfitting)**: model memorises training data, fails on new data
- Goal: sweet spot with low bias AND low variance

**Model Evaluation**
- Accuracy: (TP + TN) / total — misleading for imbalanced classes
- Precision: TP / (TP + FP) — how many predicted positives are real?
- Recall: TP / (TP + FN) — how many real positives did we catch?
- F1 = 2 × (Precision × Recall) / (Precision + Recall)
- ROC-AUC: overall ranking quality across thresholds

**Key Algorithms**
- Linear/Logistic Regression → interpretable, fast baseline
- Decision Trees / Random Forest → handles non-linear, feature importance
- SVM → effective in high-dimensional spaces
- K-Means → clustering by centroid proximity
- Neural Networks → universal function approximators, needs data

**Cross-validation**: split data into k folds, train on k-1, test on 1, rotate. Gives unbiased performance estimate.

Which ML topic do you need a deeper dive on?`,

  databases: `**Databases — SQL & Design Essentials**

**Normalisation Forms**
- **1NF**: no repeating groups, atomic values in each column
- **2NF**: 1NF + no partial dependencies (all non-key cols depend on full PK)
- **3NF**: 2NF + no transitive dependencies (no A→B→C chains)
- **BCNF**: stricter 3NF, every determinant is a candidate key

**Essential SQL joins**
\`\`\`sql
INNER JOIN  → only matching rows from both tables
LEFT JOIN   → all rows from left + matched from right (NULLs where no match)
RIGHT JOIN  → all from right + matched from left
FULL OUTER  → all rows from both, NULLs where unmatched
CROSS JOIN  → cartesian product (every combination)
\`\`\`

**Indexes**
B-tree index speeds up WHERE, ORDER BY, JOIN on indexed columns. Trade-off: faster reads, slower writes, more storage.

**ACID Properties**
- **Atomicity**: transaction is all-or-nothing
- **Consistency**: DB moves from valid state to valid state
- **Isolation**: concurrent transactions don't interfere
- **Durability**: committed data survives failures

**ER Diagram tips**
- Entities = nouns (rectangles)
- Attributes = ovals (underline the primary key)
- Relationships = diamonds (add cardinality: 1:1, 1:N, M:N)
- Weak entities = double rectangle (depend on parent for identity)

What specific DB topic are you working on?`,

  mlRegularisation: `**Overfitting & Regularisation**

**Why overfitting happens**
The model has too many parameters relative to training examples, so it memorises noise instead of generalising.

**Signs:** Training accuracy >> validation accuracy. Loss curves diverge after a certain epoch.

**L1 Regularisation (Lasso)**
Adds λ × Σ|weights| to the loss. Drives some weights exactly to zero → automatic feature selection. Use when you suspect many irrelevant features.

**L2 Regularisation (Ridge)**
Adds λ × Σweights² to the loss. Shrinks all weights toward zero but rarely to zero. More stable than L1. Default choice for most models.

**Dropout**
During training, randomly zero out p% of neurons each forward pass. Forces the network to learn redundant representations. Typical values: 0.2–0.5.

**Early Stopping**
Monitor validation loss. Stop training when it starts increasing even if training loss is still falling. Free regularisation.

**Data Augmentation**
Artificially increase training set diversity (rotations, flips, crops for images; synonym replacement for text). Reduces overfitting without changing model architecture.

**Batch Normalisation**
Normalises layer inputs. Acts as a mild regulariser and stabilises training, often allowing higher learning rates.

Rule of thumb: Start with more data → then dropout → then L2 → then reduce model capacity.`,

  gradientDescent: `**Gradient Descent & Optimisers**

**Core idea:** Move parameters in the direction that reduces the loss the most. The gradient tells you the steepest ascent; go the opposite way.

**Update rule:** θ = θ − α × ∇L(θ)   where α = learning rate

**Variants:**
- **Batch GD**: Use all training data per update. Stable but slow for large datasets.
- **Stochastic GD (SGD)**: One sample per update. Fast, noisy, can escape local minima.
- **Mini-batch GD**: Best of both. Typical batch size: 32–256.

**Modern optimisers:**
- **Momentum**: Accumulates velocity in gradient direction. Dampens oscillations. β ≈ 0.9
- **RMSprop**: Adapts learning rate per parameter using running average of squared gradients.
- **Adam** = Momentum + RMSprop. Most popular default. lr=1e-3, β₁=0.9, β₂=0.999
- **AdamW**: Adam + weight decay. Better for transformer architectures.

**Learning rate tips:**
- Too high → loss diverges or oscillates
- Too low → training is painfully slow
- Use a learning rate schedule: warmup then cosine decay is a common pattern
- Learning rate finder: start tiny, increase exponentially, plot loss, pick the steepest drop

**Vanishing/exploding gradients:**
- Vanishing → ReLU activations, residual connections, batch norm
- Exploding → gradient clipping (clip norm to max 1.0 or 5.0)`,

  softwareEngineering: `**Software Engineering Principles**

**SOLID Principles**
- **S**ingle Responsibility: one class, one reason to change
- **O**pen/Closed: open for extension, closed for modification
- **L**iskov Substitution: subclasses must honour parent class contracts
- **I**nterface Segregation: small, focused interfaces over fat ones
- **D**ependency Inversion: depend on abstractions, not concretions

**Key Design Patterns**
- **Singleton**: one instance, global access point. Use carefully (hidden dependencies).
- **Factory**: create objects without specifying exact class. Hides instantiation logic.
- **Observer**: publisher notifies all subscribers on event. Used in event systems, MVC.
- **Strategy**: swap algorithms at runtime. Replaces if/else chains.
- **Decorator**: add behaviour to objects without subclassing. Python @decorators.
- **MVC**: Model (data) ← Controller → View (UI). Separation of concerns.

**Agile / Scrum**
- Sprint: 1–4 week iteration with a defined goal
- Backlog: prioritised list of user stories
- Daily standup: what I did, what I'll do, blockers
- Retrospective: what went well, what to improve
- Velocity: story points completed per sprint

**Testing pyramid**
Unit tests (many, fast) → Integration tests → E2E tests (few, slow)

What aspect of SE are you focusing on for your course?`,

  studyTechniques: `**Evidence-Based Study Techniques**

**🏆 Tier 1 — Highest ROI (backed by cognitive science)**

**Active Recall / Retrieval Practice**
Close your notes. Try to recall everything about a topic. Check. Repeat. This is 2–3× more effective than re-reading and creates durable memories.

**Spaced Repetition**
Review material at increasing intervals: 1 day → 3 days → 1 week → 2 weeks. Use flashcard apps (Anki) or the Flashcards tab here. Fights the forgetting curve.

**Interleaving**
Mix different subjects/problem types in one study session instead of doing all of one thing. Feels harder but produces better long-term retention.

**🥈 Tier 2 — Very Useful**

**Pomodoro Technique**
25 min focused work → 5 min break → repeat × 4 → 30 min break. Combats mental fatigue.

**Feynman Technique**
Explain a concept in simple terms as if teaching it. Where you can't → that's your knowledge gap. Fill it. Repeat.

**Cornell Notes**
Divide page: notes column (right) + cue column (left, filled later) + summary (bottom). After class, write questions in the cue column and test yourself.

**❌ Low ROI (feels productive but isn't)**
- Re-reading highlighted text
- Copying notes verbatim
- Passive watching of lecture recordings at 1× speed without pausing to test yourself

**The 50-50 rule:** For every hour of learning, spend an equal hour testing yourself on it.`,

  examPrep: `**Exam Preparation Strategy**

**The 2-week countdown:**

**Week 2 (before exam)**
- Map out ALL topics. Categorise: ✅ Confident | ⚠️ Shaky | ❌ Don't know
- Solve 1 past paper under exam conditions (closed notes, timed)
- Identify your weakest 3 topics

**Week 1 (final push)**
- Focus 60% of time on the ❌ and ⚠️ topics from your map
- Do 2 more past papers, mark them, review mistakes immediately
- Create a one-page cheat sheet (even if not allowed in exam — the act of making it consolidates memory)

**Night before:**
- Gentle review of your cheat sheet only
- Prepare everything (pens, ID, snacks, route)
- 8 hours sleep — non-negotiable. Sleep is when memory consolidates.

**During the exam:**
- Read every question before starting (2 minutes)
- Answer easiest questions first to build confidence and secure marks
- For MCQ: eliminate obviously wrong answers first
- Flag questions you're unsure about and return at the end
- Leave 5 minutes to review

**On multiple-choice:**
Your first instinct is usually right. Only change an answer if you find a clear factual reason to, not just doubt.

What subject is the exam in? I can give you more targeted advice.`,

  timeManagement: `**Academic Time Management**

**Weekly planning ritual (Sunday, 20 minutes)**
1. List every deadline and commitment for the week
2. Block time in your calendar for the 3 most important tasks
3. Identify your 2 biggest "time wasters" from last week and plan around them

**The MIT method (Most Important Tasks)**
Each morning, identify 3 things that would make the day a success. Do those before anything else — even email.

**Time blocking vs to-do lists**
To-do lists tell you what to do. Time blocks tell you *when*. "Study databases 2–4pm Tuesday" is far more likely to happen than "study databases" floating on a list.

**Energy management**
- High energy (usually morning): hard problems, new learning, writing
- Medium energy: reviewing, problem sets, emails
- Low energy: admin, organising, watching recorded lectures

**Protect your deep work**
Turn off notifications during study blocks. Every interruption costs ~23 minutes of refocus time. Phone in another room > silent mode > do not disturb.

**The 2-day rule**
Never skip a study habit 2 days in a row. One missed day is a slip; two is the start of a new (bad) habit.

Would you like help building a specific weekly schedule for your courses?`,

  motivation: `**Staying Motivated and Focused**

**The secret: systems beat motivation**
Motivation is unreliable — it fluctuates. Build systems (habits, routines, environments) that work even when motivation is low.

**Implementation intentions**
Instead of "I'll study this week," say "I'll study databases at 9am Monday, Wednesday, Friday in the library." Specific plans are 2–3× more likely to happen.

**Make starting easy**
Procrastination is usually about starting, not doing. Commit to just 5 minutes. Almost always you'll keep going once you've started — the hardest part is the first minute.

**Environment design**
- Designated study spot (not your bed)
- Phone physically out of reach
- Specific playlist or silence — consistency trains your brain to enter focus mode

**Track your progress**
Use a habit tracker or the Analytics page. Seeing a streak of completed sessions is powerful. "Don't break the chain."

**Reframe setbacks**
A bad grade is information, not identity. It tells you exactly what to fix. Write down the 3 specific reasons it went wrong and what you'll do differently. That's it — then move forward.

**Celebrate small wins**
After completing a difficult study session or submitting a tough assignment — acknowledge it. A short walk, a favourite snack, a message to a friend. Positive reinforcement maintains momentum.

You've got this. What's the specific challenge you're facing right now?`,

  noteTaking: `**Effective Note-Taking for University**

**The Cornell Method (best for lectures)**
Divide your page into three sections:
- **Right column (70%)**: Main notes during lecture — capture key ideas, not every word
- **Left column (30%)**: Cue questions — fill this in *after* the lecture ("What is Big O?")
- **Bottom summary**: Write 3–5 sentences summarising the whole page

Self-test using the cue column. Cover the notes, read the question, recall the answer.

**Digital vs Paper**
- Paper: better for maths, diagrams, active processing during lecture
- Digital: searchable, easy to reorganise, syncs across devices
- Hybrid: paper in lecture, type up and annotate digitally that evening

**The 24-hour rule**
Review and clean up notes within 24 hours of taking them. Memory consolidation happens during this window. Add examples, fill gaps, write questions.

**Concept maps / mind maps**
Excellent for subjects with lots of interconnected ideas (e.g., software architecture, biology, history). Start with the central concept, branch outward. Seeing relationships is more powerful than lists.

**What to capture:**
✅ Anything the instructor writes on the board
✅ Repeated phrases or concepts
✅ Examples and worked solutions
✅ Connections to previously covered material
❌ Every single word — aim for ideas, not transcription

Use the Notes & Quiz tab here to paste your notes and get instant summaries, key points, and flashcards!`,
};

// ─── 2. DASHBOARD INSIGHT ───────────────────────────────────────
function mockInsight(content) {
  // Parse the real numbers from the message
  const gpaM   = content.match(/GPA is ([\d.]+)/);
  const goalM  = content.match(/goal:\s*([\d.]+)/);
  const pendM  = content.match(/(\d+) pending/);
  const weekM  = content.match(/(\d+) due this week/);
  const weakM  = content.match(/weakest course is (.+?) at (\d+)%/);

  const gpa    = gpaM  ? parseFloat(gpaM[1])   : 3.2;
  const goal   = goalM ? parseFloat(goalM[1])  : 3.5;
  const pend   = pendM ? parseInt(pendM[1])     : 0;
  const week   = weekM ? parseInt(weekM[1])     : 0;
  const weak   = weakM ? weakM[1].split('(')[0].trim() : null;
  const weakPct = weakM ? parseInt(weakM[2])   : 0;

  const insights = [
    gpa >= goal
      ? `You're at ${gpa} GPA — above your ${goal} goal. The key now is maintaining consistency: keep active recall sessions short and daily rather than cramming the night before assessments.`
      : `At ${gpa} GPA with a ${goal} goal, your quickest win is identifying the 2–3 topics per course where you keep losing marks and spending focused time only on those.`,

    week > 3
      ? `With ${week} deadlines this week, use time-blocking today: assign each assignment to a specific 90-minute slot and treat it like a fixed appointment.`
      : week > 0
      ? `You have ${week} task${week > 1 ? 's' : ''} due this week — manageable. Front-load the hardest one today when your energy is highest.`
      : pend > 0
      ? `No deadlines this week but ${pend} tasks pending — a perfect window to get ahead. Pick the assignment with the earliest upcoming deadline and make meaningful progress today.`
      : `Your task list looks clear — use this breathing room to review your weakest topics before new assessments appear.',`,

    weak && weakPct < 80
      ? `Your ${weak} grade of ${weakPct}% has the most room for improvement. Spend at least one focused session this week on past exam questions for that course — targeted practice beats broad revision every time.`
      : `All your course grades look solid. To push further, switch from passive review to active recall: close your notes and write out everything you remember about a topic before checking.`,
  ];

  return insights[Math.floor(Math.random() * insights.length)];
}

// ─── 3. STUDY PLANNER ───────────────────────────────────────────
function mockPlanner(prompt) {
  // Extract course colors JSON — has real course IDs
  let courseColors = {};
  const colorMatch = prompt.match(/Course colors.*?:\s*(\{[^}]+\})/s);
  if (colorMatch) {
    try { courseColors = JSON.parse(colorMatch[1]); } catch (_) {}
  }

  // Extract course names from the "Courses:" section
  const courseSection = prompt.match(/Courses:\n([\s\S]+?)(?:\nPending|$)/)?.[1] || '';
  const courseEntries = courseSection.trim().split('\n').filter(Boolean).map(line => {
    const m = line.match(/^(.+?)\s*\((\w+)\)/);
    return m ? { name: m[1].trim(), code: m[2] } : { name: line.split(':')[0].trim(), code: '' };
  });

  // Extract assignment urgency
  const assignSection = prompt.match(/Pending Assignments:\n([\s\S]+?)(?:\nCourse|$)/)?.[1] || '';
  const urgentAssignments = (assignSection.match(/due in (\d+) days.*?(high|medium)/g) || [])
    .map(a => {
      const d = parseInt(a.match(/(\d+) days/)?.[1] || '7');
      const p = a.includes('high') ? 3 : 2;
      return { days: d, weight: p };
    })
    .sort((a, b) => a.days - b.days);

  const courseIds = Object.keys(courseColors);
  if (courseIds.length === 0) {
    // Fallback: generic schedule
    return JSON.stringify({
      blocks: genericSchedule(),
      totalHours: 18,
      insights: 'No courses found — here is a generic weekly study template to get you started.',
    });
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '09:00', end: '10:30' },
    { start: '11:00', end: '12:30' },
    { start: '14:00', end: '15:30' },
    { start: '16:00', end: '17:30' },
    { start: '19:00', end: '20:30' },
  ];

  const activities = [
    'Review lecture notes and solve 3 practice problems',
    'Work on pending assignment — draft and outline first',
    'Complete problem set and check solutions',
    'Study key concepts using active recall technique',
    'Do past exam questions on this week\'s topics',
    'Review weak areas identified from last assessment',
    'Summarise chapter and create flashcard set',
    'Group study / discussion session preparation',
    'Revise and finalise submitted assignment draft',
    'Mock quiz on recent topics (30 min timed)',
  ];

  const blocks = [];
  let blockCount = 0;

  days.forEach((day, dayIdx) => {
    const slotsForDay = dayIdx === 5 ? 2 : 3; // Saturday gets fewer
    const daySlots    = timeSlots.slice(0, slotsForDay);

    daySlots.forEach((slot, slotIdx) => {
      // Rotate through courses, weight earlier-deadline courses higher
      const courseIdx = (dayIdx * 3 + slotIdx) % courseIds.length;
      const courseId  = courseIds[courseIdx];
      const courseName = courseEntries[courseIdx]?.name || `Course ${courseIdx + 1}`;
      const color     = courseColors[courseId] || '#5B9FFF';

      // Pick priority based on whether we have urgent assignments for this course
      const isUrgent = urgentAssignments.some(a => a.days <= (dayIdx + 1) * 1.5);
      const priority = isUrgent && slotIdx === 0 ? 'high' : slotIdx === 1 ? 'medium' : 'low';

      blocks.push({
        day,
        startTime:  slot.start,
        endTime:    slot.end,
        courseId,
        courseName,
        color,
        activity:   activities[blockCount % activities.length],
        priority,
      });
      blockCount++;
    });
  });

  const totalHours = blocks.length * 1.5;
  const hasUrgent  = urgentAssignments.some(a => a.days <= 2);

  return JSON.stringify({
    blocks,
    totalHours,
    insights: hasUrgent
      ? `Schedule front-loaded with high-priority sessions — ${urgentAssignments.filter(a => a.days <= 2).length} urgent deadline(s) detected within 48 hours. Mornings assigned to the most time-sensitive work.`
      : `Balanced rotation across your ${courseIds.length} courses. Courses with closer deadlines receive morning slots when focus is highest. Adjust manually if needed.`,
  });
}

function genericSchedule() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const slots = [
    { s: '09:00', e: '10:30' },
    { s: '14:00', e: '15:30' },
    { s: '19:00', e: '20:30' },
  ];
  return days.flatMap((day, i) =>
    slots.slice(0, i === 5 ? 2 : 3).map(({ s, e }, j) => ({
      day, startTime: s, endTime: e,
      courseId: `generic-${j}`,
      courseName: ['Core Subject', 'Secondary Subject', 'Review'][j],
      color: ['#5B9FFF', '#8B65F5', '#22C87A'][j],
      activity: ['Work on main assignment or problem set', 'Review lecture notes with active recall', 'Practice past exam questions'][j],
      priority: j === 0 ? 'high' : 'medium',
    }))
  );
}

// ─── 4. SUMMARY ─────────────────────────────────────────────────
function mockSummary(notes) {
  if (!notes || notes.trim().length < 30) {
    return 'The notes appear to be empty or very short. Please add more content to your note, then click Summarize again.';
  }

  const sents = sentences(notes);
  if (sents.length === 0) {
    return `**Summary of your notes:**\n\n${notes.slice(0, 300)}${notes.length > 300 ? '...' : ''}`;
  }

  // Group sentences into 3 clusters
  const third = Math.ceil(sents.length / 3);
  const groups = [
    sents.slice(0, third),
    sents.slice(third, third * 2),
    sents.slice(third * 2),
  ].filter(g => g.length > 0);

  const paragraphs = groups.map((group, i) => {
    const keySents = pick(group, Math.min(3, group.length));
    const intro = ['This section covers', 'Building on this,', 'Finally,'][i] || 'Additionally,';
    return `${intro} ${keySents.join(' ')}`;
  });

  return paragraphs.join('\n\n');
}

// ─── 5. KEY POINTS ──────────────────────────────────────────────
function mockKeyPoints(notes) {
  if (!notes || notes.trim().length < 30) {
    return '1. Please add content to your note first, then click Key Points.';
  }

  const sents = sentences(notes);

  // Score each sentence by informativeness
  const scored = sents.map(s => {
    let score = 0;
    if (/\bis\b|\bare\b|\bmeans\b|\bdefin|\brefers to/i.test(s)) score += 3; // definitions
    if (/\d+/.test(s)) score += 2; // contains numbers/facts
    if (/important|key|critical|essential|main|primary|note that/i.test(s)) score += 2;
    if (/first|second|third|finally|therefore|because|result/i.test(s)) score += 1; // structure words
    if (s.length > 40 && s.length < 200) score += 1; // good length
    return { s, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, Math.min(8, scored.length)).map(x => x.s);

  // Remove duplicates and format
  const unique = [...new Set(top)];
  return unique.map((s, i) => `${i + 1}. ${s}`).join('\n');
}

// ─── 6. FLASHCARDS ──────────────────────────────────────────────
function mockFlashcards(notes) {
  if (!notes || notes.trim().length < 30) {
    return JSON.stringify([
      { question: 'No notes found — add content to generate flashcards.', answer: 'Paste your lecture notes in the editor and try again.' },
    ]);
  }

  const sents = sentences(notes);
  const cards = [];

  // Strategy 1: Definition patterns → "What is X?"
  sents.forEach(s => {
    const defM = s.match(/^(.{5,40}?)\s+(?:is|are|refers to|means|is defined as)\s+(.{10,})/i);
    if (defM && cards.length < 10) {
      cards.push({ question: `What is ${defM[1].trim()}?`, answer: defM[2].trim().replace(/\.$/, '') + '.' });
    }
  });

  // Strategy 2: Numbered / list items → recall prompts
  const listItems = notes.match(/(?:^|\n)\s*[-•\d+\.]\s*(.{15,120})/g) || [];
  listItems.slice(0, 4).forEach(item => {
    const clean = item.replace(/^[\s\-•\d+\.]+/, '').trim();
    if (clean.length > 15 && cards.length < 10) {
      const words = clean.split(' ');
      const term  = words.slice(0, 3).join(' ');
      cards.push({ question: `Complete or explain: "${term}..."`, answer: clean });
    }
  });

  // Strategy 3: Sentence-based Q&A (fallback)
  const remaining = Math.max(0, 6 - cards.length);
  const pool = sents.filter(s => !cards.some(c => c.answer.includes(s.slice(0, 20))));
  pick(pool, remaining).forEach(s => {
    const words = s.split(' ');
    const keyWord = words.find(w => w.length > 5 && /^[A-Z]/.test(w)) || words[0];
    cards.push({
      question: `What does the concept of "${keyWord}" relate to in this context?`,
      answer: s,
    });
  });

  if (cards.length === 0) {
    // Last resort fallback
    return JSON.stringify([
      { question: 'What are the main topics covered in these notes?', answer: notes.slice(0, 150).trim() + (notes.length > 150 ? '...' : '') },
      { question: 'Summarise the key idea from this material.', answer: sentences(notes)[0] || 'Review the notes content.' },
    ]);
  }

  return JSON.stringify(cards.slice(0, 10));
}

// ─── 7. QUIZ ────────────────────────────────────────────────────
function mockQuiz(notes) {
  if (!notes || notes.trim().length < 30) {
    return JSON.stringify([{
      question: 'Your notes appear to be empty. Which step should you do first?',
      options: ['Add content to the note editor', 'Click Quiz again immediately', 'Refresh the page', 'Change the note title'],
      correct: 0,
      explanation: 'Paste your lecture notes in the editor panel first, then click Quiz to generate questions from your content.',
    }]);
  }

  const sents   = sentences(notes);
  const quiz    = [];

  // ── Q-type 1: Fact/definition MCQ ──
  sents.forEach(s => {
    if (quiz.length >= 5) return;
    const defM = s.match(/^(.{5,35}?)\s+(?:is|are|was|were)\s+(.{10,80})/i);
    if (!defM) return;

    const subject = defM[1].trim();
    const answer  = defM[2].trim().replace(/\.$/, '');

    // Generate plausible distractors by borrowing from other sentences
    const distractors = sents
      .filter(x => x !== s && x.length > 15)
      .map(x => {
        const m = x.match(/\s+(?:is|are|was|were)\s+(.{10,60})/i);
        return m ? m[1].trim().replace(/\.$/, '') : null;
      })
      .filter(Boolean)
      .slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(['a derived concept', 'an unrelated process', 'a deprecated method'][distractors.length]);
    }

    const options = shuffle([answer, ...distractors.slice(0, 3)]);
    const correct = options.indexOf(answer);

    quiz.push({
      question: `Which of the following best describes "${subject}"?`,
      options,
      correct,
      explanation: `${subject} ${s.match(/\s+(?:is|are|was|were)\s+/i)?.[0] || ' is '}${answer}.`,
    });
  });

  // ── Q-type 2: True/false-style MCQ ──
  const remaining = 5 - quiz.length;
  pick(sents.filter(s => s.split(' ').length >= 8), remaining).forEach(s => {
    // Modify the sentence to create a wrong option
    const words = s.split(' ');
    const flipIdx = Math.floor(words.length / 2);
    const antonyms = { high: 'low', fast: 'slow', large: 'small', increase: 'decrease', adds: 'removes', true: 'false', first: 'last' };
    const flippedWords = [...words];
    const flipWord = flippedWords[flipIdx]?.toLowerCase().replace(/[^a-z]/g, '');
    if (antonyms[flipWord]) flippedWords[flipIdx] = flippedWords[flipIdx].replace(new RegExp(flipWord, 'i'), antonyms[flipWord]);
    const wrong = flippedWords.join(' ');

    const options = shuffle([s, wrong, 'This concept is not covered in these notes.', 'Both statements are partially correct.']);
    const correct = options.indexOf(s);

    quiz.push({
      question: `Which statement is correct according to your notes?`,
      options,
      correct,
      explanation: `The correct statement is: "${s}"`,
    });
  });

  // Fill to 5 if still short
  while (quiz.length < 5) {
    const s = sents[quiz.length % sents.length] || 'Review the material carefully.';
    quiz.push({
      question: `Based on your notes, which of the following is most accurate?`,
      options: [s.slice(0, 80), 'None of the above is accurate.', 'This topic was not mentioned.', 'The notes contradict this statement.'],
      correct: 0,
      explanation: `The notes state: "${s.slice(0, 100)}"`,
    });
  }

  return JSON.stringify(quiz.slice(0, 5));
}
