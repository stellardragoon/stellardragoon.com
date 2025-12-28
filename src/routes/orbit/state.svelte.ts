import { cubicInOut } from 'svelte/easing'
import { Tween } from 'svelte/motion'
import { postprocessings } from './(postprocessings_data)/postprocessings'

export const STATE = $state({
	rotation: new Tween(0, { duration: 2000, easing: cubicInOut }),
	postprocessings: postprocessings as any[],
	logo: {
		floatY: 0,
		tiltX: 0,
		tiltZ: 0
	}
})

export type _State = typeof STATE
