import { cubicInOut } from 'svelte/easing'
import { Tween } from 'svelte/motion'

export const State = $state({
	rotation: new Tween(0, { duration: 2000, easing: cubicInOut }),
	isModalOpened: false
})

export type _State = typeof State
