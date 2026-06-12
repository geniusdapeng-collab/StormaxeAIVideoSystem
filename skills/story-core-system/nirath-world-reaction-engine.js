#!/usr/bin/env node

class NirathWorldReactionEngine {
 constructor() {
 this.zonePresets = {
 luminous_vein_canyon: {
 base: 'Nirath luminous vein canyon, unstable glowing geology, bioluminescent spores, twin-sun dusk'
 },
 twin_sun_grassland: {
 base: 'Nirath twin-sun grassland, vast sacred wind, eternal twilight horizon'
 },
 chaos_origin_field: {
 base: 'Nirath chaos origin field, warped spacetime, primordial energy turbulence'
 },
 broken_battlefield: {
 base: 'Nirath broken battlefield, shattered mineral cliffs, ancient scars, red dust currents'
 }
 };
 }

 react(zoneId, emotionBeat) {
 const zone = this.zonePresets[zoneId];
 if (!zone) throw new Error(`Unknown Nirath zone: ${zoneId}`);

 const map = {
 observe: { lighting: 'soft dual-star dusk, suspended calm', terrain: 'light veins breathe faintly', atmosphere: 'vast held-breath stillness' },
 foresee: { lighting: 'prophetic glimmer in reflective surfaces', terrain: 'glowing fractures pulse irregularly', atmosphere: 'air thickens with warning' },
 hesitate: { lighting: 'light dims and shivers', terrain: 'spores pause midair', atmosphere: 'wind weakens as if listening' },
 protect: { lighting: 'violent sacred flare, overwhelming backlight', terrain: 'energy surge collides through the canyon floor', atmosphere: 'shockwave of protective force' },
 dissolve: { lighting: 'warm fading afterglow', terrain: 'veins stabilize and return to harmony', atmosphere: 'gold-white particles merge into ecology' },
 wound: { lighting: 'ashen low light with exposed heat', terrain: 'ground fractures around impact zones', atmosphere: 'pain saturates the air' },
 rise: { lighting: 'growing backlight from below horizon', terrain: 'dust lifts from the ground', atmosphere: 'resolve gathering in silence' },
 defy: { lighting: 'hard contrast, defiant flare', terrain: 'ground cracks with rhythm', atmosphere: 'rage against silence' },
 burst: { lighting: 'sudden eruption of force and light', terrain: 'debris and energy streams explode outward', atmosphere: 'violent release' },
 stand: { lighting: 'solemn surviving glow', terrain: 'dust settles around monumental stillness', atmosphere: 'legend becoming landscape' },
 hide: { lighting: 'partial concealment in dim shimmer', terrain: 'mist and spores veil the body', atmosphere: 'distance and secrecy' },
 reveal: { lighting: 'truth-breaking rim light', terrain: 'surface light opens like a wound', atmosphere: 'the real form cannot stay hidden' },
 understand: { lighting: 'gentle warm-cool balance restored', terrain: 'pulses become harmonious', atmosphere: 'first fragile trust' }
 };

 return { zoneBase: zone.base, ...(map[emotionBeat] || map.observe) };
 }
}

module.exports = { NirathWorldReactionEngine };
