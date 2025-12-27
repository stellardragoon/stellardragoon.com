<script lang="ts">
	import { blur } from 'svelte/transition'

	import type { _State } from './state.svelte'

	const { State = $bindable() }: { State: _State } = $props()

	let dialog: HTMLDialogElement | undefined = $state()
</script>

<div class="absolute top-4 left-4 z-10 font-mono text-white">
	<div>Object 001</div>
	<div>Rotation: {State.rotation.current.toFixed(2)}</div>
	<div>Target: {State.rotation.target.toFixed(2)}</div>
</div>

{#if !State.isModalOpened}
	<button
		class="absolute top-4 right-4 z-10 transition-transform duration-200 ease-out hover:scale-125"
		onclick={() => {
			dialog?.showModal()
			State.isModalOpened = true
		}}
		transition:blur={{ duration: 300 }}
	>
		<img src="/src/lib/assets/favicon.svg" alt="Toggle Right Pane" class="h-16 w-16" />
	</button>
{/if}

<!-- <dialog> defaults to left: 0. need to explicitly set left-auto -->
<dialog
	bind:this={dialog}
	onclose={() => (State.isModalOpened = false)}
	onclick={e => {
		if (e.target === dialog) dialog?.close()
	}}
	class="fixed top-0 right-0 left-auto m-0 h-full max-h-none w-80 border-l border-white/10 bg-zinc-900/95 p-6 text-white focus:outline-none"
>
	<div class="flex flex-col gap-6">
		<div class="border border-white/10 bg-white/5 p-4">
			<div class="mb-3 flex items-baseline justify-between font-mono">
				<div class="text-sm text-white/70">Rotation</div>
				<div class="text-sm text-white tabular-nums">
					{State.rotation.current.toFixed(2)}
					<span class="text-white/40"> → {State.rotation.target.toFixed(2)}</span>
				</div>
			</div>

			<input
				class="w-full accent-white"
				type="range"
				min="0"
				max="10"
				step="0.01"
				value={State.rotation.target}
				oninput={e => State.rotation.set(parseFloat((e.currentTarget as HTMLInputElement).value))}
				aria-label="Rotation"
			/>
		</div>
	</div>
</dialog>
