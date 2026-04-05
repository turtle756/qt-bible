<script lang="ts">
	import { onMount } from 'svelte';

	// Types
	interface QtData {
		passage_ref: string;
		title: string;
		commentary: string;
		keyword: string;
		question: string;
		prayer: string;
		already_completed: boolean;
	}

	interface ProfileData {
		streak: number;
		best_streak: number;
		total_days: number;
		maturity: 'exploring' | 'growing' | 'close' | 'centered';
	}

	interface Card {
		id: string;
		question: string;
		type: string;
	}

	interface Verse {
		pk: number;
		verse: number;
		text: string;
	}

	// Bible book mapping for bolls.life
	const bookMap: Record<string, number> = {
		'창': 1, '출': 2, '레': 3, '민': 4, '신': 5, '수': 6, '삿': 7, '룻': 8,
		'삼상': 9, '삼하': 10, '왕상': 11, '왕하': 12, '대상': 13, '대하': 14,
		'스': 15, '느': 16, '에': 17, '욥': 18, '시': 19, '잠': 20, '전': 21,
		'아': 22, '사': 23, '렘': 24, '애': 25, '겔': 26, '단': 27, '호': 28,
		'욜': 29, '암': 30, '옵': 31, '욘': 32, '미': 33, '나': 34, '합': 35,
		'습': 36, '학': 37, '슥': 38, '말': 39,
		'마': 40, '막': 41, '눅': 42, '요': 43, '행': 44,
		'롬': 45, '고전': 46, '고후': 47, '갈': 48, '엡': 49, '빌': 50,
		'골': 51, '살전': 52, '살후': 53, '딤전': 54, '딤후': 55, '딛': 56,
		'몬': 57, '히': 58, '약': 59, '벧전': 60, '벧후': 61,
		'요일': 62, '요이': 63, '요삼': 64, '유': 65, '계': 66
	};

	let qt: QtData | null = $state(null);
	let profile: ProfileData | null = $state(null);
	let cards: Card[] = $state([]);
	let verses: Verse[] = $state([]);
	let loading = $state(true);
	let noteText = $state('');
	let showCelebration = $state(false);
	let highlightedVerses = $state<Set<number>>(new Set());
	let cardResponses = $state<Record<string, string>>({});

	function parsePassageRef(ref: string): { bookId: number; chapter: number; startVerse?: number; endVerse?: number } | null {
		// e.g. "시 119:1-16" or "창 1:1-31" or "요 3"
		const match = ref.match(/^(\S+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?/);
		if (!match) return null;
		const abbr = match[1];
		const bookId = bookMap[abbr];
		if (!bookId) return null;
		return {
			bookId,
			chapter: parseInt(match[2]),
			startVerse: match[3] ? parseInt(match[3]) : undefined,
			endVerse: match[4] ? parseInt(match[4]) : undefined
		};
	}

	onMount(async () => {
		// Auth check
		const meRes = await fetch('/api/me');
		const me = await meRes.json();
		if (!me.loggedIn) {
			window.location.href = '/login';
			return;
		}

		// Load data in parallel
		const [qtRes, profileRes, cardsRes] = await Promise.all([
			fetch('/api/v2/daily-qt'),
			fetch('/api/v2/profile'),
			fetch('/api/v2/daily-cards')
		]);

		qt = await qtRes.json();
		profile = await profileRes.json();
		cards = await cardsRes.json();

		// Check onboarding
		if (!profile?.maturity) {
			window.location.href = '/onboarding';
			return;
		}

		// Load Bible passage
		if (qt?.passage_ref) {
			const parsed = parsePassageRef(qt.passage_ref);
			if (parsed) {
				try {
					const bibleRes = await fetch(
						`https://bolls.life/get-chapter/KRV/${parsed.bookId}/${parsed.chapter}/`
					);
					let allVerses: Verse[] = await bibleRes.json();
					if (parsed.startVerse && parsed.endVerse) {
						allVerses = allVerses.filter(
							(v) => v.verse >= parsed.startVerse! && v.verse <= parsed.endVerse!
						);
					}
					verses = allVerses;
				} catch {
					verses = [];
				}
			}
		}

		loading = false;
	});

	function toggleHighlight(verseNum: number) {
		const next = new Set(highlightedVerses);
		if (next.has(verseNum)) next.delete(verseNum);
		else next.add(verseNum);
		highlightedVerses = next;
	}

	async function saveNote() {
		if (!noteText.trim()) return;
		await fetch('/api/v2/qt-complete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ note: noteText, card_responses: cardResponses })
		});
		showCelebration = true;
	}

	function getMaturityLabel(m: string) {
		const labels: Record<string, string> = {
			exploring: '탐색기',
			growing: '성장기',
			close: '친밀기',
			centered: '중심기'
		};
		return labels[m] || m;
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if qt}
	<div class="space-y-6 pb-8">
		<!-- Banner -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-text-secondary">오늘의 말씀</p>
					<h1 class="text-lg font-bold text-text mt-1">{qt.title || qt.passage_ref}</h1>
				</div>
				<div class="flex items-center gap-1.5 text-primary">
					{#if qt.already_completed}
						<span class="text-xs font-medium bg-primary-bg px-3 py-1.5 rounded-full">오늘의 묵상 완료</span>
					{:else if profile && profile.streak > 0}
						<span class="text-lg">&#x1F525;</span>
						<span class="text-sm font-bold">{profile.streak}일 연속</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Bible Passage Viewer -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<h2 class="text-sm font-semibold text-text-secondary mb-3">{qt.passage_ref}</h2>
			<div class="space-y-1">
				{#each verses as v}
					<p
						class="text-sm leading-7 cursor-pointer rounded-lg px-2 py-0.5 transition-colors {highlightedVerses.has(
							v.verse
						)
							? 'bg-primary-bg'
							: 'hover:bg-verse-hover'}"
						onclick={() => toggleHighlight(v.verse)}
					>
						<span class="text-xs font-bold text-primary mr-1.5">{v.verse}</span>
						<span class="text-text">{@html v.text}</span>
					</p>
				{/each}
			</div>
		</div>

		<!-- Meditation Guide -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<h2 class="text-sm font-semibold text-text-secondary mb-3">
				묵상 가이드 ({getMaturityLabel(profile?.maturity || 'exploring')})
			</h2>
			<div class="space-y-4 text-sm text-text leading-relaxed">
				{#if qt.commentary}
					<div>
						<h3 class="font-semibold text-primary mb-1">해설</h3>
						<p>{qt.commentary}</p>
					</div>
				{/if}
				{#if qt.keyword}
					<div>
						<h3 class="font-semibold text-primary mb-1">핵심 키워드</h3>
						<p>{qt.keyword}</p>
					</div>
				{/if}
				{#if qt.question}
					<div>
						<h3 class="font-semibold text-primary mb-1">묵상 질문</h3>
						<p>{qt.question}</p>
					</div>
				{/if}
				{#if qt.prayer}
					<div>
						<h3 class="font-semibold text-primary mb-1">기도 안내</h3>
						<p>{qt.prayer}</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Question Cards -->
		{#if cards.length > 0}
			<div class="space-y-3">
				<h2 class="text-sm font-semibold text-text-secondary">오늘의 질문</h2>
				{#each cards as card}
					<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
						<p class="text-sm font-medium text-text mb-3">{card.question}</p>
						<textarea
							class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
							rows="2"
							placeholder="나의 생각을 적어보세요..."
							bind:value={cardResponses[card.id]}
						></textarea>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Meditation Note -->
		{#if !qt.already_completed}
			<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
				<h2 class="text-sm font-semibold text-text-secondary mb-3">
					묵상 노트
					{#if profile?.maturity === 'growing'}
						<span class="text-xs text-text-secondary/70 font-normal ml-1">(SOAP)</span>
					{:else if profile?.maturity === 'close'}
						<span class="text-xs text-text-secondary/70 font-normal ml-1">(관찰-해석-적용)</span>
					{:else if profile?.maturity === 'centered'}
						<span class="text-xs text-text-secondary/70 font-normal ml-1">(렉시오 디비나)</span>
					{/if}
				</h2>

				{#if profile?.maturity === 'growing'}
					<div class="space-y-3">
						<div>
							<label class="text-xs font-medium text-text-secondary">S - Scripture (말씀)</label>
							<textarea
								class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
								rows="2"
								placeholder="마음에 와 닿는 구절을 적어보세요..."
								oninput={(e) => (noteText = `[S] ${(e.target as HTMLTextAreaElement).value}\n${noteText.replace(/^\[S\].*\n?/, '')}`)}
							></textarea>
						</div>
						<div>
							<label class="text-xs font-medium text-text-secondary">O - Observation (관찰)</label>
							<textarea
								class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
								rows="2"
								placeholder="이 말씀은 무엇을 말하고 있나요?"
							></textarea>
						</div>
						<div>
							<label class="text-xs font-medium text-text-secondary">A - Application (적용)</label>
							<textarea
								class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
								rows="2"
								placeholder="오늘 내 삶에 어떻게 적용할 수 있을까요?"
							></textarea>
						</div>
						<div>
							<label class="text-xs font-medium text-text-secondary">P - Prayer (기도)</label>
							<textarea
								class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
								rows="2"
								placeholder="말씀을 통해 기도해보세요..."
								oninput={(e) => {
									// Combine all SOAP fields
									const allTextareas = (e.target as HTMLTextAreaElement).closest('.space-y-3')?.querySelectorAll('textarea');
									if (allTextareas) {
										const parts = Array.from(allTextareas).map((ta, i) => {
											const labels = ['S', 'O', 'A', 'P'];
											return `[${labels[i]}] ${ta.value}`;
										});
										noteText = parts.filter((p) => p.length > 4).join('\n');
									}
								}}
							></textarea>
						</div>
					</div>
				{:else if profile?.maturity === 'close'}
					<div class="space-y-3">
						{#each ['관찰: 본문이 말하는 사실은?', '해석: 저자의 의도는?', '적용: 오늘 내 삶에?'] as placeholder, i}
							<textarea
								class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
								rows="3"
								{placeholder}
								oninput={(e) => {
									const allTextareas = (e.target as HTMLTextAreaElement).closest('.space-y-3')?.querySelectorAll('textarea');
									if (allTextareas) {
										noteText = Array.from(allTextareas).map((ta) => ta.value).filter(Boolean).join('\n---\n');
									}
								}}
							></textarea>
						{/each}
					</div>
				{:else if profile?.maturity === 'centered'}
					<div class="space-y-3">
						{#each [
							{ label: 'Lectio (읽기)', ph: '천천히 말씀을 읽으세요...' },
							{ label: 'Meditatio (묵상)', ph: '마음에 와 닿는 단어나 구절에 머무르세요...' },
							{ label: 'Oratio (기도)', ph: '말씀을 통해 하나님께 응답하세요...' },
							{ label: 'Contemplatio (관상)', ph: '고요 속에 하나님의 임재를 느껴보세요...' }
						] as step}
							<div>
								<label class="text-xs font-medium text-text-secondary">{step.label}</label>
								<textarea
									class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
									rows="2"
									placeholder={step.ph}
									oninput={(e) => {
										const allTextareas = (e.target as HTMLTextAreaElement).closest('.space-y-3')?.querySelectorAll('textarea');
										if (allTextareas) {
											noteText = Array.from(allTextareas).map((ta) => ta.value).filter(Boolean).join('\n---\n');
										}
									}}
								></textarea>
							</div>
						{/each}
					</div>
				{:else}
					<!-- exploring: free form -->
					<textarea
						class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
						rows="5"
						placeholder="오늘의 말씀을 통해 느낀 점을 자유롭게 적어보세요..."
						bind:value={noteText}
					></textarea>
				{/if}

				<button
					onclick={saveNote}
					class="mt-4 w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm"
				>
					묵상 완료
				</button>
			</div>
		{/if}
	</div>

	<!-- Celebration Popup -->
	{#if showCelebration}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div class="bg-surface rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-lg">
				<div class="text-5xl mb-4">&#x271D;</div>
				<h2 class="text-xl font-bold text-text mb-2">오늘의 묵상을 완료했습니다!</h2>
				<p class="text-sm text-text-secondary mb-1">하나님과 함께한 시간, 감사합니다.</p>
				{#if profile}
					<p class="text-sm font-semibold text-primary mb-6">
						&#x1F525; {profile.streak + 1}일 연속 묵상 중
					</p>
				{/if}
				<button
					onclick={() => {
						showCelebration = false;
						window.location.reload();
					}}
					class="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors"
				>
					아멘
				</button>
			</div>
		</div>
	{/if}
{/if}
