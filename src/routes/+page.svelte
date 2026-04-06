<script lang="ts">
	import { onMount } from 'svelte';

	interface Verse { pk: number; verse: number; text: string; }

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

	let qt: any = $state(null);
	let profile: any = $state(null);
	let verses: Verse[] = $state([]);
	let loading = $state(true);
	let noteText = $state('');
	let questionNote = $state('');
	let showCelebration = $state(false);
	let celebrationStreak = $state(0);
	let dataLoaded = $state(false);

	// 질문 카드 모달
	let allCards: any[] = $state([]);
	let showCardModal = $state(false);
	let selectedCard: any = $state(null);
	let cardPage = $state(0);

	// 대주제 선택 모달
	let allThemes: { id: number; theme: string }[] = $state([]);
	let showThemeModal = $state(false);

	function visibleCards() {
		return allCards.slice(cardPage * 4, cardPage * 4 + 4);
	}

	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 10) return '어제 하루는 어떠셨나요?';
		return '오늘 하루는 어떠셨나요?';
	}

	function parseRef(ref: string) {
		const m = ref.match(/^(.+?)\s+(\d+):(\d+)-?(\d+)?$/);
		if (!m) return null;
		const bookId = BOOK_MAP[m[1]];
		if (!bookId) return null;
		return { bookId, chapter: +m[2], start: +m[3], end: m[4] ? +m[4] : +m[3] };
	}

	function maturityLabel(m: string) {
		return {
			exploring: '자유롭게 묵상하기',
			growing: '체계적으로 묵상하기',
			close: '깊이 있게 묵상하기',
			centered: '하나님 앞에 고요히 머물기'
		}[m] || '묵상 가이드';
	}

	onMount(async () => {
		const today = new Date().toISOString().split('T')[0];

		// sessionStorage에서 오늘의 캐시 복원 (탭 이동 보호)
		const cacheKey = `qt_cache_${today}`;
		const cached = sessionStorage.getItem(cacheKey);
		if (cached) {
			try {
				const c = JSON.parse(cached);
				qt = c.qt; profile = c.profile; verses = c.verses;
				allCards = c.allCards || []; allThemes = c.allThemes || [];
				// 선택한 카드 복원
				const savedCard = localStorage.getItem('selectedCardToday');
				const savedDate = localStorage.getItem('cardModalDate');
				if (savedCard && savedDate === today) {
					try { selectedCard = JSON.parse(savedCard); } catch {}
				}
				dataLoaded = true;
				loading = false;
				return;
			} catch {}
		}

		const me = await fetch('/api/me').then(r => r.json());
		if (!me.loggedIn) { window.location.href = '/login'; return; }

		// 대주제 오버라이드 확인
		const savedThemeId = localStorage.getItem('themeOverride');
		const themeParam = savedThemeId ? `?monthOverride=${savedThemeId}` : '';

		const [qtRes, profileRes, cardsRes, themesRes] = await Promise.all([
			fetch(`/api/v2/daily-qt${themeParam}`),
			fetch('/api/v2/profile'),
			fetch('/api/v2/daily-cards'),
			fetch('/api/v2/themes')
		]);

		if (!profileRes.ok) { window.location.href = '/onboarding'; return; }

		qt = await qtRes.json();
		profile = await profileRes.json();

		if (!profile?.maturity_level) { window.location.href = '/onboarding'; return; }

		try { allCards = await cardsRes.json(); } catch { allCards = []; }
		try { allThemes = await themesRes.json(); } catch { allThemes = []; }

		// 본문 로드
		const ref = qt?.passage?.ref;
		if (ref) {
			const p = parseRef(ref);
			if (p) {
				try {
					const res = await fetch(`https://bolls.life/get-chapter/KRV/${p.bookId}/${p.chapter}/`);
					const all: Verse[] = await res.json();
					verses = all.filter(v => v.verse >= p.start && v.verse <= p.end);
				} catch { verses = []; }
			}
		}

		// sessionStorage에 오늘의 데이터 캐시
		try {
			sessionStorage.setItem(cacheKey, JSON.stringify({ qt, profile, verses, allCards, allThemes }));
		} catch {}

		// 선택한 카드 복원 (localStorage)
		const savedCard = localStorage.getItem('selectedCardToday');
		const savedDate = localStorage.getItem('cardModalDate');
		if (savedCard && savedDate === today) {
			try { selectedCard = JSON.parse(savedCard); } catch {}
		}

		dataLoaded = true;
		loading = false;

		// 하루 한 번만 카드 모달 표시 — 이미 선택했으면 안 띄움
		if (!qt.already_completed && allCards.length > 0 && !selectedCard) {
			if (savedDate !== today) {
				showCardModal = true;
			}
		}
	});

	function selectCard(card: any) {
		selectedCard = card;
		fetch('/api/v2/card-response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ card_id: card.id })
		}).catch(() => {});
		showCardModal = false;
		const today = new Date().toISOString().split('T')[0];
		localStorage.setItem('cardModalDate', today);
		localStorage.setItem('selectedCardToday', JSON.stringify(card));
	}

	function selectTheme(themeId: number | null) {
		if (themeId === null) {
			localStorage.removeItem('themeOverride');
		} else {
			localStorage.setItem('themeOverride', String(themeId));
		}
		showThemeModal = false;
		window.location.reload();
	}

	function showOtherCards() {
		if ((cardPage + 1) * 4 < allCards.length) {
			cardPage++;
		} else {
			cardPage = 0;
		}
	}

	async function saveNote() {
		const allNotes = [questionNote, noteText].filter(Boolean).join('\n---\n');

		// 묵상 완료 처리 (노트 유무와 무관)
		try {
			const res = await fetch('/api/v2/qt-complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					passage_ref: qt?.passage?.ref || '',
					topic_id: qt?.commentary?.source_topic || null,
					time_spent: 0,
					note_length: allNotes.length,
				})
			});
			if (res.ok) {
				const data = await res.json();
				celebrationStreak = data.streak_current || 1;
			}
		} catch {}

		// 노트가 있으면 저장
		if (allNotes.trim()) {
			try {
				const p = qt?.passage?.ref ? parseRef(qt.passage.ref) : null;
				await fetch('/api/notes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						bookId: p?.bookId || 1,
						chapter: p?.chapter || 1,
						date: new Date().toISOString().split('T')[0],
						content: allNotes,
					})
				});
			} catch {}
		}

		// sessionStorage 캐시 무효화 (완료 상태 반영)
		const today = new Date().toISOString().split('T')[0];
		sessionStorage.removeItem(`qt_cache_${today}`);

		showCelebration = true;
	}
</script>

<!-- 대주제 선택 모달 -->
{#if showThemeModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
		<div class="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl space-y-2 max-h-[85vh] overflow-y-auto">
			<h2 class="text-lg font-bold text-text text-center mb-1">묵상 주제 바꾸기</h2>
			<p class="text-xs text-text-secondary text-center mb-4">마음에 맞는 주제를 선택하세요</p>

			{#each allThemes as t}
				<button
					onclick={() => selectTheme(t.id)}
					class="w-full text-left p-4 rounded-2xl border transition-all {qt.theme?.monthId === t.id
						? 'border-primary bg-primary-bg text-primary font-semibold'
						: 'border-border bg-bg hover:border-primary hover:bg-primary-bg/50 text-text'}"
				>
					<span class="text-sm">{t.theme}</span>
					{#if qt.theme?.monthId === t.id}
						<span class="text-xs ml-2 text-primary/70">현재</span>
					{/if}
				</button>
			{/each}

			{#if localStorage.getItem('themeOverride')}
				<button
					onclick={() => selectTheme(null)}
					class="w-full p-3 rounded-2xl border border-dashed border-border text-text-secondary text-sm hover:border-primary hover:text-primary transition-all text-center"
				>기본 주제로 돌아가기</button>
			{/if}

			<button
				onclick={() => (showThemeModal = false)}
				class="w-full p-3 text-text-secondary text-sm text-center"
			>닫기</button>
		</div>
	</div>
{/if}

<!-- 질문 카드 모달 -->
{#if showCardModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
		<div class="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl space-y-3 max-h-[85vh] overflow-y-auto">
			<h2 class="text-lg font-bold text-text text-center mb-1">{getGreeting()}</h2>
			<p class="text-xs text-text-secondary text-center mb-4">마음에 와닿는 질문을 하나 골라주세요</p>

			{#each visibleCards() as card}
				<button
					onclick={() => selectCard(card)}
					class="w-full text-left p-4 rounded-2xl border border-border bg-bg hover:border-primary hover:bg-primary-bg/50 transition-all"
				>
					<p class="text-sm text-text leading-relaxed">{card.text || card.question || ''}</p>
				</button>
			{/each}

			<button
				onclick={showOtherCards}
				class="w-full p-4 rounded-2xl border border-dashed border-border text-text-secondary text-sm hover:border-primary hover:text-primary transition-all text-center"
			>
				다른 질문 받기
			</button>
		</div>
	</div>
{/if}

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if qt}
	<div class="space-y-6 pb-8 max-w-2xl mx-auto">

		<!-- 배너 -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			{#if qt.theme}
				<div class="flex items-center gap-2 mb-3">
					<span class="text-xs font-medium text-primary bg-primary-bg px-2.5 py-1 rounded-full">{qt.theme.month}</span>
					<span class="text-xs text-text-secondary">· {qt.theme.week}</span>
					<button
						onclick={() => (showThemeModal = true)}
						class="ml-auto text-xs text-text-secondary hover:text-primary transition-colors"
					>다른 주제로</button>
				</div>
			{/if}
			<div class="flex items-center justify-between">
				<div>
					{#if qt.passage?.title}
						<h1 class="text-lg font-bold text-text">{qt.passage.title}</h1>
						<p class="text-xs text-text-secondary mt-0.5">{qt.passage.ref}</p>
					{:else}
						<h1 class="text-lg font-bold text-text">{qt.passage?.ref || ''}</h1>
					{/if}
				</div>
				<div class="text-primary text-sm font-semibold">
					{#if qt.already_completed}
						<span class="bg-primary-bg px-3 py-1.5 rounded-full text-xs">묵상 완료</span>
					{:else if (profile?.streak_current || 0) > 0}
						<span>🔥 {profile.streak_current}일</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- 선택한 질문 + 노트란 -->
		{#if selectedCard}
			<div class="bg-primary-bg/50 rounded-2xl border border-primary/20 p-4 shadow-sm">
				<p class="text-sm text-text leading-relaxed">{selectedCard.text || selectedCard.question || ''}</p>
				{#if !qt.already_completed}
					<textarea
						class="mt-3 w-full rounded-xl border border-primary/20 bg-surface p-3 text-sm text-text placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
						rows="2" placeholder="이 질문에 대한 나의 생각..."
						bind:value={questionNote}
					></textarea>
				{/if}
			</div>
		{/if}

		<!-- 본문 -->
		{#if verses.length > 0}
			<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
				<h2 class="text-xs font-semibold text-text-secondary mb-3">{qt.passage?.ref}</h2>
				<div class="space-y-1 font-serif">
					{#each verses as v}
						<p class="text-sm leading-7 rounded-lg px-2 py-0.5 hover:bg-verse-hover transition-colors">
							<span class="text-xs font-bold text-primary mr-1.5 font-sans">{v.verse}</span>
							<span class="text-text">{@html v.text}</span>
						</p>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 묵상 가이드 -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<h2 class="text-sm font-semibold text-text-secondary mb-4">
				{maturityLabel(profile?.maturity_level || 'exploring')}
			</h2>
			<div class="space-y-4 text-sm text-text leading-relaxed">
				{#if qt.commentary?.content}
					<div>
						<h3 class="font-semibold text-primary text-xs mb-1">오늘의 해설</h3>
						<p>{qt.commentary.content}</p>
					</div>
				{/if}
				{#if qt.keyword?.content}
					<div class="bg-primary-bg/50 rounded-xl p-3 border-l-3 border-primary">
						<h3 class="font-semibold text-primary text-xs mb-1">핵심 원어</h3>
						<p>{qt.keyword.content}</p>
					</div>
				{/if}
				{#if qt.question?.content}
					<div>
						<h3 class="font-semibold text-primary text-xs mb-1">함께 생각해 보기</h3>
						<p>{qt.question.content}</p>
					</div>
				{/if}
				{#if qt.prayer?.content}
					<div class="bg-verse-hover rounded-xl p-3">
						<h3 class="font-semibold text-primary text-xs mb-1">기도 안내</h3>
						<p>{qt.prayer.content}</p>
						<p class="text-xs text-text-secondary mt-2">ACTS 기도법: 찬양(Adoration) → 고백(Confession) → 감사(Thanksgiving) → 간구(Supplication) 순서로 기도합니다.</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- 묵상 노트 -->
		{#if !qt.already_completed}
			<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
				<h2 class="text-sm font-semibold text-text-secondary mb-3">묵상 노트</h2>

				{#if profile?.maturity_level === 'growing'}
					<div class="space-y-3" id="soapArea">
						{#each [['말씀 (Scripture)','마음에 와 닿는 구절을 적어보세요...'],['관찰 (Observation)','이 말씀은 무엇을 말하고 있나요?'],['적용 (Application)','오늘 내 삶에 어떻게 적용할 수 있을까요?'],['기도 (Prayer)','말씀을 통해 기도해보세요...']] as [label, ph]}
							<div>
								<p class="text-xs font-medium text-text-secondary mb-1">{label}</p>
								<textarea class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="2" placeholder={ph}
									oninput={() => {
										const all = document.querySelectorAll('#soapArea textarea');
										noteText = Array.from(all).map(t => (t as HTMLTextAreaElement).value).filter(Boolean).join('\n---\n');
									}}
								></textarea>
							</div>
						{/each}
					</div>
				{:else if profile?.maturity_level === 'close'}
					<div class="space-y-3" id="soapArea">
						{#each [['관찰','본문이 말하고 있는 사실을 적어보세요...'],['해석','이 말씀의 의미는 무엇일까요?'],['적용','오늘 나의 삶에 어떻게 적용할 수 있을까요?']] as [label, ph]}
							<div>
								<p class="text-xs font-medium text-text-secondary mb-1">{label}</p>
								<textarea class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="3" placeholder={ph}
									oninput={() => {
										const all = document.querySelectorAll('#soapArea textarea');
										noteText = Array.from(all).map(t => (t as HTMLTextAreaElement).value).filter(Boolean).join('\n---\n');
									}}
								></textarea>
							</div>
						{/each}
					</div>
				{:else if profile?.maturity_level === 'centered'}
					<div class="space-y-3" id="soapArea">
						{#each [['읽기 (Lectio)','천천히 말씀을 읽으세요...'],['묵상 (Meditatio)','마음에 와 닿는 단어에 머무르세요...'],['기도 (Oratio)','말씀을 통해 하나님께 응답하세요...'],['관상 (Contemplatio)','고요 속에 하나님의 임재를 느껴보세요...']] as [label, ph]}
							<div>
								<p class="text-xs font-medium text-text-secondary mb-1">{label}</p>
								<textarea class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="2" placeholder={ph}
									oninput={() => {
										const all = document.querySelectorAll('#soapArea textarea');
										noteText = Array.from(all).map(t => (t as HTMLTextAreaElement).value).filter(Boolean).join('\n---\n');
									}}
								></textarea>
							</div>
						{/each}
					</div>
				{:else}
					<textarea
						class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
						rows="5" placeholder="오늘의 말씀을 통해 느낀 점을 자유롭게 적어보세요..."
						bind:value={noteText}
					></textarea>
				{/if}

				<button onclick={saveNote}
					class="mt-4 w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm"
				>묵상 완료</button>
			</div>
		{/if}
	</div>

	<!-- 축하 팝업 -->
	{#if showCelebration}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog">
			<div class="bg-surface rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-lg">
				<div class="text-5xl mb-4">&#x271D;</div>
				<h2 class="text-xl font-bold text-text mb-2">오늘의 묵상을 마쳤습니다</h2>
				<p class="text-sm text-text-secondary mb-1">하나님과 함께한 시간이 쌓여갑니다.</p>
				<p class="text-sm font-semibold text-primary mb-6">🔥 {celebrationStreak}일 연속 묵상</p>
				<button onclick={() => { showCelebration = false; window.location.reload(); }}
					class="w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors"
				>아멘</button>
			</div>
		</div>
	{/if}
{/if}
