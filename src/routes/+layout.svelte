<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();

	let user: { name: string; avatar: string } | null = $state(null);
	let darkMode = $state(false);

	const pageMeta: Record<string, { title: string; desc: string }> = {
		'/': { title: 'DailyQT — 매일 성경 묵상 가이드 | 맞춤형 큐티 · 해설 · 기도', desc: '매일 맞춤형 성경 본문과 해설, 묵상 질문, 기도 안내를 제공합니다. 개인 영적 프로필 기반으로 당신에게 꼭 맞는 큐티를 경험하세요. 스트릭과 캘린더로 묵상 습관을 만들어갑니다.' },
		'/bible': { title: '성경 읽기 — DailyQT | 개역한글 · NIV · ESV · 인터리니어 원어 비교', desc: '개역한글 성경을 NIV, ESV 영어 번역본 및 히브리어·그리스어 원어와 비교하며 읽으세요. 인터리니어 모드로 원어 단어별 뜻과 발음을 확인하고, 절별 하이라이트와 묵상 나눔 기능을 사용하세요.' },
		'/share': { title: '나눔 — DailyQT | 묵상 나눔 · 기도제목 · 함께 기도하는 공동체', desc: '성경 묵상을 나누고 기도제목을 올려보세요. 다른 사람의 묵상과 기도제목에 함께 기도할 수 있는 익명 커뮤니티입니다. 매일 말씀을 통해 서로를 세워가는 공동체.' },
		'/profile': { title: '프로필 — DailyQT | 묵상 기록 · 스트릭 · 캘린더 · 업적', desc: '나의 묵상 기록과 연속 묵상 스트릭, 최고 기록, 총 묵상일을 확인하세요. 캘린더에서 과거 묵상을 다시 읽고, 업적 배지를 모아보세요.' },
		'/login': { title: '로그인 — DailyQT | 구글 계정으로 간편하게 시작하는 매일 성경 묵상', desc: '구글 계정 하나로 DailyQT에 로그인하세요. 매일 맞춤형 성경 묵상, 해설, 기도 안내, 묵상 나눔 기능을 무료로 이용할 수 있습니다.' },
		'/privacy': { title: '개인정보처리방침 — DailyQT | 개인정보 수집·이용·보관·파기 안내', desc: 'DailyQT 서비스의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보관 기간, 제3자 제공 여부, 쿠키 사용 정책을 안내합니다.' },
	};
	const defaultMeta = { title: 'DailyQT — 매일 성경 묵상 가이드 | 맞춤형 큐티', desc: '매일 맞춤형 성경 묵상 가이드. 개인 영적 프로필 기반 큐티, 해설, 기도, 원어 학습을 제공합니다.' };

	let pageTitle = $derived(pageMeta[page.url.pathname]?.title || defaultMeta.title);
	let pageDesc = $derived(pageMeta[page.url.pathname]?.desc || defaultMeta.desc);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('darkMode');
			if (saved === 'true') {
				darkMode = true;
				document.documentElement.classList.add('dark');
			}
		}
		fetch('/api/me')
			.then((r) => r.json())
			.then((d) => {
				if (d.loggedIn) user = d.user;
			});
	});

	function toggleDark() {
		darkMode = !darkMode;
		localStorage.setItem('darkMode', String(darkMode));
		document.documentElement.classList.toggle('dark', darkMode);
	}

	const tabs = [
		{ href: '/', label: 'QT', icon: 'book' },
		{ href: '/bible', label: '성경', icon: 'bible' },
		{ href: '/share', label: '나눔', icon: 'share' }
	] as const;

	function isActive(href: string) {
		const p = page.url.pathname;
		if (href === '/') return p === '/';
		return p.startsWith(href);
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={pageDesc} />
	<link rel="canonical" href="https://dailyqt.xyz{page.url.pathname}" />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="DailyQT" />
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={pageDesc} />
	<meta property="og:url" content="https://dailyqt.xyz{page.url.pathname}" />
	<meta property="og:image" content="https://dailyqt.xyz/og-image.png?v=2" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content="https://dailyqt.xyz/og-image.png?v=2" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={pageDesc} />

	<link rel="icon" type="image/png" href="/logo.png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Noto+Serif+KR:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="min-h-screen bg-bg font-sans text-text flex flex-col">
	<!-- Header -->
	<header class="sticky top-0 z-50 bg-surface border-b border-border px-4 py-3">
		<div class="max-w-4xl mx-auto flex items-center justify-between">
			<a href="/" class="flex items-center gap-2">
					<img src="/logo.png" alt="DailyQT" class="w-8 h-8" />
					<span class="text-xl font-bold text-primary tracking-tight">DailyQT</span>
				</a>

			<!-- Desktop tabs -->
			<nav class="hidden md:flex items-center gap-1">
				{#each tabs as tab}
					<a
						href={tab.href}
						class="px-4 py-2 rounded-xl text-sm font-medium transition-colors {isActive(tab.href)
							? 'bg-primary-bg text-primary'
							: 'text-text-secondary hover:bg-primary-bg/50'}"
					>
						{tab.label}
					</a>
				{/each}
			</nav>

			<div class="flex items-center gap-3">
				<!-- Dark mode toggle -->
				<button
					onclick={toggleDark}
					class="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:bg-primary-bg transition-colors"
					aria-label="다크모드 전환"
				>
					{#if darkMode}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					{:else}
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
							/>
						</svg>
					{/if}
				</button>

				<!-- Avatar -->
				{#if user}
					<a href="/profile" class="w-9 h-9 rounded-full overflow-hidden border-2 border-border">
						{#if user.avatar}
							<img src={user.avatar} alt={user.name} class="w-full h-full object-cover" />
						{:else}
							<div
								class="w-full h-full bg-primary-bg flex items-center justify-center text-primary font-bold text-sm"
							>
								{user.name?.charAt(0) || '?'}
							</div>
						{/if}
					</a>
				{/if}
			</div>
		</div>
	</header>

	<!-- Main content -->
	<main class="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
		{@render children()}
	</main>

	<!-- Mobile bottom navigation -->
	<nav class="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
		<div class="flex items-center justify-around py-2">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors {isActive(
						tab.href
					)
						? 'text-primary'
						: 'text-text-secondary'}"
				>
					{#if tab.icon === 'book'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					{:else if tab.icon === 'bible'}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					{:else}
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
							/>
						</svg>
					{/if}
					<span class="text-xs font-medium">{tab.label}</span>
				</a>
			{/each}
		</div>
	</nav>

	<!-- Footer -->
	<footer class="hidden md:block text-center py-4 text-xs text-text-secondary border-t border-border">
		<a href="/privacy" class="hover:text-primary transition-colors">개인정보처리방침</a>
	</footer>

	<!-- Bottom padding for mobile nav -->
	<div class="md:hidden h-16"></div>
</div>
