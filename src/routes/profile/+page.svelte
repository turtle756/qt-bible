<script lang="ts">
	import { onMount } from 'svelte';

	interface User {
		name: string;
		email: string;
		avatar: string;
	}

	interface Profile {
		streak_current: number;
		streak_best: number;
		total_qt_days: number;
		maturity_level: string;
		created_at: string;
	}

	interface QtLogEntry {
		log_date: string;
		book_id: number;
		chapter: number;
	}

	interface Badge {
		id: string;
		label: string;
		desc: string;
		icon: string;
		earned: boolean;
	}

	let user: User | null = $state(null);
	let profile: Profile | null = $state(null);
	let loading = $state(true);

	// Calendar
	let calYear = $state(new Date().getFullYear());
	let calMonth = $state(new Date().getMonth()); // 0-indexed
	let completedDates = $state<Set<string>>(new Set());

	// Maturity setting
	let editingMaturity = $state(false);
	let newMaturity = $state('');

	const maturityOptions = [
		{ value: 'exploring', label: '탐색기' },
		{ value: 'growing', label: '성장기' },
		{ value: 'close', label: '친밀기' },
		{ value: 'centered', label: '중심기' }
	];

	function getBadges(p: Profile): Badge[] {
		return [
			{ id: 'first', label: '첫 묵상', desc: '첫 묵상을 완료했습니다', icon: '&#x2728;', earned: p.total_qt_days >= 1 },
			{ id: 'streak7', label: '7일 연속', desc: '7일 연속 묵상', icon: '&#x1F525;', earned: p.streak_best >= 7 },
			{ id: 'streak30', label: '30일 연속', desc: '30일 연속 묵상', icon: '&#x1F31F;', earned: p.streak_best >= 30 },
			{ id: 'streak100', label: '100일 연속', desc: '100일 연속 묵상', icon: '&#x1F451;', earned: p.streak_best >= 100 },
			{ id: 'total10', label: '10일 묵상', desc: '총 10일 묵상 달성', icon: '&#x1F4D6;', earned: p.total_qt_days >= 10 },
			{ id: 'total50', label: '50일 묵상', desc: '총 50일 묵상 달성', icon: '&#x1F4DA;', earned: p.total_qt_days >= 50 },
			{ id: 'total100', label: '100일 묵상', desc: '총 100일 묵상 달성', icon: '&#x1F3C6;', earned: p.total_qt_days >= 100 },
			{ id: 'total365', label: '365일 묵상', desc: '총 365일 묵상 달성', icon: '&#x1F48E;', earned: p.total_qt_days >= 365 }
		];
	}

	onMount(async () => {
		const [meRes, profileRes] = await Promise.all([
			fetch('/api/me'),
			fetch('/api/v2/profile')
		]);
		const me = await meRes.json();
		if (!me.loggedIn) {
			window.location.href = '/login';
			return;
		}
		user = me.user;
		profile = await profileRes.json();
		newMaturity = profile?.maturity_level || '';

		// Load QT log for calendar
		await loadCalendar();
		loading = false;
	});

	async function loadCalendar() {
		try {
			const res = await fetch(`/api/qt-log?year=${calYear}&month=${calMonth + 1}`);
			const data: QtLogEntry[] = await res.json();
			if (Array.isArray(data)) {
				completedDates = new Set(data.map((d) => d.log_date.substring(0, 10)));
			}
		} catch {
			completedDates = new Set();
		}
	}

	function prevMonth() {
		if (calMonth === 0) {
			calMonth = 11;
			calYear--;
		} else {
			calMonth--;
		}
		loadCalendar();
	}

	function nextMonth() {
		if (calMonth === 11) {
			calMonth = 0;
			calYear++;
		} else {
			calMonth++;
		}
		loadCalendar();
	}

	function getCalendarDays(): (number | null)[] {
		const firstDay = new Date(calYear, calMonth, 1).getDay();
		const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
		const days: (number | null)[] = [];
		for (let i = 0; i < firstDay; i++) days.push(null);
		for (let d = 1; d <= daysInMonth; d++) days.push(d);
		return days;
	}

	function formatDate(day: number): string {
		const m = String(calMonth + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${calYear}-${m}-${d}`;
	}

	async function updateMaturity() {
		await fetch('/api/v2/profile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ maturity_level: newMaturity })
		});
		if (profile) profile = { ...profile, maturity_level: newMaturity };
		editingMaturity = false;
	}

	async function logout() {
		window.location.href = '/auth/logout';
	}

	async function deleteAccount() {
		if (!confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
		await fetch('/api/account', { method: 'DELETE' });
		window.location.href = '/login';
	}

	const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
	const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
</script>

{#if loading}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else if user && profile}
	<div class="space-y-6 pb-8">
		<!-- Profile Card -->
		<div class="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
			<div class="w-20 h-20 mx-auto rounded-full overflow-hidden border-3 border-primary-bg mb-3">
				{#if user.avatar}
					<img src={user.avatar} alt={user.name} class="w-full h-full object-cover" />
				{:else}
					<div class="w-full h-full bg-primary-bg flex items-center justify-center text-primary text-2xl font-bold">
						{user.name?.charAt(0) || '?'}
					</div>
				{/if}
			</div>
			<h1 class="text-lg font-bold text-text">{user.name}</h1>
			{#if profile.created_at}
				<p class="text-xs text-text-secondary mt-1">
					{new Date(profile.created_at).toLocaleDateString('ko-KR')} 가입
				</p>
			{/if}
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-3">
			{#each [
				{ label: '연속 묵상', value: `${profile.streak_current}일` },
				{ label: '최고 기록', value: `${profile.streak_best}일` },
				{ label: '총 묵상일', value: `${profile.total_qt_days}일` }
			] as stat}
				<div class="bg-surface rounded-2xl border border-border p-4 shadow-sm text-center">
					<p class="text-xl font-bold text-primary">{stat.value}</p>
					<p class="text-xs text-text-secondary mt-1">{stat.label}</p>
				</div>
			{/each}
		</div>

		<!-- Badges -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<h2 class="text-sm font-semibold text-text mb-4">업적</h2>
			<div class="grid grid-cols-4 gap-3">
				{#each getBadges(profile) as badge}
					<div class="text-center" title={badge.desc}>
						<div
							class="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-1.5 {badge.earned
								? 'bg-primary-bg'
								: 'bg-bg opacity-40'}"
						>
							{@html badge.icon}
						</div>
						<p class="text-xs {badge.earned ? 'text-text font-medium' : 'text-text-secondary'}">
							{badge.label}
						</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Calendar -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<div class="flex items-center justify-between mb-4">
				<button
					onclick={prevMonth}
					class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg text-text-secondary"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<h2 class="text-sm font-semibold text-text">{calYear}년 {monthNames[calMonth]}</h2>
				<button
					onclick={nextMonth}
					class="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg text-text-secondary"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<div class="grid grid-cols-7 gap-1 mb-2">
				{#each dayNames as day}
					<div class="text-center text-xs font-medium text-text-secondary py-1">{day}</div>
				{/each}
			</div>
			<div class="grid grid-cols-7 gap-1">
				{#each getCalendarDays() as day}
					{#if day === null}
						<div></div>
					{:else}
						{@const dateStr = formatDate(day)}
						{@const completed = completedDates.has(dateStr)}
						{@const isToday =
							day === new Date().getDate() &&
							calMonth === new Date().getMonth() &&
							calYear === new Date().getFullYear()}
						<div
							class="aspect-square flex items-center justify-center rounded-xl text-xs font-medium transition-colors {completed
								? 'bg-primary text-white'
								: isToday
									? 'border border-primary text-primary'
									: 'text-text-secondary hover:bg-bg'}"
						>
							{day}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Maturity Setting -->
		<div class="bg-surface rounded-2xl border border-border p-5 shadow-sm">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-semibold text-text">묵상 단계</h2>
				{#if !editingMaturity}
					<button
						onclick={() => (editingMaturity = true)}
						class="text-xs text-primary font-medium hover:underline"
					>
						변경
					</button>
				{/if}
			</div>

			{#if editingMaturity}
				<div class="space-y-2">
					{#each maturityOptions as opt}
						<button
							onclick={() => (newMaturity = opt.value)}
							class="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all {newMaturity === opt.value
								? 'border-primary bg-primary-bg text-primary font-medium'
								: 'border-border text-text-secondary hover:border-primary/30'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>
				<div class="flex gap-3 mt-4">
					<button
						onclick={() => (editingMaturity = false)}
						class="flex-1 py-2.5 border border-border text-text-secondary text-sm rounded-2xl hover:bg-bg"
					>
						취소
					</button>
					<button
						onclick={updateMaturity}
						class="flex-1 py-2.5 bg-primary text-white text-sm font-semibold rounded-2xl hover:bg-primary-light"
					>
						저장
					</button>
				</div>
			{:else}
				<p class="text-sm text-text">
					{maturityOptions.find((o) => o.value === profile?.maturity_level)?.label || profile?.maturity_level}
				</p>
			{/if}
		</div>

		<!-- Actions -->
		<div class="space-y-3">
			<button
				onclick={logout}
				class="w-full py-3 bg-surface border border-border text-text font-medium rounded-2xl hover:bg-bg transition-colors shadow-sm"
			>
				로그아웃
			</button>
			<button
				onclick={deleteAccount}
				class="w-full py-3 text-red-500 text-sm font-medium hover:underline"
			>
				계정 삭제
			</button>
		</div>
	</div>
{/if}
