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
		verseText?: string;
	}

	const BOOK_MAP: Record<string, number> = {
		'창세기':1,'출애굽기':2,'레위기':3,'민수기':4,'신명기':5,
		'여호수아':6,'사사기':7,'룻기':8,'사무엘상':9,'사무엘하':10,
		'열왕기상':11,'열왕기하':12,'역대상':13,'역대하':14,'에스라':15,
		'느헤미야':16,'에스더':17,'욥기':18,'시편':19,'잠언':20,
		'전도서':21,'아가':22,'이사야':23,'예레미야':24,'애가':25,
		'에스겔':26,'다니엘':27,'호세아':28,'요엘':29,'아모스':30,
		'오바댜':31,'요나':32,'미가':33,'나훔':34,'하박국':35,
		'스바냐':36,'학개':37,'스가랴':38,'말라기':39,
		'마태복음':40,'마가복음':41,'누가복음':42,'요한복음':43,'사도행전':44,
		'로마서':45,'고린도전서':46,'고린도후서':47,'갈라디아서':48,'에베소서':49,
		'빌립보서':50,'골로새서':51,'데살로니가전서':52,'데살로니가후서':53,
		'디모데전서':54,'디모데후서':55,'디도서':56,'빌레몬서':57,'히브리서':58,
		'야고보서':59,'베드로전서':60,'베드로후서':61,
		'요한일서':62,'요한이서':63,'요한삼서':64,'유다서':65,'계시록':66,'요한계시록':66
	};

	let items: FeedItem[] = $state([]);
	let loading = $state(true);
	let showCompose = $state(false);
	let composeText = $state('');
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

	function parsePassage(ref: string) {
		const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
		if (!m) return null;
		const bookId = BOOK_MAP[m[1]];
		if (!bookId) return null;
		return { bookId, chapter: +m[2], start: +m[3], end: m[4] ? +m[4] : +m[3] };
	}

	async function loadVerseText(item: FeedItem) {
		if (!item.passage || item.verseText) return;
		const p = parsePassage(item.passage);
		if (!p) return;
		try {
			const res = await fetch(`https://bolls.life/get-chapter/KRV/${p.bookId}/${p.chapter}/`);
			const all: { verse: number; text: string }[] = await res.json();
			const verses = all.filter(v => v.verse >= p.start && v.verse <= p.end);
			item.verseText = verses.map(v => v.text.replace(/<[^>]*>/g, '')).join(' ');
			items = [...items]; // trigger reactivity
		} catch {}
	}

	async function loadFeed() {
		try {
			const res = await fetch(`/api/feed?page=${page}`);
			const data = await res.json();
			if (Array.isArray(data)) {
				items = [...items, ...data];
				hasMore = data.length === 20;
				// 묵상 나눔 항목의 절 본문 로드
				for (const item of data) {
					if (item.type === 'devotion' && item.passage) loadVerseText(item);
				}
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
					type: 'prayer',
					content: composeText.trim(),
					passage: null
				})
			});
			const newItem = await res.json();
			items = [
				{ ...newItem, is_mine: true, reaction_count: 0, my_reaction: null },
				...items
			];
			composeText = '';
			showCompose = false;
		} catch {}
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
			기도제목 나누기
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
						<p class="text-xs font-medium text-primary mb-1">{item.passage}</p>
						{#if item.verseText}
							<p class="text-xs text-text-secondary leading-relaxed mb-2 font-serif bg-bg rounded-lg p-2.5">{item.verseText}</p>
						{/if}
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
				<h2 class="font-bold text-text">기도제목 나누기</h2>
				<button
					onclick={() => (showCompose = false)}
					aria-label="닫기"
					class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-text-secondary"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<textarea
				bind:value={composeText}
				class="w-full rounded-2xl border border-border bg-bg p-4 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
				rows="5"
				placeholder="기도제목을 나눠주세요..."
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
