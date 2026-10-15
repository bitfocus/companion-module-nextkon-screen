import { InstanceBase, InstanceStatus, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, parseControlKey, parseHost, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateVariableDefinitions, UpdateVariableValues, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
import { ApiError, isUnchanged, ScreenApi, type State } from './api.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig
	api: ScreenApi | null = null
	state: State | null = null

	private pollTimer: NodeJS.Timeout | null = null
	private polling = false
	private fullPending = false
	private structureKey = ''
	private lastError = ''

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
		this.updateVariableDefinitions()
		await this.configUpdated(config, secrets)
	}

	async destroy(): Promise<void> {
		this.stopPolling()
		this.api = null
	}

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.stopPolling()
		this.state = null
		this.structureKey = ''
		this.lastError = ''

		const key = parseControlKey(secrets?.controlKey)
		if (!key) {
			this.api = null
			this.updateStatus(InstanceStatus.BadConfig, 'Control key missing')
			return
		}
		this.api = new ScreenApi(parseHost(config.host), key)
		this.updateStatus(InstanceStatus.Connecting)
		await this.poll(true)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	/** Fetch the state; `full` ignores the known version (after own changes) */
	async poll(full = false): Promise<void> {
		if (!this.api) return
		if (this.polling) {
			if (full) this.fullPending = true
			return
		}
		this.polling = true
		const api = this.api
		try {
			const res = await api.state(full || !this.state || this.lastError ? undefined : this.state.v)
			if (api !== this.api) return // config changed meanwhile
			if (isUnchanged(res)) {
				if (this.state && this.applyOnline(res.online)) {
					UpdateVariableValues(this)
					this.checkFeedbacks('screen_offline')
				}
			} else {
				this.applyState(res)
			}
			this.setOk()
		} catch (e) {
			if (api === this.api) this.handleError(e)
		} finally {
			this.polling = false
			if (this.fullPending || (this.api && api !== this.api)) {
				// a change or a new configuration arrived while this request was running
				this.fullPending = false
				void this.poll(true)
			} else if (api === this.api) {
				this.schedulePoll()
			}
		}
	}

	/** Run a change, then refresh at once so feedback follows without waiting for the next poll */
	async run(label: string, fn: (api: ScreenApi) => Promise<void>): Promise<void> {
		if (!this.api) {
			this.log('warn', `${label}: no connection configured`)
			return
		}
		try {
			await fn(this.api)
		} catch (e) {
			this.log('warn', `${label}: ${e instanceof Error ? e.message : String(e)}`)
			if (e instanceof ApiError && e.status === 403) this.handleError(e)
			return
		}
		this.stopPolling()
		await this.poll(true)
	}

	private applyState(state: State): void {
		this.state = state
		const key = JSON.stringify([
			state.aktiv,
			state.screens.map((s) => [s.id, s.name, s.raum, s.format]),
			state.namen.map((n) => [n.id, n.name, n.raum, n.rolle]),
		])
		if (key !== this.structureKey) {
			this.structureKey = key
			// choices, variable ids and presets depend on screens and names
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			this.updatePresets()
		}
		UpdateVariableValues(this)
		this.checkAllFeedbacks()
	}

	private applyOnline(online: Record<string, boolean>): boolean {
		let changed = false
		for (const s of this.state?.screens ?? []) {
			const now = online[s.id] ?? false
			if (s.online !== now) {
				s.online = now
				changed = true
			}
		}
		return changed
	}

	private setOk(): void {
		this.lastError = ''
		if (!this.state?.aktiv) {
			this.updateStatus(InstanceStatus.UnknownWarning, 'No event active')
		} else if (!this.state.gueltig) {
			this.updateStatus(InstanceStatus.UnknownWarning, 'Licence expired')
		} else {
			this.updateStatus(InstanceStatus.Ok)
		}
	}

	private handleError(e: unknown): void {
		const message = e instanceof Error ? e.message : String(e)
		if (e instanceof ApiError && e.status === 403) {
			this.updateStatus(InstanceStatus.BadConfig, 'Control key invalid or renewed')
		} else {
			this.updateStatus(InstanceStatus.ConnectionFailure, message)
		}
		if (message !== this.lastError) {
			this.log('error', `NextKon Screen: ${message}`)
			this.lastError = message
		}
	}

	private schedulePoll(): void {
		this.stopPolling()
		const interval = Math.min(Math.max(Number(this.config?.pollInterval) || 1000, 500), 10000)
		// back off while the key is invalid or the server is unreachable
		const delay = this.lastError ? Math.max(interval, 5000) : interval
		this.pollTimer = setTimeout(() => void this.poll(), delay)
	}

	private stopPolling(): void {
		if (this.pollTimer) clearTimeout(this.pollTimer)
		this.pollTimer = null
	}
}
