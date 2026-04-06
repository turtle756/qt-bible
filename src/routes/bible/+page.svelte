<script lang="ts">
	import { onMount } from 'svelte';

	interface Verse {
		pk: number;
		verse: number;
		text: string;
	}

	interface BibleBook {
		id: number;
		nameKr: string;
		nameEn: string;
		chapters: number;
		isOT: boolean;
	}

	interface Translation {
		code: string;
		label: string;
		shortLabel: string;
		type: 'kr' | 'en' | 'orig';
		needsClean?: boolean;
	}

	// KRV는 항상 표시, 비교용 번역본은 최대 1개만 선택 가능
	const COMPARE_TRANSLATIONS: Translation[] = [
		{ code: 'NIV', label: 'NIV', shortLabel: 'NIV', type: 'en' },
		{ code: 'ESV', label: 'ESV', shortLabel: 'ESV', type: 'en' },
		{ code: 'ORIG', label: '원어', shortLabel: '원어', type: 'orig' },
	];

	const books: BibleBook[] = [
		{ id: 1, nameKr: '창세기', nameEn: 'Genesis', chapters: 50, isOT: true },
		{ id: 2, nameKr: '출애굽기', nameEn: 'Exodus', chapters: 40, isOT: true },
		{ id: 3, nameKr: '레위기', nameEn: 'Leviticus', chapters: 27, isOT: true },
		{ id: 4, nameKr: '민수기', nameEn: 'Numbers', chapters: 36, isOT: true },
		{ id: 5, nameKr: '신명기', nameEn: 'Deuteronomy', chapters: 34, isOT: true },
		{ id: 6, nameKr: '여호수아', nameEn: 'Joshua', chapters: 24, isOT: true },
		{ id: 7, nameKr: '사사기', nameEn: 'Judges', chapters: 21, isOT: true },
		{ id: 8, nameKr: '룻기', nameEn: 'Ruth', chapters: 4, isOT: true },
		{ id: 9, nameKr: '사무엘상', nameEn: '1 Samuel', chapters: 31, isOT: true },
		{ id: 10, nameKr: '사무엘하', nameEn: '2 Samuel', chapters: 24, isOT: true },
		{ id: 11, nameKr: '열왕기상', nameEn: '1 Kings', chapters: 22, isOT: true },
		{ id: 12, nameKr: '열왕기하', nameEn: '2 Kings', chapters: 25, isOT: true },
		{ id: 13, nameKr: '역대상', nameEn: '1 Chronicles', chapters: 29, isOT: true },
		{ id: 14, nameKr: '역대하', nameEn: '2 Chronicles', chapters: 36, isOT: true },
		{ id: 15, nameKr: '에스라', nameEn: 'Ezra', chapters: 10, isOT: true },
		{ id: 16, nameKr: '느헤미야', nameEn: 'Nehemiah', chapters: 13, isOT: true },
		{ id: 17, nameKr: '에스더', nameEn: 'Esther', chapters: 10, isOT: true },
		{ id: 18, nameKr: '욥기', nameEn: 'Job', chapters: 42, isOT: true },
		{ id: 19, nameKr: '시편', nameEn: 'Psalms', chapters: 150, isOT: true },
		{ id: 20, nameKr: '잠언', nameEn: 'Proverbs', chapters: 31, isOT: true },
		{ id: 21, nameKr: '전도서', nameEn: 'Ecclesiastes', chapters: 12, isOT: true },
		{ id: 22, nameKr: '아가', nameEn: 'Song of Solomon', chapters: 8, isOT: true },
		{ id: 23, nameKr: '이사야', nameEn: 'Isaiah', chapters: 66, isOT: true },
		{ id: 24, nameKr: '예레미야', nameEn: 'Jeremiah', chapters: 52, isOT: true },
		{ id: 25, nameKr: '예레미야애가', nameEn: 'Lamentations', chapters: 5, isOT: true },
		{ id: 26, nameKr: '에스겔', nameEn: 'Ezekiel', chapters: 48, isOT: true },
		{ id: 27, nameKr: '다니엘', nameEn: 'Daniel', chapters: 12, isOT: true },
		{ id: 28, nameKr: '호세아', nameEn: 'Hosea', chapters: 14, isOT: true },
		{ id: 29, nameKr: '요엘', nameEn: 'Joel', chapters: 3, isOT: true },
		{ id: 30, nameKr: '아모스', nameEn: 'Amos', chapters: 9, isOT: true },
		{ id: 31, nameKr: '오바댜', nameEn: 'Obadiah', chapters: 1, isOT: true },
		{ id: 32, nameKr: '요나', nameEn: 'Jonah', chapters: 4, isOT: true },
		{ id: 33, nameKr: '미가', nameEn: 'Micah', chapters: 7, isOT: true },
		{ id: 34, nameKr: '나훔', nameEn: 'Nahum', chapters: 3, isOT: true },
		{ id: 35, nameKr: '하박국', nameEn: 'Habakkuk', chapters: 3, isOT: true },
		{ id: 36, nameKr: '스바냐', nameEn: 'Zephaniah', chapters: 3, isOT: true },
		{ id: 37, nameKr: '학개', nameEn: 'Haggai', chapters: 2, isOT: true },
		{ id: 38, nameKr: '스가랴', nameEn: 'Zechariah', chapters: 14, isOT: true },
		{ id: 39, nameKr: '말라기', nameEn: 'Malachi', chapters: 4, isOT: true },
		{ id: 40, nameKr: '마태복음', nameEn: 'Matthew', chapters: 28, isOT: false },
		{ id: 41, nameKr: '마가복음', nameEn: 'Mark', chapters: 16, isOT: false },
		{ id: 42, nameKr: '누가복음', nameEn: 'Luke', chapters: 24, isOT: false },
		{ id: 43, nameKr: '요한복음', nameEn: 'John', chapters: 21, isOT: false },
		{ id: 44, nameKr: '사도행전', nameEn: 'Acts', chapters: 28, isOT: false },
		{ id: 45, nameKr: '로마서', nameEn: 'Romans', chapters: 16, isOT: false },
		{ id: 46, nameKr: '고린도전서', nameEn: '1 Corinthians', chapters: 16, isOT: false },
		{ id: 47, nameKr: '고린도후서', nameEn: '2 Corinthians', chapters: 13, isOT: false },
		{ id: 48, nameKr: '갈라디아서', nameEn: 'Galatians', chapters: 6, isOT: false },
		{ id: 49, nameKr: '에베소서', nameEn: 'Ephesians', chapters: 6, isOT: false },
		{ id: 50, nameKr: '빌립보서', nameEn: 'Philippians', chapters: 4, isOT: false },
		{ id: 51, nameKr: '골로새서', nameEn: 'Colossians', chapters: 4, isOT: false },
		{ id: 52, nameKr: '데살로니가전서', nameEn: '1 Thessalonians', chapters: 5, isOT: false },
		{ id: 53, nameKr: '데살로니가후서', nameEn: '2 Thessalonians', chapters: 3, isOT: false },
		{ id: 54, nameKr: '디모데전서', nameEn: '1 Timothy', chapters: 6, isOT: false },
		{ id: 55, nameKr: '디모데후서', nameEn: '2 Timothy', chapters: 4, isOT: false },
		{ id: 56, nameKr: '디도서', nameEn: 'Titus', chapters: 3, isOT: false },
		{ id: 57, nameKr: '빌레몬서', nameEn: 'Philemon', chapters: 1, isOT: false },
		{ id: 58, nameKr: '히브리서', nameEn: 'Hebrews', chapters: 13, isOT: false },
		{ id: 59, nameKr: '야고보서', nameEn: 'James', chapters: 5, isOT: false },
		{ id: 60, nameKr: '베드로전서', nameEn: '1 Peter', chapters: 5, isOT: false },
		{ id: 61, nameKr: '베드로후서', nameEn: '2 Peter', chapters: 3, isOT: false },
		{ id: 62, nameKr: '요한일서', nameEn: '1 John', chapters: 5, isOT: false },
		{ id: 63, nameKr: '요한이서', nameEn: '2 John', chapters: 1, isOT: false },
		{ id: 64, nameKr: '요한삼서', nameEn: '3 John', chapters: 1, isOT: false },
		{ id: 65, nameKr: '유다서', nameEn: 'Jude', chapters: 1, isOT: false },
		{ id: 66, nameKr: '요한계시록', nameEn: 'Revelation', chapters: 22, isOT: false }
	];

	let selectedBook: BibleBook = $state(books[0]);
	let selectedChapter = $state(1);
	let showBookModal = $state(false);
	let modalStep: 'book' | 'chapter' = $state('book');
	let loading = $state(false);

	// 본문 데이터
	let versesKr: Verse[] = $state([]);
	let versesCompare: Verse[] = $state([]);

	// 비교 번역: null이면 꺼짐, 코드가 있으면 해당 번역 표시 (최대 1개)
	let compareCode: string | null = $state(null);

	// Highlights
	let highlightedVerses = $state<Map<number, string>>(new Map());
	let showColorPicker = $state<number | null>(null);
	const colors = ['bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-pink-200', 'bg-orange-200'];

	function getApiCode(code: string): string {
		if (code === 'ORIG') return selectedBook.isOT ? 'WLC' : 'TISCH';
		return code;
	}

	async function loadChapter() {
		loading = true;
		try {
			const res = await fetch(`https://bolls.life/get-chapter/KRV/${selectedBook.id}/${selectedChapter}/`);
			versesKr = await res.json();
		} catch { versesKr = []; }

		if (compareCode) {
			await loadCompare();
		} else {
			versesCompare = [];
		}

		// DB에서 하이라이트 로드
		try {
			const hlRes = await fetch(`/api/v2/highlights?book=${selectedBook.id}&chapter=${selectedChapter}`);
			const hlData: { verse: number; color: string }[] = await hlRes.json();
			const map = new Map<number, string>();
			for (const h of hlData) map.set(h.verse, h.color);
			highlightedVerses = map;
		} catch { highlightedVerses = new Map(); }

		showColorPicker = null;
		loading = false;
	}

	async function loadCompare() {
		if (!compareCode) { versesCompare = []; return; }
		try {
			const apiCode = getApiCode(compareCode);
			const res = await fetch(`https://bolls.life/get-chapter/${apiCode}/${selectedBook.id}/${selectedChapter}/`);
			versesCompare = await res.json();
		} catch { versesCompare = []; }
	}

	function toggleCompare(code: string) {
		if (compareCode === code) {
			compareCode = null;
			versesCompare = [];
		} else {
			compareCode = code;
			loadCompare();
		}
		localStorage.setItem('bibleCompare', compareCode || '');
	}

	onMount(() => {
		const saved = localStorage.getItem('bibleCompare');
		if (saved) compareCode = saved;
		loadChapter();
	});

	function selectBook(book: BibleBook) {
		selectedBook = book;
		modalStep = 'chapter';
	}

	function selectChapter(ch: number) {
		selectedChapter = ch;
		showBookModal = false;
		modalStep = 'book';
		loadChapter();
	}

	function toggleHighlight(verseNum: number) {
		if (highlightedVerses.has(verseNum)) {
			showColorPicker = null;
			const next = new Map(highlightedVerses);
			next.delete(verseNum);
			highlightedVerses = next;
			// DB 삭제
			fetch('/api/v2/highlights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bookId: selectedBook.id, chapter: selectedChapter, verse: verseNum, color: null })
			}).catch(() => {});
		} else {
			showColorPicker = verseNum;
		}
	}

	function applyColor(verseNum: number, color: string) {
		const next = new Map(highlightedVerses);
		next.set(verseNum, color);
		highlightedVerses = next;
		showColorPicker = null;
		// DB 저장
		fetch('/api/v2/highlights', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ bookId: selectedBook.id, chapter: selectedChapter, verse: verseNum, color })
		}).catch(() => {});
	}

	function getCompareLabel(): string {
		return COMPARE_TRANSLATIONS.find(t => t.code === compareCode)?.label || '';
	}
</script>

<div class="space-y-4">
	<!-- Book/Chapter selector -->
	<div class="flex items-center gap-3">
		<button
			onclick={() => {
				modalStep = 'book';
				showBookModal = true;
			}}
			class="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-2xl shadow-sm text-sm font-medium text-text hover:bg-bg transition-colors"
		>
			<span>{selectedBook.nameKr} {selectedChapter}장</span>
			<svg class="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		<!-- Prev/Next chapter -->
		<div class="flex items-center gap-1 ml-auto">
			<button
				onclick={() => {
					if (selectedChapter > 1) {
						selectedChapter--;
						loadChapter();
					}
				}}
				disabled={selectedChapter <= 1}
				aria-label="이전 장"
				class="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-bg disabled:opacity-30 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
			</button>
			<button
				onclick={() => {
					if (selectedChapter < selectedBook.chapters) {
						selectedChapter++;
						loadChapter();
					}
				}}
				disabled={selectedChapter >= selectedBook.chapters}
				aria-label="다음 장"
				class="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-bg disabled:opacity-30 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- 비교 번역 선택 (기본 꺼짐, 최대 1개) -->
	<div class="flex items-center gap-2">
		<span class="text-xs text-text-secondary">비교:</span>
		{#each COMPARE_TRANSLATIONS as trans}
			<button
				onclick={() => toggleCompare(trans.code)}
				class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all {compareCode === trans.code
					? 'border-primary bg-primary-bg text-primary'
					: 'border-border text-text-secondary hover:border-primary/30'}"
			>
				{trans.shortLabel}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else if compareCode}
		<!-- 비교 모드: Desktop 나란히, Mobile 절별 대조 -->

		<!-- Desktop: 2컬럼 -->
		<div class="hidden md:grid md:grid-cols-2 gap-4">
			<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm">
				<h3 class="text-xs font-semibold text-text-secondary mb-3">개역한글</h3>
				<div class="space-y-1 font-serif">
					{#each versesKr as v}
						<button
							type="button"
							class="w-full text-left text-sm leading-7 rounded-lg px-2 py-0.5 cursor-pointer transition-colors {highlightedVerses.has(v.verse)
								? highlightedVerses.get(v.verse)
								: 'hover:bg-verse-hover'}"
							onclick={() => toggleHighlight(v.verse)}
						>
							<span class="text-xs font-bold text-primary mr-1 font-sans">{v.verse}</span>
							<span>{@html v.text}</span>
						</button>
						{#if showColorPicker === v.verse}
							<div class="flex items-center gap-2 px-2 py-1.5">
								{#each colors as color}
									<button
										onclick={() => applyColor(v.verse, color)}
										aria-label="하이라이트 색상" class="w-6 h-6 rounded-full border border-border {color}"
									></button>
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			</div>
			<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm">
				<h3 class="text-xs font-semibold text-text-secondary mb-3">{getCompareLabel()}</h3>
				<div class="space-y-1 font-serif">
					{#each versesCompare as v}
						<button
							type="button"
							class="w-full text-left text-sm leading-7 rounded-lg px-2 py-0.5 cursor-pointer transition-colors {highlightedVerses.has(v.verse)
								? highlightedVerses.get(v.verse)
								: 'hover:bg-verse-hover'}"
							onclick={() => toggleHighlight(v.verse)}
						>
							<span class="text-xs font-bold text-primary mr-1 font-sans">{v.verse}</span>
							<span>{@html v.text}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Mobile: 절별 대조 -->
		<div class="md:hidden bg-surface rounded-2xl border border-border p-4 shadow-sm">
			<div class="space-y-3 font-serif">
				{#each versesKr as v}
					{@const compareVerse = versesCompare.find((c: Verse) => c.verse === v.verse)}
					<div
						role="button"
						tabindex="0"
						class="rounded-xl px-2 py-2 cursor-pointer transition-colors {highlightedVerses.has(v.verse)
							? highlightedVerses.get(v.verse)
							: 'hover:bg-verse-hover'}"
						onclick={() => toggleHighlight(v.verse)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleHighlight(v.verse); }}
					>
						<span class="text-xs font-bold text-primary font-sans">{v.verse}</span>
						<p class="text-sm leading-7 text-text">{@html v.text}</p>
						{#if compareVerse}
							<p class="text-sm leading-7 text-text-secondary mt-0.5">
								<span class="text-[10px] font-semibold text-text-secondary/60 font-sans mr-1">{getCompareLabel()}</span>
								{@html compareVerse.text}
							</p>
						{/if}
					</div>
					{#if showColorPicker === v.verse}
						<div class="flex items-center gap-2 px-2 py-1.5">
							{#each colors as color}
								<button
									onclick={() => applyColor(v.verse, color)}
									aria-label="하이라이트 색상" class="w-6 h-6 rounded-full border border-border {color}"
								></button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{:else}
		<!-- 단일 번역 (KRV만) -->
		<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm">
			<div class="space-y-1 font-serif">
				{#each versesKr as v}
					<button
						type="button"
						class="w-full text-left text-sm leading-7 rounded-lg px-2 py-0.5 cursor-pointer transition-colors {highlightedVerses.has(v.verse)
							? highlightedVerses.get(v.verse)
							: 'hover:bg-verse-hover'}"
						onclick={() => toggleHighlight(v.verse)}
					>
						<span class="text-xs font-bold text-primary mr-1 font-sans">{v.verse}</span>
						<span>{@html v.text}</span>
					</button>
					{#if showColorPicker === v.verse}
						<div class="flex items-center gap-2 px-2 py-1.5">
							{#each colors as color}
								<button
									onclick={() => applyColor(v.verse, color)}
									aria-label="하이라이트 색상" class="w-6 h-6 rounded-full border border-border {color}"
								></button>
							{/each}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Book/Chapter Selection Modal -->
{#if showBookModal}
	<div class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
		<div
			class="bg-surface rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
		>
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h2 class="font-bold text-text">
					{modalStep === 'book' ? '성경 선택' : `${selectedBook.nameKr} - 장 선택`}
				</h2>
				<button
					onclick={() => {
						showBookModal = false;
						modalStep = 'book';
					}}
					aria-label="닫기"
					class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-text-secondary"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div class="overflow-y-auto p-4">
				{#if modalStep === 'book'}
					<div class="mb-3">
						<h3 class="text-xs font-semibold text-text-secondary mb-2">구약</h3>
						<div class="grid grid-cols-4 gap-2">
							{#each books.filter((b) => b.isOT) as book}
								<button
									onclick={() => selectBook(book)}
									class="py-2 rounded-xl border text-xs font-medium transition-all {selectedBook.id === book.id
										? 'border-primary bg-primary-bg text-primary'
										: 'border-border text-text hover:border-primary/30'}"
								>
									{book.nameKr}
								</button>
							{/each}
						</div>
					</div>
					<div>
						<h3 class="text-xs font-semibold text-text-secondary mb-2">신약</h3>
						<div class="grid grid-cols-4 gap-2">
							{#each books.filter((b) => !b.isOT) as book}
								<button
									onclick={() => selectBook(book)}
									class="py-2 rounded-xl border text-xs font-medium transition-all {selectedBook.id === book.id
										? 'border-primary bg-primary-bg text-primary'
										: 'border-border text-text hover:border-primary/30'}"
								>
									{book.nameKr}
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="grid grid-cols-6 gap-2">
						{#each Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) as ch}
							<button
								onclick={() => selectChapter(ch)}
								class="py-2.5 rounded-xl border text-sm font-medium transition-all {selectedChapter === ch
									? 'border-primary bg-primary-bg text-primary'
									: 'border-border text-text hover:border-primary/30'}"
							>
								{ch}
							</button>
						{/each}
					</div>
					<button
						onclick={() => (modalStep = 'book')}
						class="mt-4 w-full py-2.5 border border-border text-text-secondary text-sm rounded-2xl hover:bg-bg transition-colors"
					>
						다른 책 선택
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
