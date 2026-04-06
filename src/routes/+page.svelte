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
	let showCelebration = $state(false);
	let celebrationStreak = $state(0);

	// 질문 카드 모달
	let allCards: any[] = $state([]);
	let showCardModal = $state(false);
	let selectedCard: any = $state(null);
	let cardPage = $state(0); // 0 = 첫 4개, 1 = 다음 4개

	$effect(() => {
		// cardPage가 바뀌면 visibleCards 자동 계산
	});

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

	onMount(async () => {
		const me = await fetch('/api/me').then(r => r.json());
		if (!me.loggedIn) { window.location.href = '/login'; return; }

		const [qtRes, profileRes, cardsRes] = await Promise.all([
			fetch('/api/v2/daily-qt'),
			fetch('/api/v2/profile'),
			fetch('/api/v2/daily-cards')
		]);

		if (!profileRes.ok) { window.location.href = '/onboarding'; return; }

		qt = await qtRes.json();
		profile = await profileRes.json();

		if (!profile?.maturity_level) { window.location.href = '/onboarding'; return; }

		try { allCards = await cardsRes.json(); } catch { allCards = []; }

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

		loading = false;

		// 하루 한 번만 카드 모달 표시
		if (!qt.already_completed && allCards.length > 0) {
			const today = new Date().toISOString().split('T')[0];
			const lastShown = localStorage.getItem('cardModalDate');
			if (lastShown !== today) {
				showCardModal = true;
			}
		}
	});

	function selectCard(card: any) {
		selectedCard = card;
		// API에 선택 기록
		fetch('/api/v2/card-response', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ card_id: card.id })
		}).catch(() => {});
		// 모달 닫기 + 오늘 날짜 기록
		showCardModal = false;
		localStorage.setItem('cardModalDate', new Date().toISOString().split('T')[0]);
	}

	function showOtherCards() {
		if ((cardPage + 1) * 4 < allCards.length) {
			cardPage++;
		} else {
			cardPage = 0; // 처음으로 돌아감
		}
	}

	async function saveNote() {
		if (!noteText.trim()) return;

		try {
			const res = await fetch('/api/v2/qt-complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					passage_ref: qt?.passage?.ref || '',
					topic_id: qt?.commentary?.source_topic || null,
					time_spent: 0,
					note_length: noteText.length,
				})
			});
			if (res.ok) {
				const data = await res.json();
				celebrationStreak = data.streak_current || 1;
			}
		} catch {}

		// 노트 저장
		try {
			const p = qt?.passage?.ref ? parseRef(qt.passage.ref) : null;
			await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					bookId: p?.bookId || 1,
					chapter: p?.chapter || 1,
					date: new Date().toISOString().split('T')[0],
					content: noteText,
				})
			});
		} catch {}

		showCelebration = true;
	}

	function maturityLabel(m: string) {
		return { exploring: '입문', growing: '초급 · SOAP', close: '중급 · 귀납적', centered: '심화 · 렉시오 디비나' }[m] || m;
	}
</script>

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

			<!-- 다른 질문 받기 -->
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
			<div class="flex items-center justify-between">
				<div>
					<p class="text-xs text-text-secondary">오늘의 말씀</p>
					{#if qt.passage?.title}
						<h1 class="text-lg font-bold text-text mt-1">{qt.passage.title}</h1>
						<p class="text-xs text-text-secondary mt-0.5">{qt.passage.ref}</p>
					{:else}
						<h1 class="text-lg font-bold text-text mt-1">{qt.passage?.ref || ''}</h1>
					{/if}
				</div>
				<div class="text-primary text-sm font-semibold">
					{#if qt.already_completed}
						<span class="bg-primary-bg px-3 py-1.5 rounded-full text-xs">오늘의 묵상 완료</span>
					{:else if (profile?.streak_current || 0) > 0}
						<span>🔥 {profile.streak_current}일 연속</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- 선택한 질문 표시 -->
		{#if selectedCard}
			<div class="bg-primary-bg/50 rounded-2xl border border-primary/20 p-4 shadow-sm">
				<p class="text-sm text-text leading-relaxed">{selectedCard.text || selectedCard.question || ''}</p>
			</div>
		{/if}

		<!-- 본문 -->
		{#if verses.length > 0}
			<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
				<h2 class="text-xs font-semibold text-text-secondary mb-3">{qt.passage?.ref}</h2>
				<div class="space-y-1">
					{#each verses as v}
						<p class="text-sm leading-7 rounded-lg px-2 py-0.5 hover:bg-verse-hover transition-colors">
							<span class="text-xs font-bold text-primary mr-1.5">{v.verse}</span>
							<span class="text-text">{@html v.text}</span>
						</p>
					{/each}
				</div>
			</div>
		{/if}

		<!-- 묵상 가이드 -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<h2 class="text-sm font-semibold text-text-secondary mb-4">
				묵상 가이드 · {maturityLabel(profile?.maturity_level || 'exploring')}
			</h2>
			<div class="space-y-4 text-sm text-text leading-relaxed">
				{#if qt.commentary?.content}
					<div>
						<h3 class="font-semibold text-primary text-xs mb-1">해설</h3>
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
						<h3 class="font-semibold text-primary text-xs mb-1">묵상 질문</h3>
						<p>{qt.question.content}</p>
					</div>
				{/if}
				{#if qt.prayer?.content}
					<div class="bg-verse-hover rounded-xl p-3 italic">
						<h3 class="font-semibold text-primary text-xs mb-1 not-italic">기도 안내</h3>
						<p>{qt.prayer.content}</p>
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
						{#each [['S · 말씀','마음에 와 닿는 구절을 적어보세요...'],['O · 관찰','이 말씀은 무엇을 말하고 있나요?'],['A · 적용','오늘 내 삶에 어떻게 적용할 수 있을까요?'],['P · 기도','말씀을 통해 기도해보세요...']] as [label, ph]}
							<div>
								<label class="text-xs font-medium text-text-secondary">{label}</label>
								<textarea class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="2" placeholder={ph}
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
						{#each ['관찰: 본문이 말하는 사실은?','해석: 저자의 의도는?','적용: 오늘 내 삶에?'] as ph}
							<textarea class="w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="3" placeholder={ph}
								oninput={() => {
									const all = document.querySelectorAll('#soapArea textarea');
									noteText = Array.from(all).map(t => (t as HTMLTextAreaElement).value).filter(Boolean).join('\n---\n');
								}}
							></textarea>
						{/each}
					</div>
				{:else if profile?.maturity_level === 'centered'}
					<div class="space-y-3" id="soapArea">
						{#each [['Lectio · 읽기','천천히 말씀을 읽으세요...'],['Meditatio · 묵상','마음에 와 닿는 단어에 머무르세요...'],['Oratio · 기도','말씀을 통해 하나님께 응답하세요...'],['Contemplatio · 관상','고요 속에 하나님의 임재를 느껴보세요...']] as [label, ph]}
							<div>
								<label class="text-xs font-medium text-text-secondary">{label}</label>
								<textarea class="mt-1 w-full rounded-xl border border-border bg-bg p-3 text-sm text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows="2" placeholder={ph}
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
