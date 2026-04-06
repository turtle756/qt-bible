<script lang="ts">
	import { onMount } from 'svelte';

	interface FeedItem {
		id: string;
		type: 'devotion' | 'prayer';
		content: string;
		passage: string | null;
		created_at: string;
		is_mine: boolean;
		reaction_count: number;
		my_reaction: string | null;
	}

	let items: FeedItem[] = $state([]);
	let loading = $state(true);
	let showCompose = $state(false);
	let composeType: 'devotion' | 'prayer' = $state('devotion');
	let composeText = $state('');
	let composePassage = $state('');
	let posting = $state(false);
	let page = $state(1);
	let hasMore = $state(true);
	let loadingMore = $state(false);

	onMount(async () => {
		const meRes = await fetch('/api/me');
		const me = await meRes.json();
		if (!me.loggedIn) {
			window.location.href = '/login';
			return;
		}
		await loadFeed();
		loading = false;
	});

	async function loadFeed() {
		try {
			const res = await fetch(`/api/feed?page=${page}`);
			const data = await res.json();
			if (Array.isArray(data)) {
				items = [...items, ...data];
				hasMore = data.length === 20;
			} else {
				hasMore = false;
			}
		} catch {
			hasMore = false;
		}
	}

	async function loadMore() {
		loadingMore = true;
		page++;
		await loadFeed();
		loadingMore = false;
	}

	async function post() {
		if (!composeText.trim()) return;
		posting = true;
		try {
			const res = await fetch('/api/feed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: composeType,
					content: composeText.trim(),
					passage: composePassage.trim() || null
				})
			});
			const newItem = await res.json();
			items = [
				{ ...newItem, is_mine: true, reaction_count: 0, my_reaction: null },
				...items
			];
			composeText = '';
			composePassage = '';
			showCompose = false;
		} catch {
			// ignore
		}
		posting = false;
	}

	async function react(itemId: string) {
		try {
			const res = await fetch(`/api/feed/${itemId}/react`, { method: 'POST' });
			const data = await res.json();
			items = items.map((item) =>
				item.id === itemId
					? { ...item, reaction_count: data.count, my_reaction: data.reacted ? 'pray' : null }
					: item
			);
		} catch {
			// ignore
		}
	}

	async function deletePost(id: string) {
		if (!confirm('이 글을 삭제하시겠습니까?')) return;
		try {
			await fetch(`/api/feed/${id}`, { method: 'DELETE' });
			items = items.filter(item => item.id !== id);
		} catch {}
	}

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return '방금 전';
		if (mins < 60) return `${mins}분 전`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}시간 전`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}일 전`;
		return `${Math.floor(days / 30)}달 전`;
	}
</script>

<div class="space-y-4 pb-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-bold text-text">나눔</h1>
		<button
			onclick={() => (showCompose = true)}
			class="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm"
		>
			글쓰기
		</button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if items.length === 0}
		<div class="text-center py-20">
			<p class="text-text-secondary text-sm">아직 나눔이 없습니다.</p>
			<p class="text-text-secondary text-xs mt-1">첫 번째 나눔을 작성해보세요!</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each items as item}
				<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
					<div class="flex items-center justify-between mb-3">
						<div class="flex items-center gap-2">
							<span
								class="text-xs font-medium px-2.5 py-1 rounded-full {item.type === 'prayer'
									? 'bg-blue-50 text-blue-600'
									: 'bg-primary-bg text-primary'}"
							>
								{item.type === 'prayer' ? '기도제목' : '묵상 나눔'}
							</span>
							{#if item.is_mine}
								<span class="text-xs text-text-secondary/50">내 글</span>
								<button onclick={() => deletePost(item.id)} class="text-xs text-red-400 hover:text-red-500 transition-colors">삭제</button>
							{/if}
						</div>
						<span class="text-xs text-text-secondary">{timeAgo(item.created_at)}</span>
					</div>
					{#if item.passage}
						<p class="text-xs font-medium text-primary mb-2">{item.passage}</p>
					{/if}
					<p class="text-sm text-text leading-relaxed whitespace-pre-wrap">{item.content}</p>
					<div class="mt-3 flex items-center">
						<button
							onclick={() => react(item.id)}
							class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors {item.my_reaction
								? 'bg-primary-bg text-primary'
								: 'bg-bg text-text-secondary hover:bg-primary-bg/50'}"
						>
							<span>&#x1F64F;</span>
							<span>기도했습니다</span>
							{#if item.reaction_count > 0}
								<span class="font-bold">{item.reaction_count}</span>
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>

		{#if hasMore}
			<div class="flex justify-center pt-2 pb-4">
				<button
					onclick={loadMore}
					disabled={loadingMore}
					class="px-6 py-2.5 border border-border text-text-secondary text-sm font-medium rounded-2xl hover:bg-bg transition-colors disabled:opacity-50"
				>
					{loadingMore ? '로딩 중...' : '더 보기'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<!-- Compose Modal -->
{#if showCompose}
	<div class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
		<div class="bg-surface rounded-t-2xl md:rounded-2xl w-full max-w-lg p-5">
			<div class="flex items-center justify-between mb-4">
				<h2 class="font-bold text-text">나눔 작성</h2>
				<button
					onclick={() => (showCompose = false)}
					class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-text-secondary"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Type selector -->
			<div class="flex gap-2 mb-4">
				{#each [
					{ key: 'devotion', label: '묵상 나눔' },
					{ key: 'prayer', label: '기도제목' }
				] as t}
					<button
						onclick={() => (composeType = t.key as 'devotion' | 'prayer')}
						class="flex-1 py-2 rounded-2xl border text-sm font-medium transition-all {composeType === t.key
							? 'border-primary bg-primary-bg text-primary'
							: 'border-border text-text-secondary'}"
					>
						{t.label}
					</button>
				{/each}
			</div>

			{#if composeType === 'devotion'}
				<input
					type="text"
					bind:value={composePassage}
					placeholder="말씀 구절 (예: 시편 23편)"
					class="w-full px-4 py-2.5 rounded-xl border border-border bg-bg text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
				/>
			{/if}

			<textarea
				bind:value={composeText}
				class="w-full rounded-2xl border border-border bg-bg p-4 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
				rows="5"
				placeholder={composeType === 'prayer'
					? '기도제목을 나눠주세요...'
					: '오늘의 묵상을 나눠주세요...'}
			></textarea>

			<p class="text-xs text-text-secondary mt-2 mb-4">익명으로 게시됩니다.</p>

			<button
				onclick={post}
				disabled={!composeText.trim() || posting}
				class="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm disabled:opacity-40"
			>
				{posting ? '게시 중...' : '게시하기'}
			</button>
		</div>
	</div>
{/if}
