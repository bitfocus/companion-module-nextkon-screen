import type {
	CompanionPresetDefinitions,
	CompanionPresetSection,
	CompanionSimplePresetDefinition,
} from '@companion-module/base'
import type { ModuleSchema } from './main.js'
import type ModuleInstance from './main.js'
import { namesFor, type Role, type Screen } from './api.js'
import { ALL_ROOMS, BLACK, EMPTY, screenLabel } from './choices.js'
import { COLOR_ACTIVE, COLOR_OFFLINE } from './feedbacks.js'

const ROLE_COLOR: Record<Role, number> = { pult: 0xc85a00, mod: 0x001a66, beide: 0x333333 }
const EMPTY_COLOR = 0x660000
const BLACK_COLOR = 0x3c3c3c

type Preset = CompanionSimplePresetDefinition<ModuleSchema>

function showPreset(screen: Screen, content: string, text: string, bgcolor: number, name: string): Preset {
	return {
		type: 'simple',
		name,
		style: { text, size: 'auto', color: 0xffffff, bgcolor, show_topbar: false },
		steps: [{ down: [{ actionId: 'show', options: { screen: screen.id, content } }], up: [] }],
		feedbacks: [
			{
				feedbackId: 'screen_shows',
				options: { screen: screen.id, content },
				style: { bgcolor: COLOR_ACTIVE, color: 0xffffff },
			},
		],
	}
}

export function UpdatePresets(self: ModuleInstance): void {
	const state = self.state
	const structure: CompanionPresetSection<ModuleSchema>[] = []
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}

	presets['status'] = {
		type: 'simple',
		name: 'Event and screens online',
		style: {
			text: `$(${self.label}:event_title)\\n$(${self.label}:screens_online)/$(${self.label}:screens_total) online`,
			size: 'auto',
			color: 0xffffff,
			bgcolor: 0x000000,
			show_topbar: false,
		},
		steps: [{ down: [{ actionId: 'refresh', options: {} }], up: [] }],
		feedbacks: [],
	}
	const general = ['status']
	const rooms = [ALL_ROOMS, ...new Set((state?.screens ?? []).map((s) => s.raum).filter(Boolean))]
	for (const room of rooms) {
		for (const content of [EMPTY, BLACK]) {
			const id = `room_${room === ALL_ROOMS ? 'all' : room}_${content}`.replace(/[^\w-]/g, '_')
			const where = room === ALL_ROOMS ? 'ALL' : room
			presets[id] = {
				type: 'simple',
				name: `${where}: all screens ${content === EMPTY ? 'EMPTY' : 'black'}`,
				style: {
					text: `${where}\\n${content === EMPTY ? 'EMPTY' : 'BLACK'}`,
					size: 'auto',
					color: 0xffffff,
					bgcolor: content === EMPTY ? EMPTY_COLOR : BLACK_COLOR,
					show_topbar: false,
				},
				steps: [{ down: [{ actionId: 'room', options: { room, content } }], up: [] }],
				feedbacks: [],
			}
			general.push(id)
		}
	}
	structure.push({
		id: 'general',
		name: 'General',
		definitions: [
			{
				id: 'general',
				type: 'simple',
				name: 'Event and rooms',
				description: 'Status of the event, and all screens of a room at once',
				presets: general,
			},
		],
	})

	for (const screen of state?.screens ?? []) {
		const base = `s_${screen.id}`.replace(/[^\w-]/g, '_')
		const basics: string[] = []
		presets[`${base}_empty`] = showPreset(screen, EMPTY, `${screen.name}\\nEMPTY`, EMPTY_COLOR, `${screen.name}: EMPTY`)
		presets[`${base}_black`] = showPreset(screen, BLACK, `${screen.name}\\nBLACK`, BLACK_COLOR, `${screen.name}: black`)
		presets[`${base}_offline`] = {
			type: 'simple',
			name: `${screen.name}: online state`,
			style: { text: `${screen.name}\\nonline`, size: 'auto', color: 0xffffff, bgcolor: 0x004d00, show_topbar: false },
			steps: [],
			feedbacks: [
				{
					feedbackId: 'screen_offline',
					options: { screen: screen.id },
					style: { bgcolor: COLOR_OFFLINE, color: 0xffffff, text: `${screen.name}\\nOFFLINE` },
				},
			],
		}
		basics.push(`${base}_empty`, `${base}_black`, `${base}_offline`)

		const names: string[] = []
		for (const n of namesFor(state!, screen)) {
			const id = `${base}_n_${n.id}`.replace(/[^\w-]/g, '_')
			presets[id] = showPreset(screen, n.id, n.name, ROLE_COLOR[n.rolle], `${screen.name}: ${n.name}`)
			names.push(id)
		}

		structure.push({
			id: base,
			name: screenLabel(screen),
			definitions: [
				{ id: `${base}_basics`, type: 'simple', name: 'EMPTY, black, online', presets: basics },
				{
					id: `${base}_names`,
					type: 'simple',
					name: 'Names',
					description: 'Green while the screen shows the name. Orange = lectern, blue = moderation.',
					presets: names,
				},
			],
		})
	}

	self.setPresetDefinitions(structure, presets)
}
