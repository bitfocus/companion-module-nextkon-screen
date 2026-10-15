import type { DropdownChoice } from '@companion-module/base'
import type { Name, Screen, State } from './api.js'

export const EMPTY = 'LEER'
export const BLACK = 'AUS'
export const ALL_ROOMS = '*'

export function screenLabel(s: Screen): string {
	return s.raum ? `${s.name} (${s.raum})` : s.name
}

export function nameLabel(n: Name): string {
	const extra = [n.zeile2, n.raum].filter(Boolean).join(' · ')
	return extra ? `${n.name} – ${extra}` : n.name
}

export function screenChoices(state: State | null): DropdownChoice<string>[] {
	return (state?.screens ?? []).map((s) => ({ id: s.id, label: screenLabel(s) }))
}

export function nameChoices(state: State | null): DropdownChoice<string>[] {
	return (state?.namen ?? []).map((n) => ({ id: n.id, label: nameLabel(n) }))
}

export function contentChoices(state: State | null): DropdownChoice<string>[] {
	return [{ id: EMPTY, label: 'EMPTY (logo only)' }, { id: BLACK, label: 'Black' }, ...nameChoices(state)]
}

export function roomChoices(state: State | null): DropdownChoice<string>[] {
	const rooms = new Set<string>(state?.raeume ?? [])
	for (const s of state?.screens ?? []) if (s.raum) rooms.add(s.raum)
	return [{ id: ALL_ROOMS, label: 'All rooms' }, ...[...rooms].map((r) => ({ id: r, label: r }))]
}

/** Accepts a name id or, e.g. from an expression or variable, the displayed name itself */
export function resolveName(state: State | null, value: string): Name | undefined {
	const v = value.trim()
	if (!state || !v) return undefined
	return state.namen.find((n) => n.id === v) ?? state.namen.find((n) => n.name.toLowerCase() === v.toLowerCase())
}

/** Same for screens: id or screen name */
export function resolveScreen(state: State | null, value: string): Screen | undefined {
	const v = value.trim()
	if (!state || !v) return undefined
	return state.screens.find((s) => s.id === v) ?? state.screens.find((s) => s.name.toLowerCase() === v.toLowerCase())
}

/** Content value as the server expects it: name id, LEER or AUS */
export function resolveContent(state: State | null, value: string): string | undefined {
	const v = value.trim()
	if (v.toUpperCase() === EMPTY || v.toUpperCase() === 'EMPTY') return EMPTY
	if (v.toUpperCase() === BLACK || v.toUpperCase() === 'BLACK' || v === '') return BLACK
	return resolveName(state, v)?.id
}
