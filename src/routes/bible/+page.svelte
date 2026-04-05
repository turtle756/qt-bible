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

	let versesKr: Verse[] = $state([]);
	let versesEn: Verse[] = $state([]);
	let versesOrig: Verse[] = $state([]);
	let loading = $state(false);

	// Mobile tab
	let activeTab: 'kr' | 'en' | 'orig' = $state('kr');

	// Highlights
	let highlightedVerses = $state<Map<number, string>>(new Map());
	let showColorPicker = $state<number | null>(null);
	const colors = ['bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-pink-200', 'bg-orange-200'];

	async function loadChapter() {
		loading = true;
		const origCode = selectedBook.isOT ? 'OHHB' : 'NTGK';

		try {
			const [krRes, enRes, origRes] = await Promise.all([
				fetch(`https://bolls.life/get-chapter/KRV/${selectedBook.id}/${selectedChapter}/`),
				fetch(`https://bolls.life/get-chapter/KJV/${selectedBook.id}/${selectedChapter}/`),
				fetch(`https://bolls.life/get-chapter/${origCode}/${selectedBook.id}/${selectedChapter}/`)
			]);
			versesKr = await krRes.json();
			versesEn = await enRes.json();
			versesOrig = await origRes.json();
		} catch {
			versesKr = [];
			versesEn = [];
			versesOrig = [];
		}
		loading = false;
	}

	onMount(() => {
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
		} else {
			showColorPicker = verseNum;
		}
	}

	function applyColor(verseNum: number, color: string) {
		const next = new Map(highlightedVerses);
		next.set(verseNum, color);
		highlightedVerses = next;
		showColorPicker = null;
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
				class="w-9 h-9 flex items-center justify-center rounded-xl border border-border text-text-secondary hover:bg-bg disabled:opacity-30 transition-colors"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile: Language tabs -->
	<div class="md:hidden flex rounded-2xl border border-border overflow-hidden">
		{#each [
			{ key: 'kr', label: '한국어' },
			{ key: 'en', label: 'English' },
			{ key: 'orig', label: '원어' }
		] as tab}
			<button
				onclick={() => (activeTab = tab.key as 'kr' | 'en' | 'orig')}
				class="flex-1 py-2.5 text-sm font-medium transition-colors {activeTab === tab.key
					? 'bg-primary text-white'
					: 'bg-surface text-text-secondary hover:bg-bg'}"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-20">
			<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		</div>
	{:else}
		<!-- Desktop: 3 columns -->
		<div class="hidden md:grid md:grid-cols-3 gap-4">
			{#each [
				{ label: '한국어 (개역한글)', verses: versesKr },
				{ label: 'English (KJV)', verses: versesEn },
				{ label: '원어', verses: versesOrig }
			] as col}
				<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm">
					<h3 class="text-xs font-semibold text-text-secondary mb-3">{col.label}</h3>
					<div class="space-y-1">
						{#each col.verses as v}
							<p
								class="text-sm leading-7 rounded-lg px-2 py-0.5 cursor-pointer transition-colors {highlightedVerses.has(
									v.verse
								)
									? highlightedVerses.get(v.verse)
									: 'hover:bg-verse-hover'}"
								onclick={() => toggleHighlight(v.verse)}
							>
								<span class="text-xs font-bold text-primary mr-1">{v.verse}</span>
								<span>{@html v.text}</span>
							</p>
							{#if showColorPicker === v.verse}
								<div class="flex items-center gap-2 px-2 py-1.5">
									{#each colors as color}
										<button
											onclick={() => applyColor(v.verse, color)}
											class="w-6 h-6 rounded-full border border-border {color}"
										></button>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- Mobile: single column based on active tab -->
		<div class="md:hidden bg-surface rounded-2xl border border-border p-4 shadow-sm">
			{#if activeTab === 'kr' || activeTab === 'en' || activeTab === 'orig'}
			{@const activeVerses = activeTab === 'kr' ? versesKr : activeTab === 'en' ? versesEn : versesOrig}
			<div class="space-y-1 relative">
				{#each activeVerses as v}
					<div class="relative">
						<p
							class="text-sm leading-7 rounded-lg px-2 py-0.5 cursor-pointer transition-colors {highlightedVerses.has(
								v.verse
							)
								? highlightedVerses.get(v.verse)
								: 'hover:bg-verse-hover'}"
							onclick={() => toggleHighlight(v.verse)}
						>
							<span class="text-xs font-bold text-primary mr-1">{v.verse}</span>
							<span>{@html v.text}</span>
						</p>
						{#if showColorPicker === v.verse}
							<div class="flex items-center gap-2 px-2 py-1.5">
								{#each colors as color}
									<button
										onclick={() => applyColor(v.verse, color)}
										class="w-6 h-6 rounded-full border border-border {color}"
									></button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
			{/if}
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
