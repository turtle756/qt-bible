<script lang="ts">
	import { onMount } from 'svelte';

	let step = $state(1);
	let nickname = $state('');
	let maturity = $state('');
	let saving = $state(false);

	// Personal info
	let ageGroup = $state('');
	let marriageStatus = $state('');
	let hasChildren = $state<boolean | null>(null);
	let jobStatus = $state('');
	let attendsChurch = $state<boolean | null>(null);

	// Temperament quiz
	let quizData = $state<any>(null);
	let quizIndex = $state(0);
	let quizAnswers = $state<Record<number, number>>({});
	let quizResult = $state<any>(null);

	onMount(async () => {
		const me = await fetch('/api/me').then(r => r.json());
		if (!me.loggedIn) { window.location.href = '/login'; return; }

		const ob = await fetch('/api/v2/onboarding').then(r => r.json()).catch(() => null);
		if (ob?.completed) { window.location.href = '/'; return; }

		quizData = await fetch('/data/temperament-quiz.json').then(r => r.json()).catch(() => null);
	});

	const maturityOptions = [
		{ value: 'exploring', label: '처음이에요', desc: '성경을 거의 읽어본 적 없어요' },
		{ value: 'growing', label: '가끔 읽어요', desc: '교회에 다니고 가끔 성경을 읽어요' },
		{ value: 'close', label: '꾸준히 묵상해요', desc: '매일 또는 자주 말씀을 묵상해요' },
		{ value: 'centered', label: '깊이 해왔어요', desc: '수년간 깊이 있는 묵상을 해왔어요' },
	];

	async function submitPersonal() {
		saving = true;
		try {
			await fetch('/api/v2/onboarding', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nickname,
					maturity_level: maturity,
					age_group: ageGroup || null,
					marriage_status: marriageStatus || null,
					has_children: hasChildren,
					job_status: jobStatus || null,
					attends_church: attendsChurch,
				})
			});
		} catch (e) { console.error(e); }
		saving = false;
		step = 4;
	}

	async function submitQuiz() {
		const answers = Object.entries(quizAnswers).map(([id, score]) => ({
			question_id: parseInt(id), score
		}));
		try {
			const res = await fetch('/api/v2/onboarding/temperament', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ answers })
			});
			quizResult = await res.json();
		} catch (e) {
			quizResult = { skipped: true };
		}
		step = 6;
	}

	async function skipQuiz() {
		quizResult = { skipped: true };
		step = 6;
	}

	function finishOnboarding() {
		window.location.href = '/';
	}
</script>

<div class="min-h-[80vh] flex items-center justify-center">
	<div class="w-full max-w-md">
		<!-- Progress -->
		<div class="flex items-center gap-2 mb-8">
			{#each [1,2,3,4,5] as s}
				<div class="h-1.5 flex-1 rounded-full transition-colors {s <= Math.min(step, 5) ? 'bg-primary' : 'bg-border'}"></div>
			{/each}
		</div>

		<!-- Step 1: 닉네임 -->
		<div class={step === 1 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">반갑습니다!</h1>
			<p class="text-sm text-text-secondary mb-6">DailyQT에서 사용할 이름을 알려주세요.</p>
			<input
				type="text" bind:value={nickname} placeholder="닉네임" maxlength="20"
				class="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
			/>
			<button
				onclick={() => { if (nickname.trim()) step = 2; }}
				disabled={!nickname.trim()}
				class="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
			>다음</button>
		</div>

		<!-- Step 2: 성숙도 -->
		<div class={step === 2 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">{nickname}님,</h1>
			<p class="text-sm text-text-secondary mb-6">성경이 얼마나 익숙하신가요?</p>
			<div class="space-y-3">
				{#each maturityOptions as opt}
					<button
						onclick={() => { maturity = opt.value; }}
						class="w-full text-left p-4 rounded-2xl border transition-all {maturity === opt.value ? 'border-primary bg-primary-bg' : 'border-border bg-surface hover:border-primary/30'}"
					>
						<p class="font-semibold text-text text-sm">{opt.label}</p>
						<p class="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
					</button>
				{/each}
			</div>
			<div class="flex gap-3 mt-6">
				<button onclick={() => step = 1} class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors">이전</button>
				<button onclick={() => { if (maturity) step = 3; }} disabled={!maturity} class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm disabled:opacity-40">다음</button>
			</div>
		</div>

		<!-- Step 3: 개인정보 (선택) -->
		<div class={step === 3 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">조금 더 알려주시겠어요?</h1>
			<p class="text-sm text-text-secondary mb-6">선택 사항이에요. 건너뛰셔도 괜찮습니다.</p>

			<div class="space-y-5">
				<!-- 나이대 -->
				<div>
					<label class="text-sm font-medium text-text mb-2 block">나이대</label>
					<div class="grid grid-cols-3 gap-2">
						{#each ['10대','20대','30대','40대','50대','60대+'] as age}
							<button onclick={() => ageGroup = age}
								class="py-2.5 rounded-2xl border text-sm font-medium transition-all {ageGroup === age ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{age}</button>
						{/each}
					</div>
				</div>

				<!-- 결혼 여부 -->
				<div>
					<label class="text-sm font-medium text-text mb-2 block">결혼 여부</label>
					<div class="grid grid-cols-2 gap-2">
						{#each [['single','미혼'],['married','기혼'],['divorced','이혼/별거'],['bereaved','사별']] as [val, label]}
							<button onclick={() => marriageStatus = val}
								class="py-2.5 rounded-2xl border text-sm font-medium transition-all {marriageStatus === val ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{label}</button>
						{/each}
					</div>
				</div>

				<!-- 자녀 -->
				<div>
					<label class="text-sm font-medium text-text mb-2 block">자녀</label>
					<div class="flex gap-3">
						{#each [[false,'없음'],[true,'있음']] as [val, label]}
							<button onclick={() => hasChildren = val}
								class="flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all {hasChildren === val ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{label}</button>
						{/each}
					</div>
				</div>

				<!-- 직업 -->
				<div>
					<label class="text-sm font-medium text-text mb-2 block">직업</label>
					<div class="grid grid-cols-3 gap-2">
						{#each [['student','학생'],['employed','직장인'],['self_employed','자영업'],['job_seeking','구직중'],['retired','은퇴'],['other','기타']] as [val, label]}
							<button onclick={() => jobStatus = val}
								class="py-2.5 rounded-2xl border text-sm font-medium transition-all {jobStatus === val ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{label}</button>
						{/each}
					</div>
				</div>

				<!-- 교회 출석 -->
				<div>
					<label class="text-sm font-medium text-text mb-2 block">교회 출석</label>
					<div class="flex gap-3">
						{#each [[true,'출석중'],[false,'안 하고 있음']] as [val, label]}
							<button onclick={() => attendsChurch = val}
								class="flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all {attendsChurch === val ? 'border-primary bg-primary-bg text-primary' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{label}</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex gap-3 mt-6">
				<button onclick={() => step = 2} class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors">이전</button>
				<button onclick={() => submitPersonal()} class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm" disabled={saving}>
					{saving ? '저장 중...' : '다음'}
				</button>
			</div>
			<button onclick={() => submitPersonal()} class="mt-2 w-full py-2 text-text-secondary text-sm hover:text-text transition-colors">건너뛰기</button>
		</div>

		<!-- Step 4: 기질검사 안내 -->
		<div class={step === 4 ? '' : 'hidden'}>
			<div class="text-center">
				<div class="text-5xl mb-4">&#x1F9ED;</div>
				<h1 class="text-2xl font-bold text-text mb-2">나에게 맞는 묵상 스타일을<br>찾아볼까요?</h1>
				<p class="text-sm text-text-secondary mb-6">27개의 질문으로 약 3~5분 정도 걸려요.</p>
			</div>
			<button onclick={() => { quizIndex = 0; step = 5; }}
				class="w-full py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm"
			>시작하기</button>
			<button onclick={() => skipQuiz()}
				class="mt-3 w-full py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors"
			>건너뛰기</button>
			<div class="mt-4">
				<button onclick={() => step = 3} class="text-sm text-text-secondary hover:text-text transition-colors">← 이전</button>
			</div>
		</div>

		<!-- Step 5: 기질검사 27문항 -->
		<div class={step === 5 ? '' : 'hidden'}>
			{#if quizData?.questions}
				{@const q = quizData.questions[quizIndex]}
				{@const total = quizData.questions.length}
				{@const answered = quizAnswers[q?.id]}

				<!-- Progress bar -->
				<div class="h-1 bg-border rounded-full mb-6">
					<div class="h-full bg-primary rounded-full transition-all" style="width:{((quizIndex+1)/total)*100}%"></div>
				</div>

				<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
					<p class="text-xs text-text-secondary mb-3">{quizIndex + 1} / {total}</p>
					<p class="text-base font-semibold text-text leading-relaxed mb-5">{q?.text}</p>

					<div class="flex gap-2 justify-center mb-2">
						{#each [0,1,2,3,4] as n}
							<button
								onclick={() => { quizAnswers = { ...quizAnswers, [q.id]: n }; }}
								class="w-12 h-12 rounded-xl border text-base font-semibold transition-all {answered === n ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:border-primary/30'}"
							>{n}</button>
						{/each}
					</div>
					<div class="flex justify-between text-xs text-text-secondary px-1">
						<span>전혀 아니다</span><span>매우 그렇다</span>
					</div>
				</div>

				<div class="flex gap-3 mt-6">
					<button onclick={() => { if (quizIndex > 0) quizIndex--; else step = 4; }}
						class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors"
					>이전</button>
					{#if quizIndex === total - 1}
						<button onclick={() => submitQuiz()} disabled={answered === undefined}
							class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm disabled:opacity-40"
						>완료</button>
					{:else}
						<button onclick={() => { if (answered !== undefined) quizIndex++; }} disabled={answered === undefined}
							class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm disabled:opacity-40"
						>다음</button>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Step 6: 결과 -->
		<div class={step === 6 ? '' : 'hidden'}>
			<div class="text-center">
				<div class="text-5xl mb-4">&#x2728;</div>
				<h1 class="text-2xl font-bold text-text mb-2">{nickname}님,<br>준비 완료!</h1>
				<p class="text-sm text-text-secondary mb-6">
					{quizResult?.skipped ? '묵상하면서 점점 더 맞춤화될 거예요.' : '기질에 맞는 묵상이 매일 준비됩니다.'}
				</p>
			</div>

			{#if quizResult && !quizResult.skipped && quizResult.top_pathways?.length}
				<div class="mb-6">
					<p class="text-sm font-semibold text-text mb-3">나의 영적 기질</p>
					{#each quizResult.top_pathways as p}
						<div class="flex items-center gap-3 p-4 bg-primary-bg rounded-2xl mb-2">
							<span class="text-xl font-bold text-primary min-w-[44px] text-center">{p.score}</span>
							<div>
								<p class="text-sm font-semibold text-text">{p.name}</p>
								<p class="text-xs text-text-secondary">{p.motto}</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<button onclick={() => finishOnboarding()}
				class="w-full py-3 bg-primary text-white font-semibold rounded-2xl transition-colors shadow-sm"
			>묵상 시작하기</button>
		</div>
	</div>
</div>
