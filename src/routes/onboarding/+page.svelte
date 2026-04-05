<script lang="ts">
	import { onMount } from 'svelte';

	let step = $state(1);
	let nickname = $state('');
	let maturity = $state('');
	let gender = $state('');
	let ageGroup = $state('');
	let hasChildren = $state('');
	let temperamentStarted = $state(false);
	let temperamentResult = $state('');
	let saving = $state(false);

	// Temperament test
	const temperamentQuestions = [
		{ q: '새로운 사람을 만나면?', a: '먼저 다가간다', b: '상대가 먼저 오길 기다린다' },
		{ q: '결정을 내릴 때?', a: '빠르게 판단한다', b: '충분히 고민한다' },
		{ q: '팀 프로젝트에서?', a: '리더 역할을 맡는다', b: '맡은 일을 충실히 한다' },
		{ q: '스트레스를 받으면?', a: '활동적으로 풀려 한다', b: '혼자 조용히 정리한다' },
		{ q: '대화할 때?', a: '말하면서 생각을 정리한다', b: '생각을 정리한 후 말한다' },
		{ q: '계획 세울 때?', a: '큰 그림을 먼저 그린다', b: '세부 사항부터 챙긴다' },
		{ q: '갈등 상황에서?', a: '직접 해결하려 한다', b: '시간이 해결해 주길 바란다' },
		{ q: '감정 표현은?', a: '솔직하게 드러낸다', b: '속으로 삭인다' }
	];
	let answers = $state<Record<number, 'a' | 'b'>>({});

	const maturityOptions = [
		{
			value: 'exploring',
			label: '탐색기',
			desc: '성경이 아직 낯설고, 묵상이 처음이에요'
		},
		{
			value: 'growing',
			label: '성장기',
			desc: '매일 묵상하고 싶지만 방법이 어려워요'
		},
		{
			value: 'close',
			label: '친밀기',
			desc: '하나님과의 관계가 깊어지고 있어요'
		},
		{
			value: 'centered',
			label: '중심기',
			desc: '말씀이 삶의 중심이에요'
		}
	];

	const ageOptions = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];

	onMount(async () => {
		const res = await fetch('/api/me');
		const me = await res.json();
		if (!me.loggedIn) {
			window.location.href = '/login';
		}
	});

	function computeTemperament(): string {
		let aCount = 0;
		for (const key in answers) {
			if (answers[key] === 'a') aCount++;
		}
		if (aCount >= 6) return 'choleric';
		if (aCount >= 4) return 'sanguine';
		if (aCount >= 2) return 'phlegmatic';
		return 'melancholy';
	}

	const temperamentLabels: Record<string, { label: string; desc: string }> = {
		choleric: { label: '담즙질 (지도자형)', desc: '목표지향적이고 결단력 있는 리더 기질' },
		sanguine: { label: '다혈질 (사교형)', desc: '밝고 열정적이며 사람들과 어울리기 좋아하는 기질' },
		phlegmatic: { label: '점액질 (평화형)', desc: '차분하고 안정적이며 조화를 추구하는 기질' },
		melancholy: { label: '우울질 (분석형)', desc: '깊이 생각하고 섬세하며 완벽을 추구하는 기질' }
	};

	async function finishOnboarding() {
		saving = true;
		await fetch('/api/v2/onboarding', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				nickname,
				maturity,
				gender,
				age_group: ageGroup,
				has_children: hasChildren === 'yes',
				temperament: temperamentResult || undefined
			})
		});
		window.location.href = '/';
	}
</script>

<div class="min-h-[80vh] flex items-center justify-center">
	<div class="w-full max-w-md">
		<!-- Progress -->
		<div class="flex items-center gap-2 mb-8">
			{#each [1, 2, 3, 4, 5] as s}
				<div
					class="h-1.5 flex-1 rounded-full transition-colors {s <= step
						? 'bg-primary'
						: 'bg-border'}"
				></div>
			{/each}
		</div>

		<!-- Step 1: Nickname -->
		<div class={step === 1 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">반갑습니다!</h1>
			<p class="text-sm text-text-secondary mb-6">DailyQT에서 사용할 이름을 알려주세요.</p>
			<input
				type="text"
				bind:value={nickname}
				placeholder="닉네임"
				class="w-full px-4 py-3 rounded-2xl border border-border bg-surface text-text placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
				maxlength="20"
			/>
			<button
				onclick={() => { if (nickname.trim()) step = 2; }}
				disabled={!nickname.trim()}
				class="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
			>
				다음
			</button>
		</div>

		<!-- Step 2: Maturity -->
		<div class={step === 2 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">묵상 단계</h1>
			<p class="text-sm text-text-secondary mb-6">현재 신앙 여정에서 어디쯤 계신가요?</p>
			<div class="space-y-3">
				{#each maturityOptions as opt}
					<button
						onclick={() => { maturity = opt.value; }}
						class="w-full text-left p-4 rounded-2xl border transition-all {maturity === opt.value
							? 'border-primary bg-primary-bg'
							: 'border-border bg-surface hover:border-primary/30'}"
					>
						<p class="font-semibold text-text text-sm">{opt.label}</p>
						<p class="text-xs text-text-secondary mt-0.5">{opt.desc}</p>
					</button>
				{/each}
			</div>
			<div class="flex gap-3 mt-6">
				<button
					onclick={() => (step = 1)}
					class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors"
				>
					이전
				</button>
				<button
					onclick={() => { if (maturity) step = 3; }}
					disabled={!maturity}
					class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm disabled:opacity-40"
				>
					다음
				</button>
			</div>
		</div>

		<!-- Step 3: Personal Info -->
		<div class={step === 3 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">조금 더 알려주세요</h1>
			<p class="text-sm text-text-secondary mb-6">맞춤 콘텐츠를 위한 정보입니다. (선택)</p>

			<div class="space-y-5">
				<div>
					<label class="text-sm font-medium text-text mb-2 block">성별</label>
					<div class="flex gap-3">
						{#each ['남성', '여성'] as g}
							<button
								onclick={() => (gender = g)}
								class="flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all {gender === g
									? 'border-primary bg-primary-bg text-primary'
									: 'border-border text-text-secondary hover:border-primary/30'}"
							>
								{g}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="text-sm font-medium text-text mb-2 block">연령대</label>
					<div class="grid grid-cols-3 gap-2">
						{#each ageOptions as age}
							<button
								onclick={() => (ageGroup = age)}
								class="py-2.5 rounded-2xl border text-sm font-medium transition-all {ageGroup === age
									? 'border-primary bg-primary-bg text-primary'
									: 'border-border text-text-secondary hover:border-primary/30'}"
							>
								{age}
							</button>
						{/each}
					</div>
				</div>

				<div>
					<label class="text-sm font-medium text-text mb-2 block">자녀</label>
					<div class="flex gap-3">
						{#each [
							{ value: 'no', label: '없음' },
							{ value: 'yes', label: '있음' }
						] as opt}
							<button
								onclick={() => (hasChildren = opt.value)}
								class="flex-1 py-2.5 rounded-2xl border text-sm font-medium transition-all {hasChildren === opt.value
									? 'border-primary bg-primary-bg text-primary'
									: 'border-border text-text-secondary hover:border-primary/30'}"
							>
								{opt.label}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="flex gap-3 mt-6">
				<button
					onclick={() => (step = 2)}
					class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors"
				>
					이전
				</button>
				<button
					onclick={() => (step = 4)}
					class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm"
				>
					다음
				</button>
			</div>
		</div>

		<!-- Step 4: Temperament intro -->
		<div class={step === 4 ? '' : 'hidden'}>
			<h1 class="text-2xl font-bold text-text mb-2">기질 검사</h1>
			<p class="text-sm text-text-secondary mb-6">
				간단한 질문을 통해 기질을 파악하고, 맞춤 묵상 가이드를 제공합니다.
			</p>
			<div class="bg-primary-bg rounded-2xl p-5 mb-6">
				<p class="text-sm text-text">
					8개의 간단한 질문에 답해주세요. 정답은 없으며, 평소 자신의 모습에 가까운 것을 고르시면 됩니다.
				</p>
			</div>
			<div class="flex gap-3">
				<button
					onclick={() => (step = 3)}
					class="flex-1 py-3 border border-border text-text-secondary font-medium rounded-2xl hover:bg-bg transition-colors"
				>
					이전
				</button>
				<button
					onclick={() => {
						temperamentStarted = true;
						step = 5;
					}}
					class="flex-1 py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm"
				>
					시작하기
				</button>
			</div>
			<button
				onclick={() => finishOnboarding()}
				class="mt-3 w-full py-3 text-text-secondary text-sm hover:text-text transition-colors"
			>
				건너뛰기
			</button>
		</div>

		<!-- Step 5: Temperament test / result -->
		<div class={step === 5 ? '' : 'hidden'}>
			{#if !temperamentResult}
				<h1 class="text-2xl font-bold text-text mb-2">기질 검사</h1>
				<p class="text-sm text-text-secondary mb-6">
					{Object.keys(answers).length}/8 완료
				</p>
				<div class="space-y-4">
					{#each temperamentQuestions as tq, i}
						<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm">
							<p class="text-sm font-medium text-text mb-3">{i + 1}. {tq.q}</p>
							<div class="flex gap-2">
								<button
									onclick={() => (answers = { ...answers, [i]: 'a' })}
									class="flex-1 py-2 rounded-xl border text-xs font-medium transition-all {answers[i] === 'a'
										? 'border-primary bg-primary-bg text-primary'
										: 'border-border text-text-secondary hover:border-primary/30'}"
								>
									{tq.a}
								</button>
								<button
									onclick={() => (answers = { ...answers, [i]: 'b' })}
									class="flex-1 py-2 rounded-xl border text-xs font-medium transition-all {answers[i] === 'b'
										? 'border-primary bg-primary-bg text-primary'
										: 'border-border text-text-secondary hover:border-primary/30'}"
								>
									{tq.b}
								</button>
							</div>
						</div>
					{/each}
				</div>
				<button
					onclick={() => {
						if (Object.keys(answers).length === 8) {
							temperamentResult = computeTemperament();
						}
					}}
					disabled={Object.keys(answers).length < 8}
					class="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm disabled:opacity-40"
				>
					결과 보기
				</button>
			{:else}
				<h1 class="text-2xl font-bold text-text mb-2">당신의 기질</h1>
				<div class="bg-primary-bg rounded-2xl p-6 mt-4 text-center">
					<p class="text-lg font-bold text-primary mb-2">
						{temperamentLabels[temperamentResult]?.label}
					</p>
					<p class="text-sm text-text-secondary">
						{temperamentLabels[temperamentResult]?.desc}
					</p>
				</div>
				<button
					onclick={finishOnboarding}
					disabled={saving}
					class="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-light transition-colors shadow-sm disabled:opacity-60"
				>
					{saving ? '저장 중...' : '시작하기'}
				</button>
			{/if}
		</div>
	</div>
</div>
