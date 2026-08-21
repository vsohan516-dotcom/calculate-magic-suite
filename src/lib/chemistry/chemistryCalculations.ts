import { AVOGADRO } from "./constants";

export function massToMoles(mass: number, molarMass: number) {
  if (molarMass === 0) throw new Error("Molar mass cannot be zero");
  return mass / molarMass;
}

export function molesToMass(moles: number, molarMass: number) {
  return moles * molarMass;
}

export function molesToParticles(moles: number) {
  return moles * AVOGADRO;
}

export function particlesToMoles(particles: number) {
  return particles / AVOGADRO;
}
