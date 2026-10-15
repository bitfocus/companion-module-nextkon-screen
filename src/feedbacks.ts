import type ModuleInstance from './main.js'
import { EMPTY, contentChoices, resolveContent, resolveScreen, screenChoices } from './choices.js'

export const COLOR_ACTIVE = 0x00aa00
export const COLOR_OFFLINE = 0xcc0000

export type FeedbacksSchema = {
	screen_shows: { type: 'boolean'; options: { screen: string; content: string } }
	screen_offline: { type: 'boolean'; options: { screen: string } }
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	const screens = screenChoices(self.state)

	self.setFeedbackDefinitions({
		screen_shows: {
			type: 'boolean',
			name: 'Screen shows sign',
			description: 'True while the screen shows exactly this name, EMPTY or black',
			defaultStyle: { bgcolor: COLOR_ACTIVE, color: 0xffffff },
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
					choices: contentChoices(self.state),
					default: EMPTY,
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				const screen = resolveScreen(self.state, String(feedback.options.screen))
				const content = resolveContent(self.state, String(feedback.options.content))
				if (!screen || !content) return false
				return (screen.inhalt ?? 'AUS') === content
			},
		},
		screen_offline: {
			type: 'boolean',
			name: 'Screen offline',
			description: 'True while no player shows this screen (browser closed, device off or without network)',
			defaultStyle: { bgcolor: COLOR_OFFLINE, color: 0xffffff },
			options: [
				{
					id: 'screen',
					type: 'dropdown',
					label: 'Screen',
					choices: screens,
					default: screens[0]?.id ?? '',
					allowCustom: true,
				},
			],
			callback: (feedback) => {
				const screen = resolveScreen(self.state, String(feedback.options.screen))
				return !!self.state && !!screen && !screen.online
			},
		},
	})
}
