import type { SomeCompanionConfigField } from '@companion-module/base'

export const DEFAULT_HOST = 'https://screen.nextkon.de'

export type ModuleConfig = {
	host: string
	pollInterval: number
}

export type ModuleSecrets = {
	controlKey: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'Controls the digital name signs of NextKon Screen. You find the control key in the NextKon Screen management under “Links” → “Companion / Stream Deck”. You can also paste the complete control URL shown there.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Server address',
			tooltip: 'Leave at https://screen.nextkon.de. Use http://<IP> only for a ProPlayer Backup in the local network.',
			width: 8,
			default: DEFAULT_HOST,
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Status update interval (ms)',
			width: 4,
			min: 500,
			max: 10000,
			default: 1000,
		},
		{
			type: 'secret-text',
			id: 'controlKey',
			label: 'Control key',
			tooltip: 'The value after “zugang=” in the control URL, or the complete URL',
			width: 12,
			minLength: 8,
		},
	]
}

/** Accepts the bare key or a pasted control URL (…/api/s/setzen?zugang=KEY&…) */
export function parseControlKey(raw: string | undefined): string {
	const value = (raw ?? '').trim()
	const match = /[?&#]zugang=([^&\s]+)/.exec(value)
	return match ? decodeURIComponent(match[1]) : value
}

/** Base URL without trailing slash; a pasted control URL is reduced to its origin */
export function parseHost(raw: string | undefined): string {
	let value = (raw ?? '').trim() || DEFAULT_HOST
	if (!/^https?:\/\//i.test(value)) value = `https://${value}`
	try {
		const url = new URL(value)
		return `${url.protocol}//${url.host}`
	} catch {
		return DEFAULT_HOST
	}
}
