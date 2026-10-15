/** Role of a name sign: lectern (portrait), moderation/chair (ProArt strip) or both */
export type Role = 'pult' | 'mod' | 'beide'

/** Screen format: portrait lectern, landscape screen, ASUS ProArt table strip */
export type ScreenFormat = 'hoch' | 'quer' | 'proart'

export interface Screen {
	id: string
	name: string
	raum: string
	format: ScreenFormat
	/** Name id, 'LEER' (logo only) or null (black) */
	inhalt: string | null
	online: boolean
}

export interface Name {
	id: string
	name: string
	zeile2: string
	raum: string
	rolle: Role
}

export interface State {
	v: number
	aktiv: string | null
	titel: string
	raeume: string[]
	gueltig: boolean
	screens: Screen[]
	namen: Name[]
	online: Record<string, boolean>
}

interface Unchanged {
	gleich: true
	v: number
	online: Record<string, boolean>
}

export class ApiError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
	}
}

/** Thin client for the NextKon Screen control API (authenticated by the control key, plain GET requests) */
export class ScreenApi {
	constructor(
		private readonly host: string,
		private readonly key: string,
	) {}

	private async get<T>(path: string, params: Record<string, string>): Promise<T> {
		const query = new URLSearchParams({ zugang: this.key, ...params })
		let res: Response
		try {
			res = await fetch(`${this.host}${path}?${query.toString()}`, {
				headers: { Accept: 'application/json' },
				signal: AbortSignal.timeout(5000),
			})
		} catch (e) {
			throw new ApiError(e instanceof Error ? e.message : String(e), 0)
		}
		let body: unknown = null
		try {
			body = await res.json()
		} catch {
			// non-JSON answer, handled below
		}
		if (!res.ok) {
			const message = (body as { fehler?: string } | null)?.fehler ?? `HTTP ${res.status}`
			throw new ApiError(message, res.status)
		}
		return body as T
	}

	/** Full state, or only the online flags when `knownVersion` is still current */
	async state(knownVersion?: number): Promise<State | Unchanged> {
		return this.get<State | Unchanged>('/api/s/stand', knownVersion === undefined ? {} : { v: String(knownVersion) })
	}

	/** content: name id, 'LEER' (logo only) or 'AUS' (black) */
	async show(screen: string, content: string): Promise<void> {
		await this.get('/api/s/setzen', { screen, name: content })
	}

	async swap(a: string, b: string): Promise<void> {
		await this.get('/api/s/tauschen', { a, b })
	}
}

export function isUnchanged(r: State | Unchanged): r is Unchanged {
	return (r as Unchanged).gleich === true
}

/** Same rule as the server: lectern takes lectern signs, ProArt takes moderation signs, landscape takes all */
export function fits(format: ScreenFormat, role: Role): boolean {
	if (format === 'hoch') return role === 'pult' || role === 'beide'
	if (format === 'proart') return role === 'mod' || role === 'beide'
	return true
}

/** A name belongs to a screen if it fits the format and has no room or the screen's room */
export function namesFor(state: State, screen: Screen): Name[] {
	return state.namen.filter((n) => fits(screen.format, n.rolle) && (!n.raum || !screen.raum || n.raum === screen.raum))
}
