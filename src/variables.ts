import type {
	CompanionVariableDefinitions,
	CompanionVariableValue,
	CompanionVariableValues,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { Screen, State } from './api.js'

export type VariablesSchema = Record<string, CompanionVariableValue | undefined>

/** Variable ids allow letters, digits, _ and - only */
export function screenVarId(screen: Screen, field: string): string {
	return `screen_${screen.id.replace(/[^\w-]/g, '_')}_${field}`
}

function shown(state: State, screen: Screen): { name: string; line2: string } {
	if (!screen.inhalt) return { name: 'BLACK', line2: '' }
	if (screen.inhalt === 'LEER') return { name: 'EMPTY', line2: '' }
	const n = state.namen.find((x) => x.id === screen.inhalt)
	return { name: n?.name ?? '', line2: n?.zeile2 ?? '' }
}

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const defs: CompanionVariableDefinitions<VariablesSchema> = {
		event_title: { name: 'Active event' },
		screens_online: { name: 'Screens online (count)' },
		screens_total: { name: 'Screens in the event (count)' },
	}
	for (const s of self.state?.screens ?? []) {
		defs[screenVarId(s, 'name')] = { name: `${s.name}: screen name` }
		defs[screenVarId(s, 'shows')] = { name: `${s.name}: name shown (EMPTY/BLACK)` }
		defs[screenVarId(s, 'line2')] = { name: `${s.name}: second line shown` }
		defs[screenVarId(s, 'online')] = { name: `${s.name}: online (true/false)` }
	}
	self.setVariableDefinitions(defs)
}

export function UpdateVariableValues(self: ModuleInstance): void {
	const state = self.state
	if (!state) return
	const values: CompanionVariableValues = {
		event_title: state.titel,
		screens_online: state.screens.filter((s) => s.online).length,
		screens_total: state.screens.length,
	}
	for (const s of state.screens) {
		const { name, line2 } = shown(state, s)
		values[screenVarId(s, 'name')] = s.name
		values[screenVarId(s, 'shows')] = name
		values[screenVarId(s, 'line2')] = line2
		values[screenVarId(s, 'online')] = s.online
	}
	self.setVariableValues(values)
}
