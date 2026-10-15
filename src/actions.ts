import type ModuleInstance from './main.js'
import {
	ALL_ROOMS,
	BLACK,
	EMPTY,
	contentChoices,
	resolveContent,
	resolveScreen,
	roomChoices,
	screenChoices,
} from './choices.js'

export type ActionsSchema = {
	show: { options: { screen: string; content: string } }
	swap: { options: { a: string; b: string } }
	room: { options: { room: string; content: string } }
	refresh: { options: Record<string, never> }
}

export function UpdateActions(self: ModuleInstance): void {
	const screens = screenChoices(self.state)
	const contents = contentChoices(self.state)

	self.setActionDefinitions({
		show: {
			name: 'Show sign on screen',
			description: 'Shows a name, EMPTY (logo only) or black on one screen',
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen',
					choices: screens,
					default: screens[0]?.id ?? '',
					allowCustom: true,
				},
				{
					id: 'content',
					type: 'dropdown',
					label: 'Sign',
					tooltip: 'Custom values: a name as written in NextKon Screen, EMPTY or BLACK',
					choices: contents,
					default: EMPTY,
					allowCustom: true,
				},
			],
			callback: async (event) => {
				const screen = resolveScreen(self.state, String(event.options.screen))
				const content = resolveContent(self.state, String(event.options.content))
				if (!screen || !content) {
					self.log(
						'warn',
						`Show sign: unknown ${screen ? 'name' : 'screen'} “${screen ? event.options.content : event.options.screen}”`,
					)
					return
				}
				await self.run('Show sign', async (api) => api.show(screen.id, content))
			},
		},
		swap: {
			name: 'Swap two screens',
			description: 'Exchanges the signs of two screens, e.g. after speakers changed seats',
			options: [
				{ id: 'a', type: 'dropdown', label: 'Screen A', choices: screens, default: screens[0]?.id ?? '' },
				{ id: 'b', type: 'dropdown', label: 'Screen B', choices: screens, default: screens[1]?.id ?? '' },
			],
			callback: async (event) => {
				const a = resolveScreen(self.state, String(event.options.a))
				const b = resolveScreen(self.state, String(event.options.b))
				if (!a || !b || a.id === b.id) {
					self.log('warn', 'Swap: choose two different screens')
					return
				}
				await self.run('Swap', async (api) => api.swap(a.id, b.id))
			},
		},
		room: {
			name: 'All screens of a room: EMPTY or black',
			description: 'Sets every screen of one room (or all rooms) at once, e.g. at the end of a session',
			options: [
				{ id: 'room', type: 'dropdown', label: 'Room', choices: roomChoices(self.state), default: ALL_ROOMS },
				{
					id: 'content',
					type: 'dropdown',
					label: 'Show',
					choices: [
						{ id: EMPTY, label: 'EMPTY (logo only)' },
						{ id: BLACK, label: 'Black' },
					],
					default: EMPTY,
				},
			],
			callback: async (event) => {
				const room = String(event.options.room)
				const content = String(event.options.content) === BLACK ? BLACK : EMPTY
				const targets = (self.state?.screens ?? []).filter((s) => room === ALL_ROOMS || s.raum === room)
				await self.run('Room', async (api) => {
					for (const s of targets) await api.show(s.id, content)
				})
			},
		},
		refresh: {
			name: 'Reload names and screens',
			description: 'Normally not needed: the module follows changes by itself',
			options: [],
			callback: async () => {
				await self.poll(true)
			},
		},
	})
}
